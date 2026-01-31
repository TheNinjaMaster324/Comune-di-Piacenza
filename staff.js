// VARIABILI GLOBALI
let currentUser = {};
let allUsers = [];
let currentFilter = 'all';
let currentReportFilter = 'all';

const WEBHOOK_AZIONI_STAFF = 'https://discord.com/api/webhooks/1464602775907467550/UXyFjYPWIv-pQaIzdCIichb9FeG5PVsEMmRRdmk87_Hx2cw_3ffvjeGsMWNGpW6Y5oYE';

// ========== FUNZIONE DI CONFRONTO NOME ROBLOX ==========
function compareRobloxNames(name1, name2) {
    if (!name1 || !name2) return false;
    
    const n1 = name1.toLowerCase().trim();
    const n2 = name2.toLowerCase().trim();
    
    // Confronto esatto
    if (n1 === n2) return true;
    
    // Confronto prime 5 lettere
    if (n1.length >= 5 && n2.length >= 5) {
        if (n1.substring(0, 5) === n2.substring(0, 5)) return true;
    }
    
    // Confronto se uno contiene l'altro
    if (n1.includes(n2) || n2.includes(n1)) return true;
    
    return false;
}

// ========== WEBHOOK AZIONI STAFF ==========
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
            { name: '🆔 ID', value: `\`${report.id}\``, inline: true },
            { name: '👤 Segnalato da', value: report.reporter.username, inline: true },
            { name: '🎯 Utente Segnalato', value: report.reported.username, inline: true },
            { name: '⚠️ Tipo', value: report.violationType, inline: true },
            { name: '👮 Staff', value: staffUsername, inline: true },
            { name: '📅 Data', value: new Date().toLocaleString('it-IT'), inline: true }
        ],
        footer: { text: 'Sistema Segnalazioni - Piacenza RP' },
        timestamp: new Date().toISOString()
    };

    if (note) embed.fields.push({ name: '📝 Nota', value: note, inline: false });
    
    if (report.evidenceUrls && report.evidenceUrls.length > 0) {
        const imageLinks = report.evidenceUrls.map((img, i) => `[🖼️ Img ${i + 1}](${img.url})`).join(' • ');
        embed.fields.push({ name: '🔗 Immagini', value: imageLinks, inline: false });
        embed.thumbnail = { url: report.evidenceUrls[0].url };
    }
    
    if (report.videoUrls && report.videoUrls.length > 0) {
        const videoLinks = report.videoUrls.map((vid, i) => `[🎥 Video ${i + 1}](${vid.url})`).join(' • ');
        embed.fields.push({ name: '🎥 Video', value: videoLinks, inline: false });
    }

    try {
        await fetch(WEBHOOK_AZIONI_STAFF, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                embeds: [embed],
                components: [{
                    type: 1,
                    components: [{
                        type: 2,
                        style: 5,
                        label: '🔍 Visualizza',
                        url: `https://theninjamaster324.github.io/Comune-di-Piacenza/staff.html?report=${report.id}`
                    }]
                }]
            })
        });
    } catch (error) {
        console.error('Errore webhook:', error);
    }
}

// INIZIALIZZAZIONE
window.addEventListener('load', function() {
    currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    
    if (!currentUser.isAdmin) {
        alert('⚠️ Accesso negato!');
        window.location.href = 'home.html';
        return;
    }

    document.getElementById('adminName').textContent = currentUser.username;
    
    const urlParams = new URLSearchParams(window.location.search);
    const reportId = urlParams.get('report');
    
    loadDashboard();
    loadUsers();
    loadReports();
    loadAnnouncements();
    loadLogs();
    loadSettings();
    
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
    
    currentReportFilter = report.status;
    loadReports();
    
    setTimeout(() => {
        const detailsDiv = document.getElementById(`details-${reportId}`);
        if (detailsDiv) {
            detailsDiv.style.display = 'block';
            const reportCard = detailsDiv.closest('.report-card');
            if (reportCard) {
                reportCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                reportCard.style.boxShadow = '0 0 20px rgba(102, 126, 234, 0.5)';
                setTimeout(() => { reportCard.style.boxShadow = ''; }, 3000);
            }
        }
    }, 300);
}

function showTab(tabName) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    if (event && event.target) event.target.classList.add('active');
    document.getElementById(tabName).classList.add('active');
    if (tabName === 'reports') loadReports();
}

function loadDashboard() {
    const users = JSON.parse(localStorage.getItem('piacenzaUsers') || '[]');
    const reports = JSON.parse(localStorage.getItem('userReports') || '[]');
    
    document.getElementById('totalUsers').textContent = users.length;
    
    const activeReports = reports.filter(r => r.status !== 'archived' && r.status !== 'rejected');
    const reportedUsernames = [...new Set(activeReports.map(r => r.reported.username))];
    document.getElementById('reportedUsers').textContent = reportedUsernames.length;
    document.getElementById('totalReports').textContent = reports.filter(r => r.status === 'in_progress').length;
    document.getElementById('totalApplications').textContent = reports.length;
    
    const logs = JSON.parse(localStorage.getItem('adminLogs') || '[]');
    const activityDiv = document.getElementById('recentActivity');
    
    if (logs.length === 0) {
        activityDiv.innerHTML = '<div class="log-item" style="text-align: center; padding: 30px;"><p>📋 Nessuna attività</p></div>';
    } else {
        activityDiv.innerHTML = logs.slice(-10).reverse().map(log => `
            <div class="log-item">
                <div class="log-time">${new Date(log.date).toLocaleString('it-IT')}</div>
                <div class="log-action"><strong>${log.admin}:</strong> ${log.action}</div>
            </div>
        `).join('');
    }
}

// ========== GESTIONE UTENTI CON CONTROLLO ROBLOX ==========
function loadUsers() {
    allUsers = JSON.parse(localStorage.getItem('piacenzaUsers') || '[]');
    const reports = JSON.parse(localStorage.getItem('userReports') || '[]');
    
    allUsers.forEach(user => {
        if (!user.registeredDate) user.registeredDate = new Date().toISOString();
        
        // ✅ CONTROLLO AUTOMATICO: cerca segnalazioni con nome Roblox simile
        const matchingReports = reports.filter(r => {
            // Salta segnalazioni archiviate o respinte
            if (r.status === 'archived' || r.status === 'rejected') return false;
            
            // Confronta username esatto
            if (r.reported.username === user.username) return true;
            
            // ✅ CONFRONTA NOME ROBLOX (prime 5 lettere o tutto intero)
            if (user.robloxName && r.reported.robloxName) {
                return compareRobloxNames(user.robloxName, r.reported.robloxName);
            }
            
            return false;
        });
        
        user.reportsCount = matchingReports.length;
    });
    
    localStorage.setItem('piacenzaUsers', JSON.stringify(allUsers));
    renderUsers();
}

function renderUsers() {
    const tbody = document.getElementById('userTableBody');
    const searchTerm = document.getElementById('userSearch').value.toLowerCase();
    
    let filtered = allUsers.filter(user => {
        const matchesSearch = 
            user.username.toLowerCase().includes(searchTerm) || 
            user.email.toLowerCase().includes(searchTerm) ||
            (user.robloxName && user.robloxName.toLowerCase().includes(searchTerm));
        
        if (currentFilter === 'all') return matchesSearch;
        if (currentFilter === 'active') return matchesSearch && user.reportsCount === 0;
        if (currentFilter === 'reported') return matchesSearch && user.reportsCount > 0;
        
        return matchesSearch;
    });
    
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px;">Nessun utente trovato</td></tr>';
        return;
    }
    
    tbody.innerHTML = filtered.map(user => `
        <tr>
            <td><strong>${user.username}</strong></td>
            <td>
                <span style="display: inline-flex; align-items: center; gap: 5px;">
                    <span style="color: #4CAF50;">🎮</span>
                    ${user.robloxName || '<span style="color: #888;">Non fornito</span>'}
                </span>
            </td>
            <td>${user.email}</td>
            <td>
                ${user.reportsCount > 0
                    ? '<span class="badge" style="background: #e74c3c; color: white;">🚨 Segnalato</span>'
                    : '<span class="badge badge-success">✅ Attivo</span>'}
            </td>
            <td>${new Date(user.registeredDate).toLocaleDateString('it-IT')}</td>
            <td>
                <span style="display: inline-block; padding: 5px 12px; background: ${user.reportsCount > 0 ? '#e74c3c' : '#27ae60'}; color: white; border-radius: 15px; font-weight: 600; font-size: 13px;">
                    ${user.reportsCount}
                </span>
            </td>
            <td>
                ${user.reportsCount > 0 ? `
                    <button class="btn btn-primary" style="font-size: 13px; padding: 8px 12px;" onclick="viewUserReports('${user.username}')">👁️ Vedi</button>
                ` : '<span style="color: #888;">Nessuna azione</span>'}
            </td>
        </tr>
    `).join('');
}

function viewUserReports(username) {
    const reports = JSON.parse(localStorage.getItem('userReports') || '[]');
    const user = allUsers.find(u => u.username === username);
    
    const userReports = reports.filter(r => {
        if (r.status === 'archived' || r.status === 'rejected') return false;
        if (r.reported.username === username) return true;
        if (user && user.robloxName && r.reported.robloxName) {
            return compareRobloxNames(user.robloxName, r.reported.robloxName);
        }
        return false;
    });
    
    if (userReports.length === 0) {
        showNotification('Nessuna segnalazione trovata', 'error');
        return;
    }
    
    const modal = document.createElement('div');
    modal.id = 'userReportsModal';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 10000; display: flex; align-items: center; justify-content: center;';
    
    modal.innerHTML = `
        <div style="background: white; border-radius: 20px; max-width: 800px; max-height: 80vh; overflow-y: auto; padding: 30px; position: relative;">
            <button onclick="document.getElementById('userReportsModal').remove()" style="position: absolute; top: 15px; right: 15px; background: #e74c3c; color: white; border: none; width: 35px; height: 35px; border-radius: 50%; cursor: pointer; font-size: 20px;">×</button>
            <h2 style="color: #333; margin-bottom: 20px;">🚨 Segnalazioni di ${username}</h2>
            <p style="color: #666; margin-bottom: 20px;">Totale: <strong>${userReports.length}</strong></p>
            <div>${userReports.map(report => createClickableReportCard(report)).join('')}</div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function filterUsers() { renderUsers(); }

function filterByStatus(status) {
    currentFilter = status;
    document.querySelectorAll('#users .filter-btn').forEach(btn => btn.classList.remove('active'));
    if (event && event.target) event.target.classList.add('active');
    renderUsers();
}

// ========== GESTIONE SEGNALAZIONI ==========
function loadReports() {
    const reports = JSON.parse(localStorage.getItem('userReports') || '[]');
    const list = document.getElementById('reportsList');
    if (!list) return;
    
    const sortedReports = reports.sort((a, b) => b.id - a.id);
    let filtered = currentReportFilter !== 'all' ? sortedReports.filter(r => r.status === currentReportFilter) : sortedReports;
    
    if (filtered.length === 0) {
        list.innerHTML = '<p style="color: #888; text-align: center; padding: 40px;">Nessuna segnalazione</p>';
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
                        <strong style="font-size: 16px;">Segnalazione #${report.id}</strong>
                        <span style="margin-left: 15px; padding: 5px 12px; background: ${config.color}; color: white; border-radius: 15px; font-size: 12px;">${config.text}</span>
                    </div>
                    <div style="text-align: right;">
                        <div><strong>Segnalato:</strong> ${report.reported.username}</div>
                        <div style="font-size: 12px; margin-top: 5px;">${new Date(report.submittedDate).toLocaleDateString('it-IT')}</div>
                    </div>
                </div>
            </div>
            
            <div id="details-${report.id}" class="report-details" style="display: none; padding: 20px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                    <div>
                        <h4 style="color: #667eea;">👤 Segnalato da</h4>
                        <p><strong>Username:</strong> ${report.reporter.username}</p>
                        <p><strong>🎮 Roblox:</strong> ${report.reporter.robloxName || 'Non fornito'}</p>
                        <p><strong>Discord:</strong> ${report.reporter.discord}</p>
                        <p><strong>Email:</strong> ${report.reporter.email}</p>
                    </div>
                    <div>
                        <h4 style="color: #e74c3c;">🎯 Utente Segnalato</h4>
                        <p><strong>Username:</strong> ${report.reported.username}</p>
                        <p><strong>🎮 Roblox:</strong> ${report.reported.robloxName || 'Non fornito'}</p>
                        <p><strong>Discord:</strong> ${report.reported.discord}</p>
                    </div>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <h4>⚠️ Violazione</h4>
                    <span style="background: #f8f9fa; padding: 8px 15px; border-radius: 8px; display: inline-block;">${report.violationType}</span>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <h4>📝 Descrizione</h4>
                    <p style="background: #f8f9fa; padding: 15px; border-radius: 8px;">${report.description}</p>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <h4>📅 Data Incidente</h4>
                    <p>${new Date(report.incidentDate).toLocaleString('it-IT')}</p>
                </div>
                
                ${(() => {
                    const hasImages = report.evidenceUrls && report.evidenceUrls.length > 0;
                    const hasVideos = report.videoUrls && report.videoUrls.length > 0;
                    
                    if (!hasImages && !hasVideos) return '<p style="color: #888;">Nessuna prova</p>';
                    
                    let html = '<div style="margin-bottom: 20px;"><h4>📎 Prove</h4>';
                    
                    if (hasImages) {
                        html += `
                            <div style="margin-bottom: 20px;">
                                <h5 style="color: #667eea;">🖼️ Immagini (${report.evidenceUrls.length})</h5>
                                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px;">
                                    ${report.evidenceUrls.map((img, i) => `
                                        <a href="${img.url}" target="_blank" style="position: relative; border: 2px solid #e0e0e0; border-radius: 8px; overflow: hidden; display: block;">
                                            <img src="${img.url}" style="width: 100%; height: 150px; object-fit: cover;" alt="Prova ${i + 1}">
                                            <div style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.7); color: white; padding: 5px; text-align: center; font-size: 11px;">📸 ${i + 1}</div>
                                        </a>
                                    `).join('')}
                                </div>
                            </div>
                        `;
                    }
                    
                    if (hasVideos) {
                        html += `
                            <div>
                                <h5 style="color: #e74c3c;">🎥 Video (${report.videoUrls.length})</h5>
                                <div style="display: flex; flex-direction: column; gap: 10px;">
                                    ${report.videoUrls.map((vid, i) => `
                                        <a href="${vid.url}" target="_blank" style="display: flex; align-items: center; padding: 12px; background: #f8f9fa; border: 2px solid #e0e0e0; border-radius: 8px; text-decoration: none;">
                                            <span style="font-size: 32px; margin-right: 15px;">🎥</span>
                                            <div style="flex: 1;">
                                                <div style="color: #333; font-weight: 600;">${vid.name || `Video ${i + 1}`}</div>
                                                <div style="color: #666; font-size: 12px;">Clicca per visualizzare</div>
                                            </div>
                                            <span style="color: #667eea; font-weight: 600;">→</span>
                                        </a>
                                    `).join('')}
                                </div>
                            </div>
                        `;
                    }
                    
                    return html + '</div>';
                })()}
                
                ${report.openedBy ? `
                    <div style="margin-bottom: 20px;">
                        <h4>👮 Gestita da</h4>
                        <p><strong>${report.openedBy}</strong> il ${new Date(report.openedDate).toLocaleString('it-IT')}</p>
                    </div>
                ` : ''}
                
                <div class="report-actions" style="display: flex; gap: 10px; margin-top: 20px;">
                    ${report.status === 'pending' ? `
                        <button class="btn btn-primary" onclick="openReport(${report.id})">🔓 Apri</button>
                        <button class="btn btn-danger" onclick="rejectReport(${report.id})">❌ Respingi</button>
                    ` : ''}
                    ${report.status === 'in_progress' ? `
                        <button class="btn btn-success" onclick="resolveReport(${report.id})">✅ Chiudi</button>
                        <button class="btn btn-primary" onclick="archiveReport(${report.id})">📁 Archivia</button>
                    ` : ''}
                    ${report.status === 'resolved' ? `
                        <button class="btn btn-primary" onclick="archiveReport(${report.id})">📁 Archivia</button>
                    ` : ''}
                    ${report.status === 'rejected' || report.status === 'archived' ? `
                        <button class="btn btn-primary" onclick="reopenReport(${report.id})">🔄 Riapri</button>
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
    addLog(`Segnalazione #${reportId} aperta`);
    showNotification('Segnalazione aperta', 'success');
    
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
    addLog(`Segnalazione #${reportId} chiusa`);
    showNotification('Segnalazione chiusa', 'success');
    
    loadReports();
    loadDashboard();
    loadUsers();
}

function rejectReport(reportId) {
    showConfirmDialog('❌ Respingere?', 'Sei sicuro?', () => {
        const reports = JSON.parse(localStorage.getItem('userReports') || '[]');
        const report = reports.find(r => r.id === reportId);
        if (!report) return;
        
        const note = prompt('Motivo (opzionale):') || '';
        report.status = 'rejected';
        report.rejectedBy = currentUser.username;
        report.rejectedDate = new Date().toISOString();
        
        localStorage.setItem('userReports', JSON.stringify(reports));
        sendStaffActionWebhook('rejected', report, currentUser.username, note);
        sendReportWebhook('reject', report);
        addLog(`Segnalazione #${reportId} respinta`);
        showNotification('Segnalazione respinta', 'success');
        
        loadReports();
        loadDashboard();
        loadUsers();
    });
}

function archiveReport(reportId) {
    const reports = JSON.parse(localStorage.getItem('userReports') || '[]');
    const report = reports.find(r => r.id === reportId);
    if (!report) return;
    
    const note = prompt('Nota (opzionale):') || '';
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
        <div onclick="navigateToReport(${report.id})" style="margin-bottom: 15px; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); cursor: pointer;">
            <div style="background: ${config.bg}; padding: 15px; border-left: 4px solid ${config.color};">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <span style="font-size: 20px; margin-right: 10px;">${config.icon}</span>
                        <strong>#${report.id}</strong>
                        <span style="margin-left: 15px; padding: 5px 12px; background: ${config.color}; color: white; border-radius: 15px; font-size: 12px;">${config.text}</span>
                    </div>
                    <div style="text-align: right;">
                        <div><strong>Tipo:</strong> ${report.violationType}</div>
                        <div style="font-size: 12px; margin-top: 5px;">${new Date(report.submittedDate).toLocaleDateString('it-IT')}</div>
                    </div>
                </div>
            </div>
            <div style="padding: 15px; background: #f8f9fa;">
                <p style="margin: 0; font-size: 14px;"><strong>Descrizione:</strong> ${report.description.substring(0, 100)}...</p>
                <div style="margin-top: 10px; text-align: right;">
                    <span style="color: #667eea; font-weight: 600; font-size: 13px;">👁️ Clicca per visualizzare</span>
                </div>
            </div>
        </div>
    `;
}

function navigateToReport(reportId) {
    const modal = document.getElementById('userReportsModal');
    if (modal) modal.remove();
    
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelector('.tab:nth-child(3)').classList.add('active');
    document.getElementById('reports').classList.add('active');
    
    loadReports();
    
    setTimeout(() => {
        const detailsDiv = document.getElementById(`details-${reportId}`);
        if (detailsDiv) {
            detailsDiv.style.display = 'block';
            const reportCard = detailsDiv.closest('.report-card');
            if (reportCard) {
                reportCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                reportCard.style.boxShadow = '0 0 20px rgba(102, 126, 234, 0.5)';
                setTimeout(() => { reportCard.style.boxShadow = ''; }, 2000);
            }
        }
    }, 300);
}

// ========== ANNUNCI ==========
document.getElementById('announcementForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const announcement = {
        id: Date.now(),
        title: document.getElementById('announcementTitle').value,
        message: document.getElementById('announcementMessage').value,
        type: document.getElementById('announcementType').value,
        ping: document.getElementById('announcementPing').value,
        date: new Date().toISOString(),
        author: currentUser.username
    };
    
    const announcements = JSON.parse(localStorage.getItem('announcements') || '[]');
    announcements.unshift(announcement);
    localStorage.setItem('announcements', JSON.stringify(announcements));
    
    sendWebhook('announcement', announcement);
    addLog(`Annuncio pubblicato: ${announcement.title}`);
    showNotification('Annuncio pubblicato!', 'success');
    
    this.reset();
    loadAnnouncements();
});

function loadAnnouncements() {
    const announcements = JSON.parse(localStorage.getItem('announcements') || '[]');
    const list = document.getElementById('announcementsList');
    
    if (announcements.length === 0) {
        list.innerHTML = '<p style="color: #888;">Nessun annuncio</p>';
        return;
    }
    
    list.innerHTML = announcements.map(ann => `
        <div class="log-item">
            <div class="log-time">${new Date(ann.date).toLocaleString('it-IT')} - ${ann.author}</div>
            <div class="log-action"><strong>${ann.title}</strong></div>
            <p style="margin-top: 10px;">${ann.message}</p>
            <button class="btn btn-danger" onclick="deleteAnnouncement(${ann.id})" style="margin-top: 10px;">🗑️</button>
        </div>
    `).join('');
}

function deleteAnnouncement(id) {
    showConfirmDialog('🗑️ Eliminare?', 'Sei sicuro?', () => {
        let announcements = JSON.parse(localStorage.getItem('announcements') || '[]');
        announcements = announcements.filter(a => a.id !== id);
        localStorage.setItem('announcements', JSON.stringify(announcements));
        addLog('Annuncio eliminato');
        showNotification('Annuncio eliminato', 'success');
        loadAnnouncements();
    });
}

function sendWebhook(type, data) {
    const settings = JSON.parse(localStorage.getItem('globalSettings') || '{}');
    const webhookUrl = settings.globalWebhook;
    if (!webhookUrl) return;
    
    let embed = {};
    let content = '';
    
    if (type === 'announcement') {
        const typeEmojis = { 'info': 'ℹ️', 'warning': '⚠️', 'event': '🎉', 'update': '🔄' };
        embed = {
            title: `${typeEmojis[data.type] || '📢'} ${data.title}`,
            description: data.message,
            color: 0x667eea,
            timestamp: new Date().toISOString(),
            footer: { text: `Pubblicato da ${data.author}` }
        };
        
        if (data.ping === '@everyone') content = '@everyone';
        else if (data.ping === '@here') content = '@here';
        else if (data.ping === 'both') content = '@everyone @here';
    }
    
    fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'Annunci - Piacenza RP', content: content, embeds: [embed] })
    }).catch(err => console.error('Errore webhook:', err));
}

function sendReportWebhook(action, report) {
    const settings = JSON.parse(localStorage.getItem('globalSettings') || '{}');
    const webhookUrl = settings.globalWebhook;
    if (!webhookUrl) return;
    
    const actionConfig = {
        open: { title: '🔓 Aperta', description: `#${report.id} presa in carico`, color: 0x3498db },
        resolve: { title: '✅ Chiusa', description: `#${report.id} chiusa`, color: 0x27ae60 },
        reject: { title: '❌ Respinta', description: `#${report.id} respinta`, color: 0xe74c3c },
        archive: { title: '📁 Archiviata', description: `#${report.id} archiviata`, color: 0x95a5a6 },
        reopen: { title: '🔄 Riaperta', description: `#${report.id} riaperta`, color: 0xf39c12 }
    };
    
    const config = actionConfig[action];
    const embed = {
        title: config.title,
        description: config.description,
        color: config.color,
        fields: [
            { name: '🎯 Segnalato', value: report.reported.username, inline: true },
            { name: '⚠️ Violazione', value: report.violationType, inline: true },
            { name: '👮 Staff', value: currentUser.username, inline: true },
            { name: '📝 Descrizione', value: report.description.substring(0, 200), inline: false },
            { name: '🆔 ID', value: `\`${report.id}\``, inline: true }
        ],
        timestamp: new Date().toISOString(),
        footer: { text: `#${report.id}` }
    };
    
    if (report.evidenceUrls && report.evidenceUrls.length > 0) {
        embed.thumbnail = { url: report.evidenceUrls[0].url };
        const imageLinks = report.evidenceUrls.map((img, i) => `[🖼️ ${i + 1}](${img.url})`).join(' • ');
        embed.fields.push({ name: '🔗 Immagini', value: imageLinks, inline: false });
    }
    
    if (report.videoUrls && report.videoUrls.length > 0) {
        const videoLinks = report.videoUrls.map((vid, i) => `[🎥 ${i + 1}](${vid.url})`).join(' • ');
        embed.fields.push({ name: '🎥 Video', value: videoLinks, inline: false });
    }
    
    fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'Azioni Staff - Piacenza RP', embeds: [embed] })
    }).catch(err => console.error('Errore webhook:', err));
}

// ========== LOG E SETTINGS ==========
function addLog(action) {
    const logs = JSON.parse(localStorage.getItem('adminLogs') || '[]');
    logs.push({ date: new Date().toISOString(), action: action, admin: currentUser.username || 'Admin' });
    localStorage.setItem('adminLogs', JSON.stringify(logs));
}

function loadLogs() {
    const logs = JSON.parse(localStorage.getItem('adminLogs') || '[]');
    const list = document.getElementById('logsList');
    if (!list) return;
    
    if (logs.length === 0) {
        list.innerHTML = '<div style="text-align: center; padding: 50px;"><p>📋 Nessun log</p></div>';
        return;
    }
    
    list.innerHTML = logs.slice().reverse().map(log => `
        <div class="log-item">
            <div class="log-time">${new Date(log.date).toLocaleString('it-IT')}</div>
            <div class="log-action"><strong>${log.admin}:</strong> ${log.action}</div>
        </div>
    `).join('');
}

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

// ========== EXPORT ==========
function exportUsers() {
    downloadJSON(JSON.parse(localStorage.getItem('piacenzaUsers') || '[]'), 'utenti.json');
    addLog('Export utenti');
    showNotification('Export completato!', 'success');
}

function exportUsersCSV() {
    const users = JSON.parse(localStorage.getItem('piacenzaUsers') || '[]');
    let csv = 'Username,Nome Roblox,Email,Stato,Segnalazioni,Data Registrazione\n';
    users.forEach(u => {
        csv += `${u.username},${u.robloxName || 'N/A'},${u.email},${u.reportsCount > 0 ? 'Segnalato' : 'Attivo'},${u.reportsCount || 0},${new Date(u.registeredDate || Date.now()).toLocaleDateString('it-IT')}\n`;
    });
    
    downloadText(csv, 'utenti.csv');
    addLog('Export CSV');
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
    
    downloadJSON(backup, `backup_${new Date().toISOString().split('T')[0]}.json`);
    addLog('Backup completo');
    showNotification('Backup scaricato!', 'success');
}

function clearAllData() {
    showConfirmDialog('⚠️ Reset', 'ATTENZIONE! Cancellare TUTTI i dati? IRREVERSIBILE!', () => {
        exportAllData();
        localStorage.clear();
        showNotification('Dati cancellati! Backup salvato.', 'success');
        setTimeout(() => window.location.reload(), 2000);
    });
}

// ========== UTILITY ==========
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
    setTimeout(() => { notification.style.animation = 'slideIn 0.3s ease reverse'; setTimeout(() => notification.remove(), 300); }, 3000);
}

function showConfirmDialog(title, message, onConfirm) {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 10000; display: flex; align-items: center; justify-content: center;';
    
    overlay.innerHTML = `
        <div style="background: white; border-radius: 20px; padding: 40px; max-width: 500px; text-align: center;">
            <div style="font-size: 60px; margin-bottom: 20px;">⚠️</div>
            <h3 style="margin-bottom: 15px;">${title}</h3>
            <p style="margin-bottom: 30px;">${message}</p>
            <div style="display: flex; gap: 15px; justify-content: center;">
                <button id="confirmBtn" style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; padding: 12px 30px; border-radius: 10px; cursor: pointer;">Ok</button>
                <button id="cancelBtn" style="background: #e0e0e0; color: #333; border: none; padding: 12px 30px; border-radius: 10px; cursor: pointer;">Annulla</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    document.getElementById('confirmBtn').onclick = () => { overlay.remove(); onConfirm(); };
    document.getElementById('cancelBtn').onclick = () => overlay.remove();
}

function toggleMobileMenu() {
    const navMenu = document.getElementById('navMenu');
    if (navMenu) navMenu.classList.toggle('active');
}

function logout() {
    showConfirmDialog('👋 Logout', 'Sei sicuro?', () => {
        sessionStorage.clear();
        localStorage.removeItem('piacenza_auto_login');
        window.location.href = 'index.html';
    });
}

console.log('✅ Sistema Staff completo caricato!');
console.log('🎮 Controllo automatico nome Roblox attivo');