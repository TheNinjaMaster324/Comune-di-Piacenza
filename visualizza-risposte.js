// ==================== INIZIALIZZAZIONE ====================
const urlParams = new URLSearchParams(window.location.search);
const answerId = urlParams.get('id');
const contentDiv = document.getElementById('content');

// Carica le risposte al caricamento della pagina
if (!answerId) {
    showError('ID non valido');
} else {
    loadAnswers(answerId);
}

// ==================== CARICAMENTO RISPOSTE ====================
function loadAnswers(id) {
    const answerData = JSON.parse(localStorage.getItem(`answer_${id}`) || 'null');

    if (!answerData) {
        showError('Dati non trovati o link scaduto');
        return;
    }

    const { faction, application } = answerData;
    const app = application;

    // Aggiorna il titolo della fazione
    document.getElementById('factionName').textContent = `Candidatura per ${faction}`;

    // Costruisci l'HTML
    let html = buildInfoSection(app);
    html += buildQuestionsSection(app);
    html += buildTotalScore(app);
    html += buildCloseButton();

    contentDiv.innerHTML = html;
}

// ==================== COSTRUZIONE SEZIONI ====================
function buildInfoSection(app) {
    const resultClass = getResultClass(app.result);
    const resultText = getResultText(app.result);

    return `
        <div class="info-section">
            <h3 style="margin-bottom: 20px;">👤 Informazioni Candidato</h3>
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">Nome Completo</span>
                    <span class="info-value">${app.name} ${app.surname}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Discord</span>
                    <span class="info-value">${app.discord}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Email</span>
                    <span class="info-value">${app.email}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Data Candidatura</span>
                    <span class="info-value">${new Date(app.date).toLocaleDateString('it-IT')}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Risultato</span>
                    <span class="result-badge ${resultClass}">${resultText}</span>
                </div>
            </div>
        </div>
    `;
}

function buildQuestionsSection(app) {
    let html = `
        <div class="questions-section">
            <h2 class="section-title">📝 Risposte del Candidato</h2>
    `;

    app.answers.forEach((answer, index) => {
        html += buildQuestionCard(answer, index, app);
    });

    html += '</div>';
    return html;
}

function buildQuestionCard(answer, index, app) {
    const questionScore = app.questionScores && app.questionScores[index] !== undefined 
        ? app.questionScores[index] 
        : 0;
    const maxScore = answer.maxScore || 0;
    const answerText = answer.answer || '<em style="color: #999;">Nessuna risposta</em>';

    let html = `
        <div class="question-card">
            <div class="question-number">Domanda ${index + 1}</div>
            <div class="question-text">${answer.question}</div>
            <div class="answer-text">${answerText}</div>
    `;

    if (maxScore > 0) {
        html += `
            <div class="score-info">
                <span style="color: #666; font-size: 14px;">Punteggio assegnato:</span>
                <span class="score-badge">${questionScore} / ${maxScore} punti</span>
            </div>
        `;
    }

    html += '</div>';
    return html;
}

function buildTotalScore(app) {
    return `
        <div class="total-score">
            <h3>📊 Punteggio Totale</h3>
            <div class="score">${app.totalScore || 0}</div>
            <p style="margin-top: 10px; opacity: 0.9;">punti</p>
        </div>
    `;
}

function buildCloseButton() {
    return `
        <div style="text-align: center;">
            <a href="javascript:window.close();" class="back-btn">← Chiudi</a>
        </div>
    `;
}

// ==================== GESTIONE ERRORI ====================
function showError(message) {
    contentDiv.innerHTML = `
        <div class="error-container">
            <div class="error-icon">⚠️</div>
            <div class="error-text">${message}</div>
            <a href="javascript:window.close();" class="back-btn">← Chiudi</a>
        </div>
    `;
}

// ==================== UTILITY FUNCTIONS ====================
function getResultClass(result) {
    if (result === 'passed') return 'result-passed';
    if (result === 'failed') return 'result-failed';
    return 'result-pending';
}

function getResultText(result) {
    if (result === 'passed') return '✅ IDONEO';
    if (result === 'failed') return '❌ NON IDONEO';
    return '⏳ In attesa';
}