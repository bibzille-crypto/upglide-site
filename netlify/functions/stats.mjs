import { getStore } from '@netlify/blobs';

const HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'no-store',
};

export default async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: HEADERS });
  if (req.method !== 'GET') return new Response('Method Not Allowed', { status: 405 });

  try {
    const store = getStore('blog-stats');
    const { blobs } = await store.list();

    const result = {};
    await Promise.all(blobs.map(async (item) => {
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
      } catch (_) {}
    }));

    return new Response(JSON.stringify(result), { status: 200, headers: HEADERS });
  } catch (e) {
    console.error('[stats]', e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: HEADERS });
  }
};
