// ==================== CONFIGURAZIONE ====================
const AUTHORIZED_INSTITUTIONAL = {
    'Polizia di Stato': { email: 'plulibnd@gmail.com', password: 'PS2025', ids: ['PS0001', 'PS0002'] },
    'Arma dei Carabinieri': { email: 'carabinieri@piacenzarp.it', password: 'CC2025', ids: ['CC0001', 'CC0002'] },
    'Guardia di Finanza': { email: 'gdf@piacenzarp.it', password: 'GDF2025', ids: ['GDF001', 'GDF002'] },
    'Polizia Penitenziaria': { email: 'penitenziaria@piacenzarp.it', password: 'PP2025', ids: ['PP0001', 'PP0002'] },
    'Polizia Locale': { email: 'locale@piacenzarp.it', password: 'PL2025', ids: ['PL0001', 'PL0002'] },
    'Croce Rossa Italiana': { email: 'cri@piacenzarp.it', password: 'CRI2025', ids: ['CRI001', 'CRI002'] },
    'Croce Verde': { email: 'croceverde@piacenzarp.it', password: 'CV2025', ids: ['CV0001', 'CV0002'] },
    'Vigili del Fuoco': { email: 'vvf@piacenzarp.it', password: 'VVF2025', ids: ['VVF001', 'VVF002'] },
    'ACI': { email: 'aci@piacenzarp.it', password: 'ACI2025', ids: ['ACI001', 'ACI002'] }
};

const TEMPLATE_ID = "template_fyt6b6a";

// 🔥 DUE WEBHOOK SEPARATI
const WEBHOOK_REGISTRAZIONE = 'https://discord.com/api/webhooks/1464584085048524994/LgbWVahoCUAAOpntZinbasISfrj7lYz6QjllcNkuYegL_mK-S7LR-2exai1RCJAxJ5Zz';
const WEBHOOK_LOGIN = 'https://discord.com/api/webhooks/1464590848665850030/NoCWPNEHJ8Scj8CXaVy3hKxu61KJaAB28IV_T12S7VYyyf3vSAhWanVg1brXwLPdwnZK';

let generatedCode = '';
let pendingUser = null;

// ==================== INIZIALIZZAZIONE ====================
emailjs.init("ST9J-kvXHdaIc9_Ps");

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('tabLogin').addEventListener('click', () => switchTab('login'));
    document.getElementById('tabRegister').addEventListener('click', () => switchTab('register'));
    document.getElementById('tabAdmin').addEventListener('click', () => switchTab('admin'));
    document.getElementById('tabInstitutional').addEventListener('click', () => switchTab('institutional'));
});

window.addEventListener('load', function() {
    const savedLogin = localStorage.getItem('piacenza_auto_login');
    if (savedLogin) {
        const { userData, expiry } = JSON.parse(savedLogin);
        if (new Date().getTime() < expiry) {
            completeLogin(userData, false);
            return;
        } else {
            localStorage.removeItem('piacenza_auto_login');
        }
    }
    if (sessionStorage.getItem('logged') === 'yes') {
        window.location.href = 'home.html';
    }
});

// ==================== UTILITY FUNCTIONS ====================
function showNotification(title, message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification-box ${type}`;
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : '📧';
    notification.innerHTML = `
        <div class="notification-header">
            <span class="notification-icon">${icon}</span>
            <span class="notification-title">${title}</span>
        </div>
        <div class="notification-message">${message}</div>
    `;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.4s ease';
        setTimeout(() => notification.remove(), 400);
    }, 4000);
}

function makeCode() {
    return String(Math.floor(100000 + Math.random() * 900000));
}

function switchTab(tabName) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.form-container').forEach(f => f.classList.remove('active'));
    document.getElementById('tab' + tabName.charAt(0).toUpperCase() + tabName.slice(1)).classList.add('active');
    document.getElementById(tabName + 'Form').classList.add('active');
}

function closeAuthModal() {
    document.getElementById('authModal').style.display = 'none';
    document.getElementById('authCode').value = '';
    document.getElementById('acceptCookies').checked = false;
}

// ==================== VALIDAZIONE ====================
function validateInstitutionalLogin(email, faction, id, password) {
    if (!AUTHORIZED_INSTITUTIONAL[faction]) {
        return { valid: false, error: 'Fazione non valida!' };
    }
    
    const factionData = AUTHORIZED_INSTITUTIONAL[faction];
    
    if (email.toLowerCase() !== factionData.email.toLowerCase()) {
        return { 
            valid: false, 
            error: `Email non autorizzata per ${faction}!\n\nEmail corretta: ${factionData.email}` 
        };
    }
    
    if (password !== factionData.password) {
        return { valid: false, error: 'Password errata!' };
    }
    
    if (!factionData.ids.includes(id.toUpperCase())) {
        return { 
            valid: false, 
            error: `ID Esponente non valido per ${faction}!\n\nID autorizzati: ${factionData.ids.join(', ')}` 
        };
    }
    
    return { 
        valid: true, 
        userData: { 
            username: id.toUpperCase(), 
            email: email, 
            faction: faction, 
            isAdmin: false, 
            isInstitutional: true 
        } 
    };
}

// ==================== EMAIL ====================
async function sendEmail(email, code, type) {
    document.getElementById('loading').style.display = 'block';
    try {
        await emailjs.send("service_5gatndp", TEMPLATE_ID, {
            to_email: email,
            to_name: email.split('@')[0],
            code: code,
            type: type
        });
        document.getElementById('loading').style.display = 'none';
        showNotification('Email Inviata!', 'Controlla la tua casella (anche spam).', 'success');
        return true;
    } catch (error) {
        document.getElementById('loading').style.display = 'none';
        showNotification('Errore Invio Email', `Usa questo codice: ${code}`, 'error');
        return true;
    }
}

// ==================== WEBHOOK DISCORD ====================

// 🎉 Webhook Registrazione
async function sendRegistrationWebhook(user) {
    console.log('📤 Invio webhook REGISTRAZIONE per:', user.username);
    
    const embed = {
        title: '🎉 Nuova Registrazione!',
        description: `Un nuovo utente si è registrato su **Comune di Piacenza RP**`,
        color: 0x27ae60,
        fields: [
            { name: '👤 Username', value: user.username, inline: true },
            { name: '📧 Email', value: user.email, inline: true },
            { name: '📅 Data Registrazione', value: new Date(user.registeredDate).toLocaleString('it-IT'), inline: false }
        ],
        footer: { text: 'Sistema Registrazioni - Comune di Piacenza RP' },
        timestamp: new Date().toISOString()
    };
    
    try {
        const response = await fetch(WEBHOOK_REGISTRAZIONE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'Registrazioni - Piacenza RP',
                avatar_url: 'https://via.placeholder.com/100/27ae60/FFFFFF?text=REG',
                embeds: [embed]
            })
        });
        
        if (response.ok) {
            console.log('✅ Webhook registrazione inviato!');
        } else {
            console.error('❌ Errore webhook registrazione:', response.status);
        }
    } catch (error) {
        console.error('❌ Errore invio webhook registrazione:', error);
    }
}

// 🔐 Webhook Login
async function sendLoginWebhook(user) {
    console.log('📤 Invio webhook LOGIN per:', user.username);
    
    const embed = {
        title: '🔐 Nuovo Login',
        description: `Nuovo accesso rilevato su **Comune di Piacenza RP**`,
        color: 0x3498db,
        fields: [
            { name: '👤 Username', value: user.username, inline: true },
            { name: '📧 Email', value: user.email, inline: true },
            { name: '📅 Data Login', value: new Date().toLocaleString('it-IT'), inline: false }
        ],
        footer: { text: 'Sistema Login - Comune di Piacenza RP' },
        timestamp: new Date().toISOString()
    };
    
    try {
        const response = await fetch(WEBHOOK_LOGIN, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'Login - Piacenza RP',
                avatar_url: 'https://via.placeholder.com/100/3498db/FFFFFF?text=LOG',
                embeds: [embed]
            })
        });
        
        if (response.ok) {
            console.log('✅ Webhook login inviato!');
        } else {
            console.error('❌ Errore webhook login:', response.status);
        }
    } catch (error) {
        console.error('❌ Errore invio webhook login:', error);
    }
}

// ==================== FORM HANDLERS ====================
document.getElementById('loginForm').onsubmit = async function(e) {
    e.preventDefault();
    const user = document.getElementById('loginUsername').value.trim();
    const pass = document.getElementById('loginPassword').value.trim();
    const users = JSON.parse(localStorage.getItem('piacenzaUsers') || '[]');
    const found = users.find(u => u.username === user && u.password === pass);
    
    if (!found) {
        showNotification('Errore Login', 'Credenziali errate!', 'error');
        return;
    }
    
    generatedCode = makeCode();
    pendingUser = {
        username: found.username,
        email: found.email,
        isAdmin: false,
        isInstitutional: false,
        isLogin: true // 🔥 Flag per sapere che è un login
    };
    
    await sendEmail(found.email, generatedCode, 'Login');
    document.getElementById('cookieConsent').style.display = 'block';
    document.getElementById('authModal').style.display = 'flex';
};

document.getElementById('registerForm').onsubmit = async function(e) {
    e.preventDefault();
    const user = document.getElementById('regUsername').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const pass = document.getElementById('regPassword').value.trim();
    const conf = document.getElementById('regPasswordConfirm').value.trim();
    
    if (pass !== conf) {
        showNotification('Errore', 'Le password non coincidono!', 'error');
        return;
    }
    
    if (pass.length < 6) {
        showNotification('Errore', 'Password troppo corta (min. 6 caratteri)!', 'error');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('piacenzaUsers') || '[]');
    if (users.find(u => u.username === user)) {
        showNotification('Errore', 'Username già esistente!', 'error');
        return;
    }
    
    generatedCode = makeCode();
    pendingUser = {
        username: user,
        email: email,
        password: pass,
        isAdmin: false,
        isInstitutional: false,
        register: true, // 🔥 Flag per sapere che è una registrazione
        registeredDate: new Date().toISOString()
    };
    
    await sendEmail(email, generatedCode, 'Registrazione');
    document.getElementById('cookieConsent').style.display = 'block';
    document.getElementById('authModal').style.display = 'flex';
};

document.getElementById('adminForm').onsubmit = async function(e) {
    e.preventDefault();
    const user = document.getElementById('adminUsername').value.trim();
    const email = document.getElementById('adminEmail').value.trim();
    const pass = document.getElementById('adminPassword').value.trim();
    
    if (email !== 'amministrazionepiacenzarp@gmail.com' || pass !== 'amministrazionePiacenzaRP2.0') {
        showNotification('Accesso Negato', 'Credenziali admin errate!', 'error');
        return;
    }
    
    generatedCode = makeCode();
    pendingUser = {
        username: user,
        email: email,
        isAdmin: true,
        isInstitutional: false,
        isLogin: true // 🔥 Admin login = login
    };
    
    await sendEmail(email, generatedCode, 'Login Admin');
    document.getElementById('cookieConsent').style.display = 'block';
    document.getElementById('authModal').style.display = 'flex';
};

document.getElementById('institutionalForm').onsubmit = async function(e) {
    e.preventDefault();
    const email = document.getElementById('instEmail').value.trim();
    const faction = document.getElementById('instFaction').value;
    const id = document.getElementById('instID').value.trim().toUpperCase();
    const pass = document.getElementById('instPassword').value.trim();
    
    if (!faction) {
        showNotification('Errore', 'Seleziona una fazione!', 'error');
        return;
    }
    
    const validation = validateInstitutionalLogin(email, faction, id, pass);
    if (!validation.valid) {
        showNotification('Accesso Negato', validation.error, 'error');
        return;
    }
    
    generatedCode = makeCode();
    pendingUser = validation.userData;
    pendingUser.isLogin = true; // 🔥 Istituzionale login = login
    
    await sendEmail(email, generatedCode, `Login Esponente - ${faction}`);
    document.getElementById('cookieConsent').style.display = 'block';
    document.getElementById('authModal').style.display = 'flex';
};

document.getElementById('authForm').onsubmit = async function(e) {
    e.preventDefault();
    const code = document.getElementById('authCode').value.trim();
    
    if (code !== generatedCode) {
        showNotification('Codice Errato', 'Ricontrolla il codice ricevuto via email.', 'error');
        return;
    }
    
    // 🔥 SE È UNA REGISTRAZIONE
    if (pendingUser.register) {
        const users = JSON.parse(localStorage.getItem('piacenzaUsers') || '[]');
        
        const newUser = {
            username: pendingUser.username,
            email: pendingUser.email,
            password: pendingUser.password,
            registeredDate: pendingUser.registeredDate
        };
        
        users.push(newUser);
        localStorage.setItem('piacenzaUsers', JSON.stringify(users));
        
        // 📤 Invia webhook REGISTRAZIONE
        console.log('🚀 Invio webhook registrazione...');
        await sendRegistrationWebhook(newUser);
    }
    // 🔥 SE È UN LOGIN
    else if (pendingUser.isLogin) {
        // 📤 Invia webhook LOGIN
        console.log('🚀 Invio webhook login...');
        await sendLoginWebhook(pendingUser);
    }
    
    const acceptCookies = document.getElementById('acceptCookies').checked;
    completeLogin(pendingUser, acceptCookies);
};

// ==================== LOGIN COMPLETION ====================
function completeLogin(user, saveCookie) {
    sessionStorage.setItem('logged', 'yes');
    sessionStorage.setItem('currentUser', JSON.stringify(user));
    
    if (saveCookie) {
        const expiry = new Date().getTime() + (5 * 24 * 60 * 60 * 1000);
        localStorage.setItem('piacenza_auto_login', JSON.stringify({
            userData: user,
            expiry: expiry
        }));
    }
    
    showNotification('Accesso Effettuato!', 'Reindirizzamento in corso...', 'success');
    setTimeout(() => {
        window.location.href = 'home.html';
    }, 1500);
}

// ==================== INPUT VALIDATION ====================
document.getElementById('authCode').oninput = function() {
    this.value = this.value.replace(/[^0-9]/g, '');
};

document.getElementById('instID').oninput = function() {
    this.value = this.value.toUpperCase();
};