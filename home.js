// ==================== CUSTOM ALERT SYSTEM ====================

function showCustomAlert(type, title, message) {
    const alertOverlay = document.getElementById('customAlert');
    const alertBox = alertOverlay.querySelector('.custom-alert-box');
    const alertTitle = document.getElementById('alertTitle');
    const alertMessage = document.getElementById('alertMessage');
    const alertDate = document.getElementById('alertDate');
    const alertIcon = document.getElementById('alertIcon');
    
    alertBox.classList.remove('warning', 'error', 'success', 'info', 'submission');
    alertBox.classList.add(type);
    
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
    
    const now = new Date();
    const dateStr = now.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    alertDate.textContent = `Data: ${dateStr}, ${timeStr}`;
    
    alertOverlay.classList.add('show');
}

function closeCustomAlert() {
    const alertOverlay = document.getElementById('customAlert');
    alertOverlay.classList.remove('show');
}

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeCustomAlert();
});

document.getElementById('customAlert')?.addEventListener('click', function(e) {
    if (e.target === this) closeCustomAlert();
});

// ==================== TRACCIAMENTO UTENTI ONLINE ====================

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

function cleanOfflineUsers() {
    const onlineUsers = JSON.parse(localStorage.getItem('onlineUsers') || '{}');
    const now = new Date().getTime();
    const timeout = 5 * 60 * 1000;
    
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

function updateAdminStats() {
    const users = JSON.parse(localStorage.getItem('piacenzaUsers') || '[]');
    const totalUsersElement = document.getElementById('totalUsers');
    
    if (totalUsersElement) {
        totalUsersElement.textContent = users.length;
    }
    
    refreshHomeStats();
}

setInterval(updateUserHeartbeat, 30000);
setInterval(refreshHomeStats, 30000);

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
    
    const userData = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    
    if (userData.username) {
        document.getElementById('welcomeMessage').textContent = `Benvenuto, ${userData.username}!`;
        
        updateUserHeartbeat();
        
        if (userData.isAdmin) {
            const staffSection = document.getElementById('staff');
            if (staffSection) {
                staffSection.style.display = 'block';
            }
            updateAdminStats();
            refreshHomeStats();
            loadQuickActions();
            
            // 🔥 MOSTRA PULSANTI FLOATING PER ADMIN
            const buttons = document.getElementById('createEventsGuidesButtons');
            if (buttons) {
                buttons.style.display = 'flex';
                console.log('✅ Pulsanti floating mostrati!');
            }
        }
        
        if (userData.isInstitutional) {
            const gestioneLink = document.getElementById('gestioneLink');
            if (gestioneLink) {
                gestioneLink.style.display = 'block';
            }
        }
    }
    
    // 🔥 CARICA EVENTI E GUIDE
    loadEventsOnSite();
    loadGuidesOnSite();
});

// ==================== LOGOUT ====================

function logout() {
    if (confirm('Sei sicuro di voler uscire?')) {
        console.log('👋 Logout in corso...');
        sessionStorage.clear();
        localStorage.removeItem('piacenza_auto_login');
        window.location.href = 'index.html';
    }
}

// ==================== MOBILE MENU ====================

function toggleMobileMenu() {
    const navMenu = document.getElementById('navMenu');
    navMenu.classList.toggle('active');
}

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

// ==================== FORM CONTATTI ====================

document.getElementById('contactForm')?.addEventListener('submit', async function(e) {
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
            alert('✅ Messaggio inviato con successo!\n\nGrazie per averci contattato, ' + name + '!\nRiceverai una risposta entro 24-48 ore.');
            this.reset();
        } else {
            throw new Error('Errore risposta webhook');
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
        showCustomAlert('warning', 'Accesso Richiesto', 'Devi essere loggato per candidarti!');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 3000);
        return;
    }
    
    const schedule = JSON.parse(localStorage.getItem(`schedule_${fullFactionName}`) || '{}');
    if (schedule.status !== 'open') {
        showCustomAlert('warning', 'Le candidature sono chiuse!', `Al momento non è possibile inviare candidature per ${fullFactionName}.`);
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
        
        showCustomAlert('warning', 'HAI GIÀ INVIATO UNA CANDIDATURA!', `Hai già inviato una candidatura per ${fullFactionName}.\n\nData invio: ${dataInvio}`);
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
}

// ==================== NAVBAR SCROLL ====================

let lastScroll = 0;
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
        navbar?.classList.add('scrolled');
    } else {
        navbar?.classList.remove('scrolled');
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

// ==================== AZIONI RAPIDE ====================

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
    
    if (enabled && !confirm('⚠️ Attivare la modalità manutenzione?\n\n• Gli utenti non potranno fare login\n• Solo admin possono accedere\n\nConfermi?')) {
        checkbox.checked = false;
        return;
    }
    
    const settings = JSON.parse(localStorage.getItem('quickActionsSettings') || '{}');
    settings.maintenanceMode = enabled;
    localStorage.setItem('quickActionsSettings', JSON.stringify(settings));
    
    updateMaintStatus(enabled);
    showCustomAlert(enabled ? 'warning' : 'success', 
                     enabled ? '🚨 Manutenzione Attivata' : '✅ Manutenzione Disattivata',
                     enabled ? 'Server in manutenzione.' : 'Server tornato online.');
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
    if (!confirm('⚠️ Espellere TUTTI gli utenti?\n\nConfermi?')) {
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
    
    showCustomAlert('success', '📤 Logout Forzato', `${count} utenti espulsi.`);
    refreshHomeStats();
}

function clearCache() {
    if (!confirm('🧹 Pulire la cache?\n\nConfermi?')) {
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
    
    showCustomAlert('success', '🧹 Cache Pulita', `${cleaned} elementi rimossi.`);
    refreshHomeStats();
}

// ==================== MODALE EVENTI/GUIDE ====================

function openEventGuideModal(type) {
    const modal = document.getElementById('eventGuideModal');
    const typeInput = document.getElementById('eventGuideType');
    const modalTitle = document.getElementById('modalHeaderTitle');
    const modalSubtitle = document.getElementById('modalHeaderSubtitle');
    const submitBtn = document.getElementById('submitEventGuideBtn');
    const dataField = document.getElementById('dataEventoField');
    const dataInput = document.getElementById('eventGuideData');
    
    typeInput.value = type;
    
    if (type === 'evento') {
        modalTitle.textContent = '🎉 Crea Nuovo Evento';
        modalSubtitle.textContent = 'Compila i campi e pubblica su Discord';
        submitBtn.textContent = '🚀 Pubblica Evento';
        dataField.style.display = 'block';
        dataInput.required = true;
    } else {
        modalTitle.textContent = '📚 Crea Nuova Guida';
        modalSubtitle.textContent = 'Scrivi una guida utile per la community';
        submitBtn.textContent = '📚 Pubblica Guida';
        dataField.style.display = 'none';
        dataInput.required = false;
    }
    
    modal.classList.add('show');
}

function closeEventGuideModal() {
    const modal = document.getElementById('eventGuideModal');
    modal.classList.remove('show');
    document.getElementById('eventGuideForm').reset();
}

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeEventGuideModal();
    }
});

document.getElementById('eventGuideModal')?.addEventListener('click', function(e) {
    if (e.target === this) {
        closeEventGuideModal();
    }
});

// ==================== INVIO FORM EVENTI/GUIDE ====================

document.getElementById('eventGuideForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    console.log('📋 Form submit avviato...');
    
    const userData = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    const type = document.getElementById('eventGuideType').value;
    const titolo = document.getElementById('eventGuideTitolo').value.trim();
    const descrizione = document.getElementById('eventGuideDescrizione').value.trim();
    const dataEvento = document.getElementById('eventGuideData').value;
    const immagine = document.getElementById('eventGuideImmagine').value.trim();
    const ping = document.querySelector('input[name="ping"]:checked').value;
    
    console.log('📝 Dati:', { type, titolo, ping });
    
    if (!titolo || !descrizione) {
        showCustomAlert('warning', 'Campi Obbligatori', 'Compila titolo e descrizione!');
        return;
    }
    
    if (type === 'evento' && !dataEvento) {
        showCustomAlert('warning', 'Data Mancante', 'Inserisci la data dell\'evento!');
        return;
    }
    
    const WEBHOOK_EVENTI = 'https://discord.com/api/webhooks/1474735824380887140/DcvoHY6FSpxUwyQcc8KLVZI2eWe1fHt2mP74UXzOWKBNyU0JGwYi0iiljjjeJGaD8uQP';
    const WEBHOOK_GUIDE = 'https://discord.com/api/webhooks/1474731676860154079/2qOLrr5D711JqjRM9ApH3Y1SFRwdfJteOeVtrSET3ivy6U_Wfjs255gFWQOcm1SIziKY';
    
    const WEBHOOK_URL = type === 'evento' ? WEBHOOK_EVENTI : WEBHOOK_GUIDE;
    
    console.log('🚀 Invio a webhook...');
    
    try {
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'Sistema Eventi/Guide - Piacenza RP',
                avatar_url: 'https://theninjamaster324.github.io/Comune-di-Piacenza/Place.png',
                content: `EVENTO_GUIDA_TRIGGER`,
                embeds: [{
                    title: `📋 ${type === 'evento' ? 'Nuovo Evento' : 'Nuova Guida'}`,
                    color: type === 'evento' ? 0x667eea : 0x27ae60,
                    fields: [
                        { name: '📝 Titolo', value: titolo, inline: false },
                        { name: '📄 Descrizione', value: descrizione.substring(0, 1024), inline: false },
                        type === 'evento' && dataEvento ? { 
                            name: '📅 Data Evento', 
                            value: dataEvento,
                            inline: false 
                        } : null,
                        immagine ? { name: '🖼️ Immagine', value: immagine, inline: false } : null,
                        { name: '🔔 Ping', value: ping, inline: true },
                        { name: '👤 Autore', value: userData.username, inline: true },
                        { name: '🆔 Tipo', value: type, inline: true }
                    ].filter(Boolean),
                    thumbnail: immagine ? { url: immagine } : null,
                    timestamp: new Date().toISOString(),
                    footer: { text: 'Comune di Piacenza RP' }
                }]
            })
        });
        
        console.log('📡 Risposta:', response.status);
        
        if (response.ok) {
            console.log('✅ WEBHOOK INVIATO!');
            
            // 🔥 SALVA EVENTO/GUIDA IN LOCALSTORAGE IMMEDIATAMENTE!
            if (type === 'evento') {
                const events = JSON.parse(localStorage.getItem('pinnedEvents') || '[]');
                const newEvent = {
                    id: Date.now().toString(),
                    title: titolo,
                    description: descrizione,
                    date: dataEvento,
                    location: 'Server Roblox - Comune di Piacenza RP',
                    author: userData.username || 'Staff',
                    image: immagine || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&h=200&fit=crop',
                    program: '',
                    discordEventUrl: null,
                    createdAt: new Date().toISOString()
                };
                events.unshift(newEvent);
                localStorage.setItem('pinnedEvents', JSON.stringify(events));
                console.log('💾 Evento salvato in localStorage!');
                
                // Ricarica eventi sul sito
                loadEventsOnSite();
                console.log('🔄 Eventi ricaricati!');
            } else {
                const guides = JSON.parse(localStorage.getItem('pinnedGuides') || '[]');
                const newGuide = {
                    id: Date.now().toString(),
                    title: titolo,
                    description: descrizione,
                    author: userData.username || 'Staff',
                    createdAt: new Date().toISOString()
                };
                guides.unshift(newGuide);
                localStorage.setItem('pinnedGuides', JSON.stringify(guides));
                console.log('💾 Guida salvata in localStorage!');
                
                // Ricarica guide sul sito
                loadGuidesOnSite();
                console.log('🔄 Guide ricaricate!');
            }
            
            // Mostra alert di successo
            showCustomAlert('success', '✅ PUBBLICATO!', 
                `${type === 'evento' ? '🎉 EVENTO' : '📚 GUIDA'} pubblicato con successo!\n\n` +
                `📝 "${titolo}"\n\n` +
                `✅ Visibile sul sito!\n` +
                `✅ Inviato su Discord!`
            );
            
            console.log('⏰ Chiudo modale tra 3 secondi...');
            
            // Aspetta 3 secondi prima di chiudere
            setTimeout(() => {
                console.log('🔒 Chiudo modale!');
                closeEventGuideModal();
                document.getElementById('eventGuideForm').reset();
            }, 3000);
            
        } else {
            const errorText = await response.text();
            console.error('❌ Errore webhook:', response.status, errorText);
            throw new Error(`Webhook error: ${response.status}`);
        }
    } catch (error) {
        console.error('❌ ERRORE:', error);
        showCustomAlert('error', '❌ Errore!', 
            `Impossibile pubblicare!\n\n${error.message}\n\nRiprova o contatta lo staff.`
        );
    }
});

// ==================== SEZIONE EVENTI/GUIDE SUL SITO ====================

function loadEventsOnSite() {
    const container = document.getElementById('eventsContainer');
    if (!container) return;
    
    const events = JSON.parse(localStorage.getItem('pinnedEvents') || '[]');
    
    if (events.length === 0) {
        container.innerHTML = `
            <div style="text-align:center;padding:60px 20px;color:#999;grid-column:1/-1;">
                <p style="font-size:18px;margin:0;">📅 Nessun evento in programma al momento</p>
                <p style="font-size:14px;margin-top:10px;">Controlla Discord per gli ultimi aggiornamenti!</p>
            </div>
        `;
        return;
    }
    
    events.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    container.innerHTML = events.map(event => {
        const eventDate = new Date(event.date);
        const now = new Date();
        const isPast = eventDate < now;
        
        const formattedDate = eventDate.toLocaleString('it-IT', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        return `
            <div class="event-card ${isPast ? 'past-event' : ''}">
                <img src="${event.image || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&h=200&fit=crop'}" alt="${event.title}">
                <h3>🎉 ${event.title}</h3>
                <p>${event.description.substring(0, 120)}...</p>
                <p class="event-date">📅 ${formattedDate}</p>
                <div class="event-buttons">
                    ${!isPast ? `
                        <button onclick="participateEvent('${event.id}', '${event.title.replace(/'/g, "\\'")}')" class="btn-participate">
                            🎉 Partecipa
                        </button>
                    ` : ''}
                    <button onclick="showEventDetails('${event.id}')" class="btn-details">
                        ℹ️ Più Info
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function loadGuidesOnSite() {
    const container = document.getElementById('guidesContainer');
    if (!container) return;
    
    const guides = JSON.parse(localStorage.getItem('pinnedGuides') || '[]');
    
    if (guides.length === 0) {
        container.innerHTML = `
            <div style="text-align:center;padding:60px 20px;color:#999;grid-column:1/-1;">
                <p style="font-size:18px;margin:0;">📖 Nessuna guida disponibile al momento</p>
                <p style="font-size:14px;margin-top:10px;">Le guide verranno pubblicate presto!</p>
            </div>
        `;
        return;
    }
    
    guides.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    container.innerHTML = guides.map((guide, index) => {
        const isPinned = index < 3;
        
        return `
            <div class="guide-card ${isPinned ? 'pinned-guide' : ''}">
                ${isPinned ? '<div class="pin-badge">📌 Fissata</div>' : ''}
                <h3>📚 ${guide.title}</h3>
                <p>${guide.description.substring(0, 150).replace(/<[^>]*>/g, '')}...</p>
                <p style="font-size:13px;color:#999;margin:10px 20px;">👤 ${guide.author}</p>
                <div class="guide-buttons">
                    <button onclick="showGuideDetails('${guide.id}')" class="btn-read">
                        📖 Leggi Guida
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

async function participateEvent(eventId, eventTitle) {
    const user = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    if (!user.username) {
        showCustomAlert('warning', 'Login Richiesto', 'Devi essere loggato per partecipare!');
        return;
    }
    
    const participations = JSON.parse(localStorage.getItem('myParticipations') || '{}');
    participations[eventId] = { title: eventTitle, date: new Date().toISOString() };
    localStorage.setItem('myParticipations', JSON.stringify(participations));
    
    const WEBHOOK = 'https://discord.com/api/webhooks/INSERISCI_WEBHOOK_PARTECIPAZIONI';
    
    try {
        await fetch(WEBHOOK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content: 'PARTECIPA_TRIGGER',
                embeds: [{
                    title: '✅ Nuova Partecipazione',
                    color: 0x27ae60,
                    fields: [
                        { name: 'Evento', value: eventTitle },
                        { name: 'Username', value: user.username },
                        { name: 'Event ID', value: eventId }
                    ]
                }]
            })
        });
    } catch (err) {
        console.log('⚠️ Webhook partecipazione fallito');
    }
    
    showCustomAlert('success', '🎉 Iscritto!', 
        `Parteciperai a "${eventTitle}"!\n\nControlla i DM Discord!`);
}

function showEventDetails(eventId) {
    const events = JSON.parse(localStorage.getItem('pinnedEvents') || '[]');
    const event = events.find(e => e.id === eventId);
    if (!event) return;
    
    const eventDate = new Date(event.date);
    const formattedDate = eventDate.toLocaleString('it-IT', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const modalBody = `
        <img src="${event.image || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&h=300&fit=crop'}" style="width:100%;border-radius:10px;margin-bottom:20px;">
        <h2>🎉 ${event.title}</h2>
        <p style="line-height:1.8;color:#555;">${event.description}</p>
        <hr>
        <h3>📋 Dettagli Evento</h3>
        <p><strong>📅 Quando:</strong> ${formattedDate}</p>
        <p><strong>📍 Dove:</strong> ${event.location || 'Server Roblox - Comune di Piacenza RP'}</p>
        <p><strong>👤 Organizzatore:</strong> ${event.author || 'Staff'}</p>
        ${event.program ? `<p><strong>🎯 Programma:</strong><br>${event.program.replace(/\n/g, '<br>')}</p>` : ''}
        <hr>
        <button onclick="participateEvent('${event.id}', '${event.title.replace(/'/g, "\\'")}')" class="btn-participate" style="width:100%;padding:15px;font-size:16px;">
            🎉 Partecipa all'Evento
        </button>
    `;
    
    document.getElementById('detailsModalBody').innerHTML = modalBody;
    document.getElementById('detailsModal').classList.add('show');
}

function showGuideDetails(guideId) {
    const guides = JSON.parse(localStorage.getItem('pinnedGuides') || '[]');
    const guide = guides.find(g => g.id === guideId);
    if (!guide) return;
    
    const modalBody = `
        <h2>📚 ${guide.title}</h2>
        <div style="text-align:left;line-height:1.8;color:#555;margin:20px 0;">
            ${guide.description}
        </div>
        <hr>
        <p style="font-size:14px;color:#999;">
            <strong>👤 Autore:</strong> ${guide.author || 'Staff'}<br>
            <strong>📅 Pubblicata:</strong> ${new Date(guide.createdAt).toLocaleDateString('it-IT')}
        </p>
    `;
    
    document.getElementById('detailsModalBody').innerHTML = modalBody;
    document.getElementById('detailsModal').classList.add('show');
}

function closeDetailsModal() {
    document.getElementById('detailsModal').classList.remove('show');
}

// ==================== FUNZIONI MANUALI DI TEST ====================

function addEventManually() {
    const events = JSON.parse(localStorage.getItem('pinnedEvents') || '[]');
    
    const newEvent = {
        id: Date.now().toString(),
        title: 'Grande Festa di Natale 🎄',
        description: 'Vieni a festeggiare il Natale con noi! Premi esclusivi, minigiochi e tanto divertimento!',
        date: '2026-12-25T18:00:00',
        location: 'Server Roblox - Comune di Piacenza RP',
        author: 'Ninja',
        image: 'https://images.unsplash.com/photo-1512389142860-9c449e58a543?w=400',
        program: '18:00 - Inizio\n19:00 - Minigiochi\n20:00 - Premiazioni',
        createdAt: new Date().toISOString()
    };
    
    events.unshift(newEvent);
    localStorage.setItem('pinnedEvents', JSON.stringify(events));
    loadEventsOnSite();
    
    showCustomAlert('success', 'Evento Aggiunto!', 'Evento di test creato!');
}

function addGuideManually() {
    const guides = JSON.parse(localStorage.getItem('pinnedGuides') || '[]');
    
    const newGuide = {
        id: Date.now().toString(),
        title: 'Come Iniziare a Giocare',
        description: `
            <h3>🎮 Benvenuto!</h3>
            <p>Questa guida ti aiuterà a iniziare.</p>
            <h4>1️⃣ Crea personaggio</h4>
            <p>Scegli nome e aspetto.</p>
            <h4>2️⃣ Scegli fazione</h4>
            <p>Unisciti a Polizia, Medici o Vigili del Fuoco.</p>
            <h4>3️⃣ Leggi regolamento</h4>
            <p>Fondamentale per evitare sanzioni!</p>
        `,
        author: 'Staff',
        createdAt: new Date().toISOString()
    };
    
    guides.unshift(newGuide);
    localStorage.setItem('pinnedGuides', JSON.stringify(guides));
    loadGuidesOnSite();
    
    showCustomAlert('success', 'Guida Aggiunta!', 'Guida di test creata!');
}

console.log('✅ home.js caricato correttamente!');
console.log('💡 Per testare: addEventManually() o addGuideManually() nella console');
console.log('💡 Per testare: addEventManually() o addGuideManually() nella console');