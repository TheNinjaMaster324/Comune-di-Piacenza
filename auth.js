// Variabili globali
let currentAuthForm = 'login';
let authCodeRequested = false;

// Controllo se l'utente è già loggato
window.addEventListener('DOMContentLoaded', () => {
    const savedUser = localStorage.getItem('piacenzaRP_user');
    
    if (savedUser) {
        // Se l'utente è già loggato, reindirizza alla home
        window.location.href = 'home.html';
    }
    
    initializeEventListeners();
});

// Inizializza tutti gli event listeners
function initializeEventListeners() {
    // Toggle tra login/registrazione/admin
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const formType = btn.getAttribute('data-form');
            switchAuthForm(formType);
        });
    });

    // Form di login
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // Form di registrazione
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    
    // Form admin
    document.getElementById('adminForm').addEventListener('submit', handleAdminLogin);
}

// Cambia form di autenticazione
function switchAuthForm(formType) {
    currentAuthForm = formType;
    authCodeRequested = false;
    
    // Aggiorna bottoni toggle
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-form="${formType}"]`).classList.add('active');
    
    // Mostra form corretto
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.remove('active');
    });
    document.getElementById(`${formType}Form`).classList.add('active');
    
    // Nascondi campi auth code
    hideAllAuthCodeFields();
}

// Nascondi tutti i campi codice autenticazione
function hideAllAuthCodeFields() {
    document.querySelectorAll('[id$="AuthCode"]').forEach(field => {
        field.classList.add('hidden');
    });
}

// Gestione Login
function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const authCode = document.getElementById('loginCode').value;
    
    if (!authCodeRequested) {
        // Prima richiesta - mostra campo codice
        document.getElementById('loginAuthCode').classList.remove('hidden');
        authCodeRequested = true;
        showNotification('Codice di autenticazione inviato alla tua email!', 'success');
    } else {
        // Verifica codice (simulato)
        if (authCode.length === 6) {
            const userData = {
                username: email.split('@')[0],
                email: email,
                isAdmin: false
            };
            
            // Salva l'utente
            localStorage.setItem('piacenzaRP_user', JSON.stringify(userData));
            
            showNotification('Login effettuato con successo!', 'success');
            
            // Reindirizza alla home dopo 1 secondo
            setTimeout(() => {
                window.location.href = 'home.html';
            }, 1000);
        } else {
            showNotification('Inserisci un codice valido di 6 cifre', 'error');
        }
    }
}

// Gestione Registrazione
function handleRegister(e) {
    e.preventDefault();
    
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const authCode = document.getElementById('registerCode').value;
    
    if (!authCodeRequested) {
        // Prima richiesta - mostra campo codice
        document.getElementById('registerAuthCode').classList.remove('hidden');
        authCodeRequested = true;
        showNotification('Codice di autenticazione inviato alla tua email!', 'success');
    } else {
        // Verifica codice (simulato)
        if (authCode.length === 6) {
            const userData = {
                username: username,
                email: email,
                isAdmin: false
            };
            
            // Salva l'utente
            localStorage.setItem('piacenzaRP_user', JSON.stringify(userData));
            
            showNotification('Registrazione completata con successo!', 'success');
            
            // Reindirizza alla home dopo 1 secondo
            setTimeout(() => {
                window.location.href = 'home.html';
            }, 1000);
        } else {
            showNotification('Inserisci un codice valido di 6 cifre', 'error');
        }
    }
}

// Gestione Login Admin
function handleAdminLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('adminUsername').value;
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;
    const authCode = document.getElementById('adminCode').value;
    
    // Verifica credenziali admin (esempio)
    const validAdminEmail = 'admin@piacenzarp.it';
    const validAdminPassword = 'admin123';
    
    if (email !== validAdminEmail || password !== validAdminPassword) {
        showNotification('Credenziali amministratore non valide!', 'error');
        return;
    }
    
    if (!authCodeRequested) {
        // Prima richiesta - mostra campo codice
        document.getElementById('adminAuthCode').classList.remove('hidden');
        authCodeRequested = true;
        showNotification('Codice di autenticazione amministratore inviato!', 'success');
    } else {
        // Verifica codice (simulato)
        if (authCode.length === 6) {
            const userData = {
                username: username,
                email: email,
                isAdmin: true
            };
            
            // Salva l'utente admin
            localStorage.setItem('piacenzaRP_user', JSON.stringify(userData));
            
            showNotification('Accesso amministratore effettuato!', 'success');
            
            // Reindirizza alla home dopo 1 secondo
            setTimeout(() => {
                window.location.href = 'home.html';
            }, 1000);
        } else {
            showNotification('Inserisci un codice valido di 6 cifre', 'error');
        }
    }
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