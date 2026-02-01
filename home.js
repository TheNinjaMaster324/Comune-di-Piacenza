// ==================== CUSTOM ALERT SYSTEM ====================

function showCustomAlert(type, title, message) {
    const alertOverlay = document.getElementById('customAlert');
    const alertBox = alertOverlay.querySelector('.custom-alert-box');
    const alertTitle = document.getElementById('alertTitle');
    const alertMessage = document.getElementById('alertMessage');
    const alertDate = document.getElementById('alertDate');
    const alertIcon = document.getElementById('alertIcon');
    
    // Rimuovi classi precedenti
    alertBox.classList.remove('warning', 'error', 'success', 'info', 'submission');
    alertBox.classList.add(type);
    
    // Icone
    const icons = {
        'warning': '⚠️',
        'error': '❌',
        'success': '✅',
        'info': 'ℹ️',
        'submission': '📋'
    };
    
    alertIcon.textContent = icons[type] || '⚠️';
    alertTitle.textContent = title;
    alertMessage.textContent = message;
    
    // Data e ora
    const now = new Date();
    const dateStr = now.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    alertDate.textContent = `Data: ${dateStr}, ${timeStr}`;
    
    // Mostra alert
    alertOverlay.classList.add('show');
}

function closeCustomAlert() {
    const alertOverlay = document.getElementById('customAlert');
    alertOverlay.classList.remove('show');
}

// Chiudi con ESC
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeCustomAlert();
});

// Chiudi cliccando fuori
document.getElementById('customAlert')?.addEventListener('click', function(e) {
    if (e.target === this) closeCustomAlert();
});

// ==================== TRACCIAMENTO UTENTI ONLINE ====================

// Funzione per aggiornare l'heartbeat dell'utente
function updateUserHeartbeat() {
    const user = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    if (!user.username) return;
    
    const onlineUsers = JSON.parse(localStorage.getItem('onlineUsers') || '{}');
    
    onlineUsers[user.username] = {
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin || false,
        isInstitutional: user.isInstitutional || false,
        lastSeen: new Date().toISOString()
    };
    
    localStorage.setItem('onlineUsers', JSON.stringify(onlineUsers));
}

// Funzione per pulire utenti offline (ultimo heartbeat > 5 minuti)
function cleanOfflineUsers() {
    const onlineUsers = JSON.parse(localStorage.getItem('onlineUsers') || '{}');
    const now = new Date().getTime();
    const timeout = 5 * 60 * 1000; // 5 minuti
    
    let cleaned = false;
    Object.keys(onlineUsers).forEach(username => {
        const lastSeen = new Date(onlineUsers[username].lastSeen).getTime();
        if (now - lastSeen > timeout) {
            delete onlineUsers[username];
            cleaned = true;
        }
    });
    
    if (cleaned) {
        localStorage.setItem('onlineUsers', JSON.stringify(onlineUsers));
    }
}

// Funzione per contare gli utenti online
function getOnlineUsersCount() {
    cleanOfflineUsers();
    const onlineUsers = JSON.parse(localStorage.getItem('onlineUsers') || '{}');
    
    let totalOnline = 0;
    let adminsOnline = 0;
    
    Object.values(onlineUsers).forEach(user => {
        totalOnline++;
        if (user.isAdmin) adminsOnline++;
    });
    
    return { totalOnline, adminsOnline };
}

// 🔥 Funzione per aggiornare le statistiche (chiamata dal bottone)
function refreshHomeStats() {
    const users = JSON.parse(localStorage.getItem('piacenzaUsers') || '[]');
    const { totalOnline, adminsOnline } = getOnlineUsersCount();
    
    const totalUsersEl = document.getElementById('totalUsers');
    const onlineUsersEl = document.getElementById('onlineUsers');
    const adminOnlineEl = document.getElementById('adminOnline');
    
    if (totalUsersEl) totalUsersEl.textContent = users.length;
    if (onlineUsersEl) onlineUsersEl.textContent = totalOnline;
    if (adminOnlineEl) adminOnlineEl.textContent = adminsOnline;
    
    console.log(`📊 Stats aggiornate: ${users.length} utenti, ${totalOnline} online (${adminsOnline} admin)`);
}

// Aggiorna statistiche admin (se presente)
function updateAdminStats() {
    const users = JSON.parse(localStorage.getItem('piacenzaUsers') || '[]');
    const totalUsersElement = document.getElementById('totalUsers');
    
    if (totalUsersElement) {
        totalUsersElement.textContent = users.length;
    }
    
    // Aggiorna anche online users
    refreshHomeStats();
}

// Avvia heartbeat ogni 30 secondi
setInterval(updateUserHeartbeat, 30000);
setInterval(refreshHomeStats, 30000);

// Cleanup quando l'utente chiude la pagina
window.addEventListener('beforeunload', function() {
    const user = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    if (user.username) {
        const onlineUsers = JSON.parse(localStorage.getItem('onlineUsers') || '{}');
        delete onlineUsers[user.username];
        localStorage.setItem('onlineUsers', JSON.stringify(onlineUsers));
    }
});

// ==================== VERIFICA LOGIN ALL'AVVIO ====================

window.addEventListener('load', function() {
    const isLoggedIn = sessionStorage.getItem('logged');
    
    if (isLoggedIn !== 'yes') {
        window.location.href = 'index.html';
        return;
    }
    
    // Carica i dati dell'utente
    const userData = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    
    if (userData.username) {
        // Mostra il messaggio di benvenuto
        document.getElementById('welcomeMessage').textContent = `Benvenuto, ${userData.username}!`;
        
        // ⭐ AVVIA TRACCIAMENTO UTENTE ONLINE
        updateUserHeartbeat();
        
        // Se è admin, mostra la sezione staff
        if (userData.isAdmin) {
            const staffSection = document.getElementById('staff');
            if (staffSection) {
                staffSection.style.display = 'block';
            }
            updateAdminStats();
            refreshHomeStats(); // Aggiorna stats subito
            loadQuickActions();
        }
        
        // Se è esponente istituzionale, mostra link gestione
        if (userData.isInstitutional) {
            const gestioneLink = document.getElementById('gestioneLink');
            if (gestioneLink) {
                gestioneLink.style.display = 'block';
            }
        }
    }
});

// ==================== LOGOUT ====================

function logout() {
    if (confirm('Sei sicuro di voler uscire?')) {
        console.log('👋 Logout in corso...');
        
        // Cancella TUTTI i dati di sessione
        sessionStorage.clear();
        
        // Cancella cookie auto-login
        localStorage.removeItem('piacenza_auto_login');
        
        // Reindirizza a index.html
        window.location.href = 'index.html';
    }
}

// ==================== MOBILE MENU ====================

function toggleMobileMenu() {
    const navMenu = document.getElementById('navMenu');
    navMenu.classList.toggle('active');
}

// Chiudi menu mobile quando si clicca su un link
document.querySelectorAll('.nav-menu a').forEach(link => {
    link.addEventListener('click', function() {
        const navMenu = document.getElementById('navMenu');
        navMenu.classList.remove('active');
    });
});

// ==================== ACCESSO STAFF ====================

function checkStaffAccess(event) {
    const userData = JSON.parse(sessionStorage.getItem('currentUser'));
    
    if (!userData || !userData.isAdmin) {
        event.preventDefault();
        showAccessDeniedModal();
        return false;
    }
}

function showAccessDeniedModal() {
    document.getElementById('accessDeniedModal').style.display = 'flex';
}

function closeAccessModal() {
    document.getElementById('accessDeniedModal').style.display = 'none';
}

// ==================== SMOOTH SCROLL ====================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        
        if (href === '#') return;
        
        e.preventDefault();
        const target = document.querySelector(href);
        
        if (target) {
            const navbarHeight = document.querySelector('.navbar').offsetHeight;
            const targetPosition = target.offsetTop - navbarHeight;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
            
            const navMenu = document.getElementById('navMenu');
            navMenu.classList.remove('active');
        }
    });
});

// ==================== FORM CONTATTI → DISCORD WEBHOOK ====================

document.getElementById('contactForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const name = document.getElementById('contactName').value.trim();
    const email = document.getElementById('contactEmail').value.trim();
    const message = document.getElementById('contactMessage').value.trim();
    
    if (!name || !email || !message) {
        alert('⚠️ Compila tutti i campi!');
        return;
    }
    
    const webhookUrl = 'https://discord.com/api/webhooks/1464363269593497663/n8ZgJ96CoxaXoZ-ujq2yYo-ml2xkXO5h9dGx9K2onmkG3NTVDUopGwgWaVE_3bWkbiNy';
    
    const embed = {
        title: '📧 Nuovo Messaggio di Contatto',
        description: 'Un utente ha inviato un messaggio dal sito',
        color: 0x667eea,
        fields: [
            { name: '👤 Nome', value: name, inline: true },
            { name: '📧 Email', value: email, inline: true },
            { name: '\u200B', value: '\u200B', inline: false },
            { name: '💬 Messaggio', value: message.length > 1024 ? message.substring(0, 1021) + '...' : message, inline: false }
        ],
        footer: { text: 'Comune di Piacenza RP' },
        timestamp: new Date().toISOString()
    };
    
    try {
        console.log('📤 Invio messaggio al webhook Discord...');
        
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'Contatti - Piacenza RP',
                avatar_url: 'https://via.placeholder.com/100',
                embeds: [embed]
            })
        });
        
        if (response.ok) {
            console.log('✅ Messaggio inviato con successo!');
            alert('✅ Messaggio inviato con successo!\n\nGrazie per averci contattato, ' + name + '!\nRiceverai una risposta entro 24-48 ore.');
            this.reset();
        } else {
            throw new Error('Errore risposta webhook: ' + response.status);
        }
        
    } catch (error) {
        console.error('❌ Errore invio webhook:', error);
        alert('❌ Errore invio messaggio!\n\nPer favore contattaci direttamente su Discord:\nhttps://discord.gg/PjxsnbDs');
    }
});

// ==================== CANDIDATURA FAZIONE ====================

const factionNameMap = {
    'Polizia': 'Polizia di Stato',
    'Medici': 'Croce Rossa Italiana',
    'Vigili del Fuoco': 'Vigili del Fuoco',
    'Meccanici': 'ACI',
    'Tassisti': 'Tassisti',
    'Polizia di Stato': 'Polizia di Stato',
    'Arma dei Carabinieri': 'Arma dei Carabinieri',
    'Polizia Locale': 'Polizia Locale',
    'Guardia di Finanza': 'Guardia di Finanza',
    'Polizia Penitenziaria': 'Polizia Penitenziaria',
    'Croce Rossa Italiana': 'Croce Rossa Italiana',
    'Croce Verde': 'Croce Verde',
    'ACI': 'ACI'
};

function applyFaction(factionName) {
    const fullFactionName = factionNameMap[factionName] || factionName;
    
    const user = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    if (!user.username) {
        showCustomAlert('warning', 'Accesso Richiesto', 'Devi essere loggato per candidarti! Effettua il login dalla pagina principale.');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 3000);
        return;
    }
    
    const schedule = JSON.parse(localStorage.getItem(`schedule_${fullFactionName}`) || '{}');
    if (schedule.status !== 'open') {
        showCustomAlert('warning', 'Le candidature sono chiuse!', `Al momento non è possibile inviare candidature per ${fullFactionName}. Riprova più tardi quando verranno riaperte.`);
        return;
    }
    
    const applications = JSON.parse(localStorage.getItem(`applications_${fullFactionName}`) || '[]');
    const alreadyApplied = applications.find(app => 
        app.username === user.username && 
        app.sessionId === schedule.sessionId
    );
    
    if (alreadyApplied) {
        const dataInvio = new Date(alreadyApplied.date).toLocaleString('it-IT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        showCustomAlert('warning', 'HAI GIÀ INVIATO UNA CANDIDATURA!', `Hai già inviato una candidatura per ${fullFactionName}.\n\nData invio: ${dataInvio}\n\nPuoi candidarti solo una volta per apertura. Attendi la valutazione dello staff.`);
        return;
    }
    
    window.location.href = `candidatura-form.html?faction=${encodeURIComponent(fullFactionName)}`;
}

function selectCivilian() {
    const user = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    
    if (!user.username) {
        alert('⚠️ Devi essere loggato!');
        return;
    }
    
    alert(`✅ Benvenuto come Civile!\n\nPuoi iniziare subito a giocare.\nEntra nel server Roblox e divertiti!`);
    
    console.log('👤 Utente diventato civile:', user.username);
}

// ==================== NAVBAR SCROLL EFFECT ====================

let lastScroll = 0;
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
    
    lastScroll = currentScroll;
});

// ==================== ANIMAZIONE CARDS ====================

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

document.querySelectorAll('.card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(card);
});

// ==================== GESTIONE BOTTONI ADMIN ====================
// ⭐ ESCLUDI il bottone "🔄 Aggiorna" dall'alert

document.querySelectorAll('.admin-btn').forEach(btn => {
    // Salta il bottone con onclick="refreshHomeStats()"
    if (btn.getAttribute('onclick') === 'refreshHomeStats()') {
        return; // Non aggiungere l'alert a questo bottone
    }
});


// ==================== AZIONI RAPIDE - CARICAMENTO DINAMICO ====================

function loadQuickActions() {
    const container = document.getElementById('quickActionsContent');
    if (!container) return;
    
    const settings = JSON.parse(localStorage.getItem('quickActionsSettings') || '{}');
    const regEnabled = settings.registrationsEnabled !== false;
    const maintEnabled = settings.maintenanceMode === true;
    
    container.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 15px;">
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: #f8f9fa; border-radius: 8px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span id="regStatusIcon">${regEnabled ? '🔓' : '🔒'}</span>
                    <span id="regStatusText" style="font-size: 14px; font-weight: 500; color: ${regEnabled ? '#27ae60' : '#e74c3c'};">
                        ${regEnabled ? 'Registrazioni Aperte' : 'Registrazioni Chiuse'}
                    </span>
                </div>
                <label class="quick-toggle">
                    <input type="checkbox" id="toggleRegistrations" onchange="toggleRegistrations()" ${regEnabled ? 'checked' : ''}>
                    <span class="quick-slider"></span>
                </label>
            </div>
            
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: #f8f9fa; border-radius: 8px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span id="maintStatusIcon">${maintEnabled ? '🚨' : '✅'}</span>
                    <span id="maintStatusText" style="font-size: 14px; font-weight: 500; color: ${maintEnabled ? '#e74c3c' : '#27ae60'};">
                        ${maintEnabled ? 'Manutenzione Attiva' : 'Server Online'}
                    </span>
                </div>
                <label class="quick-toggle">
                    <input type="checkbox" id="toggleMaintenance" onchange="toggleMaintenance()" ${maintEnabled ? 'checked' : ''}>
                    <span class="quick-slider"></span>
                </label>
            </div>
            
            <button class="admin-btn" onclick="forceLogoutAll()" style="background: #e74c3c; width: 100%; margin-top: 5px;">
                📤 Logout Tutti
            </button>
            <button class="admin-btn" onclick="clearCache()" style="background: #95a5a6; width: 100%;">
                🧹 Pulisci Cache
            </button>
        </div>
    `;
}

function toggleRegistrations() {
    const checkbox = document.getElementById('toggleRegistrations');
    const enabled = checkbox.checked;
    
    const settings = JSON.parse(localStorage.getItem('quickActionsSettings') || '{}');
    settings.registrationsEnabled = enabled;
    localStorage.setItem('quickActionsSettings', JSON.stringify(settings));
    
    updateRegStatus(enabled);
    showCustomAlert('success', enabled ? '✅ Registrazioni Attivate' : '🔒 Registrazioni Disattivate', 
                     `Le registrazioni sono ora ${enabled ? 'aperte' : 'chiuse'}.`);
}

function updateRegStatus(enabled) {
    const icon = document.getElementById('regStatusIcon');
    const text = document.getElementById('regStatusText');
    if (icon && text) {
        icon.textContent = enabled ? '🔓' : '🔒';
        text.textContent = enabled ? 'Registrazioni Aperte' : 'Registrazioni Chiuse';
        text.style.color = enabled ? '#27ae60' : '#e74c3c';
    }
}

function toggleMaintenance() {
    const checkbox = document.getElementById('toggleMaintenance');
    const enabled = checkbox.checked;
    
    if (enabled && !confirm('⚠️ Attivare la modalità manutenzione?\n\n• Gli utenti non potranno fare login\n• Banner pubblico visibile\n• Solo admin possono accedere\n\nConfermi?')) {
        checkbox.checked = false;
        return;
    }
    
    const settings = JSON.parse(localStorage.getItem('quickActionsSettings') || '{}');
    settings.maintenanceMode = enabled;
    localStorage.setItem('quickActionsSettings', JSON.stringify(settings));
    
    updateMaintStatus(enabled);
    showCustomAlert(enabled ? 'warning' : 'success', 
                     enabled ? '🚨 Manutenzione Attivata' : '✅ Manutenzione Disattivata',
                     enabled ? 'Server in manutenzione. Solo admin possono accedere.' : 'Server tornato online.');
}

function updateMaintStatus(enabled) {
    const icon = document.getElementById('maintStatusIcon');
    const text = document.getElementById('maintStatusText');
    if (icon && text) {
        icon.textContent = enabled ? '🚨' : '✅';
        text.textContent = enabled ? 'Manutenzione Attiva' : 'Server Online';
        text.style.color = enabled ? '#e74c3c' : '#27ae60';
    }
}

function forceLogoutAll() {
    if (!confirm('⚠️ Espellere TUTTI gli utenti?\n\n• Invalida tutte le sessioni\n• Gli utenti dovranno rifare login\n• Tu resti connesso\n\nConfermi?')) {
        return;
    }
    
    const onlineUsers = JSON.parse(localStorage.getItem('onlineUsers') || '{}');
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    
    let count = 0;
    Object.keys(onlineUsers).forEach(username => {
        if (username !== currentUser.username) {
            delete onlineUsers[username];
            count++;
        }
    });
    
    localStorage.setItem('onlineUsers', JSON.stringify(onlineUsers));
    localStorage.setItem('force_logout_timestamp', Date.now().toString());
    
    showCustomAlert('success', '📤 Logout Forzato', `${count} utenti espulsi dal server.`);
    refreshHomeStats();
}

function clearCache() {
    if (!confirm('🧹 Pulire la cache?\n\n• Log temporanei\n• Dati scaduti\n• Utenti offline\n\nConfermi?')) {
        return;
    }
    
    const onlineUsers = JSON.parse(localStorage.getItem('onlineUsers') || '{}');
    const now = new Date().getTime();
    const timeout = 5 * 60 * 1000;
    
    let cleaned = 0;
    Object.keys(onlineUsers).forEach(username => {
        const lastSeen = new Date(onlineUsers[username].lastSeen).getTime();
        if (now - lastSeen > timeout) {
            delete onlineUsers[username];
            cleaned++;
        }
    });
    
    localStorage.setItem('onlineUsers', JSON.stringify(onlineUsers));
    
    const logs = JSON.parse(localStorage.getItem('adminLogs') || '[]');
    if (logs.length > 500) {
        const newLogs = logs.slice(-500);
        localStorage.setItem('adminLogs', JSON.stringify(newLogs));
        cleaned += logs.length - 500;
    }
    
    showCustomAlert('success', '🧹 Cache Pulita', `${cleaned} elementi rimossi.`);
    refreshHomeStats();
}

console.log('✅ home.js caricato correttamente!');