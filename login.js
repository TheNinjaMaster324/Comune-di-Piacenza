// Variabili globali
let currentTab = 'login';
let userData = {};

// Controlla se l'utente è già loggato
window.addEventListener('load', function() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    if (isLoggedIn === 'true') {
        window.location.href = 'home.html';
    }
});

// Gestione tabs
function showTab(tab) {
    currentTab = tab;
    
    // Rimuovi classe active da tutti i tab e form
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.form-container').forEach(f => f.classList.remove('active'));
    
    // Aggiungi classe active al tab selezionato
    event.target.classList.add('active');
    document.getElementById(tab + 'Form').classList.add('active');
}

// Gestione form Login
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    // Validazione
    if (!username || !password) {
        alert('⚠️ Compila tutti i campi!');
        return;
    }
    
    // Verifica se l'utente esiste
    const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    const userExists = users.find(u => u.username === username && u.password === password);
    
    if (!userExists) {
        alert('⚠️ Credenziali non valide!\n\nNome utente o password errati.');
        return;
    }
    
    // Salva dati utente per il codice di autenticazione
    userData = {
        username: username,
        email: userExists.email,
        isAdmin: false,
        type: 'login'
    };
    
    showAuthModal();
});

// Gestione form Registrazione
document.getElementById('registerForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('regUsername').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regPasswordConfirm').value;
    
    // Validazione campi vuoti
    if (!username || !email || !password || !confirmPassword) {
        alert('⚠️ Compila tutti i campi!');
        return;
    }
    
    // Validazione email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('⚠️ Inserisci un\'email valida!');
        return;
    }
    
    // Validazione password
    if (password.length < 6) {
        alert('⚠️ La password deve contenere almeno 6 caratteri!');
        return;
    }
    
    if (password !== confirmPassword) {
        alert('⚠️ Le password non coincidono!');
        return;
    }
    
    // Verifica se l'utente esiste già
    const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    const userExists = users.find(u => u.username === username || u.email === email);
    
    if (userExists) {
        alert('⚠️ Utente già registrato!\n\nNome utente o email già in uso.');
        return;
    }
    
    // Salva dati utente
    userData = {
        username: username,
        email: email,
        password: password,
        isAdmin: false,
        type: 'register',
        registeredAt: new Date().toISOString()
    };
    
    // Salva nel localStorage
    users.push(userData);
    localStorage.setItem('registeredUsers', JSON.stringify(users));
    
    showAuthModal();
});

// Gestione form Amministratore
document.getElementById('adminForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('adminUsername').value.trim();
    const email = document.getElementById('adminEmail').value.trim();
    const password = document.getElementById('adminPassword').value;
    
    // Validazione campi vuoti
    if (!username || !email || !password) {
        alert('⚠️ Compila tutti i campi!');
        return;
    }
    
    // Verifica email amministratore specifica
    const validAdminEmails = [
        'admin@piacenzarp.it',
        'amministratore@piacenzarp.it',
        'staff@piacenzarp.it'
    ];
    
    if (!validAdminEmails.includes(email.toLowerCase())) {
        alert('⚠️ Email amministratore non valida!\n\nSolo gli amministratori autorizzati possono accedere.\nEmail consentite:\n- admin@piacenzarp.it\n- amministratore@piacenzarp.it\n- staff@piacenzarp.it');
        return;
    }
    
    // Verifica password admin (esempio: password deve essere "admin123")
    if (password !== 'admin123') {
        alert('⚠️ Password amministratore non corretta!');
        return;
    }
    
    // Salva dati admin
    userData = {
        username: username,
        email: email,
        isAdmin: true,
        type: 'admin'
    };
    
    showAuthModal();
});

// Mostra modal codice autenticazione
function showAuthModal() {
    document.getElementById('authModal').style.display = 'flex';
    document.getElementById('authCode').focus();
    
    // Simula invio email (in produzione qui invieresti una vera email)
    console.log('📧 Codice di autenticazione inviato a:', userData.email);
}

// Chiudi modal codice autenticazione
function closeAuthModal() {
    document.getElementById('authModal').style.display = 'none';
    document.getElementById('authCode').value = '';
}

// Gestione form codice autenticazione
document.getElementById('authForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const code = document.getElementById('authCode').value.trim();
    
    // Validazione codice
    if (code.length !== 6) {
        alert('⚠️ Il codice deve essere di 6 cifre!');
        return;
    }
    
    if (!/^\d+$/.test(code)) {
        alert('⚠️ Il codice deve contenere solo numeri!');
        return;
    }
    
    // Simula verifica codice (in produzione verificheresti con il server)
    // Per questo esempio, accettiamo qualsiasi codice a 6 cifre
    
    // Salva i dati di sessione
    const userSession = {
        username: userData.username,
        email: userData.email,
        isAdmin: userData.isAdmin,
        loginTime: new Date().toISOString()
    };
    
    sessionStorage.setItem('currentUser', JSON.stringify(userSession));
    sessionStorage.setItem('isLoggedIn', 'true');
    
    // Messaggio di successo
    if (userData.type === 'register') {
        alert('✅ Registrazione completata con successo!\n\nBenvenuto, ' + userData.username + '!');
    } else if (userData.type === 'admin') {
        alert('✅ Accesso amministratore effettuato!\n\nBenvenuto, ' + userData.username + '!');
    } else {
        alert('✅ Login effettuato con successo!\n\nBenvenuto, ' + userData.username + '!');
    }
    
    // Reindirizza alla home
    setTimeout(() => {
        window.location.href = 'home.html';
    }, 500);
});

// Permetti solo numeri nel campo codice
document.getElementById('authCode').addEventListener('input', function(e) {
    this.value = this.value.replace(/[^0-9]/g, '');
    
    // Auto-submit quando il codice è completo
    if (this.value.length === 6) {
        // Piccolo delay per migliore UX
        setTimeout(() => {
            document.getElementById('authForm').dispatchEvent(new Event('submit'));
        }, 300);
    }
});

// Chiudi modal con ESC
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const modal = document.getElementById('authModal');
        if (modal.style.display === 'flex') {
            closeAuthModal();
        }
    }
});

// Chiudi modal cliccando fuori
document.getElementById('authModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeAuthModal();
    }
});

// Previeni invio form con Enter nei campi password
document.querySelectorAll('input[type="password"]').forEach(input => {
    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            this.form.dispatchEvent(new Event('submit'));
        }
    });
});

// Debug: Mostra utenti registrati (solo per sviluppo)
function showRegisteredUsers() {
    const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    console.log('👥 Utenti registrati:', users);
    console.log('📊 Totale utenti:', users.length);
}

// Debug: Reset dati (solo per sviluppo)
function resetAllData() {
    if (confirm('⚠️ ATTENZIONE!\n\nQuesto cancellerà tutti i dati.\nSei sicuro?')) {
        localStorage.clear();
        sessionStorage.clear();
        alert('✅ Tutti i dati sono stati cancellati!');
        location.reload();
    }
}

// Funzioni di utilità disponibili nella console del browser:
// - showRegisteredUsers() : Mostra tutti gli utenti registrati
// - resetAllData() : Cancella tutti i dati salvati

console.log('🔐 Sistema di autenticazione caricato!');
console.log('📝 Funzioni disponibili: showRegisteredUsers(), resetAllData()');
console.log('🔑 Password admin di default: admin123');