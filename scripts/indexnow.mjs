import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

/**
 * IndexNow incremental submission utility for https://tizidaquan.blog
 * Usage:
 *   INDEXNOW_KEY=<your-key> node scripts/indexnow.mjs          # Dry-run diff against .indexnow-cache.json
 *   INDEXNOW_KEY=<your-key> node scripts/indexnow.mjs --submit # Verify live key & submit changed URLs only
 */

const SITE_HOST = 'tizidaquan.blog';
const SITE_URL = `https://${SITE_HOST}`;
const CACHE_PATH = path.resolve('.indexnow-cache.json');
const DIST_DIR = path.resolve('dist');
const SUBMIT_MODE = process.argv.includes('--submit');
const API_KEY = process.env.INDEXNOW_KEY || '';

function loadCurrentSitemapUrls() {
  const sitemaps = fs.readdirSync(DIST_DIR).filter((f) => /^sitemap-.*\.xml$/.test(f) && f !== 'sitemap-index.xml');
  const urls = [];
  for (const sm of sitemaps) {
    const xml = fs.readFileSync(path.join(DIST_DIR, sm), 'utf8');
    for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
      urls.push(m[1]);
    }
  }
  return [...new Set(urls)];
}

function hashUrlContent(url) {
  const rel = url.replace(SITE_URL, '');
  const htmlPath = path.join(DIST_DIR, rel === '/' ? 'index.html' : `${rel.replace(/^\/|\/$/g, '')}/index.html`);
  if (!fs.existsSync(htmlPath)) return null;
  const content = fs.readFileSync(htmlPath, 'utf8');
  return crypto.createHash('sha256').update(content).digest('hex').slice(0, 16);
}

async function main() {
  if (!fs.existsSync(DIST_DIR)) {
    console.error('[IndexNow] dist/ not found. Run npm run build first.');
    process.exit(1);
  }

  const urls = loadCurrentSitemapUrls();
  const prevCache = fs.existsSync(CACHE_PATH) ? JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8')) : {};
  const nextCache = {};
  const changedUrls = [];

  for (const u of urls) {
    const h = hashUrlContent(u);
    if (!h) continue;
    nextCache[u] = h;
    if (prevCache[u] !== h) changedUrls.push(u);
  }

  for (const oldUrl of Object.keys(prevCache)) {
    if (!nextCache[oldUrl]) changedUrls.push(oldUrl);
  }

  console.log(`[IndexNow] Total indexable URLs: ${urls.length}, Changed/New/Removed: ${changedUrls.length}`);

  if (!API_KEY) {
    console.log('[IndexNow] INDEXNOW_KEY environment variable is not set.');
    console.log('To enable IndexNow for tizidaquan.blog:');
    console.log('  1. Generate a 32-char hex key and save it at public/<KEY>.txt containing only <KEY>.');
    console.log('  2. Rebuild and deploy so https://tizidaquan.blog/<KEY>.txt returns HTTP 200.');
    console.log('  3. Run: INDEXNOW_KEY=<KEY> node scripts/indexnow.mjs --submit');
    return;
  }

  const keyFile = path.join(DIST_DIR, `${API_KEY}.txt`);
  if (!fs.existsSync(keyFile)) {
    console.error(`[IndexNow] Missing key verification file: public/${API_KEY}.txt`);
    process.exit(1);
  }

  if (changedUrls.length === 0) {
    console.log('[IndexNow] Zero changed URLs detected. Skipping submission.');
    return;
  }

  if (!SUBMIT_MODE) {
    console.log('[IndexNow] Dry-run mode. Changed URLs (first 10):');
    changedUrls.slice(0, 10).forEach((u) => console.log('  -', u));
    console.log('Pass --submit after confirming live deployment returns HTTP 200.');
    return;
  }

  const keyCheck = await fetch(`${SITE_URL}/${API_KEY}.txt`);
  if (!keyCheck.ok) {
    console.error(`[IndexNow] Live key check failed (${keyCheck.status}). Deploy first before --submit.`);
    process.exit(1);
  }

  const payload = {
    host: SITE_HOST,
    key: API_KEY,
    keyLocation: `${SITE_URL}/${API_KEY}.txt`,
    urlList: changedUrls.slice(0, 500),
  };

  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    console.error(`[IndexNow] Submission returned HTTP ${res.status}: ${await res.text()}`);
    process.exit(1);
  }

  fs.writeFileSync(CACHE_PATH, JSON.stringify(nextCache, null, 2), 'utf8');
  console.log(`✓ [IndexNow] Submitted ${payload.urlList.length} changed URL(s) (HTTP ${res.status}).`);
}

main().catch((err) => {
  console.error('[IndexNow] Error:', err);
  process.exit(1);
});
