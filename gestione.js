// GESTIONE FAZIONI - Sistema Completo
// Verifica accesso
window.addEventListener('load', function() {
    const user = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    
    if (!user.isInstitutional && !user.isAdmin) {
        alert('⚠️ ACCESSO NEGATO\n\nQuesta sezione è riservata agli esponenti istituzionali.');
        window.location.href = 'home.html';
        return;
    }
    
    initializeFactionPanel(user);
});

// Mappa colori fazioni
const factionColors = {
    'Polizia di Stato': '#0066cc',
    'Arma dei Carabinieri': '#cc0000',
    'Polizia Locale': '#0099cc',
    'Guardia di Finanza': '#FFD700',
    'Polizia Penitenziaria': '#8B4513',
    'Vigili del Fuoco': '#FF4500',
    'Croce Rossa Italiana': '#DC143C',
    'Croce Verde': '#228B22',
    'ACI': '#0066cc'
};

// Mappa loghi fazioni (puoi sostituire con immagini reali)
const factionLogos = {
    'Polizia di Stato': 'https://via.placeholder.com/100/0066cc/FFFFFF?text=PS',
    'Arma dei Carabinieri': 'https://via.placeholder.com/100/cc0000/FFFFFF?text=CC',
    'Polizia Locale': 'https://via.placeholder.com/100/0099cc/FFFFFF?text=PL',
    'Guardia di Finanza': 'https://via.placeholder.com/100/FFD700/000000?text=GdF',
    'Polizia Penitenziaria': 'https://via.placeholder.com/100/8B4513/FFFFFF?text=PP',
    'Vigili del Fuoco': 'https://via.placeholder.com/100/FF4500/FFFFFF?text=VVF',
    'Croce Rossa Italiana': 'https://via.placeholder.com/100/DC143C/FFFFFF?text=CRI',
    'Croce Verde': 'https://via.placeholder.com/100/228B22/FFFFFF?text=CV',
    'ACI': 'https://via.placeholder.com/100/0066cc/FFFFFF?text=ACI'
};

// Inizializza pannello
function initializeFactionPanel(user) {
    const faction = user.faction;
    const color = factionColors[faction];
    
    // Imposta nome utente e fazione
    document.getElementById('userName').textContent = user.username;
    document.getElementById('factionName').textContent = faction;
    document.getElementById('factionName').style.color = color;
    
    // Imposta logo e titolo
    document.getElementById('factionLogo').src = factionLogos[faction];
    document.getElementById('factionTitle').textContent = faction;
    document.getElementById('factionTitle').style.color = color;
    
    // Carica dati fazione
    loadFactionData(faction);
    loadWebhooks(faction);
    updateStatus(faction);
    loadQuestions(faction);
    loadApplications(faction);
}

// ==================== WEBHOOK DISCORD ====================
function sendDiscordWebhook(type, data) {
    const user = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    const faction = user.faction;
    
    // Carica webhook salvati
    const webhooks = JSON.parse(localStorage.getItem(`webhooks_${faction}`) || '{}');
    
    let webhookUrl = '';
    let embed = {};
    
    if (type === 'open') {
        webhookUrl = webhooks.management || '';
        embed = {
            title: '📅 Candidature Aperte!',
            description: `Le candidature per **${faction}** sono ora APERTE!`,
            color: parseInt(factionColors[faction].replace('#', ''), 16),
            fields: [
                { name: '📆 Data Apertura', value: data.openDate || 'Adesso', inline: true },
                { name: '🕒 Data Chiusura', value: data.closeDate || 'Da definire', inline: true }
            ],
            footer: { text: `Gestito da ${user.username}` },
            timestamp: new Date().toISOString()
        };
    } else if (type === 'close') {
        webhookUrl = webhooks.management || '';
        embed = {
            title: '🔒 Candidature Chiuse',
            description: `Le candidature per **${faction}** sono ora CHIUSE.`,
            color: 0xe74c3c,
            fields: [
                { name: '📊 Candidature Ricevute', value: String(data.totalApplications || 0), inline: true }
            ],
            footer: { text: `Gestito da ${user.username}` },
            timestamp: new Date().toISOString()
        };
    } else if (type === 'application') {
        webhookUrl = webhooks.applications || '';
        embed = {
            title: '📋 Nuova Candidatura',
            description: `Nuova candidatura ricevuta per **${faction}**`,
            color: parseInt(factionColors[faction].replace('#', ''), 16),
            fields: [
                { name: '👤 Nome', value: data.name || 'N/A', inline: true },
                { name: '👤 Cognome', value: data.surname || 'N/A', inline: true },
                { name: '💬 Discord', value: data.discord || 'N/A', inline: true },
                { name: '📧 Email', value: data.email || 'N/A', inline: false }
            ],
            footer: { text: 'Candidatura ricevuta' },
            timestamp: new Date().toISOString()
        };
    } else if (type === 'results') {
        webhookUrl = webhooks.management || '';
        embed = {
            title: '📊 Risultati Pubblicati',
            description: `I risultati del concorso per **${faction}** sono stati pubblicati!`,
            color: 0x27ae60,
            fields: [
                { name: '✅ Idonei', value: String(data.passed || 0), inline: true },
                { name: '❌ Non Idonei', value: String(data.failed || 0), inline: true }
            ],
            footer: { text: `Pubblicati da ${user.username}` },
            timestamp: new Date().toISOString()
        };
    }
    
    if (!webhookUrl) {
        console.log('⚠️ Webhook non configurato');
        return;
    }
    
    // Invia webhook
    fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: 'Comune di Piacenza RP',
            avatar_url: 'https://via.placeholder.com/100',
            embeds: [embed]
        })
    })
    .then(res => {
        if (res.ok) {
            console.log('✅ Webhook inviato:', type);
        } else {
            console.error('❌ Errore webhook:', res.status);
        }
    })
    .catch(err => {
        console.error('❌ Errore invio webhook:', err);
    });
}

// ==================== GESTIONE TABS ====================
function showManageTab(tab) {
    document.querySelectorAll('.manage-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.manage-tab-content').forEach(c => c.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(tab + 'Tab').classList.add('active');
}

// ==================== PROGRAMMAZIONE ====================
function scheduleOpen() {
    const user = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    const faction = user.faction;
    const openDate = document.getElementById('openDate').value;
    
    if (!openDate) {
        alert('⚠️ Seleziona una data!');
        return;
    }
    
    const schedule = JSON.parse(localStorage.getItem(`schedule_${faction}`) || '{}');
    schedule.openDate = openDate;
    schedule.status = 'scheduled';
    localStorage.setItem(`schedule_${faction}`, JSON.stringify(schedule));
    
    // Invia notifica Discord
    sendDiscordWebhook('open', {
        openDate: new Date(openDate).toLocaleString('it-IT'),
        closeDate: schedule.closeDate ? new Date(schedule.closeDate).toLocaleString('it-IT') : 'Da definire'
    });
    
    alert('✅ Apertura programmata!\n\nData: ' + new Date(openDate).toLocaleString('it-IT'));
    updateStatus(faction);
}

function scheduleClose() {
    const user = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    const faction = user.faction;
    const closeDate = document.getElementById('closeDate').value;
    
    if (!closeDate) {
        alert('⚠️ Seleziona una data!');
        return;
    }
    
    const schedule = JSON.parse(localStorage.getItem(`schedule_${faction}`) || '{}');
    schedule.closeDate = closeDate;
    localStorage.setItem(`schedule_${faction}`, JSON.stringify(schedule));
    
    alert('✅ Chiusura programmata!\n\nData: ' + new Date(closeDate).toLocaleString('it-IT'));
    updateStatus(faction);
}

function openNow() {
    const user = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    const faction = user.faction;
    
    const schedule = JSON.parse(localStorage.getItem(`schedule_${faction}`) || '{}');
    schedule.status = 'open';
    schedule.openDate = new Date().toISOString();
    localStorage.setItem(`schedule_${faction}`, JSON.stringify(schedule));
    
    sendDiscordWebhook('open', { openDate: 'Adesso' });
    
    alert('✅ Candidature APERTE!');
    updateStatus(faction);
}

function closeNow() {
    const user = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    const faction = user.faction;
    
    const applications = JSON.parse(localStorage.getItem(`applications_${faction}`) || '[]');
    
    const schedule = JSON.parse(localStorage.getItem(`schedule_${faction}`) || '{}');
    schedule.status = 'closed';
    schedule.closeDate = new Date().toISOString();
    localStorage.setItem(`schedule_${faction}`, JSON.stringify(schedule));
    
    sendDiscordWebhook('close', { totalApplications: applications.length });
    
    alert('✅ Candidature CHIUSE!\n\nCandidature ricevute: ' + applications.length);
    updateStatus(faction);
}

function updateStatus(faction) {
    const schedule = JSON.parse(localStorage.getItem(`schedule_${faction}`) || '{}');
    const statusBox = document.getElementById('currentStatus');
    
    let statusHtml = '';
    
    if (schedule.status === 'open') {
        statusHtml = `
            <strong style="color: #27ae60;">🟢 APERTO</strong><br>
            Apertura: ${schedule.openDate ? new Date(schedule.openDate).toLocaleString('it-IT') : 'N/A'}<br>
            ${schedule.closeDate ? 'Chiusura programmata: ' + new Date(schedule.closeDate).toLocaleString('it-IT') : ''}
        `;
    } else if (schedule.status === 'closed') {
        statusHtml = `
            <strong style="color: #e74c3c;">🔴 CHIUSO</strong><br>
            ${schedule.openDate ? 'Prossima apertura: ' + (schedule.nextOpen || 'Da programmare') : 'Nessuna apertura programmata'}
        `;
    } else {
        statusHtml = '<strong style="color: #f39c12;">⚪ NON ATTIVO</strong><br>Nessun concorso programmato';
    }
    
    if (statusBox) {
        statusBox.innerHTML = statusHtml;
    }
}

// ==================== DOMANDE ====================
let questions = [];

function loadQuestions(faction) {
    questions = JSON.parse(localStorage.getItem(`questions_${faction}`) || '[]');
    renderQuestions();
}

function renderQuestions() {
    const list = document.getElementById('questionsList');
    if (!list) return;
    
    if (questions.length === 0) {
        list.innerHTML = '<p style="color: #888;">Nessuna domanda aggiunta. Clicca "Aggiungi Domanda" per iniziare.</p>';
        return;
    }
    
    list.innerHTML = questions.map((q, i) => `
        <div class="question-card">
            <h5>Domanda ${i + 1}: ${q.question}</h5>
            <p><strong>Tipo:</strong> ${q.type === 'open' ? 'Risposta Aperta' : q.type === 'closed' ? 'Risposta Chiusa' : 'Scelta Multipla'}</p>
            ${q.options ? '<p><strong>Opzioni:</strong> ' + q.options.join(', ') + '</p>' : ''}
            <p><strong>Punteggio Max:</strong> ${q.maxScore || 'N/A'}</p>
            <p><strong>Obbligatoria:</strong> ${q.required ? 'Sì' : 'No'}</p>
            <div class="question-options">
                <button onclick="editQuestion(${i})" class="btn-secondary">✏️ Modifica</button>
                <button onclick="deleteQuestion(${i})" class="btn-danger">🗑️ Elimina</button>
            </div>
        </div>
    `).join('');
}

function addQuestion() {
    const type = prompt('Tipo di domanda:\n\n1 = Risposta Aperta\n2 = Risposta Chiusa (Sì/No)\n3 = Scelta Multipla\n\nInserisci numero:');
    
    if (!type || !['1', '2', '3'].includes(type)) return;
    
    const question = prompt('Testo della domanda:');
    if (!question) return;
    
    const required = confirm('Domanda obbligatoria?');
    const maxScore = prompt('Punteggio massimo (lascia vuoto per nessun punteggio):');
    
    const newQ = {
        question: question,
        type: type === '1' ? 'open' : type === '2' ? 'closed' : 'multiple',
        required: required,
        maxScore: maxScore ? parseInt(maxScore) : null
    };
    
    if (type === '3') {
        const opts = prompt('Opzioni separate da virgola (es: Opzione 1, Opzione 2, Opzione 3):');
        if (opts) {
            newQ.options = opts.split(',').map(o => o.trim());
        }
    }
    
    questions.push(newQ);
    saveQuestions();
    renderQuestions();
    alert('✅ Domanda aggiunta!');
}

function deleteQuestion(index) {
    if (confirm('Eliminare questa domanda?')) {
        questions.splice(index, 1);
        saveQuestions();
        renderQuestions();
    }
}

function saveQuestions() {
    const user = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    localStorage.setItem(`questions_${user.faction}`, JSON.stringify(questions));
}

// ==================== CANDIDATURE ====================
function loadApplications(faction) {
    const applications = JSON.parse(localStorage.getItem(`applications_${faction}`) || '[]');
    const list = document.getElementById('applicationsList');
    
    if (!list) return;
    
    if (applications.length === 0) {
        list.innerHTML = '<p style="color: #888;">Nessuna candidatura ricevuta.</p>';
        return;
    }
    
    list.innerHTML = applications.map((app, i) => `
        <div class="application-card">
            <div class="application-header">
                <h4>Candidatura #${i + 1}</h4>
                <span style="color: #888;">${new Date(app.date).toLocaleString('it-IT')}</span>
            </div>
            <div class="application-info">
                <div class="info-item">
                    <span class="info-label">Nome (RP)</span>
                    <span class="info-value">${app.name || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Cognome (RP)</span>
                    <span class="info-value">${app.surname || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Discord</span>
                    <span class="info-value">${app.discord || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Email</span>
                    <span class="info-value">${app.email || 'N/A'}</span>
                </div>
            </div>
            
            <div class="application-answers">
                <h5>Risposte:</h5>
                ${app.answers ? app.answers.map((a, j) => `
                    <p><strong>D${j + 1}:</strong> ${a.answer}</p>
                `).join('') : '<p>Nessuna risposta</p>'}
            </div>
            
            <div style="margin-top: 20px;">
                <label><strong>Punteggio Totale:</strong></label>
                <input type="number" class="score-input" value="${app.score || 0}" 
                    onchange="updateScore('${faction}', ${i}, this.value)">
                <button onclick="setResult('${faction}', ${i}, 'passed')" class="btn-success">✅ Idoneo</button>
                <button onclick="setResult('${faction}', ${i}, 'failed')" class="btn-danger">❌ Non Idoneo</button>
            </div>
        </div>
    `).join('');
}

function updateScore(faction, index, score) {
    const applications = JSON.parse(localStorage.getItem(`applications_${faction}`) || '[]');
    applications[index].score = parseInt(score);
    localStorage.setItem(`applications_${faction}`, JSON.stringify(applications));
    console.log('💾 Punteggio aggiornato:', score);
}

function setResult(faction, index, result) {
    const applications = JSON.parse(localStorage.getItem(`applications_${faction}`) || '[]');
    applications[index].result = result;
    localStorage.setItem(`applications_${faction}`, JSON.stringify(applications));
    alert('✅ Risultato impostato: ' + (result === 'passed' ? 'IDONEO' : 'NON IDONEO'));
    loadApplications(faction);
}

function publishResults() {
    const user = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    const faction = user.faction;
    const applications = JSON.parse(localStorage.getItem(`applications_${faction}`) || '[]');
    
    const passed = applications.filter(a => a.result === 'passed').length;
    const failed = applications.filter(a => a.result === 'failed').length;
    
    if (!confirm(`Pubblicare i risultati?\n\n✅ Idonei: ${passed}\n❌ Non Idonei: ${failed}`)) {
        return;
    }
    
    applications.forEach(app => app.published = true);
    localStorage.setItem(`applications_${faction}`, JSON.stringify(applications));
    
    sendDiscordWebhook('results', { passed, failed });
    
    alert('✅ Risultati pubblicati!');
    loadApplications(faction);
}

// ==================== WEBHOOK ====================
function loadWebhooks(faction) {
    const webhooks = JSON.parse(localStorage.getItem(`webhooks_${faction}`) || '{}');
    
    const mgmtInput = document.getElementById('webhookManagement');
    const appInput = document.getElementById('webhookApplications');
    
    if (mgmtInput && webhooks.management) {
        mgmtInput.value = webhooks.management;
    }
    if (appInput && webhooks.applications) {
        appInput.value = webhooks.applications;
    }
}

function saveWebhooks() {
    const user = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    const faction = user.faction;
    
    const webhooks = {
        management: document.getElementById('webhookManagement').value,
        applications: document.getElementById('webhookApplications').value
    };
    
    localStorage.setItem(`webhooks_${faction}`, JSON.stringify(webhooks));
    alert('✅ Webhook salvati!');
}

function testWebhook() {
    const user = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    
    sendDiscordWebhook('open', {
        openDate: 'TEST',
        closeDate: 'TEST'
    });
    
    alert('🧪 Test webhook inviato!\n\nControlla il tuo canale Discord.');
}

function loadFactionData(faction) {
    // Carica tutti i dati necessari
    loadQuestions(faction);
    loadApplications(faction);
}

console.log('✅ Gestione Fazioni caricata!');