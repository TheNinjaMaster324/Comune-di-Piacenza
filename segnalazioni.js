// ==================== CONFIGURAZIONE ====================
const WEBHOOK_SEGNALAZIONI = 'https://discord.com/api/webhooks/1464602775907467550/UXyFjYPWIv-pQaIzdCIichb9FeG5PVsEMmRRdmk87_Hx2cw_3ffvjeGsMWNGpW6Y5oYE';
const IMGBB_API_KEY = '5cbd206261a1b8340b7a826e97316a64'; 

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

// ==================== GESTIONE FILE MULTIPLI ====================
let uploadedFiles = [];

document.getElementById('evidence').addEventListener('change', function(e) {
    const files = Array.from(e.target.files);
    
    files.forEach(file => {
        // Controlla tipo file
        if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
            showCustomNotification('error', '❌ File Non Supportato', `${file.name} non è un'immagine o un video valido!`);
            return;
        }
        
        // Controlla dimensione (max 10MB per Imgur)
        if (file.size > 10 * 1024 * 1024) {
            showCustomNotification('error', '❌ File Troppo Grande', `${file.name} supera i 10MB!`);
            return;
        }
        
        // Leggi il file come base64
        const reader = new FileReader();
        reader.onload = function(event) {
            uploadedFiles.push({
                name: file.name,
                type: file.type,
                size: file.size,
                data: event.target.result,
                isVideo: file.type.startsWith('video/')
            });
            
            updateFileList();
        };
        reader.readAsDataURL(file);
    });
});

function updateFileList() {
    const fileList = document.getElementById('fileList');
    
    if (uploadedFiles.length === 0) {
        fileList.innerHTML = '<p style="color: #888; font-size: 14px; margin-top: 10px;">Nessun file selezionato</p>';
        return;
    }
    
    fileList.innerHTML = `
        <div style="margin-top: 15px;">
            <strong style="color: #333;">File caricati (${uploadedFiles.length}):</strong>
            ${uploadedFiles.map((file, index) => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: #f8f9fa; border-radius: 8px; margin-top: 8px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 24px;">${file.isVideo ? '🎥' : '🖼️'}</span>
                        <div>
                            <div style="font-size: 14px; color: #333; font-weight: 500;">${file.name}</div>
                            <div style="font-size: 12px; color: #888;">${(file.size / 1024 / 1024).toFixed(2)} MB</div>
                        </div>
                    </div>
                    <button type="button" onclick="removeFile(${index})" style="background: #e74c3c; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 13px;">🗑️ Rimuovi</button>
                </div>
            `).join('')}
        </div>
    `;
}

function removeFile(index) {
    uploadedFiles.splice(index, 1);
    updateFileList();
}

// ==================== VALIDAZIONE ====================
document.getElementById('reporterDiscord').addEventListener('blur', function() {
    const value = this.value.trim();
    if (value && !value.includes('#')) {
        showCustomNotification('warning', '⚠️ Formato Discord', 'Ricorda di includere il tag (es: username#1234)');
    }
});

// ==================== UPLOAD SU IMGUR ====================

// ==================== UPLOAD SU IMGUR (ALTERNATIVA) ====================
// ==================== UPLOAD SU IMGBB ====================
async function uploadToImgBB(file) {
    try {
        const base64Data = file.data.split(',')[1];
        
        const formData = new FormData();
        formData.append('key', IMGBB_API_KEY);
        formData.append('image', base64Data);
        formData.append('name', file.name);
        
        const response = await fetch('https://api.imgbb.com/1/upload', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('Errore ImgBB:', errorData);
            throw new Error('Errore upload ImgBB');
        }
        
        const data = await response.json();
        return {
            url: data.data.url,
            deleteUrl: data.data.delete_url,
            name: file.name
        };
    } catch (error) {
        console.error('Errore upload ImgBB:', error);
        throw error;
    }
}

// ==================== SUBMIT DEL FORM ====================
document.getElementById('reportForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    if (uploadedFiles.length === 0) {
        showCustomNotification('error', '❌ Nessun File', 'Devi caricare almeno un file come prova!');
        return;
    }

    
    showLoadingOverlay('📤 Caricamento prove su Imgur...');
    
    try {
        // Upload di tutte le immagini su Imgur
        const uploadedUrls = [];
        for (let i = 0; i < uploadedFiles.length; i++) {
            const file = uploadedFiles[i];
            
            // Imgur supporta solo immagini, non video
            if (file.isVideo) {
                showCustomNotification('warning', '⚠️ Video Ignorato', `${file.name} non può essere caricato (Imgur supporta solo immagini)`);
                continue;
            }
            
            updateLoadingMessage(`📤 Caricamento ${i + 1}/${uploadedFiles.length}...`);
            
            const imgurData = await uploadToImgBB(file);
            uploadedUrls.push(imgurData);
            
            // Piccolo delay per evitare rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        if (uploadedUrls.length === 0) {
            hideLoadingOverlay();
            showCustomNotification('error', '❌ Nessuna Immagine', 'Nessuna immagine è stata caricata con successo!');
            return;
        }
        
        updateLoadingMessage('📤 Invio segnalazione...');
        
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
            evidenceCount: uploadedUrls.length,
            evidenceUrls: uploadedUrls,
            submittedDate: new Date().toISOString(),
            status: 'pending',
            openedBy: null
        };
        
        if (reportData.reporter.username === reportData.reported.username) {
            hideLoadingOverlay();
            showCustomNotification('error', '❌ Errore', 'Non puoi segnalare te stesso!');
            return;
        }
        
        // Salva nel localStorage
        const reports = JSON.parse(localStorage.getItem('userReports') || '[]');
        reports.push(reportData);
        localStorage.setItem('userReports', JSON.stringify(reports));
        
        // Invia webhook Discord
        await sendDiscordWebhook(reportData);
        
        hideLoadingOverlay();
        showSuccessAnimation();
        
        setTimeout(() => {
            window.location.href = 'home.html';
        }, 3000);
        
    } catch (error) {
        hideLoadingOverlay();
        console.error('Errore:', error);
        showCustomNotification('error', '❌ Errore', 'Si è verificato un errore durante il caricamento. Riprova più tardi.');
    }
});

// ==================== WEBHOOK DISCORD ====================
async function sendDiscordWebhook(data) {
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
            { name: '📎 Prove Allegate', value: `${data.evidenceCount} immagini`, inline: true },
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
            text: 'Sistema Segnalazioni - Comune di Piacenza RP',
            icon_url: 'https://cdn.discordapp.com/embed/avatars/0.png'
        },
        timestamp: new Date().toISOString()
    };
    
    // Aggiungi la prima immagine come thumbnail
    if (data.evidenceUrls && data.evidenceUrls.length > 0) {
        embed.thumbnail = { url: data.evidenceUrls[0].url };
        
        // Aggiungi tutte le immagini come field con link
        const imageLinks = data.evidenceUrls.map((img, i) => 
            `[🖼️ Immagine ${i + 1}](${img.url})`
        ).join(' • ');
        
        embed.fields.push({
            name: '🔗 Link alle Prove',
            value: imageLinks,
            inline: false
        });
        
        // ✅ LINK ALLA SEGNALAZIONE NEL PANNELLO STAFF
        embed.fields.push({
            name: '👮 Pannello Staff',
            value: `[🔍 **Apri Segnalazione nel Pannello Staff**](https://theninjamaster324.github.io/Comune-di-Piacenza/staff.html?report=${data.id})`,
            inline: false
        });
    }
    
    // ❌ RIMOSSO components perché non funziona con webhook
    const payload = {
        embeds: [embed]
    };
    
    const response = await fetch(WEBHOOK_SEGNALAZIONI, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        console.error('Errore webhook:', errorText);
        throw new Error('Errore invio webhook');
    }
    
    console.log('✅ Webhook inviato con successo');
}

// ==================== UTILITY ====================
function updateLoadingMessage(message) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        const messageEl = overlay.querySelector('p');
        if (messageEl) messageEl.textContent = message;
    }
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

console.log('✅ Sistema segnalazioni con ImgBB caricato correttamente!');