// ==================== CANDIDATURA FORM - JAVASCRIPT ====================

// Ottieni parametri URL
const urlParams = new URLSearchParams(window.location.search);
const faction = urlParams.get('faction');

if (!faction) {
    alert('⚠️ Errore: Fazione non specificata!');
    window.location.href = 'home.html';
}

// Imposta titolo
document.getElementById('factionTitle').textContent = `Candidatura per ${faction}`;

// Verifica se l'utente è loggato
const user = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
if (!user.username) {
    alert('⚠️ Devi essere loggato per candidarti!');
    window.location.href = 'index.html';
}

// Verifica se il concorso è aperto
const schedule = JSON.parse(localStorage.getItem(`schedule_${faction}`) || '{}');
if (schedule.status !== 'open') {
    alert('🔒 Le candidature sono chiuse!\n\nTorna alla home.');
    window.location.href = 'home.html';
}

// Verifica se ha già candidato
const applications = JSON.parse(localStorage.getItem(`applications_${faction}`) || '[]');
const alreadyApplied = applications.find(app => 
    app.username === user.username && 
    app.sessionId === schedule.sessionId
);

if (alreadyApplied) {
    alert('⚠️ HAI GIÀ INVIATO UNA CANDIDATURA!\n\nData: ' + new Date(alreadyApplied.date).toLocaleString('it-IT'));
    window.location.href = 'home.html';
}

// Carica domande
const questions = JSON.parse(localStorage.getItem(`questions_${faction}`) || '[]');
const questionsContainer = document.getElementById('questionsContainer');

if (questions.length === 0) {
    questionsContainer.innerHTML = '<p style="color: #888; text-align: center;">Nessuna domanda configurata per questo concorso.</p>';
    document.getElementById('submitBtn').disabled = true;
} else {
    questions.forEach((q, index) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question-block';
        
        let inputHtml = '';
        
        if (q.type === 'open') {
            inputHtml = `
                <div class="question-text">
                    ${index + 1}. ${q.question} 
                    ${q.required ? '<span class="required-mark">*</span>' : ''}
                    ${q.maxScore ? `<span style="color: #667eea; font-size: 14px;">(${q.maxScore} punti)</span>` : ''}
                </div>
                <textarea class="question-input question-textarea" id="q${index}" ${q.required ? 'required' : ''} placeholder="Scrivi qui la tua risposta..."></textarea>
                <div class="error-message" id="error-q${index}">Campo obbligatorio</div>
            `;
        } else if (q.type === 'closed') {
            inputHtml = `
                <div class="question-text">
                    ${index + 1}. ${q.question} 
                    ${q.required ? '<span class="required-mark">*</span>' : ''}
                    ${q.maxScore ? `<span style="color: #667eea; font-size: 14px;">(${q.maxScore} punti)</span>` : ''}
                </div>
                <div class="radio-group">
                    <label class="radio-option">
                        <input type="radio" name="q${index}" value="Sì" ${q.required ? 'required' : ''}>
                        <span>Sì</span>
                    </label>
                    <label class="radio-option">
                        <input type="radio" name="q${index}" value="No" ${q.required ? 'required' : ''}>
                        <span>No</span>
                    </label>
                </div>
                <div class="error-message" id="error-q${index}">Campo obbligatorio</div>
            `;
        } else if (q.type === 'multiple' && q.options) {
            inputHtml = `
                <div class="question-text">
                    ${index + 1}. ${q.question} 
                    ${q.required ? '<span class="required-mark">*</span>' : ''}
                    ${q.maxScore ? `<span style="color: #667eea; font-size: 14px;">(${q.maxScore} punti)</span>` : ''}
                </div>
                <div class="radio-group">
                    ${q.options.map(opt => `
                        <label class="radio-option">
                            <input type="radio" name="q${index}" value="${opt}" ${q.required ? 'required' : ''}>
                            <span>${opt}</span>
                        </label>
                    `).join('')}
                </div>
                <div class="error-message" id="error-q${index}">Campo obbligatorio</div>
            `;
        }
        
        questionDiv.innerHTML = inputHtml;
        questionsContainer.appendChild(questionDiv);
    });
}

// Progress bar
const form = document.getElementById('candidaturaForm');
const inputs = form.querySelectorAll('input, textarea');
const progressBar = document.getElementById('progressBar');

function updateProgress() {
    let filled = 0;
    inputs.forEach(input => {
        if (input.type === 'radio') {
            const name = input.name;
            if (document.querySelector(`input[name="${name}"]:checked`)) {
                filled++;
            }
        } else if (input.value.trim() !== '') {
            filled++;
        }
    });
    
    const progress = (filled / inputs.length) * 100;
    progressBar.style.width = progress + '%';
}

inputs.forEach(input => {
    input.addEventListener('input', updateProgress);
    input.addEventListener('change', updateProgress);
});

// Submit form
form.addEventListener('submit', function(e) {
    e.preventDefault();

    // Raccogli risposte
    const answers = [];
    questions.forEach((q, index) => {
        let answer = '';
        
        if (q.type === 'open') {
            answer = document.getElementById(`q${index}`).value.trim();
        } else {
            const selected = document.querySelector(`input[name="q${index}"]:checked`);
            answer = selected ? selected.value : '';
        }

        answers.push({
            question: q.question,
            answer: answer,
            maxScore: q.maxScore || 0
        });
    });

    // Crea candidatura
    const newApp = {
        username: user.username,
        name: document.getElementById('rpName').value.trim(),
        surname: document.getElementById('rpSurname').value.trim(),
        discord: document.getElementById('discord').value.trim(),
        email: document.getElementById('email').value.trim(),
        answers: answers,
        date: new Date().toISOString(),
        sessionId: schedule.sessionId,
        questionScores: Array(questions.length).fill(0),
        totalScore: 0,
        result: null,
        published: false,
        archived: false
    };

    // Salva
    applications.push(newApp);
    localStorage.setItem(`applications_${faction}`, JSON.stringify(applications));

    // Invia webhook
    const webhooks = JSON.parse(localStorage.getItem(`webhooks_${faction}`) || '{}');
    if (webhooks.applications) {
        sendWebhook(webhooks.applications, newApp);
    }

    alert('✅ Candidatura inviata con successo!\n\nRiceverai una risposta su Discord entro 48-72 ore.');
    window.location.href = 'home.html';
});

function sendWebhook(url, data) {
    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: 'Candidature - ' + faction,
            embeds: [{
                title: '📋 Nuova Candidatura',
                description: `Nuova candidatura ricevuta per **${faction}**`,
                color: 0x667eea,
                fields: [
                    { name: '👤 Nome RP', value: data.name, inline: true },
                    { name: '👤 Cognome RP', value: data.surname, inline: true },
                    { name: '💬 Discord', value: data.discord, inline: true },
                    { name: '📧 Email', value: data.email, inline: false }
                ],
                timestamp: new Date().toISOString()
            }]
        })
    }).catch(err => console.error('Errore webhook:', err));
}