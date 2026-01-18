// Variabili globali
let currentTab = 'login';
let userData = {};
let generatedCode = '';

// Controlla se l'utente è già loggato
window.addEventListener('load', function() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    if (isLoggedIn === 'true') {
        window.location.href = 'home.html';
    }
});

// Genera codice casuale a 6 cifre
function generateAuthCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Funzione per inviare email con EmailJS (servizio gratuito)
async function sendAuthEmail(email, code, username) {
    console.log(`📧 Invio email a: ${email}`);
    console.log(`🔑 Codice di autenticazione: ${code}`);
    console.log(`👤 Username: ${username}`);
    
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log('✅ Email inviata con successo (simulata)');
            resolve(true);
        }, 1000);
    });
}

// Gestione tabs
function showTab(tab) {
    currentTab = tab;
    
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.form-container').forEach(f => f.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(tab + 'Form').classList.add('active');
}

// Gestione form Login
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!username || !password) {
        alert('⚠️ Compila tutti i campi!');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    
    if (users.length === 0) {
        alert('⚠️ Nessun utente registrato!\n\nNon ci sono account nel sistema.\nEffettua prima la registrazione per creare un account.');
        return;
    }
    
    const userExists = users.find(u => 
        u.username.toLowerCase() === username.toLowerCase() && 
        u.password === password
    );
    
    if (!userExists) {
        const usernameExists = users.find(u => u.username.toLowerCase() === username.toLowerCase());
        
        if (usernameExists) {
            alert('⚠️ Password errata!\n\nLa password inserita non è corretta per questo utente.');
        } else {
            alert('⚠️ Utente non registrato!\n\nQuesto nome utente non esiste nel sistema.\nEffettua prima la registrazione per creare un account.');
        }
        return;
    }
    
    generatedCode = generateAuthCode();
    
    userData = {
        username: userExists.username,
        email: userExists.email,
        isAdmin: false,
        type: 'login'
    };
    
    sendAuthEmail(userExists.email, generatedCode, userExists.username);
    showAuthModal();
});

// Gestione form Registrazione
document.getElementById('registerForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('regUsername').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regPasswordConfirm').value;
    
    if (!username || !email || !password || !confirmPassword) {
        alert('⚠️ Compila tutti i campi!');
        return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('⚠️ Inserisci un\'email valida!');
        return;
    }
    
    if (password.length < 6) {
        alert('⚠️ La password deve contenere almeno 6 caratteri!');
        return;
    }
    
    if (password !== confirmPassword) {
        alert('⚠️ Le password non coincidono!');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    const userExists = users.find(u => 
        u.username.toLowerCase() === username.toLowerCase() || 
        u.email.toLowerCase() === email.toLowerCase()
    );
    
    if (userExists) {
        alert('⚠️ Utente già registrato!\n\nQuesto nome utente o email è già in uso.\nProva con credenziali diverse o effettua il login.');
        return;
    }
    
    generatedCode = generateAuthCode();
    
    userData = {
        username: username,
        email: email,
        password: password,
        isAdmin: false,
        type: 'register',
        registeredAt: new Date().toISOString()
    };
    
    sendAuthEmail(email, generatedCode, username);
    showAuthModal();
});

// Gestione form Amministratore
document.getElementById('adminForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('adminUsername').value.trim();
    const email = document.getElementById('adminEmail').value.trim();
    const password = document.getElementById('adminPassword').value;
    
    if (!username || !email || !password) {
        alert('⚠️ Compila tutti i campi!');
        return;
    }
    
    const validAdminEmails = [
        'admin@piacenzarp.it',
        'amministratore@piacenzarp.it',
        'staff@piacenzarp.it'
    ];
    
    if (!validAdminEmails.includes(email.toLowerCase())) {
        alert('⚠️ Email amministratore non valida!\n\nSolo gli amministratori autorizzati possono accedere.\nEmail consentite:\n- admin@piacenzarp.it\n- amministratore@piacenzarp.it\n- staff@piacenzarp.it');
        return;
    }
    
    if (password !== 'admin123') {
        alert('⚠️ Password amministratore non corretta!');
        return;
    }
    
    generatedCode = generateAuthCode();
    
    userData = {
        username: username,
        email: email,
        isAdmin: true,
        type: 'admin'
    };
    
    sendAuthEmail(email, generatedCode, username);
    showAuthModal();
});

// Mostra modal codice autenticazione
function showAuthModal() {
    document.getElementById('authModal').style.display = 'flex';
    document.getElementById('authCode').focus();
    
    console.log('🔐 Codice generato:', generatedCode);
    console.log('📧 Email inviata a:', userData.email);
}

// Chiudi modal codice autenticazione
function closeAuthModal() {
    document.getElementById('authModal').style.display = 'none';
    document.getElementById('authCode').value = '';
    generatedCode = '';
}

// Gestione form codice autenticazione
document.getElementById('authForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const code = document.getElementById('authCode').value.trim();
    
    if (code.length !== 6) {
        alert('⚠️ Il codice deve essere di 6 cifre!');
        return;
    }
    
    if (!/^\d+$/.test(code)) {
        alert('⚠️ Il codice deve contenere solo numeri!');
        return;
    }
    
    if (code !== generatedCode) {
        alert('❌ Codice non valido!\n\nIl codice inserito non corrisponde a quello inviato via email.\nControlla la tua casella di posta e riprova.');
        document.getElementById('authCode').value = '';
        document.getElementById('authCode').focus();
        return;
    }
    
    if (userData.type === 'register') {
        const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
        users.push({
            username: userData.username,
            email: userData.email,
            password: userData.password,
            registeredAt: userData.registeredAt
        });
        localStorage.setItem('registeredUsers', JSON.stringify(users));
    }
    
    const userSession = {
        username: userData.username,
        email: userData.email,
        isAdmin: userData.isAdmin,
        loginTime: new Date().toISOString()
    };
    
    sessionStorage.setItem('currentUser', JSON.stringify(userSession));
    sessionStorage.setItem('isLoggedIn', 'true');
    
    let successMessage = '';
    if (userData.type === 'register') {
        successMessage = '✅ Registrazione completata con successo!\n\nBenvenuto, ' + userData.username + '!';
    } else if (userData.type === 'admin') {
        successMessage = '✅ Accesso amministratore effettuato!\n\nBenvenuto, ' + userData.username + '!';
    } else {
        successMessage = '✅ Login effettuato con successo!\n\nBenvenuto, ' + userData.username + '!';
    }
    
    alert(successMessage);
    
    setTimeout(() => {
        window.location.href = 'home.html';
    }, 500);
});

// Permetti solo numeri nel campo codice
document.getElementById('authCode').addEventListener('input', function(e) {
    this.value = this.value.replace(/[^0-9]/g, '');
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

// Funzioni debug
function showRegisteredUsers() {
    const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    console.log('👥 Utenti registrati:', users);
    console.log('📊 Totale utenti:', users.length);
    return users;
}

function resetAllData() {
    if (confirm('⚠️ ATTENZIONE!\n\nQuesto cancellerà tutti i dati.\nSei sicuro?')) {
        localStorage.clear();
        sessionStorage.clear();
        alert('✅ Tutti i dati sono stati cancellati!');
        location.reload();
    }
}

function showLastCode() {
    console.log('🔑 Ultimo codice generato:', generatedCode);
    return generatedCode;
}

console.log('🔐 Sistema di autenticazione caricato!');
console.log('📝 Funzioni debug disponibili:');
console.log('  - showRegisteredUsers() : Mostra tutti gli utenti registrati');
console.log('  - resetAllData() : Cancella tutti i dati salvati');
console.log('  - showLastCode() : Mostra ultimo codice 2FA generato');
console.log('🔑 Password admin: admin123');
console.log('📧 Il codice viene mostrato nella console per test');