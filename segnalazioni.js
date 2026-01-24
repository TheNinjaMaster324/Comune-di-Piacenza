// ==================== CONFIGURAZIONE ====================
const WEBHOOK_SEGNALAZIONI = 'https://discord.com/api/webhooks/1464602775907467550/UXyFjYPWIv-pQaIzdCIichb9FeG5PVsEMmRRdmk87_Hx2cw_3ffvjeGsMWNGpW6Y5oYE';

// ==================== VERIFICA LOGIN ====================
window.addEventListener('load', function() {
    const user = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    if (!user.username) {
        showCustomNotification('warning', '⚠️ Accesso Richiesto', 'Devi essere loggato per inviare una segnalazione!');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
    } else {
        document.getElementById('reporterUsername').value = user.username || '';
        document.getElementById('reporterEmail').value = user.email || '';
    }
});

// ==================== GESTIONE FILE UPLOAD ====================
document.getElementById('evidence').addEventListener('change', function(e) {
    const fileList = document.getElementById('fileList');
    fileList.innerHTML = '';
    
    if (e.target.files.length === 0) return;
    
    const validFiles = Array.from(e.target.files).filter(file => 
        file.type.startsWith('image/') || file.type.startsWith('video/')
    );
    const invalidFiles = Array.from(e.target.files).filter(file => 
        !file.type.startsWith('image/') && !file.type.startsWith('video/')
    );
    
    if (invalidFiles.length > 0) {
        showCustomNotification('error', '❌ File Non Supportati', `${invalidFiles.length} file non sono immagini o video. Accettiamo: JPG, PNG, GIF, WEBP, MP4, MOV, AVI, WEBM.`);
    }
    
    validFiles.forEach((file) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        
        const fileSize = (file.size / 1024 / 1024).toFixed(2);
        const isVideo = file.type.startsWith('video/');
        
        fileItem.innerHTML = `
            <span style="color: #555;">
                ${isVideo ? '🎥' : '🖼️'} ${file.name} (${fileSize} MB) ✅
            </span>
        `;
        fileList.appendChild(fileItem);
    });
});

// ==================== VALIDAZIONE ====================
document.getElementById('reporterDiscord').addEventListener('blur', function() {
    const value = this.value.trim();
    if (value && !value.includes('#')) {
        showCustomNotification('warning', '⚠️ Formato Discord', 'Ricorda di includere il tag (es: username#1234)');
    }
});

// ==================== SUBMIT DEL FORM ====================
document.getElementById('reportForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    showLoadingOverlay('📤 Invio segnalazione in corso...');
    
    const fileInput = document.getElementById('evidence');
    const files = Array.from(fileInput.files).filter(f => 
        f.type.startsWith('image/') || f.type.startsWith('video/')
    );
    
    if (fileInput.files.length > 0 && files.length === 0) {
        hideLoadingOverlay();
        showCustomNotification('error', '❌ Nessun File Valido', 'Devi allegare almeno un file valido (immagine o video).');
        return;
    }
    
    const evidenceFiles = [];
    for (const file of files) {
        try {
            const base64 = await fileToBase64(file);
            evidenceFiles.push({
                name: file.name,
                type: file.type,
                size: file.size,
                data: base64,
                isVideo: file.type.startsWith('video/')
            });
        } catch (err) {
            console.error('Errore conversione file:', err);
        }
    }
    
    const reportData = {
        id: Date.now(),
        reporter: {
            username: document.getElementById('reporterUsername').value.trim(),
            discord: document.getElementById('reporterDiscord').value.trim(),
            email: document.getElementById('reporterEmail').value.trim()
        },
        reported: {
            username: document.getElementById('reportedUsername').value.trim(),
            discord: document.getElementById('reportedDiscord').value.trim() || 'Non fornito'
        },
        violationType: document.getElementById('violationType').value,
        description: document.getElementById('description').value.trim(),
        incidentDate: document.getElementById('incidentDate').value,
        evidenceCount: files.length,
        evidenceFiles: evidenceFiles,
        submittedDate: new Date().toISOString(),
        status: 'pending',
        openedBy: null
    };
    
    if (reportData.reporter.username === reportData.reported.username) {
        hideLoadingOverlay();
        showCustomNotification('error', '❌ Errore', 'Non puoi segnalare te stesso!');
        return;
    }
    
    try {
        const reports = JSON.parse(localStorage.getItem('userReports') || '[]');
        reports.push(reportData);
        localStorage.setItem('userReports', JSON.stringify(reports));
        
        await sendDiscordWebhook(reportData);
        
        hideLoadingOverlay();
        showSuccessAnimation();
        
        setTimeout(() => {
            window.location.href = 'home.html';
        }, 3000);
        
    } catch (error) {
        hideLoadingOverlay();
        console.error('Errore:', error);
        showCustomNotification('error', '❌ Errore', 'Si è verificato un errore. Riprova più tardi.');
    }
});

// ==================== CONVERTI FILE IN BASE64 ====================
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// ==================== WEBHOOK DISCORD ====================
async function sendDiscordWebhook(data) {
    const imageCount = data.evidenceFiles.filter(f => !f.isVideo).length;
    const videoCount = data.evidenceFiles.filter(f => f.isVideo).length;
    
    const embed = {
        title: '🚨 Nuova Segnalazione Ricevuta',
        description: 'È stata ricevuta una nuova segnalazione da un utente',
        color: 0xe74c3c,
        fields: [
            { 
                name: '👤 Segnalato da', 
                value: `**Username:** ${data.reporter.username}\n**Discord:** ${data.reporter.discord}\n**Email:** ${data.reporter.email}`, 
                inline: true 
            },
            { 
                name: '🎯 Utente Segnalato', 
                value: `**Username:** ${data.reported.username}\n**Discord:** ${data.reported.discord}`, 
                inline: true 
            },
            { name: '\u200B', value: '\u200B', inline: false },
            { name: '⚠️ Tipo Violazione', value: `**${data.violationType}**`, inline: true },
            { name: '📎 Prove Allegate', value: `${imageCount} immagini, ${videoCount} video`, inline: true },
            { name: '\u200B', value: '\u200B', inline: false },
            { 
                name: '📝 Descrizione Dettagliata', 
                value: data.description.length > 1024 ? data.description.substring(0, 1021) + '...' : data.description, 
                inline: false 
            },
            { 
                name: '📅 Data e Ora Incidente', 
                value: new Date(data.incidentDate).toLocaleString('it-IT', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }), 
                inline: true 
            },
            { 
                name: '🆔 ID Segnalazione', 
                value: `\`${data.id}\``, 
                inline: true 
            }
        ],
        footer: { 
            text: 'Sistema Segnalazioni - Comune di Piacenza RP | Gestisci nel pannello staff',
            icon_url: 'https://via.placeholder.com/100/e74c3c/FFFFFF?text=!'
        },
        timestamp: new Date().toISOString()
    };
    
    const firstImage = data.evidenceFiles.find(f => !f.isVideo);
    if (firstImage) {
        embed.thumbnail = { url: firstImage.data };
    }
    
    const payload = {
        username: '🚨 Segnalazioni - Piacenza RP',
        avatar_url: 'https://via.placeholder.com/100/e74c3c/FFFFFF?text=!',
        embeds: [embed],
        components: [
            {
                type: 1,
                components: [
                    {
                        type: 2,
                        style: 5,
                        label: '🔗 Apri Segnalazione',
                        url: `${window.location.origin}/staff.html?report=${data.id}`
                    }
                ]
            }
        ]
    };
    
    const response = await fetch(WEBHOOK_SEGNALAZIONI, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
        throw new Error('Errore invio webhook');
    }
    
    console.log('✅ Webhook inviato con successo');
}

// ==================== NOTIFICHE ====================
function showCustomNotification(type, title, message) {
    const notification = document.createElement('div');
    notification.className = 'custom-notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        padding: 20px 25px;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        max-width: 400px;
        border-left: 4px solid ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#f39c12'};
        animation: slideInRight 0.4s ease;
    `;
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
            <span style="font-size: 24px;">${type === 'success' ? '✅' : type === 'error' ? '❌' : '⚠️'}</span>
            <strong style="font-size: 16px; color: #333;">${title}</strong>
        </div>
        <div style="color: #666; font-size: 14px; line-height: 1.5;">${message}</div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.4s ease';
        setTimeout(() => notification.remove(), 400);
    }, 4000);
}

function showLoadingOverlay(message) {
    const overlay = document.createElement('div');
    overlay.id = 'loadingOverlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(5px);
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.3s ease;
    `;
    
    overlay.innerHTML = `
        <div style="text-align: center; color: white;">
            <div class="loading-spinner" style="
                border: 5px solid rgba(255, 255, 255, 0.3);
                border-top: 5px solid white;
                border-radius: 50%;
                width: 60px;
                height: 60px;
                animation: spin 1s linear infinite;
                margin: 0 auto 20px;
            "></div>
            <p style="font-size: 18px; font-weight: 600;">${message}</p>
        </div>
    `;
    
    document.body.appendChild(overlay);
}

function hideLoadingOverlay() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => overlay.remove(), 300);
    }
}

function showSuccessAnimation() {
    const successOverlay = document.createElement('div');
    successOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #27ae60 0%, #229954 100%);
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.3s ease;
    `;
    
    successOverlay.innerHTML = `
        <div style="text-align: center; color: white; animation: scaleIn 0.5s ease;">
            <div style="font-size: 100px; margin-bottom: 20px; animation: bounce 0.8s ease;">✅</div>
            <h2 style="font-size: 32px; margin-bottom: 15px;">Segnalazione Inviata!</h2>
            <p style="font-size: 18px; opacity: 0.9;">Lo staff la esaminerà entro 48 ore</p>
            <p style="font-size: 16px; opacity: 0.8; margin-top: 10px;">Riceverai una risposta su Discord</p>
            <div style="margin-top: 30px; font-size: 14px; opacity: 0.7;">Reindirizzamento in corso...</div>
        </div>
    `;
    
    document.body.appendChild(successOverlay);
}

// ==================== ANIMAZIONI CSS ====================
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { opacity: 0; transform: translateX(100px); }
        to { opacity: 1; transform: translateX(0); }
    }
    
    @keyframes slideOutRight {
        from { opacity: 1; transform: translateX(0); }
        to { opacity: 0; transform: translateX(100px); }
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
    
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
    
    @keyframes scaleIn {
        from { transform: scale(0.5); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
    }
    
    @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-20px); }
    }
`;
document.head.appendChild(style);

console.log('✅ Sistema segnalazioni caricato correttamente!');