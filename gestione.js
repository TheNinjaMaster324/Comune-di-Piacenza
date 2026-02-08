// GESTIONE FAZIONI - Sistema Completo con UI Google Moduli
console.log('🔄 Caricamento gestione.js...');

window.addEventListener('load', function() {
    const user = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    if (!user.isInstitutional && !user.isAdmin) {
        alert('⚠️ ACCESSO NEGATO\n\nQuesta sezione è riservata agli esponenti istituzionali.');
        window.location.href = 'home.html';
        return;
    }
    initializeFactionPanel(user);
    injectGoogleModuliStyles();
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
        list.innerHTML = '<p style="color: #888; text-align: center; padding: 40px;">Nessuna domanda aggiunta. Clicca su "+ Aggiungi Domanda" per iniziare.</p>';
        return;
    }
    
    list.innerHTML = questions.map((q, i) => {
        const typeIcons = {
            'short': '📝',
            'paragraph': '📄',
            'multiple': '⭕',
            'checkboxes': '☑️',
            'dropdown': '🔽',
            'linear': '📊',
            'grid': '📊',
            'date': '📅',
            'time': '🕐',
            'file': '📎'
        };
        
        const typeNames = {
            'short': 'Risposta breve',
            'paragraph': 'Paragrafo',
            'multiple': 'Scelta multipla',
            'checkboxes': 'Caselle di controllo',
            'dropdown': 'Elenco a discesa',
            'linear': 'Scala lineare',
            'grid': 'Griglia a scelta multipla',
            'date': 'Data',
            'time': 'Ora',
            'file': 'Caricamento file'
        };
        
        return `
            <div class="gm-question-card" style="animation: slideIn 0.3s ease ${i * 0.05}s both;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                            <span style="font-size: 24px;">${typeIcons[q.type] || '❓'}</span>
                            <h4 style="margin: 0; color: #202124; font-size: 16px;">${q.question}</h4>
                            ${q.required ? '<span class="gm-required-badge">* Obbligatoria</span>' : ''}
                        </div>
                        <p style="margin: 5px 0; color: #5f6368; font-size: 14px;">${typeNames[q.type] || q.type}</p>
                        ${q.options && q.options.length > 0 ? `
                            <div style="margin-top: 10px; padding-left: 34px;">
                                ${q.options.map(opt => `<div style="color: #5f6368; font-size: 14px; margin: 5px 0;">• ${opt}</div>`).join('')}
                            </div>
                        ` : ''}
                        ${q.maxScore ? `<div style="margin-top: 10px; padding: 8px 12px; background: #e8f0fe; border-radius: 8px; display: inline-block;"><strong style="color: #1a73e8;">📊 Punteggio max: ${q.maxScore}</strong></div>` : ''}
                    </div>
                    <button onclick="deleteQuestion(${i})" class="gm-icon-btn" title="Elimina domanda">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="#5f6368">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// ==================== SISTEMA CREAZIONE DOMANDE STILE GOOGLE MODULI ====================
function addQuestion() {
    showGoogleModuliModal();
}

function showGoogleModuliModal() {
    const modal = document.createElement('div');
    modal.id = 'gmModal';
    modal.className = 'gm-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: gmFadeIn 0.3s ease;
    `;
    
    modal.innerHTML = `
        <div class="gm-modal-content" style="animation: gmSlideUp 0.4s ease;">
            <div class="gm-modal-header">
                <h2 style="margin: 0; color: #202124; font-size: 22px; font-weight: 400;">Nuova domanda</h2>
                <button onclick="closeGMModal()" class="gm-close-btn">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="#5f6368">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                </button>
            </div>
            
            <div class="gm-modal-body">
                <!-- Step 1: Testo Domanda -->
                <div id="gmStep1" class="gm-step active">
                    <label class="gm-label">Domanda</label>
                    <input type="text" id="gmQuestionText" class="gm-input" placeholder="Inserisci la tua domanda" autofocus>
                    <div class="gm-hint">Questa è la domanda che verrà mostrata ai candidati</div>
                </div>
                
                <!-- Step 2: Tipo Domanda -->
                <div id="gmStep2" class="gm-step">
                    <label class="gm-label">Tipo di domanda</label>
                    <div class="gm-type-grid">
                        <div class="gm-type-option" onclick="selectQuestionType('short')">
                            <div class="gm-type-icon">📝</div>
                            <div class="gm-type-name">Risposta breve</div>
                            <div class="gm-type-desc">Testo su una riga</div>
                        </div>
                        <div class="gm-type-option" onclick="selectQuestionType('paragraph')">
                            <div class="gm-type-icon">📄</div>
                            <div class="gm-type-name">Paragrafo</div>
                            <div class="gm-type-desc">Testo su più righe</div>
                        </div>
                        <div class="gm-type-option" onclick="selectQuestionType('multiple')">
                            <div class="gm-type-icon">⭕</div>
                            <div class="gm-type-name">Scelta multipla</div>
                            <div class="gm-type-desc">Scegli un'opzione</div>
                        </div>
                        <div class="gm-type-option" onclick="selectQuestionType('checkboxes')">
                            <div class="gm-type-icon">☑️</div>
                            <div class="gm-type-name">Caselle</div>
                            <div class="gm-type-desc">Scegli più opzioni</div>
                        </div>
                        <div class="gm-type-option" onclick="selectQuestionType('dropdown')">
                            <div class="gm-type-icon">🔽</div>
                            <div class="gm-type-name">Elenco</div>
                            <div class="gm-type-desc">Menu a tendina</div>
                        </div>
                        <div class="gm-type-option" onclick="selectQuestionType('linear')">
                            <div class="gm-type-icon">📊</div>
                            <div class="gm-type-name">Scala lineare</div>
                            <div class="gm-type-desc">1-5, 1-10, etc.</div>
                        </div>
                        <div class="gm-type-option" onclick="selectQuestionType('grid')">
                            <div class="gm-type-icon">📊</div>
                            <div class="gm-type-name">Griglia</div>
                            <div class="gm-type-desc">Tabella di opzioni</div>
                        </div>
                        <div class="gm-type-option" onclick="selectQuestionType('date')">
                            <div class="gm-type-icon">📅</div>
                            <div class="gm-type-name">Data</div>
                            <div class="gm-type-desc">Seleziona data</div>
                        </div>
                        <div class="gm-type-option" onclick="selectQuestionType('time')">
                            <div class="gm-type-icon">🕐</div>
                            <div class="gm-type-name">Ora</div>
                            <div class="gm-type-desc">Seleziona ora</div>
                        </div>
                        <div class="gm-type-option" onclick="selectQuestionType('file')">
                            <div class="gm-type-icon">📎</div>
                            <div class="gm-type-name">File</div>
                            <div class="gm-type-desc">Carica documento</div>
                        </div>
                    </div>
                </div>
                
                <!-- Step 3: Opzioni (se tipo lo richiede) -->
                <div id="gmStep3" class="gm-step">
                    <div id="gmOptionsContainer"></div>
                </div>
                
                <!-- Step 4: Impostazioni -->
                <div id="gmStep4" class="gm-step">
                    <label class="gm-label">Impostazioni</label>
                    
                    <div class="gm-setting-row">
                        <label class="gm-checkbox-label">
                            <input type="checkbox" id="gmRequired" class="gm-checkbox">
                            <span>Domanda obbligatoria</span>
                        </label>
                    </div>
                    
                    <div class="gm-setting-row">
                        <label class="gm-checkbox-label">
                            <input type="checkbox" id="gmScored" class="gm-checkbox" onchange="toggleScoreInput()">
                            <span>Valuta questa domanda</span>
                        </label>
                    </div>
                    
                    <div id="gmScoreInput" style="display: none; margin-top: 15px;">
                        <label class="gm-label">Punteggio massimo</label>
                        <input type="number" id="gmMaxScore" class="gm-input" min="0" step="1" placeholder="Es: 10">
                        <div class="gm-hint">Inserisci solo numeri interi</div>
                    </div>
                </div>
            </div>
            
            <div class="gm-modal-footer">
                <div class="gm-step-indicator" id="gmStepIndicator">
                    <span class="gm-step-dot active"></span>
                    <span class="gm-step-dot"></span>
                    <span class="gm-step-dot"></span>
                    <span class="gm-step-dot"></span>
                </div>
                <div class="gm-footer-actions">
                    <button id="gmBackBtn" onclick="gmPrevStep()" class="gm-btn-secondary" style="display: none;">Indietro</button>
                    <button id="gmNextBtn" onclick="gmNextStep()" class="gm-btn-primary">Avanti</button>
                    <button id="gmSaveBtn" onclick="saveGMQuestion()" class="gm-btn-primary" style="display: none;">Salva Domanda</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.getElementById('gmQuestionText').focus();
}

let currentGMStep = 1;
let selectedQuestionType = null;

function gmNextStep() {
    if (currentGMStep === 1) {
        const questionText = document.getElementById('gmQuestionText').value.trim();
        if (!questionText) {
            showGMNotification('error', 'Inserisci il testo della domanda!');
            return;
        }
    }
    
    if (currentGMStep === 2 && !selectedQuestionType) {
        showGMNotification('error', 'Seleziona un tipo di domanda!');
        return;
    }
    
    document.getElementById(`gmStep${currentGMStep}`).classList.remove('active');
    currentGMStep++;
    
    // Salta step 3 se non servono opzioni
    if (currentGMStep === 3 && !['multiple', 'checkboxes', 'dropdown', 'linear', 'grid'].includes(selectedQuestionType)) {
        currentGMStep++;
    }
    
    if (currentGMStep === 3) {
        setupOptionsStep();
    }
    
    document.getElementById(`gmStep${currentGMStep}`).classList.add('active');
    updateGMNavigation();
}

function gmPrevStep() {
    document.getElementById(`gmStep${currentGMStep}`).classList.remove('active');
    currentGMStep--;
    
    // Salta step 3 se non servono opzioni
    if (currentGMStep === 3 && !['multiple', 'checkboxes', 'dropdown', 'linear', 'grid'].includes(selectedQuestionType)) {
        currentGMStep--;
    }
    
    document.getElementById(`gmStep${currentGMStep}`).classList.add('active');
    updateGMNavigation();
}

function updateGMNavigation() {
    const backBtn = document.getElementById('gmBackBtn');
    const nextBtn = document.getElementById('gmNextBtn');
    const saveBtn = document.getElementById('gmSaveBtn');
    
    backBtn.style.display = currentGMStep > 1 ? 'inline-block' : 'none';
    nextBtn.style.display = currentGMStep < 4 ? 'inline-block' : 'none';
    saveBtn.style.display = currentGMStep === 4 ? 'inline-block' : 'none';
    
    // Update step indicator
    document.querySelectorAll('.gm-step-dot').forEach((dot, i) => {
        dot.classList.toggle('active', i < currentGMStep);
    });
}

function selectQuestionType(type) {
    selectedQuestionType = type;
    document.querySelectorAll('.gm-type-option').forEach(opt => opt.classList.remove('selected'));
    event.target.closest('.gm-type-option').classList.add('selected');
    setTimeout(() => gmNextStep(), 300);
}

function setupOptionsStep() {
    const container = document.getElementById('gmOptionsContainer');
    
    if (selectedQuestionType === 'multiple' || selectedQuestionType === 'checkboxes' || selectedQuestionType === 'dropdown') {
        container.innerHTML = `
            <label class="gm-label">Opzioni</label>
            <div id="gmOptionsList"></div>
            <button onclick="addGMOption()" class="gm-btn-text">+ Aggiungi opzione</button>
        `;
        addGMOption();
        addGMOption();
    } else if (selectedQuestionType === 'linear') {
        container.innerHTML = `
            <label class="gm-label">Scala</label>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div>
                    <label class="gm-label">Da</label>
                    <select id="gmScaleFrom" class="gm-input">
                        <option value="0">0</option>
                        <option value="1" selected>1</option>
                    </select>
                </div>
                <div>
                    <label class="gm-label">A</label>
                    <select id="gmScaleTo" class="gm-input">
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                        <option value="5" selected>5</option>
                        <option value="10">10</option>
                    </select>
                </div>
            </div>
        `;
    } else if (selectedQuestionType === 'grid') {
        container.innerHTML = `
            <label class="gm-label">Righe (domande)</label>
            <div id="gmRowsList"></div>
            <button onclick="addGMRow()" class="gm-btn-text">+ Aggiungi riga</button>
            
            <label class="gm-label" style="margin-top: 20px;">Colonne (opzioni)</label>
            <div id="gmColumnsList"></div>
            <button onclick="addGMColumn()" class="gm-btn-text">+ Aggiungi colonna</button>
        `;
        addGMRow();
        addGMColumn();
        addGMColumn();
    }
}

let gmOptionCounter = 0;
function addGMOption() {
    const list = document.getElementById('gmOptionsList');
    const id = gmOptionCounter++;
    const div = document.createElement('div');
    div.className = 'gm-option-row';
    div.innerHTML = `
        <span class="gm-option-bullet">${selectedQuestionType === 'checkboxes' ? '☐' : '○'}</span>
        <input type="text" class="gm-input" placeholder="Opzione ${id + 1}" id="gmOpt${id}">
        <button onclick="this.parentElement.remove()" class="gm-icon-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#5f6368">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
        </button>
    `;
    list.appendChild(div);
}

let gmRowCounter = 0;
function addGMRow() {
    const list = document.getElementById('gmRowsList');
    const id = gmRowCounter++;
    const div = document.createElement('div');
    div.className = 'gm-option-row';
    div.innerHTML = `
        <input type="text" class="gm-input" placeholder="Riga ${id + 1}" id="gmRow${id}">
        <button onclick="this.parentElement.remove()" class="gm-icon-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#5f6368">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
        </button>
    `;
    list.appendChild(div);
}

let gmColumnCounter = 0;
function addGMColumn() {
    const list = document.getElementById('gmColumnsList');
    const id = gmColumnCounter++;
    const div = document.createElement('div');
    div.className = 'gm-option-row';
    div.innerHTML = `
        <input type="text" class="gm-input" placeholder="Colonna ${id + 1}" id="gmCol${id}">
        <button onclick="this.parentElement.remove()" class="gm-icon-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#5f6368">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
        </button>
    `;
    list.appendChild(div);
}

function toggleScoreInput() {
    const scoreInput = document.getElementById('gmScoreInput');
    const checked = document.getElementById('gmScored').checked;
    scoreInput.style.display = checked ? 'block' : 'none';
}

function saveGMQuestion() {
    const questionText = document.getElementById('gmQuestionText').value.trim();
    const required = document.getElementById('gmRequired').checked;
    const scored = document.getElementById('gmScored').checked;
    const maxScore = scored ? parseInt(document.getElementById('gmMaxScore').value) || 0 : null;
    
    // Validazione punteggio
    if (scored && (isNaN(maxScore) || maxScore < 0)) {
        showGMNotification('error', 'Inserisci un punteggio valido (numero intero positivo)!');
        return;
    }
    
    const newQuestion = {
        question: questionText,
        type: selectedQuestionType,
        required: required,
        maxScore: maxScore
    };
    
    // Raccogli opzioni in base al tipo
    if (selectedQuestionType === 'multiple' || selectedQuestionType === 'checkboxes' || selectedQuestionType === 'dropdown') {
        const options = [];
        document.querySelectorAll('#gmOptionsList input').forEach(input => {
            if (input.value.trim()) options.push(input.value.trim());
        });
        if (options.length === 0) {
            showGMNotification('error', 'Aggiungi almeno un\'opzione!');
            return;
        }
        newQuestion.options = options;
    } else if (selectedQuestionType === 'linear') {
        newQuestion.scaleFrom = parseInt(document.getElementById('gmScaleFrom').value);
        newQuestion.scaleTo = parseInt(document.getElementById('gmScaleTo').value);
    } else if (selectedQuestionType === 'grid') {
        const rows = [];
        const columns = [];
        document.querySelectorAll('#gmRowsList input').forEach(input => {
            if (input.value.trim()) rows.push(input.value.trim());
        });
        document.querySelectorAll('#gmColumnsList input').forEach(input => {
            if (input.value.trim()) columns.push(input.value.trim());
        });
        if (rows.length === 0 || columns.length === 0) {
            showGMNotification('error', 'Aggiungi almeno una riga e una colonna!');
            return;
        }
        newQuestion.rows = rows;
        newQuestion.columns = columns;
    }
    
    questions.push(newQuestion);
    saveQuestions();
    renderQuestions();
    closeGMModal();
    showGMNotification('success', '✅ Domanda aggiunta con successo!');
}

function showGMNotification(type, message) {
    const notification = document.createElement('div');
    notification.className = 'gm-notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#f44336' : '#4caf50'};
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10001;
        animation: gmSlideIn 0.3s ease;
        font-weight: 500;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.animation = 'gmSlideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function closeGMModal() {
    const modal = document.getElementById('gmModal');
    if (modal) {
        modal.style.animation = 'gmFadeOut 0.3s ease';
        setTimeout(() => modal.remove(), 300);
    }
    currentGMStep = 1;
    selectedQuestionType = null;
    gmOptionCounter = 0;
    gmRowCounter = 0;
    gmColumnCounter = 0;
}

function deleteQuestion(index) {
    if (confirm('Eliminare questa domanda?')) {
        questions.splice(index, 1);
        saveQuestions();
        renderQuestions();
        showGMNotification('success', '✅ Domanda eliminata!');
    }
}

function saveQuestions() {
    const user = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    localStorage.setItem(`questions_${user.faction}`, JSON.stringify(questions));
}

// ==================== RESTO DEL CODICE (IDENTICO) ====================
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

// ==================== STILI GOOGLE MODULI ====================
function injectGoogleModuliStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes gmFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        @keyframes gmFadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
        
        @keyframes gmSlideUp {
            from { transform: translateY(50px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes gmSlideIn {
            from { transform: translateX(100px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes gmSlideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100px); opacity: 0; }
        }
        
        @keyframes slideIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .gm-modal-content {
            background: white;
            border-radius: 12px;
            max-width: 650px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 8px 40px rgba(0,0,0,0.25);
        }
        
        .gm-modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 24px;
            border-bottom: 1px solid #e0e0e0;
        }
        
        .gm-close-btn {
            background: none;
            border: none;
            cursor: pointer;
            padding: 8px;
            border-radius: 50%;
            transition: background 0.2s;
        }
        
        .gm-close-btn:hover {
            background: #f1f3f4;
        }
        
        .gm-modal-body {
            padding: 24px;
            min-height: 300px;
        }
        
        .gm-step {
            display: none;
        }
        
        .gm-step.active {
            display: block;
            animation: gmSlideUp 0.4s ease;
        }
        
        .gm-label {
            display: block;
            color: #202124;
            font-size: 14px;
            font-weight: 500;
            margin-bottom: 8px;
        }
        
        .gm-input {
            width: 100%;
            padding: 12px 16px;
            border: 1px solid #dadce0;
            border-radius: 8px;
            font-size: 14px;
            font-family: inherit;
            transition: border-color 0.2s;
            box-sizing: border-box;
        }
        
        .gm-input:focus {
            outline: none;
            border-color: #1a73e8;
            box-shadow: 0 0 0 4px rgba(26, 115, 232, 0.1);
        }
        
        .gm-hint {
            color: #5f6368;
            font-size: 12px;
            margin-top: 8px;
        }
        
        .gm-type-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
            gap: 12px;
            margin-top: 16px;
        }
        
        .gm-type-option {
            padding: 20px 16px;
            border: 2px solid #dadce0;
            border-radius: 12px;
            text-align: center;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .gm-type-option:hover {
            border-color: #1a73e8;
            background: #f8f9fa;
        }
        
        .gm-type-option.selected {
            border-color: #1a73e8;
            background: #e8f0fe;
        }
        
        .gm-type-icon {
            font-size: 32px;
            margin-bottom: 8px;
        }
        
        .gm-type-name {
            color: #202124;
            font-size: 13px;
            font-weight: 500;
            margin-bottom: 4px;
        }
        
        .gm-type-desc {
            color: #5f6368;
            font-size: 11px;
        }
        
        .gm-option-row {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 12px;
        }
        
        .gm-option-bullet {
            font-size: 20px;
            color: #5f6368;
            width: 24px;
            text-align: center;
        }
        
        .gm-btn-text {
            background: none;
            border: none;
            color: #1a73e8;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            padding: 8px 0;
            transition: background 0.2s;
        }
        
        .gm-btn-text:hover {
            background: rgba(26, 115, 232, 0.04);
        }
        
        .gm-icon-btn {
            background: none;
            border: none;
            cursor: pointer;
            padding: 6px;
            border-radius: 50%;
            transition: background 0.2s;
        }
        
        .gm-icon-btn:hover {
            background: #f1f3f4;
        }
        
        .gm-checkbox-label {
            display: flex;
            align-items: center;
            gap: 12px;
            cursor: pointer;
            padding: 12px;
            border-radius: 8px;
            transition: background 0.2s;
        }
        
        .gm-checkbox-label:hover {
            background: #f8f9fa;
        }
        
        .gm-checkbox {
            width: 20px;
            height: 20px;
            cursor: pointer;
        }
        
        .gm-setting-row {
            margin-bottom: 16px;
        }
        
        .gm-modal-footer {
            padding: 16px 24px;
            border-top: 1px solid #e0e0e0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .gm-step-indicator {
            display: flex;
            gap: 8px;
        }
        
        .gm-step-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #dadce0;
            transition: all 0.3s;
        }
        
        .gm-step-dot.active {
            background: #1a73e8;
            width: 24px;
            border-radius: 4px;
        }
        
        .gm-footer-actions {
            display: flex;
            gap: 12px;
        }
        
        .gm-btn-primary, .gm-btn-secondary {
            padding: 10px 24px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
            border: none;
        }
        
        .gm-btn-primary {
            background: #1a73e8;
            color: white;
        }
        
        .gm-btn-primary:hover {
            background: #1557b0;
        }
        
        .gm-btn-secondary {
            background: white;
            color: #1a73e8;
            border: 1px solid #dadce0;
        }
        
        .gm-btn-secondary:hover {
            background: #f8f9fa;
        }
        
        .gm-question-card {
            background: white;
            border: 1px solid #dadce0;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 16px;
            transition: all 0.2s;
        }
        
        .gm-question-card:hover {
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            border-color: #1a73e8;
        }
        
        .gm-required-badge {
            background: #e8f0fe;
            color: #1a73e8;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 500;
        }
    `;
    document.head.appendChild(style);
}

console.log('✅ Gestione Fazioni caricata completamente con Google Moduli UI!');