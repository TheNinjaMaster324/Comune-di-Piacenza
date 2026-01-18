// Variabili globali
let currentTab = 'login';
let userData = {};
let generatedCode = ''; // Codice generato per l'autenticazione

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
    // IMPORTANTE: Per usare questa funzione devi:
    // 1. Registrarti su https://www.emailjs.com/
    // 2. Creare un template email
    // 3. Sostituire 'YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', 'YOUR_PUBLIC_KEY'
    
    console.log(`📧 Invio email a: ${email}`);
    console.log(`🔑 Codice di autenticazione: ${code}`);
    console.log(`👤 Username: ${username}`);
    
    // Simulazione invio email (in produzione usa EmailJS o un backend)
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log('✅ Email inviata con successo (simulata)');
            resolve(true);
        }, 1000);
    });
    
    /* CODICE REALE PER EMAILJS (decommentare dopo la configurazione):
    
    try {
        const response = await emailjs.send(
            'YOUR_SERVICE_ID',
            'YOUR_TEMPLATE_ID',
            {
                to_email: email,
                to_name: username,
                auth_code: code,
                message: `Il tuo codice di autenticazione è: ${code}`
            },
            'YOUR_PUBLIC_KEY'
        );
        
        console.log('✅ Email inviata:', response);
        return true;
    } catch (error) {
        console.error('❌ Errore invio email:', error);
        alert('⚠️ Errore nell\'invio dell\'email. Riprova.');
        return false;
    }
    */
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
    
    // VALIDAZIONE: Verifica se l'utente esiste nel database locale
    const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    const userExists = users.find(u => 
        u.username.toLowerCase() === username.toLowerCase() && 
        u.password === password
    );
    
    if (!userExists) {
        alert('⚠️ Credenziali non valide!\n\nUtente non registrato o password errata.\n\nSe non hai un account, registrati prima di effettuare il login.');
        return;
    }
    
    // Genera codice e invia email
    generatedCode = generateAuthCode();
    
    userData = {
        username: userExists.username,
        email: userExists.email,
        isAdmin: false,
        type: 'login'
    };
    
    // Invia email con il codice
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
    
    // Verifica se l'utente esiste già
    const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    const userExists = users.find(u => 
        u.username.toLowerCase() === username.toLowerCase() || 
        u.email.toLowerCase() === email.toLowerCase()
    );
    
    if (userExists) {
        alert('⚠️ Utente già registrato!\n\nQuesto nome utente o email è già in uso.\nProva con credenziali diverse o effettua il login.');
        return;
    }
    
    // Genera codice e invia email
    generatedCode = generateAuthCode();
    
    userData = {
        username: username,
        email: email,
        password: password,
        isAdmin: false,
        type: 'register',
        registeredAt: new Date().toISOString()
    };
    
    // Invia email con il codice
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
    
    // Genera codice e invia email
    generatedCode = generateAuthCode();
    
    userData = {
        username: username,
        email: email,
        isAdmin: true,
        type: 'admin'
    };
    
    // Invia email con il codice
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
    
    // VALIDAZIONE CODICE: Verifica che il codice inserito corrisponda a quello generato
    if (code !== generatedCode) {
        alert('❌ Codice non valido!\n\nIl codice inserito non corrisponde a quello inviato via email.\nControlla la tua casella di posta e riprova.');
        document.getElementById('authCode').value = '';
        document.getElementById('authCode').focus();
        return;
    }
    
    // Codice corretto! Procedi con la registrazione/login
    if (userData.type === 'register') {
        // Salva il nuovo utente nel localStorage
        const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
        users.push({
            username: userData.username,
            email: userData.email,
            password: userData.password,
            registeredAt: userData.registeredAt
        });
        localStorage.setItem('registeredUsers', JSON.stringify(users));
    }
    
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
    let successMessage = '';
    if (userData.type === 'register') {
        successMessage = '✅ Registrazione completata con successo!\n\nBenvenuto, ' + userData.username + '!';
    } else if (userData.type === 'admin') {
        successMessage = '✅ Accesso amministratore effettuato!\n\nBenvenuto, ' + userData.username + '!';
    } else {
        successMessage = '✅ Login effettuato con successo!\n\nBenvenuto, ' + userData.username + '!';
    }
    
    alert(successMessage);
    
    // Reindirizza alla home
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

// Debug: Mostra utenti registrati
function showRegisteredUsers() {
    const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    console.log('👥 Utenti registrati:', users);
    console.log('📊 Totale utenti:', users.length);
    return users;
}

// Debug: Reset dati
function resetAllData() {
    if (confirm('⚠️ ATTENZIONE!\n\nQuesto cancellerà tutti i dati.\nSei sicuro?')) {
        localStorage.clear();
        sessionStorage.clear();
        alert('✅ Tutti i dati sono stati cancellati!');
        location.reload();
    }
}

// Debug: Mostra ultimo codice generato
function showLastCode() {
    console.log('🔑 Ultimo codice generato:', generatedCode);
    return generatedCode;
}

console.log('🔐 Sistema di autenticazione caricato!');
console.log('📝 Funzioni debug disponibili:');
console.log('  - showRegisteredUsers() : Mostra tutti gli utenti registrati');
console.log('  - resetAllData() : Cancella tutti i dati salvati');
console.log('  - showLastCode() : Mostra l\'ultimo codice 2FA generato');
console.log('🔑 Password admin: admin123');
console.log('📧 Il codice viene mostrato nella console per test');// Variabili globali
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