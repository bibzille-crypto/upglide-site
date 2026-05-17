(function() {
  'use strict';

  /* ── Messages contextuels par page ──
     Ton : humain, direct, ancré dans le problème du visiteur.
     Pas un bot qui "répond" — une vraie invitation à un appel avec Caroline. */
  var MESSAGES = {
    'index.html':
      'Votre CA progresse mais la marge nette reste décevante ? Caroline peut identifier vos fuites en 30 min — gratuitement.',
    'audit-rentabilite-ecommerce.html':
      'Vous lisez cette page parce que quelque chose ne tourne pas rond avec votre rentabilité. Caroline peut regarder votre situation concrète en 30 min.',
    'methode-marc.html':
      'Vous voulez savoir ce que MARC donnerait sur votre boutique ? Un appel de 30 min suffit pour le savoir.',
    'guide-fuites-marge.html':
      'Le guide vous montre quoi chercher. Le diagnostic, lui, vous dit combien ça vous coûte — en euros, sur votre boutique.',
    'blog.html':
      'Cet article vous parle ? Caroline peut analyser votre situation précise et chiffrer l\'impact réel en 30 minutes.',
    'article.html':
      'Si ce sujet vous concerne, un diagnostic de 30 min peut quantifier exactement ce que ça représente pour votre boutique.',
    'podcast.html':
      'Vous écoutez parce que vous cherchez des réponses. Caroline peut vous en donner sur votre situation — en 30 min chrono.',
    'ressources.html':
      'Une ressource vous a intéressé ? Caroline peut vous aider à identifier ce qui s\'applique concrètement à votre cas.',
    'a-propos.html':
      'Vous voulez savoir si Upglide est fait pour vous ? Un appel de 30 min vous donnera une réponse honnête.',
    'contact.html':
      'Plutôt que de remplir un formulaire, réservez directement un créneau de 30 min avec Caroline.',
    'accompagnements.html':
      'Vous hésitez encore ? Un appel de 30 min avec Caroline vous donnera un avis honnête sur votre situation — sans engagement.',
    'default':
      'Caroline peut analyser votre rentabilité en 30 min et identifier vos principales fuites de marge — gratuitement, sans engagement.'
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
            '<div class="marc-bubble-role">Avec Caroline · 30 min · Gratuit</div>' +
          '</div>' +
          '<span class="marc-live-dot" aria-hidden="true">Dispo</span>' +
        '</div>' +

        '<p class="marc-msg" id="marc-msg"></p>' +

        '<button class="marc-cta-btn" id="marc-cta">Réserver l\'appel avec Caroline →</button>' +
        '<p class="marc-human-note">Vrai appel téléphonique · Sans engagement</p>' +
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
