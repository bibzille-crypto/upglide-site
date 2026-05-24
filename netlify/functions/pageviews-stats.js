/* ── Upglide — Page views stats API ──
   GET /.netlify/functions/pageviews-stats → { [path]: { views, lastSeen } } */

const { getStore } = require('@netlify/blobs');

exports.handler = async function(event) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-store',
  };

  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const store = getStore('page-views');
    const { blobs } = await store.list();

    const result = {};
    await Promise.all(
      blobs.map(async function(item) {
        try {
          const data = await store.get(item.key, { type: 'json' });
          if (data && data.views > 0) {
            // Reconvertit la clé en path lisible
            const path = '/' + item.key.replace(/_/g, '/').replace(/^\//, '');
            result[path === '/' ? '/' : path] = {
              views: data.views,
              lastSeen: data.lastSeen || null,
            };
          }
        } catch (_) {}
      })
    );

    return { statusCode: 200, headers, body: JSON.stringify(result) };
  } catch (e) {
    console.error('[pageviews-stats]', e);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Error' }) };
  }
};
