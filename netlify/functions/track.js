/* ── Upglide — Article read tracking ──
   Receives beacon POST from article pages, aggregates stats in Netlify Blobs.
   Data stored per slug: { views, totalTime, totalDepth, lastSeen } */

const { getStore } = require('@netlify/blobs');

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // sendBeacon sends URLSearchParams body
    const params = new URLSearchParams(event.body || '');
    const slug   = (params.get('slug') || '').trim();
    const time   = Math.min(Math.max(parseInt(params.get('time')  || '0', 10), 0), 7200); // cap 2h
    const depth  = Math.min(Math.max(parseInt(params.get('depth') || '0', 10), 0), 100);

    // Validate slug (only lowercase letters, digits, hyphens)
    if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
      return { statusCode: 400, body: 'Invalid slug' };
    }

    const store = getStore('blog-stats');

    // Read existing aggregate
    let stats = { views: 0, totalTime: 0, totalDepth: 0, lastSeen: null };
    try {
      const existing = await store.get(slug, { type: 'json' });
      if (existing) stats = existing;
    } catch (_) { /* first time — start fresh */ }

    // Update running totals
    stats.views      = (stats.views      || 0) + 1;
    stats.totalTime  = (stats.totalTime  || 0) + time;
    stats.totalDepth = (stats.totalDepth || 0) + depth;
    stats.lastSeen   = new Date().toISOString();

    await store.set(slug, JSON.stringify(stats));

    return { statusCode: 204, body: '' };
  } catch (e) {
    console.error('[track]', e);
    return { statusCode: 500, body: 'Internal error' };
  }
};
