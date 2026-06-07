(function() {
  'use strict';

  /* ── Messages contextuels par page ──
     Ton : humain, direct, ancré dans le problème du visiteur.
     Pas un bot qui "répond" — une vraie invitation à un appel avec Caroline. */
  var MESSAGES = {
    'index.html':
      'Je vends, mais je ne fais pas de marge. En 30 min, on comprend ensemble pourquoi — et ce que ça représente en euros.',
    'audit-rentabilite-ecommerce.html':
      'Vous sentez que quelque chose fuit, mais vous ne savez pas quoi exactement. C\'est précisément ce qu\'on creuse en 30 min.',
    'methode-marc.html':
      'Vous faites du CA mais pas de bénéfice. En 30 min, on identifie les 2-3 leviers qui changent vraiment la donne sur votre boutique.',
    'guide-fuites-marge.html':
      'Vous avez identifié les fuites théoriques. Maintenant : combien ça vous coûte concrètement, sur votre boutique, en ce moment ?',
    'blog.html':
      'Vous lisez des articles sur la rentabilité parce que quelque chose cloche. En 30 min, on met le doigt dessus — gratuitement.',
    'article.html':
      'Ce sujet résonne parce que vous le vivez. En 30 min de diagnostic, on chiffre exactement ce que ça vous coûte.',
    'podcast.html':
      'Vous écoutez parce que vous cherchez à comprendre pourquoi vous ne faites pas de marge. On peut vous répondre en 30 min.',
    'ressources.html':
      'Vous cherchez des outils parce que les chiffres ne s\'expliquent pas. Un diagnostic de 30 min donne les vraies réponses.',
    'a-propos.html':
      'Vous voulez savoir si Upglide peut résoudre votre problème de marge spécifiquement. 30 min pour une réponse franche.',
    'contact.html':
      'Vous avez des questions sur votre rentabilité. Plutôt qu\'un formulaire, réservez 30 min pour des réponses concrètes.',
    'accompagnements.html':
      'Vous ne comprenez pas pourquoi votre boutique ne dégage pas plus. C\'est exactement ce qu\'on diagnostique en 30 min.',
    'default':
      'Je vends mais je ne fais pas de marge — et je ne comprends pas pourquoi. C\'est ce qu\'on résout en 30 min, gratuitement.'
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

        '<div class="marc-thought-wrap">' +
          '<span class="marc-thought-label">Vous vous dites peut-être…</span>' +
          '<p class="marc-msg" id="marc-msg"></p>' +
        '</div>' +

        '<button class="marc-cta-btn" id="marc-cta">Réserver le diagnostic gratuit →</button>' +
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
