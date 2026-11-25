import fs from 'node:fs';
import path from 'node:path';

const distDir = path.resolve('dist');
const siteUrl = 'https://tizidaquan.blog';
const today = '2026-11-25';

if (!fs.existsSync(distDir)) {
  console.error('[FAIL] dist/ directory not found. Run astro build first.');
  process.exit(1);
}

function walkHtml(dir, base = '') {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = path.posix.join(base, entry.name);
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '_astro' || entry.name === 'pagefind') continue;
      out.push(...walkHtml(full, rel));
    } else if (entry.name === 'index.html') {
      const route = base === '' ? '/' : `/${base}/`;
      out.push({ route, full });
    }
  }
  return out;
}

const htmlFiles = walkHtml(distDir);
const excludedPrefixes = ['/search/', '/404/'];

const buckets = {
  hubs: [],
  brands: [],
  devices: [],
  ai: [],
  streaming: [],
  beginners: [],
  safety: [],
  troubleshooting: [],
  articles: [],
};

for (const item of htmlFiles) {
  if (excludedPrefixes.some((ex) => item.route === ex || item.route.startsWith(ex))) continue;
  const html = fs.readFileSync(item.full, 'utf8');
  if (/<meta\s+name="robots"\s+content="[^"]*noindex/i.test(html)) continue;

  const modMatch = html.match(/article:modified_time"\s+content="([^"]+)"/i) || html.match(/dateModified":"([^"]+)"/i);
  const lastmod = (modMatch && modMatch[1].slice(0, 10)) || today;

  const priority =
    item.route === '/'
      ? '1.0'
      : item.route.startsWith('/devices/')
        ? '0.9'
        : item.route.startsWith('/beginners/') || item.route.startsWith('/safety/') || item.route.startsWith('/troubleshooting/')
          ? '0.85'
          : item.route.startsWith('/ai/') || item.route.startsWith('/streaming/') || item.route.startsWith('/brands/')
            ? '0.8'
            : '0.7';

  const entry = {
    loc: `${siteUrl}${item.route}`,
    lastmod,
    changefreq: item.route === '/' ? 'daily' : 'weekly',
    priority,
  };

  if (item.route.startsWith('/brands/')) buckets.brands.push(entry);
  else if (item.route.startsWith('/devices/')) buckets.devices.push(entry);
  else if (item.route.startsWith('/ai/')) buckets.ai.push(entry);
  else if (item.route.startsWith('/streaming/')) buckets.streaming.push(entry);
  else if (item.route.startsWith('/beginners/')) buckets.beginners.push(entry);
  else if (item.route.startsWith('/safety/')) buckets.safety.push(entry);
  else if (item.route.startsWith('/troubleshooting/')) buckets.troubleshooting.push(entry);
  else if (item.route.startsWith('/articles/')) buckets.articles.push(entry);
  else buckets.hubs.push(entry);
}

function renderUrlset(items) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${items
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`;
}

const sitemapFiles = [];
for (const [key, list] of Object.entries(buckets)) {
  if (list.length === 0) continue;
  const fname = `sitemap-${key}.xml`;
  fs.writeFileSync(path.join(distDir, fname), renderUrlset(list), 'utf8');
  sitemapFiles.push(fname);
}

const indexXml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapFiles
  .map(
    (fname) => `  <sitemap>
    <loc>${siteUrl}/${fname}</loc>
    <lastmod>${today}</lastmod>
  </sitemap>`
  )
  .join('\n')}
</sitemapindex>
`;

fs.writeFileSync(path.join(distDir, 'sitemap.xml'), indexXml, 'utf8');
fs.writeFileSync(path.join(distDir, 'sitemap-index.xml'), indexXml, 'utf8');

const totalUrls = Object.values(buckets).reduce((sum, arr) => sum + arr.length, 0);
console.log(
  `✓ Generated split sitemaps (${totalUrls} indexable URLs across ${sitemapFiles.length} sub-sitemaps: ${sitemapFiles.join(', ')})`
);
