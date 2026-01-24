// ==================== VARIABILI GLOBALI ====================
let currentUser = {};
let allUsers = [];
let currentFilter = 'all';

// ==================== INIZIALIZZAZIONE ====================
window.addEventListener('load', function() {
    currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    
    if (!currentUser.isAdmin) {
        alert('⚠️ Accesso negato! Solo admin.');
        window.location.href = 'home.html';
        return;
    }

    document.getElementById('adminName').textContent = currentUser.username;
    
    loadDashboard();
    loadUsers();
    loadAnnouncements();
    loadLogs();
    loadSettings();
});

// ==================== GESTIONE TABS ====================
function showTab(tabName) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(tabName).classList.add('active');
}

// ==================== DASHBOARD ====================
function loadDashboard() {
    const users = JSON.parse(localStorage.getItem('piacenzaUsers') || '[]');
    const bannedCount = users.filter(u => u.banned).length;
    
    document.getElementById('totalUsers').textContent = users.length;
    document.getElementById('bannedUsers').textContent = bannedCount;
    
    // Conta candidature
    const factions = [
        'Polizia di Stato', 
        'Arma dei Carabinieri', 
        'Guardia di Finanza', 
        'Polizia Penitenziaria', 
        'Polizia Locale', 
        'Croce Rossa Italiana', 
        'Croce Verde', 
        'Vigili del Fuoco', 
        'ACI'
    ];
    
    let totalApps = 0;
    let openApps = 0;
    
    factions.forEach(faction => {
        const apps = JSON.parse(localStorage.getItem(`applications_${faction}`) || '[]');
        totalApps += apps.length;
        
        const schedule = JSON.parse(localStorage.getItem(`schedule_${faction}`) || '{}');
        if (schedule.status === 'open') openApps++;
    });
    
    document.getElementById('totalApplications').textContent = totalApps;
    document.getElementById('openApplications').textContent = openApps;
    
    // Attività recente
    const logs = JSON.parse(localStorage.getItem('adminLogs') || '[]');
    const recentLogs = logs.slice(-5).reverse();
    
    const activityHtml = recentLogs.length > 0 
        ? recentLogs.map(log => `
            <div class="log-item">
                <div class="log-time">${new Date(log.date).toLocaleString('it-IT')}</div>
                <div class="log-action">${log.action}</div>
            </div>
        `).join('')
        : '<p style="color: #888;">Nessuna attività recente</p>';
    
    document.getElementById('recentActivity').innerHTML = activityHtml;
}

// ==================== GESTIONE UTENTI ====================
function loadUsers() {
    allUsers = JSON.parse(localStorage.getItem('piacenzaUsers') || '[]');
    renderUsers();
}

function renderUsers() {
    const tbody = document.getElementById('userTableBody');
    const searchTerm = document.getElementById('userSearch').value.toLowerCase();
    
    let filtered = allUsers.filter(user => {
        const matchesSearch = user.username.toLowerCase().includes(searchTerm) || 
                             user.email.toLowerCase().includes(searchTerm);
        
        if (currentFilter === 'all') return matchesSearch;
        if (currentFilter === 'active') return matchesSearch && !user.banned;
        if (currentFilter === 'banned') return matchesSearch && user.banned;
        
        return matchesSearch;
    });
    
    tbody.innerHTML = filtered.map(user => `
        <tr>
            <td><strong>${user.username}</strong></td>
            <td>${user.email}</td>
            <td>
                ${user.banned 
                    ? '<span class="badge badge-danger">🚫 Bannato</span>' 
                    : '<span class="badge badge-success">✅ Attivo</span>'}
            </td>
            <td>${new Date(user.registeredDate || Date.now()).toLocaleDateString('it-IT')}</td>
            <td>
                ${user.banned 
                    ? `<button class="btn btn-success" onclick="toggleBan('${user.username}')">✅ Sbanna</button>`
                    : `<button class="btn btn-danger" onclick="toggleBan('${user.username}')">🚫 Banna</button>`}
            </td>
        </tr>
    `).join('');
}

function filterUsers() {
    renderUsers();
}

function filterByStatus(status) {
    currentFilter = status;
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    renderUsers();
}

function toggleBan(username) {
    const users = JSON.parse(localStorage.getItem('piacenzaUsers') || '[]');
    const user = users.find(u => u.username === username);
    
    if (!user) return;
    
    user.banned = !user.banned;
    user.bannedDate = user.banned ? new Date().toISOString() : null;
    
    localStorage.setItem('piacenzaUsers', JSON.stringify(users));
    
    // Log
    addLog(user.banned ? `Utente ${username} bannato` : `Ban rimosso per ${username}`);
    
    // Notifica Discord
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
    
    // Notifica Discord
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
    if (!confirm('Eliminare questo annuncio?')) return;
    
    let announcements = JSON.parse(localStorage.getItem('announcements') || '[]');
    announcements = announcements.filter(a => a.id !== id);
    localStorage.setItem('announcements', JSON.stringify(announcements));
    
    addLog('Annuncio eliminato');
    showNotification('Annuncio eliminato', 'success');
    loadAnnouncements();
}

// ==================== LOG ====================
function addLog(action) {
    const logs = JSON.parse(localStorage.getItem('adminLogs') || '[]');
    logs.push({
        date: new Date().toISOString(),
        action: action,
        admin: currentUser.username
    });
    localStorage.setItem('adminLogs', JSON.stringify(logs));
}

function loadLogs() {
    const logs = JSON.parse(localStorage.getItem('adminLogs') || '[]');
    const list = document.getElementById('logsList');
    
    if (logs.length === 0) {
        list.innerHTML = '<p style="color: #888;">Nessuna attività registrata</p>';
        return;
    }
    
    list.innerHTML = logs.slice().reverse().map(log => `
        <div class="log-item">
            <div class="log-time">${new Date(log.date).toLocaleString('it-IT')} - ${log.admin}</div>
            <div class="log-action">${log.action}</div>
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
    let csv = 'Username,Email,Stato,Data Registrazione\n';
    users.forEach(u => {
        csv += `${u.username},${u.email},${u.banned ? 'Bannato' : 'Attivo'},${new Date(u.registeredDate || Date.now()).toLocaleDateString('it-IT')}\n`;
    });
    
    downloadText(csv, 'utenti_piacenzarp.csv');
    addLog('Export utenti (CSV)');
    showNotification('Export CSV completato!', 'success');
}

function exportAllData() {
    const backup = {
        users: JSON.parse(localStorage.getItem('piacenzaUsers') || '[]'),
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
    if (!confirm('⚠️ ATTENZIONE! Vuoi davvero cancellare TUTTI i dati?\n\nQuesta azione è IRREVERSIBILE!')) return;
    if (!confirm('Sei SICURO? Tutti gli utenti, candidature e impostazioni verranno cancellati!')) return;
    
    // Backup automatico prima di cancellare
    exportAllData();
    
    // Cancella tutto tranne l'admin corrente
    localStorage.removeItem('piacenzaUsers');
    localStorage.removeItem('announcements');
    localStorage.removeItem('adminLogs');
    localStorage.removeItem('globalSettings');
    
    // Cancella dati fazioni
    const factions = [
        'Polizia di Stato', 
        'Arma dei Carabinieri', 
        'Guardia di Finanza', 
        'Polizia Penitenziaria', 
        'Polizia Locale', 
        'Croce Rossa Italiana', 
        'Croce Verde', 
        'Vigili del Fuoco', 
        'ACI'
    ];
    
    factions.forEach(faction => {
        localStorage.removeItem(`applications_${faction}`);
        localStorage.removeItem(`questions_${faction}`);
        localStorage.removeItem(`schedule_${faction}`);
        localStorage.removeItem(`webhooks_${faction}`);
        localStorage.removeItem(`archive_${faction}`);
    });
    
    showNotification('Tutti i dati sono stati cancellati! Backup salvato.', 'success');
    
    setTimeout(() => {
        window.location.reload();
    }, 2000);
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
    
    if (!webhookUrl) {
        console.log('⚠️ Webhook non configurato');
        return;
    }
    
    let embed = {};
    
    if (type === 'ban') {
        embed = {
            title: data.banned ? '🚫 Utente Bannato dal Sito' : '✅ Ban Rimosso',
            color: data.banned ? 0xe74c3c : 0x27ae60,
            fields: [
                { name: '👤 Username', value: data.username, inline: true },
                { name: '📧 Email', value: data.email, inline: true },
                { name: '💬 Discord', value: data.discord || 'N/A', inline: true },
                {
                    name: '⚠️ Azione Manuale Richiesta',
                    value: data.banned 
                        ? 'Bannare questo utente anche su Discord manualmente' 
                        : 'Rimuovere il ban su Discord se presente',
                    inline: false
                }
            ],
            timestamp: new Date().toISOString(),
            footer: { text: `Azione eseguita da ${currentUser.username}` }
        };
    } else if (type === 'announcement') {
        const typeEmojis = {
            'info': 'ℹ️',
            'warning': '⚠️',
            'event': '🎉',
            'update': '🔄'
        };
        
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
        body: JSON.stringify({
            username: 'Sistema Staff - Piacenza RP',
            avatar_url: 'https://via.placeholder.com/100',
            embeds: [embed]
        })
    })
    .then(res => {
        if (res.ok) {
            console.log('✅ Webhook inviato:', type);
        } else {
            console.error('❌ Errore webhook:', res.status);
        }
    })
    .catch(err => console.error('❌ Errore invio webhook:', err));
}