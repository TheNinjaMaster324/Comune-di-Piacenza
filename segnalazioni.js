// ==================== VARIABILI GLOBALI ====================
let currentUser = {};
const WEBHOOK_SEGNALAZIONI = 'https://discord.com/api/webhooks/1464602775907467550/UXyFjYPWIv-pQaIzdCIichb9FeG5PVsEMmRRdmk87_Hx2cw_3ffvjeGsMWNGpW6Y5oYE';

// ==================== INIZIALIZZAZIONE ====================
window.addEventListener('load', function() {
    currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    
    // ✅ CONTROLLO: Verifica solo se l'utente è loggato (NON se è admin)
    if (!currentUser.username) {
        alert('⚠️ Devi essere loggato per accedere a questa pagina!');
        window.location.href = 'index.html';
        return;
    }

    // Precompila i campi del form con i dati dell'utente loggato
    document.getElementById('reporterUsername').value = currentUser.username || '';
    document.getElementById('reporterEmail').value = currentUser.email || '';
    
    // Inizializza il gestore del form
    initReportForm();
    
    console.log('✅ Pagina segnalazioni caricata per:', currentUser.username);
});

// ==================== INIZIALIZZAZIONE FORM ====================
function initReportForm() {
    const form = document.getElementById('reportForm');
    const fileInput = document.getElementById('evidence');
    const fileList = document.getElementById('fileList');
    
    // Mostra i file selezionati
    fileInput.addEventListener('change', function() {
        fileList.innerHTML = '';
        
        if (this.files.length === 0) {
            fileList.innerHTML = '<p style="color: #888;">Nessun file selezionato</p>';
            return;
        }
        
        Array.from(this.files).forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.style.cssText = `
                padding: 10px;
                background: #f8f9fa;
                border-radius: 8px;
                margin-bottom: 8px;
                display: flex;
                align-items: center;
                justify-content: space-between;
            `;
            
            const fileIcon = file.type.startsWith('video/') ? '🎥' : '🖼️';
            const fileSize = (file.size / 1024 / 1024).toFixed(2);
            
            fileItem.innerHTML = `
                <div>
                    <span style="font-size: 20px; margin-right: 10px;">${fileIcon}</span>
                    <strong>${file.name}</strong> 
                    <span style="color: #666; font-size: 14px;">(${fileSize} MB)</span>
                </div>
                ${file.size > 10 * 1024 * 1024 ? '<span style="color: #e74c3c; font-weight: 600;">⚠️ Troppo grande</span>' : '<span style="color: #27ae60;">✅</span>'}
            `;
            
            fileList.appendChild(fileItem);
        });
    });
    
    // Gestisci submit
    form.addEventListener('submit', handleFormSubmit);
}

// ==================== GESTIONE SUBMIT FORM ====================
async function handleFormSubmit(e) {
    e.preventDefault();
    
    // Raccogli dati
    const formData = {
        reporter: {
            username: document.getElementById('reporterUsername').value.trim(),
            discord: document.getElementById('reporterDiscord').value.trim(),
            email: document.getElementById('reporterEmail').value.trim()
        },
        reported: {
            username: document.getElementById('reportedUsername').value.trim(),
            discord: document.getElementById('reportedDiscord').value.trim() || 'Non specificato'
        },
        violationType: document.getElementById('violationType').value,
        description: document.getElementById('description').value.trim(),
        incidentDate: document.getElementById('incidentDate').value
    };
    
    // Validazione
    if (!formData.reporter.username || !formData.reporter.discord || !formData.reporter.email) {
        alert('⚠️ Compila tutti i campi obbligatori delle tue informazioni!');
        return;
    }
    
    if (!formData.reported.username) {
        alert('⚠️ Inserisci l\'username dell\'utente segnalato!');
        return;
    }
    
    if (!formData.violationType) {
        alert('⚠️ Seleziona il tipo di violazione!');
        return;
    }
    
    if (formData.description.length < 20) {
        alert('⚠️ La descrizione deve essere di almeno 20 caratteri!');
        return;
    }
    
    const fileInput = document.getElementById('evidence');
    if (fileInput.files.length === 0) {
        alert('⚠️ Devi caricare almeno una prova (screenshot o video)!');
        return;
    }
    
    // Verifica dimensione file
    const oversizedFiles = Array.from(fileInput.files).filter(f => f.size > 10 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
        alert(`⚠️ I seguenti file superano i 10MB:\n${oversizedFiles.map(f => f.name).join('\n')}`);
        return;
    }
    
    // Mostra loading
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '⏳ Invio in corso...';
    
    try {
        // Converti file in base64
        const evidenceFiles = await processFiles(fileInput.files);
        
        // Crea segnalazione
        const report = {
            id: Date.now(),
            ...formData,
            evidenceFiles: evidenceFiles,
            submittedDate: new Date().toISOString(),
            status: 'pending'
        };
        
        // Salva in localStorage
        const reports = JSON.parse(localStorage.getItem('userReports') || '[]');
        reports.push(report);
        localStorage.setItem('userReports', JSON.stringify(reports));
        
        // Invia webhook Discord
        await sendDiscordWebhook(report);
        
        // Successo
        alert('✅ Segnalazione inviata con successo!\n\nRiceverai una risposta dallo staff entro 48 ore.');
        
        // Reset form
        e.target.reset();
        document.getElementById('fileList').innerHTML = '';
        
        // Reindirizza alla home
        setTimeout(() => {
            window.location.href = 'home.html';
        }, 1500);
        
    } catch (error) {
        console.error('Errore invio segnalazione:', error);
        alert('❌ Errore durante l\'invio della segnalazione. Riprova.');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

// ==================== PROCESSA FILE (CONVERTI IN BASE64) ====================
async function processFiles(files) {
    const processedFiles = [];
    
    for (let file of files) {
        const base64 = await fileToBase64(file);
        processedFiles.push({
            name: file.name,
            type: file.type,
            size: file.size,
            data: base64,
            isVideo: file.type.startsWith('video/')
        });
    }
    
    return processedFiles;
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// ==================== WEBHOOK DISCORD ====================
async function sendDiscordWebhook(report) {
    const embed = {
        title: '🚨 Nuova Segnalazione Ricevuta',
        description: `Una nuova segnalazione è stata inviata da **${report.reporter.username}**`,
        color: 0xe74c3c,
        fields: [
            { name: '👤 Segnalato da', value: report.reporter.username, inline: true },
            { name: '🎯 Utente Segnalato', value: report.reported.username, inline: true },
            { name: '⚠️ Tipo Violazione', value: report.violationType, inline: true },
            { name: '💬 Discord Segnalante', value: report.reporter.discord, inline: true },
            { name: '📧 Email Segnalante', value: report.reporter.email, inline: true },
            { name: '🆔 ID Segnalazione', value: `\`${report.id}\``, inline: true },
            { name: '📝 Descrizione', value: report.description.length > 300 ? report.description.substring(0, 297) + '...' : report.description, inline: false },
            { name: '📅 Data Incidente', value: new Date(report.incidentDate).toLocaleString('it-IT'), inline: true },
            { name: '📤 Inviata il', value: new Date(report.submittedDate).toLocaleString('it-IT'), inline: true }
        ],
        footer: { text: 'Sistema Segnalazioni - Comune di Piacenza RP' },
        timestamp: new Date().toISOString()
    };
    
    // Aggiungi info sui file allegati
    if (report.evidenceFiles && report.evidenceFiles.length > 0) {
        const fileTypes = report.evidenceFiles.map(f => f.isVideo ? '🎥 Video' : '🖼️ Immagine').join(', ');
        embed.fields.push({
            name: '📎 Prove Allegate',
            value: `${report.evidenceFiles.length} file (${fileTypes})`,
            inline: false
        });
        
        // Se c'è un'immagine, usala come thumbnail
        const firstImage = report.evidenceFiles.find(f => !f.isVideo);
        if (firstImage) {
            embed.thumbnail = { url: firstImage.data };
        }
    }
    
    const payload = {
        username: 'Segnalazioni - Piacenza RP',
        avatar_url: 'https://via.placeholder.com/100/e74c3c/FFFFFF?text=REP',
        embeds: [embed],
        components: [
            {
                type: 1,
                components: [
                    {
                        type: 2,
                        style: 5,
                        label: '🔍 Visualizza nel Pannello Staff',
                        url: `https://theninjamaster324.github.io/Comune-di-Piacenza/staff.html?report=${report.id}`
                    }
                ]
            }
        ]
    };
    
    try {
        const response = await fetch(WEBHOOK_SEGNALAZIONI, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (response.ok) {
            console.log('✅ Webhook Discord inviato con successo');
        } else {
            console.error('❌ Errore invio webhook:', response.status);
        }
    } catch (error) {
        console.error('❌ Errore invio webhook:', error);
    }
}

console.log('✅ segnalazioni.js caricato correttamente');