// VERIFICA LOGIN ALL'AVVIO
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

// ==================== FINE CUSTOM ALERT ====================

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
        
        // Se è admin, mostra la sezione staff
        if (userData.isAdmin) {
            const staffSection = document.getElementById('staff');
            if (staffSection) {
                staffSection.style.display = 'block';
            }
            updateAdminStats();
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

// LOGOUT CORRETTO - FIX PRINCIPALE
function logout() {
    if (confirm('Sei sicuro di voler uscire?')) {
        console.log('👋 Logout in corso...');
        
        // Cancella TUTTI i dati di sessione
        sessionStorage.clear();
        
        // Cancella cookie auto-login
        localStorage.removeItem('piacenza_auto_login');
        
        // Reindirizza a index.html (NON home.html!)
        window.location.href = 'index.html';
    }
}

// Toggle menu mobile
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

// Controlla accesso sezione staff
function checkStaffAccess(event) {
    const userData = JSON.parse(sessionStorage.getItem('currentUser'));
    
    if (!userData || !userData.isAdmin) {
        event.preventDefault();
        showAccessDeniedModal();
        return false;
    }
}

// Mostra modal accesso negato
function showAccessDeniedModal() {
    document.getElementById('accessDeniedModal').style.display = 'flex';
}

// Chiudi modal accesso negato
function closeAccessModal() {
    document.getElementById('accessDeniedModal').style.display = 'none';
}

// Aggiorna statistiche admin
function updateAdminStats() {
    const users = JSON.parse(localStorage.getItem('piacenzaUsers') || '[]');
    const totalUsersElement = document.getElementById('totalUsers');
    
    if (totalUsersElement) {
        totalUsersElement.textContent = users.length;
    }
}

// Smooth scroll per i link interni
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        
        // Ignora i link che non sono per scroll
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
            
            // Chiudi il menu mobile se aperto
            const navMenu = document.getElementById('navMenu');
            navMenu.classList.remove('active');
        }
    });
});

// Gestione form contatti
// ==================== GESTIONE FORM CONTATTI → DISCORD WEBHOOK ====================
document.getElementById('contactForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const name = document.getElementById('contactName').value.trim();
    const email = document.getElementById('contactEmail').value.trim();
    const message = document.getElementById('contactMessage').value.trim();
    
    // Validazione
    if (!name || !email || !message) {
        alert('⚠️ Compila tutti i campi!');
        return;
    }
    
    // Webhook Discord
    const webhookUrl = 'https://discord.com/api/webhooks/1464363269593497663/n8ZgJ96CoxaXoZ-ujq2yYo-ml2xkXO5h9dGx9K2onmkG3NTVDUopGwgWaVE_3bWkbiNy';
    
    // Embed per Discord
    const embed = {
        title: '📧 Nuovo Messaggio di Contatto',
        description: 'Un utente ha inviato un messaggio dal sito',
        color: 0x667eea,
        fields: [
            {
                name: '👤 Nome',
                value: name,
                inline: true
            },
            {
                name: '📧 Email',
                value: email,
                inline: true
            },
            {
                name: '\u200B',
                value: '\u200B',
                inline: false
            },
            {
                name: '💬 Messaggio',
                value: message.length > 1024 ? message.substring(0, 1021) + '...' : message,
                inline: false
            }
        ],
        footer: {
            text: 'Comune di Piacenza RP'
        },
        timestamp: new Date().toISOString()
    };
    
    try {
        console.log('📤 Invio messaggio al webhook Discord...');
        
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: 'Contatti - Piacenza RP',
                avatar_url: 'https://via.placeholder.com/100',
                embeds: [embed]
            })
        });
        
        if (response.ok) {
            console.log('✅ Messaggio inviato con successo al webhook!');
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

// Mappa nomi semplici → nomi completi
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
    window.location.href = `candidatura-form.html?faction=${encodeURIComponent(fullFactionName)}`;
}

function sendApplicationWebhook(webhookUrl, faction, data) {
    fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: 'Comune di Piacenza RP - Candidature',
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

function selectCivilian() {
    const user = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    
    if (!user.username) {
        alert('⚠️ Devi essere loggato!');
        return;
    }
    
    alert(`✅ Benvenuto come Civile!\n\nPuoi iniziare subito a giocare.\nEntra nel server Roblox e divertiti!`);
    
    console.log('👤 Utente diventato civile:', user.username);
}

// Navbar scroll effect
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

// Animazione cards quando entrano nella viewport
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

// Osserva tutte le card
document.querySelectorAll('.card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(card);
});

// Gestione bottoni admin
document.querySelectorAll('.admin-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const toolName = this.parentElement.querySelector('h4').textContent;
        alert(`Funzionalità "${toolName}" in sviluppo!\n\nQuesta funzionalità sarà disponibile presto.`);
    });
});

console.log('✅ home.js caricato correttamente!');