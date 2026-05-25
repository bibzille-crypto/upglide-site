import { getStore } from '@netlify/blobs';

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const text = await req.text();
    const params = new URLSearchParams(text);
    const slug  = (params.get('slug') || '').trim();
    const time  = Math.min(Math.max(parseInt(params.get('time')  || '0', 10), 0), 7200);
    const depth = Math.min(Math.max(parseInt(params.get('depth') || '0', 10), 0), 100);

    if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
      return new Response('Invalid slug', { status: 400 });
    }

    const store = getStore('blog-stats');
    let stats = { views: 0, totalTime: 0, totalDepth: 0, lastSeen: null };
    try {
      const existing = await store.get(slug, { type: 'json' });
      if (existing) stats = existing;
    } catch (_) {}

    stats.views      = (stats.views      || 0) + 1;
    stats.totalTime  = (stats.totalTime  || 0) + time;
    stats.totalDepth = (stats.totalDepth || 0) + depth;
    stats.lastSeen   = new Date().toISOString();

    await store.set(slug, JSON.stringify(stats));
    return new Response(null, { status: 204 });
  } catch (e) {
    console.error('[track]', e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
