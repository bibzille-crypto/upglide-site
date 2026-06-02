import { readFileSync, writeFileSync } from 'fs';

const BASE = 'https://upglide.fr';

const STATIC_PAGES = [
  { loc: '/',                           priority: '1.0', changefreq: 'weekly'  },
  { loc: '/audit-rentabilite-ecommerce', priority: '0.9', changefreq: 'monthly' },
  { loc: '/methode-marc',               priority: '0.8', changefreq: 'monthly' },
  { loc: '/guide-fuites-marge',         priority: '0.7', changefreq: 'monthly' },
  { loc: '/blog',                       priority: '0.8', changefreq: 'weekly'  },
  { loc: '/podcast',                    priority: '0.7', changefreq: 'weekly'  },
  { loc: '/ressources',                 priority: '0.6', changefreq: 'monthly' },
  { loc: '/calculateur-cout-produit',    priority: '0.7', changefreq: 'monthly' },
  { loc: '/calculateur-marge-unitaire', priority: '0.7', changefreq: 'monthly' },
  { loc: '/a-propos',                   priority: '0.5', changefreq: 'yearly'  },
  { loc: '/contact',                    priority: '0.5', changefreq: 'yearly'  },
];

const blog = JSON.parse(readFileSync('./data/blog.json', 'utf8'));
const published = (blog.posts || []).filter(p => p.published && p.slug);

const articleEntries = published.map(p => ({
  loc:        `/blog/${p.slug}`,
  priority:   '0.7',
  changefreq: 'monthly',
  lastmod:    p.date || null,
}));

const all = [...STATIC_PAGES, ...articleEntries];

const urls = all.map(({ loc, priority, changefreq, lastmod }) => {
  const lastmodTag = lastmod ? `<lastmod>${lastmod}</lastmod>` : '';
  return `  <url><loc>${BASE}${loc}</loc>${lastmodTag}<priority>${priority}</priority><changefreq>${changefreq}</changefreq></url>`;
}).join('\n');

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

writeFileSync('./sitemap.xml', xml);
console.log(`[sitemap] ${all.length} URLs écrites (${articleEntries.length} articles)`);
