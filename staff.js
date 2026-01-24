// ==================== VARIABILI GLOBALI ====================
let currentUser = {};
let allUsers = [];
let currentFilter = 'all';
let currentReportFilter = 'all';

// ==================== WEBHOOK AZIONI STAFF ====================
const WEBHOOK_AZIONI_STAFF = 'https://discord.com/api/webhooks/1464602775907467550/UXyFjYPWIv-pQaIzdCIichb9FeG5PVsEMmRRdmk87_Hx2cw_3ffvjeGsMWNGpW6Y5oYE';

async function sendStaffActionWebhook(action, report, staffUsername, note = '') {
    const actionConfig = {
        'opened': { title: '👁️ Segnalazione Aperta', description: `${staffUsername} ha preso in carico la segnalazione`, color: 0x3498db },
        'rejected': { title: '❌ Segnalazione Rifiutata', description: `${staffUsername} ha rifiutato la segnalazione`, color: 0xe74c3c },
        'resolved': { title: '✅ Segnalazione Chiusa', description: `${staffUsername} ha chiuso la segnalazione`, color: 0x27ae60 },
        'archived': { title: '📁 Segnalazione Archiviata', description: `${staffUsername} ha archiviato la segnalazione`, color: 0x95a5a6 },
        'reopened': { title: '🔄 Segnalazione Riaperta', description: `${staffUsername} ha riaperto la segnalazione`, color: 0xf39c12 }
    };

    const config = actionConfig[action];
    if (!config) return;

    const embed = {
        title: config.title,
        description: config.description,
        color: config.color,
        fields: [
            { name: '🆔 ID Segnalazione', value: `\`${report.id}\``, inline: true },
            { name: '👤 Segnalato da', value: report.reporter.username, inline: true },
            { name: '🎯 Utente Segnalato', value: report.reported.username, inline: true },
            { name: '⚠️ Tipo Violazione', value: report.violationType, inline: true },
            { name: '👮 Staff', value: staffUsername, inline: true },
            { name: '📅 Data Azione', value: new Date().toLocaleString('it-IT'), inline: true }
        ],
        footer: { text: 'Sistema Segnalazioni - Comune di Piacenza RP' },
        timestamp: new Date().toISOString()
    };

    if (note && note.trim() !== '') {
        embed.fields.push({ name: '📝 Nota', value: note, inline: false });
    }

    if (report.evidenceUrls && report.evidenceUrls.length > 0) {
        const imageLinks = report.evidenceUrls.map((img, i) => `[🖼️ Immagine ${i + 1}](${img.url})`).join(' • ');
        embed.fields.push({ name: '🔗 Prove', value: imageLinks, inline: false });
        embed.thumbnail = { url: report.evidenceUrls[0].url };
    }

    const payload = {
    username: '🚨 Segnalazioni - Piacenza RP',
    avatar_url: 'https://cdn.discordapp.com/embed/avatars/0.png',
    embeds: [embed],
    components: [
        {
            type: 1,
            components: [
                {
                    type: 2,
                    style: 5,
                    label: '🔍 Visualizza Segnalazione',
                    url: `https://theninjamaster324.github.io/Comune-di-Piacenza/staff.html?report=${report.id}`
                }
            ]
        }
    ]
};

    try {
        await fetch(WEBHOOK_AZIONI_STAFF, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        console.log(`✅ Webhook azione "${action}" inviato`);
    } catch (error) {
        console.error('Errore webhook:', error);
    }
}

// ==================== INIZIALIZZAZIONE ====================
window.addEventListener('load', function() {
    currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    
    if (!currentUser.isAdmin) {
        alert('⚠️ Accesso negato! Solo admin.');
        window.location.href = 'home.html';
        return;
    }

    document.getElementById('adminName').textContent = currentUser.username;
    
    // Controlla se c'è un parametro report nell'URL
    const urlParams = new URLSearchParams(window.location.search);
    const reportId = urlParams.get('report');
    
    loadDashboard();
    loadUsers();
    loadReports();
    loadAnnouncements();
    loadLogs();
    loadSettings();
    
    // Se c'è un reportId, apri quella segnalazione
    if (reportId) {
        setTimeout(() => navigateToReportFromUrl(parseInt(reportId)), 500);
    }
});

function navigateToReportFromUrl(reportId) {
    const reports = JSON.parse(localStorage.getItem('userReports') || '[]');
    const report = reports.find(r => r.id === reportId);
    
    if (!report) {
        showNotification('Segnalazione non trovata', 'error');
        return;
    }
    
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelector('.tab:nth-child(3)').classList.add('active');
    document.getElementById('reports').classList.add('active');
    
    currentReportFilter = report.status === 'archived' ? 'archived' : 
                          report.status === 'rejected' ? 'rejected' :
                          report.status === 'resolved' ? 'resolved' :
                          report.status === 'in_progress' ? 'in_progress' : 'pending';
    
    document.querySelectorAll('#reports .filter-btn').forEach(btn => btn.classList.remove('active'));
    const filterBtns = document.querySelectorAll('#reports .filter-btn');
    filterBtns.forEach(btn => {
        if (btn.textContent.includes(report.status === 'pending' ? 'Da Gestire' : 
                                      report.status === 'in_progress' ? 'Aperte' :
                                      report.status === 'resolved' ? 'Chiuse' :
                                      report.status === 'rejected' ? 'Respinte' :
                                      report.status === 'archived' ? 'Archiviate' : '')) {
            btn.classList.add('active');
        }
    });
    
    loadReports();
    
    setTimeout(() => {
        const detailsDiv = document.getElementById(`details-${reportId}`);
        if (detailsDiv) {
            detailsDiv.style.display = 'block';
            const reportCard = detailsDiv.closest('.report-card');
            if (reportCard) {
                reportCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                reportCard.style.boxShadow = '0 0 20px rgba(102, 126, 234, 0.5)';
                reportCard.style.border = '2px solid #667eea';
                setTimeout(() => {
                    reportCard.style.boxShadow = '';
                    reportCard.style.border = '';
                }, 3000);
            }
        }
    }, 300);
}

// ==================== GESTIONE TABS ====================
function showTab(tabName) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    if (event && event.target) {
        event.target.classList.add('active');
    }
    document.getElementById(tabName).classList.add('active');
    
    if (tabName === 'reports') {
        loadReports();
    }
}

// ==================== DASHBOARD ====================
function loadDashboard() {
    const users = JSON.parse(localStorage.getItem('piacenzaUsers') || '[]');
    const reports = JSON.parse(localStorage.getItem('userReports') || '[]');
    
    document.getElementById('totalUsers').textContent = users.length;
    
    const activeReports = reports.filter(r => r.status !== 'archived' && r.status !== 'rejected');
    const reportedUsernames = [...new Set(activeReports.map(r => r.reported.username))];
    document.getElementById('bannedUsers').textContent = reportedUsernames.length;
    
    const openReports = reports.filter(r => r.status === 'in_progress').length;
    document.getElementById('totalReports').textContent = openReports;
    
    document.getElementById('totalApplications').textContent = reports.length;
    
    const logs = JSON.parse(localStorage.getItem('adminLogs') || '[]');
    const recentLogs = logs.slice(-10).reverse();
    
    const activityDiv = document.getElementById('recentActivity');
    
    if (recentLogs.length === 0) {
        activityDiv.innerHTML = `
            <div class="log-item" style="text-align: center; padding: 30px; color: #888;">
                <p style="font-size: 16px;">📋 Nessuna attività registrata</p>
            </div>
        `;
    } else {
        activityDiv.innerHTML = recentLogs.map(log => `
            <div class="log-item">
                <div class="log-time">${new Date(log.date).toLocaleString('it-IT')}</div>
                <div class="log-action"><strong>${log.admin}:</strong> ${log.action}</div>
            </div>
        `).join('');
    }
}

// ==================== GESTIONE SEGNALAZIONI ====================
function loadReports() {
    const reports = JSON.parse(localStorage.getItem('userReports') || '[]');
    const list = document.getElementById('reportsList');
    
    if (!list) return;
    
    const sortedReports = reports.sort((a, b) => b.id - a.id);
    
    let filtered = sortedReports;
    if (currentReportFilter !== 'all') {
        filtered = sortedReports.filter(r => r.status === currentReportFilter);
    }
    
    if (filtered.length === 0) {
        list.innerHTML = `<p style="color: #888; text-align: center; padding: 40px;">Nessuna segnalazione in questa categoria</p>`;
        return;
    }
    
    list.innerHTML = filtered.map(report => createReportCard(report)).join('');
}

function createReportCard(report) {
    const statusConfig = {
        pending: { icon: '⏳', text: 'Da Gestire', color: '#f39c12', bg: '#fff3cd' },
        in_progress: { icon: '🔓', text: 'Aperta', color: '#3498db', bg: '#d1ecf1' },
        resolved: { icon: '✅', text: 'Chiusa', color: '#27ae60', bg: '#d4edda' },
        rejected: { icon: '❌', text: 'Respinta', color: '#e74c3c', bg: '#f8d7da' },
        archived: { icon: '📁', text: 'Archiviata', color: '#95a5a6', bg: '#e2e3e5' }
    };
    
    const config = statusConfig[report.status] || statusConfig.pending;
    
    return `
        <div class="report-card" style="margin-bottom: 15px; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div class="report-header" style="background: ${config.bg}; padding: 15px; border-left: 4px solid ${config.color}; cursor: pointer;" onclick="toggleReportDetails(${report.id})">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <span style="font-size: 20px; margin-right: 10px;">${config.icon}</span>
                        <strong style="color: #333; font-size: 16px;">Segnalazione #${report.id}</strong>
                        <span style="margin-left: 15px; padding: 5px 12px; background: ${config.color}; color: white; border-radius: 15px; font-size: 12px; font-weight: 600;">${config.text}</span>
                    </div>
                    <div style="text-align: right; color: #666;">
                        <div style="font-size: 14px;"><strong>Segnalato:</strong> ${report.reported.username}</div>
                        <div style="font-size: 12px; margin-top: 5px;">${new Date(report.submittedDate).toLocaleDateString('it-IT')}</div>
                    </div>
                </div>
            </div>
            
            <div id="details-${report.id}" class="report-details" style="display: none; padding: 20px; border-top: 1px solid #e0e0e0;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                    <div>
                        <h4 style="color: #667eea; margin-bottom: 10px;">👤 Segnalato da</h4>
                        <p><strong>Username:</strong> ${report.reporter.username}</p>
                        <p><strong>Discord:</strong> ${report.reporter.discord}</p>
                        <p><strong>Email:</strong> ${report.reporter.email}</p>
                    </div>
                    <div>
                        <h4 style="color: #e74c3c; margin-bottom: 10px;">🎯 Utente Segnalato</h4>
                        <p><strong>Username:</strong> ${report.reported.username}</p>
                        <p><strong>Discord:</strong> ${report.reported.discord}</p>
                    </div>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <h4 style="color: #333; margin-bottom: 10px;">⚠️ Violazione</h4>
                    <span style="background: #f8f9fa; padding: 8px 15px; border-radius: 8px; display: inline-block; font-weight: 600;">${report.violationType}</span>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <h4 style="color: #333; margin-bottom: 10px;">📝 Descrizione</h4>
                    <p style="background: #f8f9fa; padding: 15px; border-radius: 8px; line-height: 1.6; color: #555;">${report.description}</p>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <h4 style="color: #333; margin-bottom: 10px;">📅 Data Incidente</h4>
                    <p>${new Date(report.incidentDate).toLocaleString('it-IT')}</p>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <h4 style="color: #333; margin-bottom: 10px;">📎 Prove</h4>
                    ${report.evidenceFiles && report.evidenceFiles.length > 0 ? `
                        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; margin-top: 10px;">
                            ${report.evidenceFiles.map((file, index) => file.isVideo ? `
                                <div style="position: relative; border: 2px solid #e0e0e0; border-radius: 8px; overflow: hidden; cursor: pointer; background: #000;" onclick="event.stopPropagation(); openVideoModal(${report.id}, ${index})">
                                    <div style="width: 100%; height: 150px; display: flex; align-items: center; justify-content: center; color: white; font-size: 48px;">
                                        🎥
                                    </div>
                                    <div style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.8); color: white; padding: 5px; text-align: center; font-size: 11px;">
                                        ${file.name}
                                    </div>
                                </div>
                            ` : `
                                <div style="position: relative; border: 2px solid #e0e0e0; border-radius: 8px; overflow: hidden; cursor: pointer;" onclick="event.stopPropagation(); openImageModal(${report.id}, ${index})">
                                    <img src="${file.data}" style="width: 100%; height: 150px; object-fit: cover;" alt="Prova ${index + 1}">
                                    <div style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.7); color: white; padding: 5px; text-align: center; font-size: 11px;">
                                        ${file.name}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : `<p>${report.evidenceCount} file allegati (non disponibili in anteprima)</p>`}
                </div>
                
                ${report.openedBy ? `
                    <div style="margin-bottom: 20px;">
                        <h4 style="color: #333; margin-bottom: 10px;">👮 Gestita da</h4>
                        <p><strong>${report.openedBy}</strong> il ${new Date(report.openedDate).toLocaleString('it-IT')}</p>
                    </div>
                ` : ''}
                
                <div class="report-actions" style="display: flex; gap: 10px; margin-top: 20px;">
                    ${report.status === 'pending' ? `
                        <button class="btn btn-primary" onclick="openReport(${report.id})">🔓 Apri Segnalazione</button>
                        <button class="btn btn-danger" onclick="rejectReport(${report.id})">❌ Respingi</button>
                    ` : ''}
                    
                    ${report.status === 'in_progress' ? `
                        <button class="btn btn-success" onclick="resolveReport(${report.id})">✅ Chiudi Segnalazione</button>
                    ` : ''}
                    
                    ${report.status === 'resolved' ? `
                        <button class="btn btn-primary" onclick="archiveReport(${report.id})">📁 Archivia</button>
                    ` : ''}
                    
                    ${report.status === 'rejected' || report.status === 'archived' ? `
                        <button class="btn btn-primary" onclick="reopenReport(${report.id})">🔄 Riapri Segnalazione</button>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

function toggleReportDetails(reportId) {
    const details = document.getElementById(`details-${reportId}`);
    details.style.display = details.style.display === 'none' ? 'block' : 'none';
}

function openReport(reportId) {
    const reports = JSON.parse(localStorage.getItem('userReports') || '[]');
    const report = reports.find(r => r.id === reportId);
    
    if (!report) return;
    
    report.status = 'in_progress';
    report.openedBy = currentUser.username;
    report.openedDate = new Date().toISOString();
    
    localStorage.setItem('userReports', JSON.stringify(reports));
    sendStaffActionWebhook('opened', report, currentUser.username);
    
    sendReportWebhook('open', report);
    addLog(`Segnalazione #${reportId} aperta - Utente: ${report.reported.username}`);
    showNotification('Segnalazione aperta e presa in carico', 'success');
    
    loadReports();
    loadDashboard();
    loadUsers();
}

function resolveReport(reportId) {
    const reports = JSON.parse(localStorage.getItem('userReports') || '[]');
    const report = reports.find(r => r.id === reportId);
    
    if (!report) return;
    
    report.status = 'resolved';
    report.resolvedBy = currentUser.username;
    report.resolvedDate = new Date().toISOString();
    
    localStorage.setItem('userReports', JSON.stringify(reports));
    sendStaffActionWebhook('resolved', report, currentUser.username);
    
    sendReportWebhook('resolve', report);
    addLog(`Segnalazione #${reportId} chiusa - Utente: ${report.reported.username}`);
    showNotification('Segnalazione chiusa con successo', 'success');
    
    loadReports();
    loadDashboard();
    loadUsers();
}

function rejectReport(reportId) {
    showConfirmDialog(
        '❌ Respingere Segnalazione?',
        'Sei sicuro di voler respingere questa segnalazione? Questa azione può essere annullata.',
        () => {
            const reports = JSON.parse(localStorage.getItem('userReports') || '[]');
            const report = reports.find(r => r.id === reportId);
            
            if (!report) return;
            
            const note = prompt('Motivo del rifiuto (opzionale):') || '';
            report.status = 'rejected';
            report.rejectedBy = currentUser.username;
            report.rejectedDate = new Date().toISOString();
            
            localStorage.setItem('userReports', JSON.stringify(reports));
            sendStaffActionWebhook('rejected', report, currentUser.username, note);
            
            sendReportWebhook('reject', report);
            addLog(`Segnalazione #${reportId} respinta - Utente: ${report.reported.username}`);
            showNotification('Segnalazione respinta', 'success');
            
            loadReports();
            loadDashboard();
            loadUsers();
        }
    );
}

function archiveReport(reportId) {
    const reports = JSON.parse(localStorage.getItem('userReports') || '[]');
    const report = reports.find(r => r.id === reportId);
    
    if (!report) return;
    const note = prompt('Nota di archiviazione (opzionale):') || '';
    
    report.status = 'archived';
    report.archivedBy = currentUser.username;
    report.archivedDate = new Date().toISOString();
    
    localStorage.setItem('userReports', JSON.stringify(reports));
    sendStaffActionWebhook('archived', report, currentUser.username, note);
    
    sendReportWebhook('archive', report);
    addLog(`Segnalazione #${reportId} archiviata`);
    showNotification('Segnalazione archiviata', 'success');
    
    loadReports();
    loadDashboard();
    loadUsers();
}

function reopenReport(reportId) {
    const reports = JSON.parse(localStorage.getItem('userReports') || '[]');
    const report = reports.find(r => r.id === reportId);
    
    if (!report) return;
    
    report.status = 'in_progress';
    
    localStorage.setItem('userReports', JSON.stringify(reports));
    sendStaffActionWebhook('reopened', report, currentUser.username);
    
    sendReportWebhook('reopen', report);
    addLog(`Segnalazione #${reportId} riaperta`);
    showNotification('Segnalazione riaperta', 'success');
    
    loadReports();
    loadDashboard();
    loadUsers();
}

function filterReports(filter) {
    currentReportFilter = filter;
    document.querySelectorAll('#reports .filter-btn').forEach(btn => btn.classList.remove('active'));
    if (event && event.target) event.target.classList.add('active');
    loadReports();
}

// ==================== GESTIONE UTENTI ====================
function loadUsers() {
    allUsers = JSON.parse(localStorage.getItem('piacenzaUsers') || '[]');
    const reports = JSON.parse(localStorage.getItem('userReports') || '[]');
    
    allUsers.forEach(user => {
        if (!user.registeredDate) {
            user.registeredDate = new Date().toISOString();
        }
        
        const userReports = reports.filter(r => 
            r.reported.username === user.username && 
            r.status !== 'archived' && 
            r.status !== 'rejected'
        );
        user.reportsCount = userReports.length;
    });
    
    localStorage.setItem('piacenzaUsers', JSON.stringify(allUsers));
    renderUsers();
}

function renderUsers() {
    const tbody = document.getElementById('userTableBody');
    const searchTerm = document.getElementById('userSearch').value.toLowerCase();
    
    let filtered = allUsers.filter(user => {
        const matchesSearch = user.username.toLowerCase().includes(searchTerm) || 
                             user.email.toLowerCase().includes(searchTerm);
        
        if (currentFilter === 'all') return matchesSearch;
        if (currentFilter === 'active') return matchesSearch && !user.banned && user.reportsCount === 0;
        if (currentFilter === 'banned') return matchesSearch && user.banned;
        if (currentFilter === 'reported') return matchesSearch && user.reportsCount > 0;
        
        return matchesSearch;
    });
    
    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: #888;">
                    Nessun utente trovato
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = filtered.map(user => `
        <tr>
            <td><strong>${user.username}</strong></td>
            <td>${user.email}</td>
            <td>
                ${user.banned 
                    ? '<span class="badge badge-danger">🚫 Bannato</span>' 
                    : user.reportsCount > 0
                        ? '<span class="badge" style="background: #fff3cd; color: #856404;">🚨 Segnalato</span>'
                        : '<span class="badge badge-success">✅ Attivo</span>'}
            </td>
            <td>${new Date(user.registeredDate).toLocaleDateString('it-IT')}</td>
            <td>
                <span style="display: inline-block; padding: 5px 12px; background: ${user.reportsCount > 0 ? '#e74c3c' : '#27ae60'}; color: white; border-radius: 15px; font-weight: 600; font-size: 13px;">
                    ${user.reportsCount} segnalazioni
                </span>
            </td>
            <td>
                ${user.reportsCount > 0 ? `
                    <button class="btn btn-primary" style="font-size: 13px; padding: 8px 12px;" onclick="viewUserReports('${user.username}')">👁️ Vedi Segnalazioni</button>
                ` : ''}
                ${user.banned 
                    ? `<button class="btn btn-success" onclick="toggleBan('${user.username}')">✅ Sbanna</button>`
                    : `<button class="btn btn-danger" onclick="toggleBan('${user.username}')">🚫 Banna</button>`}
            </td>
        </tr>
    `).join('');
}

function viewUserReports(username) {
    const reports = JSON.parse(localStorage.getItem('userReports') || '[]');
    const userReports = reports.filter(r => r.reported.username === username);
    
    if (userReports.length === 0) {
        showNotification('Nessuna segnalazione trovata per questo utente', 'error');
        return;
    }
    
    const modal = document.createElement('div');
    modal.id = 'userReportsModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.3s ease;
    `;
    
    modal.innerHTML = `
        <div style="background: white; border-radius: 20px; max-width: 800px; max-height: 80vh; overflow-y: auto; padding: 30px; position: relative;">
            <button onclick="document.getElementById('userReportsModal').remove()" style="position: absolute; top: 15px; right: 15px; background: #e74c3c; color: white; border: none; width: 35px; height: 35px; border-radius: 50%; cursor: pointer; font-size: 20px;">×</button>
            
            <h2 style="color: #333; margin-bottom: 20px;">🚨 Segnalazioni di ${username}</h2>
            <p style="color: #666; margin-bottom: 20px;">Totale segnalazioni: <strong>${userReports.length}</strong></p>
            
            <div>
                ${userReports.map(report => createClickableReportCard(report)).join('')}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function createClickableReportCard(report) {
    const statusConfig = {
        pending: { icon: '⏳', text: 'Da Gestire', color: '#f39c12', bg: '#fff3cd' },
        in_progress: { icon: '🔓', text: 'Aperta', color: '#3498db', bg: '#d1ecf1' },
        resolved: { icon: '✅', text: 'Chiusa', color: '#27ae60', bg: '#d4edda' },
        rejected: { icon: '❌', text: 'Respinta', color: '#e74c3c', bg: '#f8d7da' },
        archived: { icon: '📁', text: 'Archiviata', color: '#95a5a6', bg: '#e2e3e5' }
    };
    
    const config = statusConfig[report.status] || statusConfig.pending;
    
    return `
        <div class="report-card-clickable" onclick="navigateToReport(${report.id})" style="margin-bottom: 15px; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); cursor: pointer; transition: transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 20px rgba(0,0,0,0.15)'" onmouseout="this.style.transform=''; this.style.boxShadow='0 2px 10px rgba(0,0,0,0.1)'">
            <div style="background: ${config.bg}; padding: 15px; border-left: 4px solid ${config.color};">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <span style="font-size: 20px; margin-right: 10px;">${config.icon}</span>
                        <strong style="color: #333; font-size: 16px;">Segnalazione #${report.id}</strong>
                        <span style="margin-left: 15px; padding: 5px 12px; background: ${config.color}; color: white; border-radius: 15px; font-size: 12px; font-weight: 600;">${config.text}</span>
                    </div>
                    <div style="text-align: right; color: #666;">
                        <div style="font-size: 13px;"><strong>Tipo:</strong> ${report.violationType}</div>
                        <div style="font-size: 12px; margin-top: 5px;">${new Date(report.submittedDate).toLocaleDateString('it-IT')}</div>
                    </div>
                </div>
            </div>
            <div style="padding: 15px; background: #f8f9fa;">
                <p style="margin: 0; color: #555; font-size: 14px; line-height: 1.5;">
                    <strong>Descrizione:</strong> ${report.description.substring(0, 100)}${report.description.length > 100 ? '...' : ''}
                </p>
                <div style="margin-top: 10px; text-align: right;">
                    <span style="color: #667eea; font-weight: 600; font-size: 13px;">👁️ Clicca per visualizzare</span>
                </div>
            </div>
        </div>
    `;
}

function navigateToReport(reportId) {
    const reports = JSON.parse(localStorage.getItem('userReports') || '[]');
    const report = reports.find(r => r.id === reportId);
    
    if (!report) {
        showNotification('Segnalazione non trovata', 'error');
        return;
    }
    
    const modal = document.getElementById('userReportsModal');
    if (modal) modal.remove();
    
    if (report.status === 'archived') {
        const archivedDate = report.archivedDate ? new Date(report.archivedDate).toLocaleString('it-IT') : 'Data sconosciuta';
        const archivedBy = report.archivedBy || 'Staff';
        showArchiveNotification(reportId, archivedDate, archivedBy);
        return;
    }
    
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelector('.tab:nth-child(3)').classList.add('active');
    document.getElementById('reports').classList.add('active');
    
    currentReportFilter = report.status;
    document.querySelectorAll('#reports .filter-btn').forEach(btn => btn.classList.remove('active'));
    const filterBtns = document.querySelectorAll('#reports .filter-btn');
    filterBtns.forEach(btn => {
        if (btn.textContent.includes(report.status === 'pending' ? 'Da Gestire' : 
                                      report.status === 'in_progress' ? 'Aperte' :
                                      report.status === 'resolved' ? 'Chiuse' :
                                      report.status === 'rejected' ? 'Respinte' : '')) {
            btn.classList.add('active');
        }
    });
    
    loadReports();
    
    setTimeout(() => {
        const detailsDiv = document.getElementById(`details-${reportId}`);
        if (detailsDiv) {
            detailsDiv.style.display = 'block';
            const reportCard = detailsDiv.closest('.report-card');
            if (reportCard) {
                reportCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                reportCard.style.boxShadow = '0 0 20px rgba(102, 126, 234, 0.5)';
                reportCard.style.border = '2px solid #667eea';
                setTimeout(() => {
                    reportCard.style.boxShadow = '';
                    reportCard.style.border = '';
                }, 2000);
            }
        }
    }, 300);
}

function showArchiveNotification(reportId, archivedDate, archivedBy) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 30px 40px;
        border-radius: 20px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        z-index: 10001;
        max-width: 500px;
        text-align: center;
        animation: scaleIn 0.3s ease;
    `;
    
    notification.innerHTML = `
        <div style="font-size: 60px; margin-bottom: 20px;">📁</div>
        <h3 style="color: #333; margin-bottom: 15px; font-size: 24px;">Segnalazione Archiviata</h3>
        <p style="color: #666; margin-bottom: 20px; line-height: 1.6;">
            La segnalazione <strong>#${reportId}</strong> è stata archiviata.
        </p>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 10px; margin-bottom: 20px;">
            <p style="color: #555; margin: 0; font-size: 14px;">
                <strong>📅 Archiviata il:</strong> ${archivedDate}
            </p>
            <p style="color: #555; margin: 10px 0 0 0; font-size: 14px;">
                <strong>👤 Archiviata da:</strong> ${archivedBy}
            </p>
        </div>
        <button onclick="this.closest('div').remove(); navigateToArchive()" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 12px 30px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 15px; margin-right: 10px;">
            📁 Vai all'Archivio
        </button>
        <button onclick="this.closest('div').remove()" style="background: #e0e0e0; color: #333; border: none; padding: 12px 30px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 15px;">
            Chiudi
        </button>
    `;
    
    document.body.appendChild(notification);
}

function navigateToArchive() {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelector('.tab:nth-child(3)').classList.add('active');
    document.getElementById('reports').classList.add('active');
    
    currentReportFilter = 'archived';
    document.querySelectorAll('#reports .filter-btn').forEach(btn => btn.classList.remove('active'));
    const archiveBtn = Array.from(document.querySelectorAll('#reports .filter-btn')).find(btn => btn.textContent.includes('Archiviate'));
    if (archiveBtn) archiveBtn.classList.add('active');
    loadReports();
}

function filterUsers() {
    renderUsers();
}

function filterByStatus(status) {
    currentFilter = status;
    document.querySelectorAll('#users .filter-btn').forEach(btn => btn.classList.remove('active'));
    if (event && event.target) event.target.classList.add('active');
    renderUsers();
}

function toggleBan(username) {
    const users = JSON.parse(localStorage.getItem('piacenzaUsers') || '[]');
    const user = users.find(u => u.username === username);
    
    if (!user) return;
    
    user.banned = !user.banned;
    user.bannedDate = user.banned ? new Date().toISOString() : null;
    
    localStorage.setItem('piacenzaUsers', JSON.stringify(users));
    
    addLog(user.banned ? `Utente ${username} bannato` : `Ban rimosso per ${username}`);
    sendWebhook('ban', user);
    
    showNotification(
        user.banned ? `${username} bannato dal sito` : `Ban rimosso per ${username}`,
        user.banned ? 'error' : 'success'
    );
    
    loadUsers();
    loadDashboard();
}

// ==================== ANNUNCI ====================
document.getElementById('announcementForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const title = document.getElementById('announcementTitle').value;
    const message = document.getElementById('announcementMessage').value;
    const type = document.getElementById('announcementType').value;
    
    const announcement = {
        id: Date.now(),
        title,
        message,
        type,
        date: new Date().toISOString(),
        author: currentUser.username
    };
    
    const announcements = JSON.parse(localStorage.getItem('announcements') || '[]');
    announcements.unshift(announcement);
    localStorage.setItem('announcements', JSON.stringify(announcements));
    
    sendWebhook('announcement', announcement);
    addLog(`Annuncio pubblicato: ${title}`);
    showNotification('Annuncio pubblicato con successo!', 'success');
    
    this.reset();
    loadAnnouncements();
});

function loadAnnouncements() {
    const announcements = JSON.parse(localStorage.getItem('announcements') || '[]');
    const list = document.getElementById('announcementsList');
    
    if (announcements.length === 0) {
        list.innerHTML = '<p style="color: #888;">Nessun annuncio pubblicato</p>';
        return;
    }
    
    list.innerHTML = announcements.map(ann => `
        <div class="log-item">
            <div class="log-time">${new Date(ann.date).toLocaleString('it-IT')} - ${ann.author}</div>
            <div class="log-action"><strong>${ann.title}</strong></div>
            <p style="margin-top: 10px; color: #555;">${ann.message}</p>
            <button class="btn btn-danger" onclick="deleteAnnouncement(${ann.id})" style="margin-top: 10px;">🗑️ Elimina</button>
        </div>
    `).join('');
}

function deleteAnnouncement(id) {
    showConfirmDialog(
        '🗑️ Eliminare Annuncio?',
        'Sei sicuro di voler eliminare questo annuncio?',
        () => {
            let announcements = JSON.parse(localStorage.getItem('announcements') || '[]');
            announcements = announcements.filter(a => a.id !== id);
            localStorage.setItem('announcements', JSON.stringify(announcements));
            
            addLog('Annuncio eliminato');
            showNotification('Annuncio eliminato', 'success');
            loadAnnouncements();
        }
    );
}

// ==================== LOG ====================
function addLog(action) {
    const logs = JSON.parse(localStorage.getItem('adminLogs') || '[]');
    logs.push({
        date: new Date().toISOString(),
        action: action,
        admin: currentUser.username || 'Admin'
    });
    localStorage.setItem('adminLogs', JSON.stringify(logs));
}

function loadLogs() {
    const logs = JSON.parse(localStorage.getItem('adminLogs') || '[]');
    const list = document.getElementById('logsList');
    
    if (!list) return;
    
    if (logs.length === 0) {
        list.innerHTML = `
            <div style="text-align: center; padding: 50px; color: #888;">
                <p style="font-size: 18px;">📋 Nessun log disponibile</p>
            </div>
        `;
        return;
    }
    
    const sortedLogs = logs.slice().reverse();
    
    list.innerHTML = sortedLogs.map(log => `
        <div class="log-item">
            <div class="log-time">${new Date(log.date).toLocaleString('it-IT')}</div>
            <div class="log-action"><strong>${log.admin}:</strong> ${log.action}</div>
        </div>
    `).join('');
}

// ==================== IMPOSTAZIONI ====================
document.getElementById('settingsForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const settings = {
        serverName: document.getElementById('serverName').value,
        supportEmail: document.getElementById('supportEmail').value,
        globalWebhook: document.getElementById('globalWebhook').value,
        welcomeMessage: document.getElementById('welcomeMessage').value
    };
    
    localStorage.setItem('globalSettings', JSON.stringify(settings));
    
    addLog('Impostazioni aggiornate');
    showNotification('Impostazioni salvate!', 'success');
});

function loadSettings() {
    const settings = JSON.parse(localStorage.getItem('globalSettings') || '{}');
    
    if (settings.serverName) document.getElementById('serverName').value = settings.serverName;
    if (settings.supportEmail) document.getElementById('supportEmail').value = settings.supportEmail;
    if (settings.globalWebhook) document.getElementById('globalWebhook').value = settings.globalWebhook;
    if (settings.welcomeMessage) document.getElementById('welcomeMessage').value = settings.welcomeMessage;
}

// ==================== EXPORT & BACKUP ====================
function exportUsers() {
    const users = JSON.parse(localStorage.getItem('piacenzaUsers') || '[]');
    downloadJSON(users, 'utenti_piacenzarp.json');
    addLog('Export utenti (JSON)');
    showNotification('Export completato!', 'success');
}

function exportUsersCSV() {
    const users = JSON.parse(localStorage.getItem('piacenzaUsers') || '[]');
    let csv = 'Username,Email,Stato,Segnalazioni,Data Registrazione\n';
    users.forEach(u => {
        csv += `${u.username},${u.email},${u.banned ? 'Bannato' : u.reportsCount > 0 ? 'Segnalato' : 'Attivo'},${u.reportsCount || 0},${new Date(u.registeredDate || Date.now()).toLocaleDateString('it-IT')}\n`;
    });
    
    downloadText(csv, 'utenti_piacenzarp.csv');
    addLog('Export utenti (CSV)');
    showNotification('Export CSV completato!', 'success');
}

function exportAllData() {
    const backup = {
        users: JSON.parse(localStorage.getItem('piacenzaUsers') || '[]'),
        reports: JSON.parse(localStorage.getItem('userReports') || '[]'),
        announcements: JSON.parse(localStorage.getItem('announcements') || '[]'),
        logs: JSON.parse(localStorage.getItem('adminLogs') || '[]'),
        settings: JSON.parse(localStorage.getItem('globalSettings') || '{}'),
        date: new Date().toISOString()
    };
    
    downloadJSON(backup, `backup_piacenzarp_${new Date().toISOString().split('T')[0]}.json`);
    addLog('Backup completo eseguito');
    showNotification('Backup completo scaricato!', 'success');
}

function clearAllData() {
    showConfirmDialog(
        '⚠️ Reset Completo',
        'ATTENZIONE! Vuoi davvero cancellare TUTTI i dati? Questa azione è IRREVERSIBILE! Verrà creato un backup automatico.',
        () => {
            exportAllData();
            localStorage.clear();
            showNotification('Tutti i dati sono stati cancellati! Backup salvato.', 'success');
            setTimeout(() => window.location.reload(), 2000);
        }
    );
}

// ==================== UTILITY FUNCTIONS ====================
function downloadJSON(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function downloadText(text, filename) {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ==================== WEBHOOK DISCORD ====================
function sendWebhook(type, data) {
    const settings = JSON.parse(localStorage.getItem('globalSettings') || '{}');
    const webhookUrl = settings.globalWebhook;
    
    if (!webhookUrl) return;
    
    let embed = {};
    
    if (type === 'ban') {
        embed = {
            title: data.banned ? '🚫 Utente Bannato dal Sito' : '✅ Ban Rimosso',
            color: data.banned ? 0xe74c3c : 0x27ae60,
            fields: [
                { name: '👤 Username', value: data.username, inline: true },
                { name: '📧 Email', value: data.email, inline: true },
                { name: '💬 Discord', value: data.discord || 'N/A', inline: true }
            ],
            timestamp: new Date().toISOString(),
            footer: { text: `Azione eseguita da ${currentUser.username}` }
        };
    } else if (type === 'announcement') {
        const typeEmojis = { 'info': 'ℹ️', 'warning': '⚠️', 'event': '🎉', 'update': '🔄' };
        embed = {
            title: `${typeEmojis[data.type] || '📢'} Nuovo Annuncio: ${data.title}`,
            description: data.message,
            color: 0x667eea,
            timestamp: new Date().toISOString(),
            footer: { text: `Pubblicato da ${data.author}` }
        };
    }
    
    fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'Annunci - Piacenza RP', embeds: [embed] })
    }).catch(err => console.error('Errore webhook:', err));
}

function sendReportWebhook(action, report) {
    const settings = JSON.parse(localStorage.getItem('globalSettings') || '{}');
    const webhookUrl = settings.globalWebhook;
    
    if (!webhookUrl) return;
    
    const actionConfig = {
        open: { title: '🔓 Segnalazione Aperta', description: `La segnalazione #${report.id} è stata presa in carico`, color: 0x3498db },
        resolve: { title: '✅ Segnalazione Chiusa', description: `La segnalazione #${report.id} è stata chiusa con successo`, color: 0x27ae60 },
        reject: { title: '❌ Segnalazione Respinta', description: `La segnalazione #${report.id} è stata respinta`, color: 0xe74c3c },
        archive: { title: '📁 Segnalazione Archiviata', description: `La segnalazione #${report.id} è stata archiviata`, color: 0x95a5a6 },
        reopen: { title: '🔄 Segnalazione Riaperta', description: `La segnalazione #${report.id} è stata riaperta per ulteriori verifiche`, color: 0xf39c12 }
    };
    
    const config = actionConfig[action];
    
    const embed = {
        title: config.title,
        description: config.description,
        color: config.color,
        fields: [
            { name: '🎯 Utente Segnalato', value: report.reported.username, inline: true },
            { name: '⚠️ Violazione', value: report.violationType, inline: true },
            { name: '👮 Gestito da', value: currentUser.username, inline: true },
            { name: '\u200B', value: '\u200B', inline: false },
            { name: '📝 Descrizione', value: report.description.length > 200 ? report.description.substring(0, 197) + '...' : report.description, inline: false },
            { name: '📅 Azione Eseguita', value: new Date().toLocaleString('it-IT'), inline: true },
            { name: '🆔 ID', value: `\`${report.id}\``, inline: true }
        ],
        timestamp: new Date().toISOString(),
        footer: { text: `Segnalazione #${report.id} • ${currentUser.username}` }
    };
    
    // Aggiungi thumbnail se ci sono immagini
    if (report.evidenceFiles && report.evidenceFiles.length > 0) {
        embed.thumbnail = { url: report.evidenceFiles[0].data };
    }
    
    const payload = {
        username: '🚨 Sistema Segnalazioni',
        embeds: [embed],
        components: [
            {
                type: 1,
                components: [
                    {
                        type: 2,
                        style: 5,
                        label: '🔗 Visualizza Segnalazione',
                        url: `${window.location.origin}/staff.html?report=${report.id}`
                    }
                ]
            }
        ]
    };
    
    fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }).catch(err => console.error('Errore webhook:', err));
}

// ==================== DIALOG CONFERMA ====================
function showConfirmDialog(title, message, onConfirm) {
    const overlay = document.createElement('div');
    overlay.id = 'confirmDialog';
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(5px);
        z-index: 10000; display: flex; align-items: center; justify-content: center;
        animation: fadeIn 0.3s ease;
    `;
    
    overlay.innerHTML = `
        <div style="background: white; border-radius: 20px; padding: 40px; max-width: 500px; text-align: center; animation: scaleIn 0.3s ease; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
            <div style="font-size: 60px; margin-bottom: 20px;">⚠️</div>
            <h3 style="color: #333; margin-bottom: 15px; font-size: 24px;">${title}</h3>
            <p style="color: #666; margin-bottom: 30px; line-height: 1.6; font-size: 16px;">${message}</p>
            <div style="display: flex; gap: 15px; justify-content: center;">
                <button id="confirmBtn" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 12px 30px; border-radius: 10px; cursor: pointer; font-weight: 600; font-size: 15px; transition: transform 0.2s;">Ok</button>
                <button id="cancelBtn" style="background: #e0e0e0; color: #333; border: none; padding: 12px 30px; border-radius: 10px; cursor: pointer; font-weight: 600; font-size: 15px; transition: transform 0.2s;">Annulla</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    document.getElementById('confirmBtn').onclick = () => {
        overlay.style.animation = 'fadeOut 0.2s ease';
        setTimeout(() => { overlay.remove(); onConfirm(); }, 200);
    };
    
    document.getElementById('cancelBtn').onclick = () => {
        overlay.style.animation = 'fadeOut 0.2s ease';
        setTimeout(() => overlay.remove(), 200);
    };
    
    document.getElementById('confirmBtn').onmouseover = function() { this.style.transform = 'translateY(-2px)'; };
    document.getElementById('confirmBtn').onmouseout = function() { this.style.transform = ''; };
    document.getElementById('cancelBtn').onmouseover = function() { this.style.transform = 'translateY(-2px)'; };
    document.getElementById('cancelBtn').onmouseout = function() { this.style.transform = ''; };
}

// ==================== NAVBAR ====================
function toggleMobileMenu() {
    const navMenu = document.getElementById('navMenu');
    if (navMenu) navMenu.classList.toggle('active');
}

function logout() {
    showConfirmDialog(
        '👋 Logout',
        'Sei sicuro di voler uscire?',
        () => {
            sessionStorage.clear();
            localStorage.removeItem('piacenza_auto_login');
            window.location.href = 'index.html';
        }
    );
}

// ==================== GALLERIA IMMAGINI E VIDEO ====================
function openImageModal(reportId, imageIndex) {
    const reports = JSON.parse(localStorage.getItem('userReports') || '[]');
    const report = reports.find(r => r.id === reportId);
    
    if (!report || !report.evidenceFiles || !report.evidenceFiles[imageIndex]) return;
    
    const modal = document.createElement('div');
    modal.id = 'imageModal';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.95); z-index: 10002;
        display: flex; align-items: center; justify-content: center;
        animation: fadeIn 0.3s ease;
    `;
    
    const currentFile = report.evidenceFiles[imageIndex];
    const totalFiles = report.evidenceFiles.length;
    
    modal.innerHTML = `
        <div style="max-width: 90%; max-height: 90vh; position: relative;">
            <button onclick="document.getElementById('imageModal').remove()" style="position: absolute; top: -40px; right: 0; background: #e74c3c; color: white; border: none; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; font-size: 24px; z-index: 10003;">×</button>
            
            <div style="text-align: center; color: white; margin-bottom: 10px;">
                <strong>${currentFile.name}</strong> (${imageIndex + 1} di ${totalFiles})
            </div>
            
            <img src="${currentFile.data}" style="max-width: 100%; max-height: 80vh; border-radius: 10px; box-shadow: 0 20px 60px rgba(0,0,0,0.5);" alt="${currentFile.name}">
            
            <div style="display: flex; justify-content: center; gap: 15px; margin-top: 20px;">
                ${imageIndex > 0 ? `
                    <button onclick="changeImage(${reportId}, ${imageIndex - 1})" style="background: #667eea; color: white; border: none; padding: 12px 25px; border-radius: 8px; cursor: pointer; font-weight: 600;">
                        ← Precedente
                    </button>
                ` : ''}
                ${imageIndex < totalFiles - 1 ? `
                    <button onclick="changeImage(${reportId}, ${imageIndex + 1})" style="background: #667eea; color: white; border: none; padding: 12px 25px; border-radius: 8px; cursor: pointer; font-weight: 600;">
                        Successivo →
                    </button>
                ` : ''}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function openVideoModal(reportId, videoIndex) {
    const reports = JSON.parse(localStorage.getItem('userReports') || '[]');
    const report = reports.find(r => r.id === reportId);
    
    if (!report || !report.evidenceFiles || !report.evidenceFiles[videoIndex]) return;
    
    const modal = document.createElement('div');
    modal.id = 'imageModal';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.95); z-index: 10002;
        display: flex; align-items: center; justify-content: center;
        animation: fadeIn 0.3s ease;
    `;
    
    const currentFile = report.evidenceFiles[videoIndex];
    const totalFiles = report.evidenceFiles.length;
    
    modal.innerHTML = `
        <div style="max-width: 90%; max-height: 90vh; position: relative;">
            <button onclick="document.getElementById('imageModal').remove()" style="position: absolute; top: -40px; right: 0; background: #e74c3c; color: white; border: none; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; font-size: 24px; z-index: 10003;">×</button>
            
            <div style="text-align: center; color: white; margin-bottom: 10px;">
                <strong>${currentFile.name}</strong> (${videoIndex + 1} di ${totalFiles})
            </div>
            
            <video controls autoplay style="max-width: 100%; max-height: 80vh; border-radius: 10px; box-shadow: 0 20px 60px rgba(0,0,0,0.5);">
                <source src="${currentFile.data}" type="${currentFile.type}">
                Il tuo browser non supporta la riproduzione video.
            </video>
            
            <div style="display: flex; justify-content: center; gap: 15px; margin-top: 20px;">
                ${videoIndex > 0 ? `
                    <button onclick="changeImage(${reportId}, ${videoIndex - 1})" style="background: #667eea; color: white; border: none; padding: 12px 25px; border-radius: 8px; cursor: pointer; font-weight: 600;">
                        ← Precedente
                    </button>
                ` : ''}
                ${videoIndex < totalFiles - 1 ? `
                    <button onclick="changeImage(${reportId}, ${videoIndex + 1})" style="background: #667eea; color: white; border: none; padding: 12px 25px; border-radius: 8px; cursor: pointer; font-weight: 600;">
                        Successivo →
                    </button>
                ` : ''}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function changeImage(reportId, newIndex) {
    const reports = JSON.parse(localStorage.getItem('userReports') || '[]');
    const report = reports.find(r => r.id === reportId);
    const file = report.evidenceFiles[newIndex];
    
    document.getElementById('imageModal').remove();
    
    if (file.isVideo) {
        openVideoModal(reportId, newIndex);
    } else {
        openImageModal(reportId, newIndex);
    }
}

console.log('✅ Sistema Staff completo caricato!');