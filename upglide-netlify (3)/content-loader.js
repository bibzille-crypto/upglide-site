/**
 * Shopilot — Content Loader
 * Applique les personnalisations stockées dans localStorage sur chaque page.
 * Géré depuis admin.html → section Personnalisation.
 */
(function () {
  try {
    var c = JSON.parse(localStorage.getItem('shopilot_content') || '{}');
    var filename = (location.pathname.split('/').pop() || 'index.html').replace('.html', '');
    var page = filename === '' ? 'index' : filename;
    // Normalise a-propos → apropos
    var pageKey = page.replace(/-/g, '');
    var g = c.global || {};
    var d = c[pageKey] || {};

    function set(sel, val) {
      if (!val) return;
      var el = document.querySelector(sel);
      if (el) el.innerHTML = val;
    }

    /* ── PHOTO DE PROFIL (toutes pages) ─────────────────────── */
    if (g.photo) {
      document.querySelectorAll('.hero-initiale, .bio-initiale, .page-initiale').forEach(function (el) {
        var img = document.createElement('img');
        img.src = g.photo;
        img.alt = g.prenom || 'Caroline';
        img.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;';
        el.parentNode.replaceChild(img, el);
      });
    }

    /* ── LIENS PLATEFORMES PODCAST (podcast.html) ────────────── */
    var platformKeys = ['spotify', 'apple', 'youtube', 'deezer'];
    platformKeys.forEach(function (p, i) {
      if (!g[p]) return;
      var btns = document.querySelectorAll('.platform-btn');
      if (!btns[i]) return;
      var btn = btns[i];
      var a = document.createElement('a');
      a.href = g[p];
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.className = btn.className;
      a.innerHTML = btn.innerHTML;
      btn.parentNode.replaceChild(a, btn);
    });

    /* ── PAGE D'ACCUEIL (index) ──────────────────────────────── */
    if (pageKey === 'index') {
      set('.hero-eyebrow', d.hero_eyebrow);
      set('.hero-h1', d.hero_h1);
      set('.hero-sub', d.hero_sub);
      set('.hero-trusted', d.hero_trusted);

      // Boutons CTA héros
      var ctas = document.querySelectorAll('.hero-cta-row button');
      if (ctas[0] && d.hero_cta1) ctas[0].innerHTML = d.hero_cta1;
      if (ctas[1] && d.hero_cta2) ctas[1].innerHTML = d.hero_cta2;

      // Proof bar — chiffres et labels
      var nums = document.querySelectorAll('.proof-num');
      var lbls = document.querySelectorAll('.proof-lbl');
      ['stat1_num', 'stat2_num', 'stat3_num', 'stat4_num'].forEach(function (k, i) {
        if (d[k] && nums[i]) nums[i].innerHTML = d[k];
      });
      ['stat1_lbl', 'stat2_lbl', 'stat3_lbl', 'stat4_lbl'].forEach(function (k, i) {
        if (d[k] && lbls[i]) lbls[i].innerHTML = d[k];
      });

      // Bio
      set('.bio-quote', d.bio_quote);
      var bios = document.querySelectorAll('.bio-text');
      ['bio_text1', 'bio_text2', 'bio_text3', 'bio_text4'].forEach(function (k, i) {
        if (d[k] && bios[i]) bios[i].innerHTML = d[k];
      });
    }

    /* ── À PROPOS ────────────────────────────────────────────── */
    else if (pageKey === 'apropos') {
      set('.page-h1', d.h1);
      set('.page-sub', d.sub);
    }

    /* ── ACCOMPAGNEMENTS ─────────────────────────────────────── */
    else if (pageKey === 'accompagnements') {
      set('.page-h1', d.h1);
      set('.page-sub', d.sub);
    }

    /* ── CONTACT ─────────────────────────────────────────────── */
    else if (pageKey === 'contact') {
      set('.contact-form-title', d.h1);
      set('.contact-form-sub', d.sub);
    }

    /* ── PODCAST ─────────────────────────────────────────────── */
    else if (pageKey === 'podcast') {
      set('.podcast-h1', d.h1);
      set('.podcast-sub', d.sub);
    }

    /* ── BLOG ────────────────────────────────────────────────── */
    else if (pageKey === 'blog') {
      set('.page-h1', d.h1);
      set('.page-sub', d.sub);
    }

    /* ── RESSOURCES ──────────────────────────────────────────── */
    else if (pageKey === 'ressources') {
      set('.page-h1', d.h1);
      set('.page-sub', d.sub);
    }

  } catch (e) { /* silencieux */ }
})();
