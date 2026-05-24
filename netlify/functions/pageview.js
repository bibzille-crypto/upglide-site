/* ── Upglide — Page view tracking ──
   Receives beacon POST from all pages, counts views per path in Netlify Blobs. */

const { getStore } = require('@netlify/blobs');

// Pages autorisées (évite le spam)
const VALID_PATHS = [
  '/', '/blog', '/podcast', '/ressources', '/a-propos', '/contact',
  '/audit-rentabilite-ecommerce', '/methode-marc', '/guide-fuites-marge',
];

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const params = new URLSearchParams(event.body || '');
    let path = (params.get('path') || '/').trim();
    const slug = params.get('slug') || ''; // article slug si c'est un article

    // Normalise le path (enlève .html, garde le slug d'article)
    path = path.replace(/\.html$/, '').replace(/\/+$/, '') || '/';
    if (path === '/article' && slug) {
      path = '/blog/' + slug.replace(/[^a-z0-9-]/g, '');
    }

    // Valide : soit un path connu, soit un article de blog
    const isValid = VALID_PATHS.includes(path) || /^\/blog\/[a-z0-9-]+$/.test(path);
    if (!isValid) return { statusCode: 400, body: 'Invalid path' };

    const store = getStore('page-views');
    const key = path.replace(/\//g, '_').replace(/^_/, '') || 'home';

    let stats = { views: 0, lastSeen: null };
    try {
      const existing = await store.get(key, { type: 'json' });
      if (existing) stats = existing;
    } catch (_) {}

    stats.views++;
    stats.lastSeen = new Date().toISOString();

    await store.set(key, JSON.stringify(stats));

    return { statusCode: 204, body: '' };
  } catch (e) {
    console.error('[pageview]', e);
    return { statusCode: 500, body: 'Error' };
  }
};
