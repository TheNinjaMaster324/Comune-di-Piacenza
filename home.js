// Controllo se l'utente è loggato
window.addEventListener('DOMContentLoaded', () => {
    const savedUser = localStorage.getItem('piacenzaRP_user');
    
    if (!savedUser) {
        // Se l'utente NON è loggato, reindirizza al login
        window.location.href = 'index.html';
        return;
    }
    
    // Carica i dati utente
    const userData = JSON.parse(savedUser);
    loadUserData(userData);
    
    // Inizializza event listeners
    initializeEventListeners();
});

// Carica i dati utente nella pagina
function loadUserData(userData) {
    // Mostra il nome utente nell'header
    const usernameDisplay = document.getElementById('usernameDisplay');
    usernameDisplay.textContent = userData.username;
    
    // Se è admin, aggiungi badge
    if (userData.isAdmin) {
        usernameDisplay.textContent += ' (Admin)';
        usernameDisplay.style.color = '#e74c3c';
    }
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
        showNotification('Logout effettuato', 'success');
        
        // Reindirizza al login dopo 1 secondo
        setTimeout(() => {
            window.location.href = 'index.html';
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