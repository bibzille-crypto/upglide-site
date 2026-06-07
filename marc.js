(function() {
  'use strict';

  /* ── Messages contextuels par page ──
     Ton : humain, direct, ancré dans le problème du visiteur.
     Pas un bot qui "répond" — une vraie invitation à un appel avec Caroline. */
  var MESSAGES = {
    'index.html':
      'Votre boutique tourne mais la marge ne suit pas. On trouve pourquoi en 30 min.',
    'audit-rentabilite-ecommerce.html':
      'Quelque chose fuit dans votre rentabilité. En 30 min, on met le doigt dessus et on chiffre.',
    'methode-marc.html':
      'Du chiffre, mais pas de bénéfice. En 30 min, on identifie les 2-3 leviers qui changent vraiment la donne.',
    'guide-fuites-marge.html':
      'Vous savez que ça fuit. En 30 min, on vous dit combien — en euros, sur votre boutique.',
    'blog.html':
      'Vous lisez sur la rentabilité parce que quelque chose cloche. En 30 min, on met le doigt dessus.',
    'article.html':
      'Ce sujet vous concerne. En 30 min, on chiffre exactement ce que ça représente pour votre boutique.',
    'podcast.html':
      'Vous cherchez à comprendre pourquoi la marge n\'est pas au rendez-vous. On peut vous répondre en 30 min.',
    'ressources.html':
      'Les outils vous aident à voir. Un diagnostic vous dit combien ça vous coûte concrètement.',
    'a-propos.html':
      'Vous voulez savoir si c\'est fait pour vous. 30 min pour une réponse franche, sans engagement.',
    'contact.html':
      'Plutôt qu\'un formulaire : 30 min pour comprendre précisément où votre marge se perd.',
    'accompagnements.html':
      'Vous ne savez pas encore pourquoi votre boutique ne dégage pas plus. C\'est ce qu\'on creuse en 30 min.',
    'default':
      'Votre marge ne reflète pas votre volume. En 30 min, on comprend pourquoi — gratuitement.'
  };

  function getMessage() {
    var page = window.location.pathname.split('/').pop() || 'index.html';
    if (!page || page === '') page = 'index.html';
    return MESSAGES[page] || MESSAGES['default'];
  }

  /* ── Calendly ── */
  function marcDiag(e) {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (typeof Calendly !== 'undefined') {
      Calendly.initPopupWidget({ url: 'https://calendly.com/contact-upglide/30min' });
    } else {
      window.open('https://calendly.com/contact-upglide/30min', '_blank');
    }
  }

  /* ── Build widget DOM ──
     Framing : "Diagnostic offert · Appel avec Caroline"
     La note "Vrai appel téléphonique" dissipe toute ambiguïté avec un chatbot. */
  function buildWidget() {
    var el = document.createElement('div');
    el.id = 'marc-widget';
    el.setAttribute('role', 'complementary');
    el.setAttribute('aria-label', 'Diagnostic gratuit — réserver un appel avec Caroline');

    el.innerHTML =
      /* Bulle */
      '<div class="marc-bubble" id="marc-bubble" aria-live="polite" hidden>' +
        '<button class="marc-close" id="marc-close" aria-label="Fermer">×</button>' +

        '<div class="marc-bubble-header">' +
          '<div class="marc-bubble-avatar-mini">' +
            '<img src="marc-avatar.svg" alt="" aria-hidden="true" width="36" height="36">' +
          '</div>' +
          '<div class="marc-bubble-id">' +
            '<div class="marc-bubble-name">Diagnostic offert</div>' +
            '<div class="marc-bubble-role">Upglide · 30 min · 100% gratuit</div>' +
          '</div>' +
          '<span class="marc-live-dot" aria-hidden="true">Dispo</span>' +
        '</div>' +

        '<p class="marc-msg" id="marc-msg"></p>' +

        '<button class="marc-cta-btn" id="marc-cta">Réserver le diagnostic gratuit →</button>' +
      '</div>' +

      /* Avatar */
      '<button class="marc-avatar-btn" id="marc-toggle" ' +
              'aria-label="Réserver un diagnostic gratuit avec Caroline" ' +
              'aria-expanded="false">' +
        '<div class="marc-avatar-ring" id="marc-ring">' +
          '<img class="marc-avatar-img" src="marc-avatar.svg" alt="Caroline — diagnostic gratuit" width="60" height="60">' +
        '</div>' +
        '<span class="marc-label">Diagnostic offert</span>' +
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
    void bubble.offsetHeight; // reflow
    bubble.classList.add('marc-visible');
    toggle.setAttribute('aria-expanded', 'true');
    notif.classList.add('marc-hidden');
    ring.classList.remove('marc-pulsing');
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

  /* ── Auto-show : dot d'abord, bulle ensuite ── */
  function autoShow() {
    try { if (sessionStorage.getItem('marc-dismissed')) return; } catch(e) {}

    // Dot + pulse pour attirer l'œil
    notif.classList.remove('marc-hidden');
    ring.classList.add('marc-pulsing');

    // Bulle 3.5s plus tard
    setTimeout(function() { if (!isOpen) openBubble(); }, 3500);
  }

  /* ── Init ── */
  function init() {
    buildWidget();

    bubble   = document.getElementById('marc-bubble');
    toggle   = document.getElementById('marc-toggle');
    closeBtn = document.getElementById('marc-close');
    ctaBtn   = document.getElementById('marc-cta');
    notif    = document.getElementById('marc-notif');
    ring     = document.getElementById('marc-ring');

    document.getElementById('marc-msg').textContent = getMessage();

    toggle.addEventListener('click', toggleBubble);
    closeBtn.addEventListener('click', closeBubble);
    ctaBtn.addEventListener('click', marcDiag);

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && isOpen) closeBubble();
    });

    /* Auto-show après 8s ou 40% de scroll */
    var shown = false;
    function triggerShow() {
      if (shown) return;
      shown = true;
      autoShow();
    }

    var autoTimer = setTimeout(triggerShow, 8000);

    window.addEventListener('scroll', function onScroll() {
      var pct = window.scrollY / Math.max(1, document.body.scrollHeight - window.innerHeight);
      if (pct >= 0.4) {
        clearTimeout(autoTimer);
        triggerShow();
        window.removeEventListener('scroll', onScroll);
      }
    }, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
