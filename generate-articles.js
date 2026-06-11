#!/usr/bin/env node
'use strict';

const fs   = require('fs');
const path = require('path');

/* ── CONFIG ── */
const SITE_URL  = 'https://upglide.fr';
const BLOG_JSON = path.join(__dirname, 'data', 'blog.json');
const OUT_DIR   = path.join(__dirname, 'blog');
const TMPL_FILE = path.join(__dirname, 'article.html');

/* ── EXTRACT PAGE-SPECIFIC CSS FROM article.html ── */
const tmplSource = fs.readFileSync(TMPL_FILE, 'utf8');
const cssMatch   = tmplSource.match(/<style>([\s\S]*?)<\/style>/);
const sharedCSS  = cssMatch ? cssMatch[1] : '';

/* ── READ BLOG DATA ── */
const blogData = JSON.parse(fs.readFileSync(BLOG_JSON, 'utf8'));
const posts    = (blogData.posts || []).filter(p => p.published);

/* ── ENSURE OUTPUT DIR ── */
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

/* ── HELPERS ── */
function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtDate(d) {
  if (!d) return '';
  return new Date(d + (d.length === 10 ? 'T00:00:00' : '')).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
}

/* ── PARSE MARKDOWN (porté depuis article.html) ── */
function parseMD(md) {
  if (!md) return '';

  function fmt(s) {
    return s
      .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.+?)\*\*/g,     '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g,         '<em>$1</em>')
      .replace(/`(.+?)`/g,           '<code>$1</code>')
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="art-img" loading="lazy">')
      .replace(/\[BOUTON:\s*(.+?)\]\((.+?)\)/g, '<a class="art-cta-btn" href="$2">$1</a>')
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  }

  let html = '', inList = false, inTable = false, tableHeaderDone = false, tableHtml = '';
  const lines = md.split('\n');

  function closeTable() {
    if (inTable) {
      tableHtml += '</tbody></table></div>';
      html      += tableHtml;
      tableHtml = ''; inTable = false; tableHeaderDone = false;
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];

    /* TABLE */
    if (/^\s*\|/.test(raw)) {
      const isSep = /^\s*\|[\s\-:|]+\|/.test(raw) && /---/.test(raw);
      const cells = raw.split('|')
        .filter((c, j, a) => j > 0 && j < a.length - 1)
        .map(c => fmt(c.trim()));
      if (!inTable) {
        if (inList) { html += '</ul>'; inList = false; }
        inTable = true; tableHeaderDone = false;
        tableHtml = '<div class="art-table-wrap"><table class="art-table"><thead><tr>' +
          cells.map(c => `<th>${c}</th>`).join('') +
          '</tr></thead><tbody>';
      } else if (!tableHeaderDone && isSep) {
        tableHeaderDone = true;
      } else if (!isSep) {
        tableHtml += '<tr>' + cells.map(c => `<td>${c}</td>`).join('') + '</tr>';
      }
      continue;
    }
    closeTable();

    if      (/^#{4,6} /.test(raw))  { if (inList) { html += '</ul>'; inList = false; } html += `<h4>${fmt(raw.replace(/^#{4,6} /, ''))}</h4>`; }
    else if (/^### /.test(raw))     { if (inList) { html += '</ul>'; inList = false; } html += `<h3>${fmt(raw.slice(4))}</h3>`; }
    else if (/^## /.test(raw))      { if (inList) { html += '</ul>'; inList = false; } html += `<h2>${fmt(raw.slice(3))}</h2>`; }
    else if (/^# /.test(raw))       { if (inList) { html += '</ul>'; inList = false; } html += `<h2>${fmt(raw.slice(2))}</h2>`; }
    else if (/^> /.test(raw))       { if (inList) { html += '</ul>'; inList = false; } html += `<blockquote>${fmt(raw.slice(2))}</blockquote>`; }
    else if (/^[-*] /.test(raw))    { if (!inList) { html += '<ul>'; inList = true; }  html += `<li>${fmt(raw.slice(2))}</li>`; }
    else if (/^\d+\. /.test(raw))   { if (!inList) { html += '<ol>'; inList = 'ol'; } html += `<li>${fmt(raw.replace(/^\d+\. /, ''))}</li>`; }
    else if (/^---/.test(raw))      { if (inList) { html += inList === 'ol' ? '</ol>' : '</ul>'; inList = false; } html += '<hr>'; }
    else if (raw.trim() === '')     { if (inList) { html += inList === 'ol' ? '</ol>' : '</ul>'; inList = false; } }
    else                            { if (inList) { html += inList === 'ol' ? '</ol>' : '</ul>'; inList = false; } html += `<p>${fmt(raw)}</p>`; }
  }

  closeTable();
  if (inList) html += inList === 'ol' ? '</ol>' : '</ul>';
  return html;
}

/* ── BUILD SUMMARY BLOCK ── */
function buildSummary(art) {
  if (!art.summary || !art.summary.trim()) return '';
  const lines = art.summary.split('\n').map(l => l.trim()).filter(Boolean);
  if (!lines.length) return '';
  return `<div class="art-retenir">
      <div class="art-retenir-header">
        <div class="art-retenir-icon">✦</div>
        <div class="art-retenir-title">À retenir</div>
      </div>
      <div class="art-retenir-body"><ul class="art-retenir-list">
        ${lines.map(l => `<li>${l}</li>`).join('\n        ')}
      </ul></div>
    </div>`;
}

/* ── BUILD SIDEBAR ARTICLES ── */
function buildSidebarArticles(currentSlug) {
  return [...posts]
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    .map(p => `
      <a href="/blog/${p.slug}" class="art-list-link${p.slug === currentSlug ? ' active' : ''}">
        <span class="art-list-cat">${esc(p.category || '')}</span>
        <span class="art-list-title">${esc(p.title)}</span>
      </a>`).join('');
}

/* ── GENERATE HTML ── */
function generateHTML(art) {
  const url      = `${SITE_URL}/blog/${art.slug}`;
  const title    = `${art.title} — Upglide`;
  const desc     = art.excerpt || '';
  const ogImg    = art.image || `${SITE_URL}/hero-dashboard.png`;
  const dateStr  = fmtDate(art.date);
  const readStr  = art.readTime ? `${art.readTime} min de lecture` : '';
  const bcTitle  = art.title.length > 40 ? art.title.slice(0, 40) + '…' : art.title;

  const coverHTML   = art.image
    ? `<img src="${art.image}" alt="${esc(art.title)}" class="art-cover-img" loading="eager">`
    : '';
  const summaryHTML = buildSummary(art);
  const bodyHTML    = parseMD(art.content || '');
  const sidebarHTML = buildSidebarArticles(art.slug);

  const jsonld = JSON.stringify({
    '@context':         'https://schema.org',
    '@type':            'Article',
    'headline':         art.title,
    'description':      desc,
    'datePublished':    art.date || '',
    'author':           { '@type': 'Person', 'name': 'Caroline', 'url': `${SITE_URL}/a-propos` },
    'publisher':        { '@type': 'Organization', 'name': 'Upglide', 'url': `${SITE_URL}/` },
    'mainEntityOfPage': { '@type': 'WebPage', '@id': url },
    'inLanguage':       'fr-FR'
  });

  const breadcrumbJsonld = JSON.stringify({
    '@context':        'https://schema.org',
    '@type':           'BreadcrumbList',
    'itemListElement': [
      { '@type': 'ListItem', 'position': 1, 'name': 'Accueil', 'item': `${SITE_URL}/` },
      { '@type': 'ListItem', 'position': 2, 'name': 'Blog',    'item': `${SITE_URL}/blog` },
      { '@type': 'ListItem', 'position': 3, 'name': art.title, 'item': url }
    ]
  });

  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${url}">
  <meta property="og:type"        content="article">
  <meta property="og:locale"      content="fr_FR">
  <meta property="og:site_name"   content="Upglide">
  <meta property="og:title"       content="${esc(title)}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:url"         content="${url}">
  <meta property="og:image"       content="${esc(ogImg)}">
  <meta name="twitter:card"       content="summary_large_image">
  <meta name="twitter:image"      content="${esc(ogImg)}">
  <script type="application/ld+json">${jsonld}</script>
  <script type="application/ld+json">${breadcrumbJsonld}</script>
  <link rel="stylesheet" href="/styles.css">
  <script src="/script.js" defer></script>
  <link rel="preload" href="/marc.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
  <noscript><link rel="stylesheet" href="/marc.css"></noscript>
  <style>${sharedCSS}</style>
</head>
<body class="art-page">

<div class="art-progress" id="art-progress"></div>

<header class="site-header" data-header>
  <div class="shell nav-wrap">
    <a class="brand" href="/" aria-label="Upglide, accueil">
      <span class="brand-mark" aria-hidden="true"><span></span><span></span><span></span></span>
      <span>UPGLIDE</span>
    </a>
    <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="main-nav" data-menu-toggle>
      <span class="sr-only">Ouvrir le menu</span>
      <span></span><span></span>
    </button>
    <nav class="main-nav" id="main-nav" aria-label="Navigation principale" data-menu>
      <a href="/diagnostic">Diagnostic 360</a>
      <a href="/methode-marc">Méthode MARC</a>
      <a href="/ressources">Ressources</a>
      <a href="/blog">Blog</a>
      <a href="/a-propos">À propos</a>
      <a class="nav-contact" href="/contact">Parler de mon e-commerce</a>
    </nav>
  </div>
</header>

<div class="art-hero" id="art-hero">
  <div class="shell">
    <div class="art-breadcrumb">
      <a href="/">Accueil</a>
      <span class="art-breadcrumb-sep">›</span>
      <a href="/blog">Blog</a>
      <span class="art-breadcrumb-sep">›</span>
      <span>${esc(bcTitle)}</span>
    </div>
    ${art.category ? `<span class="art-category-badge">${esc(art.category)}</span>` : ''}
    <h1 class="art-h1">${esc(art.title)}</h1>
    <div class="art-meta-bar">
      ${dateStr ? `<span>${dateStr}</span>` : ''}
      ${dateStr && readStr ? '<span class="art-meta-sep"></span>' : ''}
      ${readStr ? `<span>${readStr}</span>` : ''}
    </div>
  </div>
</div>

<div class="art-page-body">

  <aside class="art-sidebar" id="art-sidebar">
    <div id="toc-section" style="display:none;">
      <div class="sidebar-heading">Dans cet article</div>
      ${readStr ? `<div class="art-read-time">${readStr}</div>` : ''}
      <nav id="art-toc"></nav>
    </div>
    <div id="all-articles-section">
      <div class="sidebar-heading">Tous les articles</div>
      <nav id="sidebar-articles">${sidebarHTML}
      </nav>
    </div>
    <a href="/diagnostic" class="sidebar-cta">Réserver l'appel →</a>
  </aside>

  <main class="art-main">
    <div class="art-mobile-nav" id="art-mobile-nav">
      <a href="/blog">
        <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        Blog
      </a>
      ${art.category ? `<span class="art-mobile-cat">${esc(art.category)}</span>` : ''}
    </div>

    <a href="/blog" class="art-back">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
      Retour au blog
    </a>

    <div class="art-card" id="art-card">
      <div id="art-content">
        ${coverHTML}
        ${summaryHTML}
        ${bodyHTML}
      </div>
    </div>

    <div class="art-share" id="art-share">
      <span class="art-share-lbl">Partager</span>
      <a class="art-share-btn" href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}" target="_blank" rel="noopener">
        <svg width="13" height="13" viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
        LinkedIn
      </a>
      <button class="art-share-btn" onclick="copyLink()">
        <svg width="13" height="13" viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
        <span id="copy-lbl">Copier le lien</span>
      </button>
    </div>

    <div class="art-cta" id="art-cta">
      <span class="art-cta-label">Accompagnement 1:1</span>
      <h3>Votre boutique mérite<br>un regard extérieur.</h3>
      <p>30 minutes. Gratuit. On voit si on peut travailler ensemble.</p>
      <a href="/diagnostic" class="art-cta-link">Réserver l'appel découverte →</a>
    </div>
  </main>

</div>

<footer class="site-footer">
  <div class="shell footer-grid">
    <div>
      <a class="brand brand-footer" href="/">
        <span class="brand-mark" aria-hidden="true"><span></span><span></span><span></span></span>
        <span>UPGLIDE</span>
      </a>
      <p>Le profit comme boussole.<br>La croissance comme conséquence.</p>
    </div>
    <div>
      <strong>Explorer</strong>
      <a href="/diagnostic">Diagnostic 360</a>
      <a href="/methode-marc">Méthode MARC</a>
      <a href="/ressources">Ressources</a>
      <a href="/blog">Blog</a>
    </div>
    <div>
      <strong>Upglide</strong>
      <a href="/a-propos">À propos</a>
      <a href="/contact">Contact</a>
      <a href="/scorecard">Score rentabilité</a>
    </div>
    <div class="footer-cta">
      <strong>Par où commencer ?</strong>
      <p>Obtenez une première lecture de votre rentabilité en 5 minutes.</p>
      <a href="/scorecard">Faire le score →</a>
    </div>
  </div>
  <div class="shell footer-bottom">
    <span>© <span data-year></span> Upglide</span>
    <span>Rentabilité · Cash · Pilotage</span>
  </div>
</footer>

<script>
/* READING PROGRESS */
var prog = document.getElementById('art-progress');
if (prog) window.addEventListener('scroll', function() {
  var h = document.documentElement.scrollHeight - window.innerHeight;
  prog.style.width = (h > 0 ? (window.scrollY / h * 100) : 0) + '%';
}, { passive: true });

/* COPY LINK */
function copyLink() {
  navigator.clipboard.writeText(window.location.href).then(function() {
    var lbl = document.getElementById('copy-lbl');
    lbl.textContent = 'Copié !';
    setTimeout(function() { lbl.textContent = 'Copier le lien'; }, 2000);
  });
}

/* TOC */
(function() {
  var content = document.getElementById('art-content');
  var tocNav  = document.getElementById('art-toc');
  var tocSect = document.getElementById('toc-section');
  if (!content || !tocNav) return;
  var headings = Array.from(content.querySelectorAll('h2, h3')).filter(function(h) {
    return !/à retenir|en résumé|résumé|conclusion rapide/i.test(h.textContent);
  });
  if (!headings.length) return;
  headings.forEach(function(h, i) {
    if (!h.id) h.id = 'section-' + i;
    var a = document.createElement('a');
    a.href = '#' + h.id;
    a.className = 'toc-link' + (h.tagName === 'H3' ? ' toc-h3' : '');
    a.textContent = h.textContent;
    a.addEventListener('click', function(e) {
      e.preventDefault();
      document.getElementById(h.id).scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    tocNav.appendChild(a);
  });
  if (tocSect) tocSect.style.display = 'block';
  var obs = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      var link = tocNav.querySelector('a[href="#' + entry.target.id + '"]');
      if (link) link.classList.toggle('active', entry.isIntersecting);
    });
  }, { rootMargin: '-10% 0px -80% 0px', threshold: 0 });
  headings.forEach(function(h) { obs.observe(h); });
})();

/* READING STATS */
(function() {
  var slug = '${art.slug}';
  var startTime = Date.now(), maxDepth = 0, statsSent = false;
  window.addEventListener('scroll', function() {
    var h = document.body.scrollHeight - window.innerHeight;
    if (h > 0) { var d = Math.round(window.scrollY / h * 100); if (d > maxDepth) maxDepth = d; }
  }, { passive: true });
  function sendStats() {
    if (statsSent) return; statsSent = true;
    var time = Math.round((Date.now() - startTime) / 1000);
    if (time < 5) return;
    navigator.sendBeacon('/.netlify/functions/track',
      new URLSearchParams({ slug: slug, time: time, depth: maxDepth }).toString());
  }
  window.addEventListener('pagehide', sendStats);
  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'hidden') sendStats();
  });
})();
</script>
<script src="/marc.js" defer></script>
<script src="/analytics.js" defer></script>
</body>
</html>`;
}

/* ── MAIN ── */
let count = 0;
posts.forEach(art => {
  if (!art.slug) return;
  try {
    const html    = generateHTML(art);
    const outPath = path.join(OUT_DIR, art.slug + '.html');
    fs.writeFileSync(outPath, html, 'utf8');
    console.log(`✓  blog/${art.slug}.html`);
    count++;
  } catch (err) {
    console.error(`✗  ${art.slug}:`, err.message);
  }
});
console.log(`\n→ ${count} article(s) généré(s) dans /blog/`);
