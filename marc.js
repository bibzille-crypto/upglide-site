(function() {
  'use strict';

  /* ── Messages contextuels par page ── */
  var MESSAGES = {
    'index.html':                        'Votre marge nette vous préoccupe ? En 30 min, j\'identifie vos principales fuites — gratuitement.',
    'audit-rentabilite-ecommerce.html':  'Des questions sur l\'audit ? Je peux analyser votre situation et estimer l\'impact en euros dès maintenant.',
    'methode-marc.html':                 'Vous voulez voir comment la méthode MARC s\'applique concrètement à votre boutique ?',
    'guide-fuites-marge.html':           'Le guide vous donne la direction — le diagnostic va plus loin et chiffre l\'impact réel sur votre situation.',
    'blog.html':                         'Cet article vous parle ? Je peux faire un diagnostic rapide de votre situation — 30 min, sans engagement.',
    'article.html':                      'Ce sujet vous concerne ? Je peux analyser votre situation précise en 30 minutes.',
    'podcast.html':                      'Vous écoutez, vous apprenez — prêt à passer à l\'action ? Un diagnostic offert pour aller plus loin.',
    'ressources.html':                   'Une ressource vous a interpellé ? Je peux vous aider à identifier ce qui s\'applique à votre boutique.',
    'a-propos.html':                     'Vous voulez savoir si la méthode MARC est adaptée à votre situation ? Un appel de 30 min suffit.',
    'contact.html':                      'Bonjour ! Je suis Marc. Préférez-vous réserver directement un créneau de diagnostic plutôt que de remplir le formulaire ?',
    'accompagnements.html':              'Prêt à savoir combien vous perdez réellement en marge ? Je peux faire un premier diagnostic gratuit.',
    'default':                           'Bonjour ! Je suis Marc. Je peux identifier vos principales fuites de marge en 30 min — gratuitement, sans engagement.'
  };

  /* ── Get message for current page ── */
  function getMessage() {
    var page = window.location.pathname.split('/').pop() || 'index.html';
    return MESSAGES[page] || MESSAGES['default'];
  }

  /* ── Open Calendly ── */
  function marcDiag(e) {
    if (e) e.preventDefault();
    if (typeof Calendly !== 'undefined') {
      Calendly.initPopupWidget({ url: 'https://calendly.com/contact-upglide/30min' });
    } else {
      window.open('https://calendly.com/contact-upglide/30min', '_blank');
    }
  }

  /* ── Build widget HTML ── */
  function buildWidget() {
    var el = document.createElement('div');
    el.id = 'marc-widget';
    el.setAttribute('role', 'complementary');
    el.setAttribute('aria-label', 'Assistant Marc — Diagnostic rentabilité');
    el.innerHTML =
      '<div class="marc-bubble" id="marc-bubble" aria-live="polite" hidden>' +
        '<button class="marc-close" id="marc-close" aria-label="Fermer le message de Marc">×</button>' +
        '<div class="marc-bubble-top">' +
          '<div>' +
            '<div class="marc-bubble-name">Marc</div>' +
            '<div class="marc-bubble-role">Assistant diagnostic</div>' +
          '</div>' +
        '</div>' +
        '<p class="marc-msg" id="marc-msg"></p>' +
        '<button class="marc-cta-btn" id="marc-cta">Démarrer le diagnostic gratuit →</button>' +
      '</div>' +
      '<button class="marc-avatar-btn" id="marc-toggle" aria-label="Parler à Marc — assistant diagnostic" aria-expanded="false">' +
        '<div class="marc-avatar-ring" id="marc-ring">' +
          '<img class="marc-avatar-img" src="marc-avatar.svg" alt="Marc, assistant Upglide" width="60" height="60">' +
        '</div>' +
        '<span class="marc-label">Marc</span>' +
        '<span class="marc-notif marc-hidden" id="marc-notif" aria-hidden="true">1</span>' +
      '</button>';
    document.body.appendChild(el);
  }

  /* ── State ── */
  var bubble, toggle, closeBtn, ctaBtn, notif, ring;
  var isOpen = false;

  function openBubble() {
    if (isOpen) return;
    isOpen = true;
    bubble.hidden = false;
    // Force reflow then add class
    void bubble.offsetHeight;
    bubble.classList.add('marc-visible');
    toggle.setAttribute('aria-expanded', 'true');
    notif.classList.add('marc-hidden');
    ring.classList.remove('marc-pulsing');
    // Save shown in session
    try { sessionStorage.setItem('marc-shown', '1'); } catch(e) {}
  }

  function closeBubble() {
    if (!isOpen) return;
    isOpen = false;
    bubble.classList.remove('marc-visible');
    toggle.setAttribute('aria-expanded', 'false');
    setTimeout(function() { if (!isOpen) bubble.hidden = true; }, 380);
    try { sessionStorage.setItem('marc-dismissed', '1'); } catch(e) {}
  }

  function toggleBubble() {
    if (isOpen) { closeBubble(); } else { openBubble(); }
  }

  /* ── Auto show logic ── */
  function autoShow() {
    try {
      if (sessionStorage.getItem('marc-dismissed')) return;
    } catch(e) {}

    // Show notification dot first
    notif.classList.remove('marc-hidden');
    ring.classList.add('marc-pulsing');

    // Then open bubble after delay
    setTimeout(function() {
      if (!isOpen) openBubble();
    }, 3500);
  }

  /* ── Init ── */
  function init() {
    buildWidget();

    bubble  = document.getElementById('marc-bubble');
    toggle  = document.getElementById('marc-toggle');
    closeBtn = document.getElementById('marc-close');
    ctaBtn  = document.getElementById('marc-cta');
    notif   = document.getElementById('marc-notif');
    ring    = document.getElementById('marc-ring');

    // Set contextual message
    document.getElementById('marc-msg').textContent = getMessage();

    // Events
    toggle.addEventListener('click', toggleBubble);
    closeBtn.addEventListener('click', closeBubble);
    ctaBtn.addEventListener('click', marcDiag);

    // Keyboard: close on Escape
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && isOpen) closeBubble();
    });

    // Auto-show: after 8s OR after 40% scroll
    var shown = false;
    function triggerShow() {
      if (shown) return;
      shown = true;
      autoShow();
    }

    var autoTimer = setTimeout(triggerShow, 8000);

    window.addEventListener('scroll', function onScroll() {
      var scrollPct = window.scrollY / (document.body.scrollHeight - window.innerHeight);
      if (scrollPct >= 0.4) {
        clearTimeout(autoTimer);
        triggerShow();
        window.removeEventListener('scroll', onScroll);
      }
    }, { passive: true });
  }

  /* ── Run after DOM ready ── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
