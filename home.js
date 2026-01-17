// Tempo di scadenza sessione: 5 ore (in millisecondi)
const SESSION_DURATION = 5 * 60 * 60 * 1000; // 5 ore

// Controllo se l'utente è loggato
window.addEventListener('DOMContentLoaded', () => {
    const savedUser = localStorage.getItem('piacenzaRP_user');
    const loginTime = localStorage.getItem('piacenzaRP_loginTime');
    
    // Verifica se l'utente è loggato
    if (!savedUser || !loginTime) {
        // Nessun utente loggato, reindirizza al login
        window.location.href = 'Login.html';
        return;
    }
    
    // Verifica se la sessione è scaduta (5 ore)
    const currentTime = new Date().getTime();
    const elapsedTime = currentTime - parseInt(loginTime);
    
    if (elapsedTime > SESSION_DURATION) {
        // Sessione scaduta, logout automatico
        localStorage.removeItem('piacenzaRP_user');
        localStorage.removeItem('piacenzaRP_loginTime');
        showNotification('Sessione scaduta. Effettua nuovamente il login.', 'error');
        setTimeout(() => {
            window.location.href = 'Login.html';
        }, 2000);
        return;
    }
    
    // Carica i dati utente
    const userData = JSON.parse(savedUser);
    loadUserData(userData);
    
    // Inizializza event listeners
    initializeEventListeners();
    
    // Mostra tempo rimanente sessione (opzionale - per debug)
    const remainingTime = SESSION_DURATION - elapsedTime;
    const remainingHours = Math.floor(remainingTime / (60 * 60 * 1000));
    const remainingMinutes = Math.floor((remainingTime % (60 * 60 * 1000)) / (60 * 1000));
    console.log(`Sessione valida per ancora ${remainingHours}h ${remainingMinutes}m`);
});

// Carica i dati utente nella pagina
function loadUserData(userData) {
    // Mostra il nome utente nell'header
    const usernameDisplay = document.getElementById('usernameDisplay');
    const userTypeIndicator = document.getElementById('userTypeIndicator');
    const homeUserType = document.getElementById('homeUserType');
    const homeUserTypeIndicator = document.getElementById('homeUserTypeIndicator');
    
    // Se è admin, aggiungi badge e mostra contenuti admin
    if (userData.isAdmin) {
        usernameDisplay.textContent = userData.username + ' (Admin)';
        usernameDisplay.style.color = '#e74c3c';
        usernameDisplay.style.fontWeight = 'bold';
        
        // Aggiorna indicatore nella Home
        if (homeUserType && homeUserTypeIndicator) {
            homeUserType.innerHTML = '👑 <strong>AMMINISTRATORE</strong> - Hai accesso alla Sezione Staff';
            homeUserTypeIndicator.style.background = '#28a745';
        }
        
        // Aggiorna indicatore tipo utente nella sezione staff
        if (userTypeIndicator) {
            userTypeIndicator.innerHTML = '👑 <strong>AMMINISTRATORE</strong> - Accesso Completo Garantito';
            userTypeIndicator.parentElement.style.background = '#28a745';
        }
        
        // Mostra il link "Sezione Staff" nella navbar
        const staffNavItem = document.getElementById('staffNavItem');
        if (staffNavItem) {
            staffNavItem.style.display = 'list-item';
            console.log('✅ Link Sezione Staff mostrato');
        } else {
            console.error('❌ Elemento staffNavItem non trovato!');
        }
        
        // Mostra contenuto admin nella sezione staff
        const staffUserContent = document.getElementById('staffUserContent');
        const staffAdminContent = document.getElementById('staffAdminContent');
        if (staffUserContent) staffUserContent.style.display = 'none';
        if (staffAdminContent) staffAdminContent.style.display = 'block';
        
        console.log('👑 Accesso ADMIN - Pannello staff visibile');
    } else {
        usernameDisplay.textContent = userData.username;
        
        // Aggiorna indicatore nella Home
        if (homeUserType && homeUserTypeIndicator) {
            homeUserType.innerHTML = '👤 <strong>UTENTE NORMALE</strong> - NON hai accesso alla Sezione Staff';
            homeUserTypeIndicator.style.background = '#dc3545';
        }
        
        // Aggiorna indicatore tipo utente nella sezione staff
        if (userTypeIndicator) {
            userTypeIndicator.innerHTML = '👤 <strong>UTENTE NORMALE</strong> - Accesso Staff Negato';
            userTypeIndicator.parentElement.style.background = '#dc3545';
        }
        
        // Nascondi il link "Sezione Staff" per utenti normali
        const staffNavItem = document.getElementById('staffNavItem');
        if (staffNavItem) {
            staffNavItem.style.display = 'none';
            console.log('✅ Link Sezione Staff nascosto per utente normale');
        }
        
        // Mostra messaggio "Accesso Negato" nella sezione staff
        const staffUserContent = document.getElementById('staffUserContent');
        const staffAdminContent = document.getElementById('staffAdminContent');
        if (staffUserContent) staffUserContent.style.display = 'block';
        if (staffAdminContent) staffAdminContent.style.display = 'none';
        
        console.log('👤 Accesso UTENTE - Sezione staff nascosta');
    }
}
    // Se è admin, aggiungi badge e mostra contenuti admin
    if (userData.isAdmin) {
        usernameDisplay.textContent = userData.username + ' (Admin)';
        usernameDisplay.style.color = '#e74c3c';
        usernameDisplay.style.fontWeight = 'bold';
        
        // Mostra il link "Sezione Staff" nella navbar
        document.getElementById('staffNavItem').style.display = 'block';
        
        // Mostra contenuto admin nella sezione staff
        document.getElementById('staffUserContent').style.display = 'none';
        document.getElementById('staffAdminContent').style.display = 'block';
        
        console.log('👑 Accesso ADMIN - Pannello staff visibile');
    } else {
        usernameDisplay.textContent = userData.username;
        
        // Nascondi il link "Sezione Staff" per utenti normali
        document.getElementById('staffNavItem').style.display = 'none';
        
        // Mostra messaggio "Accesso Negato" nella sezione staff
        document.getElementById('staffUserContent').style.display = 'block';
        document.getElementById('staffAdminContent').style.display = 'none';
        
        console.log('👤 Accesso UTENTE - Sezione staff nascosta');
    }
// Inizializza tutti gli event listeners
function initializeEventListeners() {
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // Menu mobile
    document.getElementById('mobileMenuBtn').addEventListener('click', toggleMobileMenu);
    
    // Navigazione
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', handleNavigation);
    });
    
    // Form contatti
    document.getElementById('contactForm').addEventListener('submit', handleContactForm);
}

// Gestione Logout
function handleLogout() {
    if (confirm('Sei sicuro di voler uscire?')) {
        localStorage.removeItem('piacenzaRP_user');
        localStorage.removeItem('piacenzaRP_loginTime');
        showNotification('Logout effettuato', 'success');
        
        // Reindirizza al login dopo 1 secondo
        setTimeout(() => {
            window.location.href = 'Login.html';
        }, 1000);
    }
}

// Toggle menu mobile
function toggleMobileMenu() {
    const navMenu = document.getElementById('navMenu');
    navMenu.classList.toggle('active');
}

// Gestione navigazione
function handleNavigation(e) {
    const href = e.target.getAttribute('href');
    
    // Se è un link esterno, lascia che si apra normalmente
    if (href && href.startsWith('http')) {
        return;
    }
    
    // Se non è un link con #, esci
    if (!href || !href.startsWith('#')) {
        return;
    }
    
    e.preventDefault();
    
    // Chiudi menu mobile se aperto
    document.getElementById('navMenu').classList.remove('active');
    
    // Rimuovi active da tutti i link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Aggiungi active al link cliccato
    e.target.classList.add('active');
    
    // Mostra sezione corrispondente
    const sectionId = href.replace('#', '');
    showSection(sectionId);
}

// Mostra sezione specifica
function showSection(sectionId) {
    // Nascondi tutte le sezioni
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Mostra la sezione richiesta
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        
        // Scroll smooth alla sezione
        targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Gestione form contatti
function handleContactForm(e) {
    e.preventDefault();
    
    const name = document.getElementById('contactName').value;
    const email = document.getElementById('contactEmail').value;
    const message = document.getElementById('contactMessage').value;
    
    // Simulazione invio (qui dovresti implementare l'invio reale)
    console.log('Form contatti inviato:', { name, email, message });
    
    showNotification('Messaggio inviato con successo! Ti risponderemo al più presto.', 'success');
    
    // Reset form
    document.getElementById('contactForm').reset();
}

// Sistema di notifiche
function showNotification(message, type = 'info') {
    // Rimuovi notifica precedente se esiste
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Crea notifica
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Aggiungi stili inline
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
        color: white;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        animation: slideIn 0.3s ease;
        font-weight: 600;
    `;
    
    document.body.appendChild(notification);
    
    // Rimuovi dopo 3 secondi
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Aggiungi animazioni CSS per le notifiche
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);