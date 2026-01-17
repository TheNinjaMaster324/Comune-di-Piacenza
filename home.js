// Verifica se l'utente è loggato
window.addEventListener('load', function() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    
    if (isLoggedIn !== 'true') {
        window.location.href = 'index.html';
        return;
    }
    
    // Carica i dati dell'utente
    const userData = JSON.parse(sessionStorage.getItem('currentUser'));
    
    if (userData) {
        // Mostra il messaggio di benvenuto
        document.getElementById('welcomeMessage').textContent = `Benvenuto, ${userData.username}!`;
        
        // Se è admin, mostra la sezione staff
        if (userData.isAdmin) {
            document.getElementById('staff').style.display = 'block';
            updateAdminStats();
        }
    }
});

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
        alert('⚠️ Accesso Negato\n\nQuesta sezione è riservata solo agli amministratori.\n\nSe sei un membro dello staff, effettua il login dalla sezione "Amministratore" nella pagina di accesso.');
        return false;
    }
}

// Logout
function logout() {
    if (confirm('Sei sicuro di voler uscire?')) {
        sessionStorage.removeItem('currentUser');
        sessionStorage.removeItem('isLoggedIn');
        window.location.href = 'index.html';
    }
}

// Aggiorna statistiche admin
function updateAdminStats() {
    const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
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
document.getElementById('contactForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const name = document.getElementById('contactName').value;
    const email = document.getElementById('contactEmail').value;
    const message = document.getElementById('contactMessage').value;
    
    // Simula invio messaggio (in produzione invieresti al server)
    console.log('📧 Messaggio inviato:', { name, email, message });
    
    // Mostra conferma
    alert('✅ Messaggio inviato con successo!\n\nGrazie per averci contattato, ' + name + '!\nRiceverai una risposta entro 24-48 ore.');
    
    // Reset form
    this.reset();
});


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

// Gestione bottoni admin (esempio)
document.querySelectorAll('.admin-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const toolName = this.parentElement.querySelector('h4').textContent;
        alert(`Funzionalità "${toolName}" in sviluppo!\n\nQuesta funzionalità sarà disponibile presto.`);
    });
});