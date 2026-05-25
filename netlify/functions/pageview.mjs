import { getStore } from '@netlify/blobs';

const VALID_PATHS = [
  '/', '/blog', '/podcast', '/ressources', '/a-propos', '/contact',
  '/audit-rentabilite-ecommerce', '/methode-marc', '/guide-fuites-marge',
];

export default async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  try {
    const text = await req.text();
    const params = new URLSearchParams(text);
    let path = (params.get('path') || '/').trim().replace(/\.html$/, '').replace(/\/+$/, '') || '/';
    const slug = params.get('slug') || '';

    if (path === '/article' && slug) {
      path = '/blog/' + slug.replace(/[^a-z0-9-]/g, '');
    }

    const isValid = VALID_PATHS.includes(path) || /^\/blog\/[a-z0-9-]+$/.test(path);
    if (!isValid) return new Response('Invalid path', { status: 400 });

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
    return new Response(null, { status: 204 });
  } catch (e) {
    console.error('[pageview]', e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
