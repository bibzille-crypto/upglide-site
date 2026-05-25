/* ── Upglide — Stats API ──
   Returns aggregated reading stats for all articles.
   GET /.netlify/functions/stats → { [slug]: { views, avgTime, avgDepth, lastSeen } } */

const { getStore } = require('@netlify/blobs');

exports.handler = async function(event) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-store',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    if (!process.env.NETLIFY_TOKEN) return { statusCode: 500, headers: {'Content-Type':'application/json'}, body: JSON.stringify({ error: 'NETLIFY_TOKEN manquant — voir les variables d'environnement Netlify' }) };
    const store = getStore({ name: 'blog-stats', siteID: process.env.SITE_ID, token: process.env.NETLIFY_TOKEN });
    const { blobs } = await store.list();

    const result = {};
    await Promise.all(
      blobs.map(async function(item) {
        try {
          const data = await store.get(item.key, { type: 'json' });
          if (data && data.views > 0) {
            result[item.key] = {
              views:    data.views,
              avgTime:  Math.round((data.totalTime  || 0) / data.views),
              avgDepth: Math.round((data.totalDepth || 0) / data.views),
              lastSeen: data.lastSeen || null,
            };
          }
        } catch (_) { /* skip corrupted entry */ }
      })
    );

    return { statusCode: 200, headers, body: JSON.stringify(result) };
  } catch (e) {
    console.error('[stats]', e);
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message || 'Could not load stats', type: e.constructor ? e.constructor.name : 'Error' }) };
  }
};
