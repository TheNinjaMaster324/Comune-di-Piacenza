// GESTIONE FAZIONI - Sistema Completo
console.log('🔄 Caricamento gestione.js...');

window.addEventListener('load', function() {
    const user = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    if (!user.isInstitutional && !user.isAdmin) {
        alert('⚠️ ACCESSO NEGATO\n\nQuesta sezione è riservata agli esponenti istituzionali.');
        window.location.href = 'home.html';
        return;
    }
    initializeFactionPanel(user);
});

const factionColors = {
    'Polizia di Stato': '#0066cc', 'Arma dei Carabinieri': '#cc0000', 'Polizia Locale': '#0099cc',
    'Guardia di Finanza': '#FFD700', 'Polizia Penitenziaria': '#8B4513', 'Vigili del Fuoco': '#FF4500',
    'Croce Rossa Italiana': '#DC143C', 'Croce Verde': '#228B22', 'ACI': '#0066cc'
};

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

function initializeFactionPanel(user) {
    const faction = user.faction;
    if (!faction) { alert('⚠️ Errore: Fazione non trovata!'); return; }
    
    const color = factionColors[faction];
    if (document.getElementById('userName')) document.getElementById('userName').textContent = user.username;
    if (document.getElementById('factionName')) {
        document.getElementById('factionName').textContent = faction;
        document.getElementById('factionName').style.color = color;
    }
    if (document.getElementById('factionLogo')) document.getElementById('factionLogo').src = factionLogos[faction];
    if (document.getElementById('factionTitle')) {
        document.getElementById('factionTitle').textContent = faction;
        document.getElementById('factionTitle').style.color = color;
    }
    
    loadFactionData(faction);
    loadWebhooks(faction);
    updateStatus(faction);
    loadQuestions(faction);
    loadApplications(faction);
    loadArchive(faction);
}

function sendDiscordWebhook(type, data) {
    const user = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    const faction = user.faction;
    const webhooks = JSON.parse(localStorage.getItem(`webhooks_${faction}`) || '{}');
    let webhookUrl = '', embed = {};
    const concorsoUrl = 'https://theninjamaster324.github.io/Comune-di-Piacenza/home.html#fazioni';    
    if (type === 'open') {
        webhookUrl = webhooks.management || '';
        embed = {
            title: '📅 Candidature Aperte!',
            description: `Le candidature per **${faction}** sono ora APERTE!\n\n[📝 Candidati Ora](${concorsoUrl})`,
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
            fields: [{ name: '📊 Candidature Ricevute', value: String(data.totalApplications || 0), inline: true }],
            footer: { text: `Gestito da ${user.username}` },
            timestamp: new Date().toISOString()
        };
    } else if (type === 'results') {
        webhookUrl = webhooks.management || '';
        embed = {
            title: '📊 Risultati Pubblicati',
            description: `I risultati del concorso per **${faction}** sono stati pubblicati!\n\n[📋 Visualizza Risultati](${concorsoUrl})`,
            color: 0x27ae60,
            fields: [
                { name: '✅ Idonei', value: String(data.passed || 0), inline: true },
                { name: '❌ Non Idonei', value: String(data.failed || 0), inline: true }
            ],
            footer: { text: `Pubblicati da ${user.username}` },
            timestamp: new Date().toISOString()
        };
    }
    
    if (!webhookUrl) return;
    fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'Comune di Piacenza', avatar_url: 'https://via.placeholder.com/100', embeds: [embed] })
    }).catch(err => console.error('❌ Errore webhook:', err));
}

function showManageTab(tab) {
    document.querySelectorAll('.manage-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.manage-tab-content').forEach(c => c.classList.remove('active'));
    event.target.classList.add('active');
    const tabContent = document.getElementById(tab + 'Tab');
    if (tabContent) tabContent.classList.add('active');
}

function scheduleOpen() {
    const user = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    const faction = user.faction;
    const openDateEl = document.getElementById('openDate');
    if (!openDateEl || !openDateEl.value) { alert('⚠️ Seleziona una data e ora!'); return; }
    
    const openDate = openDateEl.value;
    const schedule = JSON.parse(localStorage.getItem(`schedule_${faction}`) || '{}');
    schedule.openDate = openDate;
    schedule.status = 'scheduled';
    localStorage.setItem(`schedule_${faction}`, JSON.stringify(schedule));
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
    const closeDateEl = document.getElementById('closeDate');
    if (!closeDateEl || !closeDateEl.value) { alert('⚠️ Seleziona una data e ora!'); return; }
    
    const closeDate = closeDateEl.value;
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
    schedule.sessionId = Date.now();
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
    if (!statusBox) return;
    
    let statusHtml = '';
    if (schedule.status === 'open') {
        statusHtml = `<strong style="color: #27ae60;">🟢 APERTO</strong><br>Apertura: ${schedule.openDate ? new Date(schedule.openDate).toLocaleString('it-IT') : 'N/A'}<br>${schedule.closeDate ? 'Chiusura programmata: ' + new Date(schedule.closeDate).toLocaleString('it-IT') : ''}`;
    } else if (schedule.status === 'closed') {
        statusHtml = `<strong style="color: #e74c3c;">🔴 CHIUSO</strong><br>Ultimo concorso chiuso: ${schedule.closeDate ? new Date(schedule.closeDate).toLocaleString('it-IT') : 'N/A'}`;
    } else if (schedule.status === 'scheduled') {
        statusHtml = `<strong style="color: #f39c12;">⏰ PROGRAMMATO</strong><br>Apertura programmata: ${schedule.openDate ? new Date(schedule.openDate).toLocaleString('it-IT') : 'N/A'}`;
    } else {
        statusHtml = '<strong style="color: #95a5a6;">⚪ NON ATTIVO</strong><br>Nessun concorso programmato';
    }
    statusBox.innerHTML = statusHtml;
}

let questions = [];

function loadQuestions(faction) {
    questions = JSON.parse(localStorage.getItem(`questions_${faction}`) || '[]');
    renderQuestions();
}

function renderQuestions() {
    const list = document.getElementById('questionsList');
    if (!list) return;
    
    if (questions.length === 0) {
        list.innerHTML = '<p style="color: #888;">Nessuna domanda aggiunta.</p>';
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
        const opts = prompt('Opzioni separate da virgola:');
        if (opts) newQ.options = opts.split(',').map(o => o.trim());
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
                <div class="info-item"><span class="info-label">Nome</span><span class="info-value">${app.name || 'N/A'}</span></div>
                <div class="info-item"><span class="info-label">Cognome</span><span class="info-value">${app.surname || 'N/A'}</span></div>
                <div class="info-item"><span class="info-label">Discord</span><span class="info-value">${app.discord || 'N/A'}</span></div>
                <div class="info-item"><span class="info-label">Email</span><span class="info-value">${app.email || 'N/A'}</span></div>
            </div>
            <button onclick="toggleAnswers(${i})" class="btn-primary" style="margin: 15px 0;">📋 Visualizza Risposte</button>
            <div id="answers-${i}" class="application-answers" style="display: none;">
                <h5>Risposte:</h5>
                ${app.answers ? app.answers.map((a, j) => {
                    const q = questions[j];
                    const maxScore = q && q.maxScore ? q.maxScore : 0;
                    const currentScore = app.questionScores && app.questionScores[j] !== undefined ? app.questionScores[j] : 0;
                    return `
                        <div style="background: white; padding: 15px; border-radius: 8px; margin: 10px 0; border-left: 4px solid #667eea;">
                            <p><strong>D${j + 1}:</strong> ${a.question}</p>
                            <p style="color: #666;"><strong>Risposta:</strong> ${a.answer}</p>
                            ${maxScore > 0 ? `
                                <div style="margin-top: 10px;">
                                    <label><strong>Punteggio:</strong></label>
                                    <input type="number" class="score-input" min="0" max="${maxScore}" value="${currentScore}" 
                                        onchange="updateQuestionScore('${faction}', ${i}, ${j}, this.value, ${maxScore})" style="width: 80px; margin: 0 10px;">
                                    <span>/ ${maxScore} punti</span>
                                </div>
                            ` : ''}
                        </div>
                    `;
                }).join('') : '<p>Nessuna risposta</p>'}
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 20px;">
                    <h5>Punteggio Totale: <span id="total-score-${i}">${app.totalScore || 0}</span> punti</h5>
                </div>
            </div>
            <div style="margin-top: 20px;">
                <button onclick="setResult('${faction}', ${i}, 'passed')" class="btn-success">✅ Idoneo</button>
                <button onclick="setResult('${faction}', ${i}, 'failed')" class="btn-danger">❌ Non Idoneo</button>
                <button onclick="archiveSingleCandidate('${faction}', ${i})" class="btn-secondary" style="background: #3498db;">📦 Archivia</button>
                ${app.result ? `<span style="margin-left: 15px; font-weight: bold; color: ${app.result === 'passed' ? '#27ae60' : '#e74c3c'};">${app.result === 'passed' ? '✅ IDONEO' : '❌ NON IDONEO'}</span>` : ''}
            </div>
        </div>
    `).join('');
}

function toggleAnswers(index) {
    const answersDiv = document.getElementById(`answers-${index}`);
    if (answersDiv) answersDiv.style.display = answersDiv.style.display === 'none' ? 'block' : 'none';
}

function updateQuestionScore(faction, appIndex, questionIndex, score, maxScore) {
    const applications = JSON.parse(localStorage.getItem(`applications_${faction}`) || '[]');
    const app = applications[appIndex];
    if (!app.questionScores) app.questionScores = [];
    let validScore = parseInt(score);
    if (isNaN(validScore) || validScore < 0) validScore = 0;
    if (validScore > maxScore) validScore = maxScore;
    app.questionScores[questionIndex] = validScore;
    app.totalScore = app.questionScores.reduce((sum, s) => sum + (s || 0), 0);
    localStorage.setItem(`applications_${faction}`, JSON.stringify(applications));
    const totalScoreEl = document.getElementById(`total-score-${appIndex}`);
    if (totalScoreEl) totalScoreEl.textContent = app.totalScore;
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
    if (!confirm(`Pubblicare i risultati?\n\n✅ Idonei: ${passed}\n❌ Non Idonei: ${failed}`)) return;
    applications.forEach(app => app.published = true);
    localStorage.setItem(`applications_${faction}`, JSON.stringify(applications));
    sendDiscordWebhook('results', { passed, failed });
    alert('✅ Risultati pubblicati!');
    loadApplications(faction);
}

function archiveSingleCandidate(faction, index) {
    const applications = JSON.parse(localStorage.getItem(`applications_${faction}`) || '[]');
    const app = applications[index];
    if (!app) { alert('⚠️ Candidato non trovato!'); return; }
    if (!confirm(`Archiviare:\n\n${app.name} ${app.surname}\nDiscord: ${app.discord}`)) return;
    
    app.archived = true;
    app.archivedDate = new Date().toISOString();
    const archive = JSON.parse(localStorage.getItem(`archive_${faction}`) || '[]');
    archive.push(app);
    localStorage.setItem(`archive_${faction}`, JSON.stringify(archive));
    applications.splice(index, 1);
    localStorage.setItem(`applications_${faction}`, JSON.stringify(applications));
    sendArchiveWebhook([app]);
    alert('✅ Candidato archiviato!');
    loadApplications(faction);
    loadArchive(faction);
}

function archiveAllCandidates() {
    const user = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    const faction = user.faction;
    const applications = JSON.parse(localStorage.getItem(`applications_${faction}`) || '[]');
    if (applications.length === 0) { alert('⚠️ Nessuna candidatura!'); return; }
    if (!confirm(`Archiviare tutti i ${applications.length} candidati?`)) return;
    
    const archive = JSON.parse(localStorage.getItem(`archive_${faction}`) || '[]');
    applications.forEach(app => {
        app.archived = true;
        app.archivedDate = new Date().toISOString();
    });
    archive.push(...applications);
    localStorage.setItem(`archive_${faction}`, JSON.stringify(archive));
    sendArchiveWebhook(applications);
    localStorage.setItem(`applications_${faction}`, '[]');
    alert('✅ Candidati archiviati!');
    loadApplications(faction);
    loadArchive(faction);
}

function sendArchiveWebhook(applications) {
    const user = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    const faction = user.faction;
    const webhooks = JSON.parse(localStorage.getItem(`webhooks_${faction}`) || '{}');
    if (!webhooks.archive) return;
    
    const baseUrl = window.location.origin;
    applications.forEach(app => {
        const appId = Date.now() + Math.random().toString(36).substr(2, 9);
        localStorage.setItem(`answer_${appId}`, JSON.stringify({ faction, application: app, timestamp: Date.now() }));
        const answerUrl = `${baseUrl}/visualizza-risposte.html?id=${appId}`;
        
        const embed = {
            title: '📦 Candidato Archiviato',
            description: `Candidatura archiviata per **${faction}**`,
            color: app.result === 'passed' ? 0x27ae60 : app.result === 'failed' ? 0xe74c3c : 0x95a5a6,
            fields: [
                { name: '👤 Nome', value: `${app.name} ${app.surname}`, inline: true },
                { name: '💬 Discord', value: app.discord, inline: true },
                { name: '📧 Email', value: app.email, inline: true },
                { name: '📊 Punteggio', value: String(app.totalScore || 0), inline: true },
                { name: '📃 Risultato', value: app.result === 'passed' ? '✅ IDONEO' : app.result === 'failed' ? '❌ NON IDONEO' : '⏳ In attesa', inline: true },
                { name: '📅 Data', value: new Date(app.date).toLocaleDateString('it-IT'), inline: true },
                { name: '📋 Risposte', value: `[Clicca qui](${answerUrl})`, inline: false }
            ],
            footer: { text: `Archiviato da ${user.username}` },
            timestamp: new Date().toISOString()
        };
        
        fetch(webhooks.archive, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: `Archivio - ${faction}`, avatar_url: 'https://via.placeholder.com/100', embeds: [embed] })
        }).catch(err => console.error('Errore webhook:', err));
    });
}

function loadArchive(faction) {
    const archive = JSON.parse(localStorage.getItem(`archive_${faction}`) || '[]');
    const list = document.getElementById('archiveList');
    if (!list) return;
    if (archive.length === 0) {
        list.innerHTML = '<p style="color: #888;">Nessun candidato archiviato.</p>';
        return;
    }
    archive.sort((a, b) => new Date(b.archivedDate) - new Date(a.archivedDate));
    list.innerHTML = archive.map((app, i) => `
        <div class="application-card" style="opacity: 0.8;">
            <div class="application-header">
                <h4>📦 ${app.name} ${app.surname}</h4>
                <span style="color: #888;">Archiviato: ${new Date(app.archivedDate).toLocaleString('it-IT')}</span>
            </div>
            <div class="application-info">
                <div class="info-item"><span class="info-label">Discord</span><span class="info-value">${app.discord}</span></div>
                <div class="info-item"><span class="info-label">Email</span><span class="info-value">${app.email}</span></div>
                <div class="info-item"><span class="info-label">Punteggio</span><span class="info-value">${app.totalScore || 0} punti</span></div>
                <div class="info-item">
                    <span class="info-label">Risultato</span>
                    <span class="info-value" style="color: ${app.result === 'passed' ? '#27ae60' : app.result === 'failed' ? '#e74c3c' : '#95a5a6'};">
                        ${app.result === 'passed' ? '✅ IDONEO' : app.result === 'failed' ? '❌ NON IDONEO' : '⏳ In attesa'}
                    </span>
                </div>
            </div>
            <button onclick="viewArchivedAnswers(${i})" class="btn-primary" style="margin-top: 15px;">📋 Visualizza Risposte</button>
        </div>
    `).join('');
}

function viewArchivedAnswers(index) {
    const user = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    const faction = user.faction;
    const archive = JSON.parse(localStorage.getItem(`archive_${faction}`) || '[]');
    const app = archive[index];
    if (!app) return;
    
    let text = `📋 ${app.name} ${app.surname}\n\n📧 ${app.email}\n💬 ${app.discord}\n📊 Punteggio: ${app.totalScore || 0}\n✅ ${app.result === 'passed' ? 'IDONEO' : app.result === 'failed' ? 'NON IDONEO' : 'In attesa'}\n\n━━━━━━━━━━━━━━━━━━\n\n`;
    app.answers.forEach((a, i) => {
        text += `Domanda ${i + 1}: ${a.question}\nRisposta: ${a.answer}\n`;
        if (app.questionScores && app.questionScores[i] !== undefined) {
            text += `Punteggio: ${app.questionScores[i]}/${a.maxScore || 0}\n`;
        }
        text += `\n`;
    });
    alert(text);
}

function loadWebhooks(faction) {
    const webhooks = JSON.parse(localStorage.getItem(`webhooks_${faction}`) || '{}');
    if (document.getElementById('webhookManagement') && webhooks.management) document.getElementById('webhookManagement').value = webhooks.management;
    if (document.getElementById('webhookApplications') && webhooks.applications) document.getElementById('webhookApplications').value = webhooks.applications;
    if (document.getElementById('webhookArchive') && webhooks.archive) document.getElementById('webhookArchive').value = webhooks.archive;
}

function saveWebhooks() {
    const user = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    const faction = user.faction;
    const webhooks = {
        management: document.getElementById('webhookManagement').value,
        applications: document.getElementById('webhookApplications').value,
        archive: document.getElementById('webhookArchive').value
    };
    localStorage.setItem(`webhooks_${faction}`, JSON.stringify(webhooks));
    alert('✅ Webhook salvati!');
}

function testWebhook() {
    sendDiscordWebhook('open', { openDate: 'TEST', closeDate: 'TEST' });
    alert('🧪 Test webhook inviato!\n\nControlla il tuo canale Discord.');
}

function loadFactionData(faction) {
    loadQuestions(faction);
    loadApplications(faction);
    loadArchive(faction);
}

function logout() {
    if (confirm('Sei sicuro di voler uscire?')) {
        sessionStorage.clear();
        localStorage.removeItem('logged');
        window.location.href = 'index.html';
    }
}

function toggleMobileMenu() {
    const navMenu = document.getElementById('navMenu');
    if (navMenu) navMenu.classList.toggle('active');
}

console.log('✅ Gestione Fazioni caricata completamente!');