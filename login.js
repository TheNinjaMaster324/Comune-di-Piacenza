// Variabili globali
let generatedCode = '';
let pendingUserData = null;

// Controlla se già loggato
window.addEventListener('load', function() {
    if (sessionStorage.getItem('isLoggedIn') === 'true') {
        window.location.href = 'home.html';
    }
});

// Genera codice random
function generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Cambia tab
function showTab(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.form-container').forEach(f => f.classList.remove('active'));
    event.target.classList.add('active');
    document.getElementById(tab + 'Form').classList.add('active');
}

// ==================== LOGIN ====================
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    
    console.log('🔍 Tentativo login:', username);
    
    // Prendi utenti dal localStorage
    const savedUsers = localStorage.getItem('piacenzaUsers');
    console.log('💾 Dati salvati:', savedUsers);
    
    if (!savedUsers) {
        alert('❌ ERRORE\n\nNessun utente registrato nel sistema!\n\nDevi prima REGISTRARTI prima di fare il login.');
        return;
    }
    
    const users = JSON.parse(savedUsers);
    console.log('👥 Utenti trovati:', users);
    
    // Cerca utente
    const user = users.find(u => u.username === username && u.password === password);
    
    if (!user) {
        // Verifica se esiste username
        const usernameExists = users.find(u => u.username === username);
        if (usernameExists) {
            alert('❌ PASSWORD ERRATA\n\nLa password non è corretta!');
        } else {
            alert('❌ UTENTE NON TROVATO\n\nQuesto username non esiste!\n\nDevi prima REGISTRARTI.');
        }
        return;
    }
    
    // Utente trovato! Genera codice
    console.log('✅ Utente trovato:', user);
    generatedCode = generateCode();
    pendingUserData = {
        username: user.username,
        email: user.email,
        isAdmin: false,
        type: 'login'
    };
    
    console.log('🔑 CODICE GENERATO:', generatedCode);
    alert('📧 Codice inviato!\n\nCodice: ' + generatedCode + '\n\n(In produzione sarebbe inviato via email)');
    
    showAuthModal();
});

// ==================== REGISTRAZIONE ====================
document.getElementById('registerForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('regUsername').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value.trim();
    const confirm = document.getElementById('regPasswordConfirm').value.trim();
    
    console.log('📝 Tentativo registrazione:', username);
    
    // Validazioni
    if (!username || !email || !password || !confirm) {
        alert('❌ Compila tutti i campi!');
        return;
    }
    
    if (password.length < 6) {
        alert('❌ La password deve avere almeno 6 caratteri!');
        return;
    }
    
    if (password !== confirm) {
        alert('❌ Le password non coincidono!');
        return;
    }
    
    // Controlla se esiste già
    const savedUsers = localStorage.getItem('piacenzaUsers');
    let users = savedUsers ? JSON.parse(savedUsers) : [];
    
    const exists = users.find(u => u.username === username || u.email === email);
    if (exists) {
        alert('❌ UTENTE GIÀ ESISTENTE\n\nQuesto username o email è già registrato!\n\nProva con altri dati o fai il LOGIN.');
        return;
    }
    
    // Genera codice
    generatedCode = generateCode();
    pendingUserData = {
        username: username,
        email: email,
        password: password,
        isAdmin: false,
        type: 'register'
    };
    
    console.log('🔑 CODICE GENERATO:', generatedCode);
    alert('📧 Codice inviato!\n\nCodice: ' + generatedCode + '\n\n(In produzione sarebbe inviato via email)');
    
    showAuthModal();
});

// ==================== ADMIN ====================
document.getElementById('adminForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('adminUsername').value.trim();
    const email = document.getElementById('adminEmail').value.trim();
    const password = document.getElementById('adminPassword').value.trim();
    
    const validEmails = ['admin@piacenzarp.it', 'amministratore@piacenzarp.it', 'staff@piacenzarp.it'];
    
    if (!validEmails.includes(email)) {
        alert('❌ EMAIL NON VALIDA\n\nEmail admin consentite:\n- admin@piacenzarp.it\n- amministratore@piacenzarp.it\n- staff@piacenzarp.it');
        return;
    }
    
    if (password !== 'admin123') {
        alert('❌ PASSWORD ADMIN ERRATA');
        return;
    }
    
    generatedCode = generateCode();
    pendingUserData = {
        username: username,
        email: email,
        isAdmin: true,
        type: 'admin'
    };
    
    console.log('🔑 CODICE GENERATO:', generatedCode);
    alert('📧 Codice inviato!\n\nCodice: ' + generatedCode);
    
    showAuthModal();
});

// ==================== MODAL CODICE ====================
function showAuthModal() {
    document.getElementById('authModal').style.display = 'flex';
    document.getElementById('authCode').value = '';
    document.getElementById('authCode').focus();
}

function closeAuthModal() {
    document.getElementById('authModal').style.display = 'none';
    document.getElementById('authCode').value = '';
    generatedCode = '';
    pendingUserData = null;
}

// Verifica codice
document.getElementById('authForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const inputCode = document.getElementById('authCode').value.trim();
    
    console.log('🔍 Codice inserito:', inputCode);
    console.log('🔑 Codice corretto:', generatedCode);
    
    if (inputCode !== generatedCode) {
        alert('❌ CODICE ERRATO!\n\nIl codice inserito non è corretto.\n\nCodice corretto: ' + generatedCode);
        return;
    }
    
    console.log('✅ Codice corretto!');
    
    // Se è registrazione, salva l'utente
    if (pendingUserData.type === 'register') {
        const savedUsers = localStorage.getItem('piacenzaUsers');
        let users = savedUsers ? JSON.parse(savedUsers) : [];
        
        users.push({
            username: pendingUserData.username,
            email: pendingUserData.email,
            password: pendingUserData.password
        });
        
        localStorage.setItem('piacenzaUsers', JSON.stringify(users));
        console.log('💾 Utente salvato nel localStorage');
    }
    
    // Salva sessione
    sessionStorage.setItem('currentUser', JSON.stringify({
        username: pendingUserData.username,
        email: pendingUserData.email,
        isAdmin: pendingUserData.isAdmin
    }));
    sessionStorage.setItem('isLoggedIn', 'true');
    
    alert('✅ ACCESSO EFFETTUATO!\n\nBenvenuto ' + pendingUserData.username + '!');
    
    window.location.href = 'home.html';
});

// Solo numeri nel codice
document.getElementById('authCode').addEventListener('input', function() {
    this.value = this.value.replace(/[^0-9]/g, '');
});

// ESC per chiudere
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && document.getElementById('authModal').style.display === 'flex') {
        closeAuthModal();
    }
});

// Click fuori per chiudere
document.getElementById('authModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeAuthModal();
    }
});

// ==================== DEBUG ====================
function mostraUtenti() {
    const users = JSON.parse(localStorage.getItem('piacenzaUsers') || '[]');
    console.log('=== UTENTI REGISTRATI ===');
    console.table(users);
    console.log('Totale:', users.length);
    return users;
}

function cancellaUtenti() {
    if (confirm('Cancellare tutti gli utenti?')) {
        localStorage.removeItem('piacenzaUsers');
        sessionStorage.clear();
        alert('✅ Dati cancellati!');
        location.reload();
    }
}

function mostraCodice() {
    console.log('🔑 Codice attuale:', generatedCode);
    return generatedCode;
}

console.log('✅ Sistema caricato!');
console.log('📝 Comandi console:');
console.log('  mostraUtenti() - Mostra utenti registrati');
console.log('  cancellaUtenti() - Cancella tutti i dati');
console.log('  mostraCodice() - Mostra ultimo codice generato');