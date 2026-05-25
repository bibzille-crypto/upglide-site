import { getStore } from '@netlify/blobs';

const HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'no-store',
};

export default async (req) => {
  if (req.method !== 'GET') return new Response('Method Not Allowed', { status: 405 });

  try {
    const store = getStore('page-views');
    const { blobs } = await store.list();

    const result = {};
    await Promise.all(blobs.map(async (item) => {
      try {
        const data = await store.get(item.key, { type: 'json' });
        if (data && data.views > 0) {
          const path = '/' + item.key.replace(/_/g, '/');
          result[path === '/home' ? '/' : path] = {
            views:    data.views,
            lastSeen: data.lastSeen || null,
          };
        }
      } catch (_) {}
    }));

    return new Response(JSON.stringify(result), { status: 200, headers: HEADERS });
  } catch (e) {
    console.error('[pageviews-stats]', e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: HEADERS });
  }
};
