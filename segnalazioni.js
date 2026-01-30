// ==================== CONFIGURAZIONE ====================
const WEBHOOK_SEGNALAZIONI = 'https://discord.com/api/webhooks/1464602775907467550/UXyFjYPWIv-pQaIzdCIichb9FeG5PVsEMmRRdmk87_Hx2cw_3ffvjeGsMWNGpW6Y5oYE';
const IMGBB_API_KEY = '5cbd206261a1b8340b7a826e97316a64'; // ← METTI LA TUA API KEY DI IMGBB QUI!

// ==================== GESTIONE FILE MULTIPLI ====================
let uploadedFiles = [];

// ==================== VERIFICA LOGIN E SETUP ====================
window.addEventListener('load', function() {
    const user = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    if (!user.username) {
        showCustomNotification('warning', '⚠️ Accesso Richiesto', 'Devi essere loggato per inviare una segnalazione!');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        return;
    } else {
        document.getElementById('reporterUsername').value = user.username || '';
        document.getElementById('reporterEmail').value = user.email || '';
    }
    
    // ==================== SETUP EVENT LISTENER PER FILE INPUT ====================
    const fileInput = document.getElementById('evidence');
    if (!fileInput) {
        console.error('❌ Input file non trovato!');
        return;
    }
    
    console.log('✅ Input file trovato e configurato');
    
    fileInput.addEventListener('change', function(e) {
        const files = Array.from(e.target.files);
        
        console.log(`📂 Selezionati ${files.length} file`);
        
        files.forEach(file => {
            // Controlla tipo file (immagini E video)
            const isImage = file.type.startsWith('image/');
            const isVideo = file.type.startsWith('video/');
            
            if (!isImage && !isVideo) {
                showCustomNotification('error', '❌ File Non Supportato', `${file.name} non è un'immagine o un video valido!`);
                return;
            }
            
            // Controlla dimensione
            if (isImage && file.size > 32 * 1024 * 1024) {
                showCustomNotification('error', '❌ File Troppo Grande', `${file.name} supera i 32MB! Max 32MB per immagini.`);
                return;
            }
            
            if (isVideo && file.size > 100 * 1024 * 1024) {
                showCustomNotification('error', '❌ File Troppo Grande', `${file.name} supera i 100MB! Max 100MB per video.`);
                return;
            }
            
            // Aggiungi il file all'array
            uploadedFiles.push({
                file: file,
                name: file.name,
                type: file.type,
                size: file.size,
                isVideo: isVideo
            });
            
            console.log(`✅ File aggiunto: ${file.name} (${isVideo ? 'Video' : 'Immagine'}) - ${(file.size / 1024 / 1024).toFixed(2)} MB`);
            console.log(`📊 Totale file nell'array: ${uploadedFiles.length}`);
        });
        
        updateFileList();
    });
    
    // ==================== SETUP DISCORD VALIDATION ====================
    document.getElementById('reporterDiscord').addEventListener('blur', function() {
        const value = this.value.trim();
        if (value && !value.includes('#') && !value.match(/^[a-z0-9_.]+$/)) {
            showCustomNotification('warning', '⚠️ Formato Discord', 'Formato Discord non valido (es: username#1234 o username)');
        }
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
    const removedFile = uploadedFiles[index];
    console.log(`🗑️ Rimosso: ${removedFile.name}`);
    uploadedFiles.splice(index, 1);
    console.log(`📊 Totale file rimanenti: ${uploadedFiles.length}`);
    updateFileList();
}

// ==================== UPLOAD SU IMGBB (SOLO IMMAGINI) ====================
async function uploadToImgbb(fileObj) {
    try {
        console.log(`📤 Caricamento IMMAGINE su Imgbb: ${fileObj.name}...`);
        
        const formData = new FormData();
        formData.append('key', IMGBB_API_KEY);
        formData.append('image', fileObj.file);
        
        const response = await fetch('https://api.imgbb.com/1/upload', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`Errore HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success || !data.data || !data.data.url) {
            throw new Error('Risposta non valida da Imgbb');
        }
        
        const url = data.data.url;
        console.log(`✅ Immagine caricata su Imgbb: ${url}`);
        
        return {
            url: url,
            name: fileObj.name,
            isVideo: false
        };
    } catch (error) {
        console.error(`❌ Errore upload Imgbb per ${fileObj.name}:`, error);
        throw new Error(`Impossibile caricare immagine ${fileObj.name}: ${error.message}`);
    }
}

// ==================== UPLOAD SU POMF.LAIN.LA CON PROXY CORS (SOLO VIDEO) ====================
async function uploadToPomf(fileObj) {
    try {
        console.log(`📤 Caricamento VIDEO su Pomf: ${fileObj.name}...`);
        
        const formData = new FormData();
        formData.append('files[]', fileObj.file);
        
        // USA PROXY CORS per bypassare il blocco
        const response = await fetch('https://corsproxy.io/?' + encodeURIComponent('https://pomf.lain.la/upload.php'), {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`Errore HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success || !data.files || !data.files[0]) {
            throw new Error('Risposta non valida da Pomf');
        }
        
        // CORREZIONE: L'API Pomf restituisce già l'URL completo in data.files[0].url
        const url = data.files[0].url;
        console.log(`✅ Video caricato su Pomf: ${url}`);
        console.log(`📋 Risposta completa Pomf:`, data);
        
        return {
            url: url,
            name: fileObj.name,
            isVideo: true
        };
    } catch (error) {
        console.error(`❌ Errore upload Pomf per ${fileObj.name}:`, error);
        throw new Error(`Impossibile caricare video ${fileObj.name}: ${error.message}`);
    }
}

// ==================== SUBMIT DEL FORM ====================
document.getElementById('reportForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    console.log(`📋 Submit form - File nell'array: ${uploadedFiles.length}`);
    
    // Validazione file
    if (uploadedFiles.length === 0) {
        showCustomNotification('error', '❌ Nessun File', 'Devi caricare almeno un file come prova!');
        return;
    }
    
    const reporterUsername = document.getElementById('reporterUsername').value.trim();
    const reportedUsername = document.getElementById('reportedUsername').value.trim();
    
    // Validazione auto-segnalazione
    if (reporterUsername.toLowerCase() === reportedUsername.toLowerCase()) {
        showCustomNotification('error', '❌ Errore', 'Non puoi segnalare te stesso!');
        return;
    }
    
    showLoadingOverlay('📤 Preparazione caricamento...');
    
    try {
        // Upload TUTTI i file
        const uploadedMediaUrls = [];
        let successCount = 0;
        let failCount = 0;
        
        for (let i = 0; i < uploadedFiles.length; i++) {
            const file = uploadedFiles[i];
            const fileType = file.isVideo ? 'video' : 'immagine';
            updateLoadingMessage(`📤 Caricamento ${fileType} ${i + 1}/${uploadedFiles.length}...`);
            
            try {
                // Usa Imgbb per IMMAGINI, Pomf per VIDEO
                let mediaData;
                if (file.isVideo) {
                    mediaData = await uploadToPomf(file);
                } else {
                    mediaData = await uploadToImgbb(file);
                }
                
                uploadedMediaUrls.push(mediaData);
                successCount++;
                
                console.log(`✅ [${i + 1}/${uploadedFiles.length}] Caricato: ${file.name} → ${mediaData.url}`);
                
                // Pausa di 1 secondo tra i caricamenti
                if (i < uploadedFiles.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            } catch (uploadError) {
                console.error(`❌ [${i + 1}/${uploadedFiles.length}] Errore: ${file.name}`, uploadError);
                failCount++;
                showCustomNotification('warning', '⚠️ Avviso', `Impossibile caricare ${file.name}`);
            }
        }
        
        // Verifica se almeno un file è stato caricato
        if (uploadedMediaUrls.length === 0) {
            hideLoadingOverlay();
            showCustomNotification('error', '❌ Errore Caricamento', 'Nessun file è stato caricato con successo! Riprova.');
            return;
        }
        
        console.log(`📊 Riepilogo: ${successCount} caricati, ${failCount} falliti`);
        
        updateLoadingMessage('📤 Invio segnalazione a Discord...');
        
        // Separa immagini e video
        const images = uploadedMediaUrls.filter(e => !e.isVideo);
        const videos = uploadedMediaUrls.filter(e => e.isVideo);
        
        console.log(`🖼️ Immagini caricate: ${images.length}`, images);
        console.log(`🎥 Video caricati: ${videos.length}`, videos);
        
        const reportData = {
            id: Date.now(),
            reporter: {
                username: reporterUsername,
                discord: document.getElementById('reporterDiscord').value.trim(),
                email: document.getElementById('reporterEmail').value.trim()
            },
            reported: {
                username: reportedUsername,
                discord: document.getElementById('reportedDiscord').value.trim() || 'Non fornito'
            },
            violationType: document.getElementById('violationType').value,
            description: document.getElementById('description').value.trim(),
            incidentDate: document.getElementById('incidentDate').value,
            evidenceUrls: images,
            videoUrls: videos,
            submittedDate: new Date().toISOString(),
            status: 'pending',
            openedBy: null
        };
        
        // Salva nel localStorage
        const reports = JSON.parse(localStorage.getItem('userReports') || '[]');
        reports.push(reportData);
        localStorage.setItem('userReports', JSON.stringify(reportData));
        
        console.log('✅ Segnalazione salvata nel localStorage:', reportData);
        
        // Invia webhook Discord
        await sendDiscordWebhook(reportData);
        
        hideLoadingOverlay();
        showSuccessAnimation();
        
        // Reset form e redirect
        setTimeout(() => {
            uploadedFiles = [];
            document.getElementById('reportForm').reset();
            window.location.href = 'home.html';
        }, 3000);
        
    } catch (error) {
        hideLoadingOverlay();
        console.error('❌ Errore generale:', error);
        showCustomNotification('error', '❌ Errore', `Si è verificato un errore: ${error.message}`);
    }
});

// ==================== WEBHOOK DISCORD CON IMMAGINI EMBED ====================
async function sendDiscordWebhook(data) {
    const imageCount = data.evidenceUrls?.length || 0;
    const videoCount = data.videoUrls?.length || 0;
    
    console.log(`📤 Invio webhook con ${imageCount} immagini e ${videoCount} video`);
    
    // EMBED PRINCIPALE
    const mainEmbed = {
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
            { 
                name: '📎 Prove Allegate', 
                value: `${imageCount} immagine${imageCount !== 1 ? 'i' : ''}${videoCount > 0 ? ` • ${videoCount} video` : ''}`, 
                inline: true 
            },
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
    
    // THUMBNAIL prima immagine
    if (data.evidenceUrls && data.evidenceUrls.length > 0) {
        mainEmbed.image = { url: data.evidenceUrls[0].url }; // Immagine grande nel primo embed
    }
    
    // Link alle immagini
    if (data.evidenceUrls && data.evidenceUrls.length > 0) {
        const imageLinks = data.evidenceUrls.map((img, i) => 
            `[🖼️ Immagine ${i + 1}](${img.url})`
        ).join(' • ');
        
        mainEmbed.fields.push({
            name: '🔗 Link alle Immagini',
            value: imageLinks.length > 1024 ? imageLinks.substring(0, 1021) + '...' : imageLinks,
            inline: false
        });
        
        console.log(`🖼️ Link immagini aggiunti:`, imageLinks);
    }
    
    // Link ai video
    if (data.videoUrls && data.videoUrls.length > 0) {
        const videoLinks = data.videoUrls.map((vid, i) => {
            console.log(`🎥 Video ${i + 1}: ${vid.url} (${vid.name})`);
            return `[🎥 Video ${i + 1}](${vid.url}) - \`${vid.name}\``;
        }).join('\n');
        
        mainEmbed.fields.push({
            name: '🎥 Link ai Video',
            value: videoLinks.length > 1024 ? videoLinks.substring(0, 1021) + '...' : videoLinks,
            inline: false
        });
        
        console.log(`🎥 Link video aggiunti:`, videoLinks);
    }
    
    // Link pannello staff
    mainEmbed.fields.push({
        name: '👮 Pannello Staff',
        value: `[🔍 **Apri Segnalazione nel Pannello Staff**](https://theninjamaster324.github.io/Comune-di-Piacenza/staff.html?report=${data.id})`,
        inline: false
    });
    
    // Array di embeds (principale + immagini aggiuntive)
    const embeds = [mainEmbed];
    
    // Aggiungi le altre immagini come embed separati (max 10 embed totali)
    if (data.evidenceUrls && data.evidenceUrls.length > 1) {
        const remainingImages = data.evidenceUrls.slice(1, 9); // Max 9 immagini aggiuntive (totale 10 embed)
        remainingImages.forEach((img, i) => {
            embeds.push({
                title: `📸 Prova ${i + 2}`,
                image: { url: img.url },
                color: 0x3498db
            });
        });
    }
    
    const payload = { embeds: embeds };
    
    try {
        const response = await fetch(WEBHOOK_SEGNALAZIONI, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Errore webhook Discord:', errorText);
            throw new Error(`Errore invio webhook: ${response.status}`);
        }
        
        console.log('✅ Webhook Discord inviato con successo!');
    } catch (error) {
        console.error('❌ Errore invio webhook Discord:', error);
        throw error;
    }
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
            <div style="margin-top: 20px; padding: 15px; background: rgba(0,0,0,0.2); border-radius: 10px; max-width: 400px; margin: 20px auto 0;">
                <p style="font-size: 14px; opacity: 0.9;">✨ Tutti i file sono stati caricati con successo!</p>
            </div>
            <div style="margin-top: 20px; font-size: 14px; opacity: 0.7;">Reindirizzamento in corso...</div>
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

console.log('✅ Sistema segnalazioni caricato!');
console.log('🖼️ Immagini: Imgbb (max 32MB)');
console.log('🎥 Video: Pomf.lain.la (max 100MB)');