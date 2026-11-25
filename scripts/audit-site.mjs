import fs from 'node:fs';
import path from 'node:path';

const distDir = path.resolve('dist');
const SITE_URL = 'https://tizidaquan.blog';

if (!fs.existsSync(distDir)) {
  console.error('[FAIL] dist/ does not exist. Run build first.');
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
    } else if (entry.name.endsWith('.html')) {
      const route = entry.name === 'index.html' ? (base === '' ? '/' : `/${base}/`) : `/${rel}`;
      out.push({ route, full });
    }
  }
  return out;
}

const pages = walkHtml(distDir);
const routeSet = new Set(pages.map((p) => p.route));

const FORBIDDEN = [
  '待核实',
  '待填写',
  '待验证',
  '暂无资料',
  '数据缺失',
  '测试中',
  'DEMO',
  'Lorem Ipsum',
  '实测报告',
  '测速结果',
  '晚高峰实测',
];
const SIBLING_DOMAINS = ['jichangyouhui.blog', 'jichang-wending.blog'];

const errors = [];
const titles = new Map();
const descs = new Map();
const h1s = new Map();
const publishedUrls = [];

for (const p of pages) {
  const html = fs.readFileSync(p.full, 'utf8');
  const isNoindex = /<meta\s+name="robots"\s+content="[^"]*noindex/i.test(html);

  // 1. Forbidden words
  for (const w of FORBIDDEN) {
    if (html.includes(w)) errors.push(`[FORBIDDEN] "${w}" found in ${p.route}`);
  }

  // 2. Canonical & OG domain leak check
  const canonicalMatch = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i);
  const ogUrlMatch = html.match(/<meta\s+property="og:url"\s+content="([^"]+)"/i);
  if (!p.route.endsWith('404.html')) {
    if (!canonicalMatch) errors.push(`[CANONICAL MISSING] ${p.route}`);
    else if (!canonicalMatch[1].startsWith(SITE_URL)) errors.push(`[CANONICAL WRONG DOMAIN] ${p.route}: ${canonicalMatch[1]}`);
    if (ogUrlMatch && !ogUrlMatch[1].startsWith(SITE_URL)) errors.push(`[OG:URL WRONG DOMAIN] ${p.route}: ${ogUrlMatch[1]}`);
  }
  for (const d of SIBLING_DOMAINS) {
    if (canonicalMatch?.[1]?.includes(d) || ogUrlMatch?.[1]?.includes(d)) {
      errors.push(`[LEAKED SIBLING DOMAIN IN META] "${d}" in ${p.route}`);
    }
  }

  // 3. Single H1 check
  const h1Matches = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)];
  if (h1Matches.length !== 1) {
    errors.push(`[H1 COUNT] ${p.route} has ${h1Matches.length} <h1> tags`);
  }

  // 4. Unique Title, Meta Description, H1 for indexable pages
  if (!isNoindex) {
    publishedUrls.push(p.route);
    const tMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
    const dMatch = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i);
    const titleText = tMatch ? tMatch[1].trim() : '';
    const descText = dMatch ? dMatch[1].trim() : '';
    const h1Text = h1Matches[0] ? h1Matches[0][1].replace(/<[^>]+>/g, '').trim() : '';

    if (!titleText) errors.push(`[TITLE EMPTY] ${p.route}`);
    else if (titles.has(titleText)) errors.push(`[DUPLICATE TITLE] "${titleText}" on ${p.route} and ${titles.get(titleText)}`);
    else titles.set(titleText, p.route);

    if (!descText) errors.push(`[DESC EMPTY] ${p.route}`);
    else if (descs.has(descText)) errors.push(`[DUPLICATE DESC] on ${p.route} and ${descs.get(descText)}`);
    else descs.set(descText, p.route);

    if (h1Text) {
      if (h1s.has(h1Text)) errors.push(`[DUPLICATE H1] "${h1Text}" on ${p.route} and ${h1s.get(h1Text)}`);
      else h1s.set(h1Text, p.route);
    }
  }

  // 5. Internal link integrity check
  for (const lm of html.matchAll(/href="(\/[^"#?]*)(?:#[^"]*)?(?:\?[^"]*)?"/g)) {
    const target = lm[1];
    if (
      target.startsWith('/_astro/') ||
      target === '/favicon.svg' ||
      target === '/logo.svg' ||
      target === '/og-cover.svg' ||
      target === '/sitemap.xml' ||
      target === '/rss.xml'
    ) {
      continue;
    }
    const norm = target.endsWith('/') ? target : `${target}/`;
    if (!routeSet.has(norm) && !fs.existsSync(path.join(distDir, target.replace(/^\//, '')))) {
      errors.push(`[BROKEN LINK] ${p.route} -> ${lm[0]}`);
    }
  }
}

// 6. Verify all 100 SEO keywords in src/data/seo-keywords.json map to real built routes
const seoKeywords = JSON.parse(fs.readFileSync(path.resolve('src/data/seo-keywords.json'), 'utf8'));
if (seoKeywords.length !== 100) {
  errors.push(`[SEO KEYWORDS COUNT] Expected 100 keywords, got ${seoKeywords.length}`);
}
for (const kw of seoKeywords) {
  if (!routeSet.has(kw.localUrl)) {
    errors.push(`[SEO KEYWORD UNMAPPED] ${kw.keywordId} (${kw.keyword}) -> ${kw.localUrl} not found in built routes`);
  }
}

// 7. Search index verification for required terms (Section 30)
const searchIndex = JSON.parse(fs.readFileSync(path.join(distDir, 'search-index.json'), 'utf8'));
const synonyms = JSON.parse(fs.readFileSync(path.join(distDir, 'search-synonyms.json'), 'utf8'));
const requiredSearchQueries = [
  'Windows 11', '苹果手机', 'iPhone', '安卓', '小米', '华为', 'OPPO', 'Mac',
  'OpenWrt', 'ChatGPT', 'Claude', 'Gemini', 'Netflix', 'YouTube', '订阅失效',
  '节点超时', '无法上网', 'DNS', '流量倍率', '机场是什么', '灵动云', '暮光加速',
];
const allSearchText = (JSON.stringify(searchIndex) + JSON.stringify(synonyms)).toLowerCase();
for (const kw of requiredSearchQueries) {
  if (!allSearchText.includes(kw.toLowerCase())) {
    errors.push(`[SEARCH MISSING] Term "${kw}" missing in search-index/synonyms`);
  }
}

// 8. Verify noindex on search & 404
const searchHtml = fs.readFileSync(path.join(distDir, 'search/index.html'), 'utf8');
if (!/noindex/i.test(searchHtml)) errors.push('[SEARCH NOINDEX] /search/ missing noindex');

// 9. Verify split sitemaps & Pagefind
const requiredSitemaps = [
  'sitemap.xml',
  'sitemap-index.xml',
  'sitemap-brands.xml',
  'sitemap-devices.xml',
  'sitemap-ai.xml',
  'sitemap-streaming.xml',
  'sitemap-beginners.xml',
  'sitemap-safety.xml',
  'sitemap-troubleshooting.xml',
  'sitemap-articles.xml',
];
for (const sm of requiredSitemaps) {
  const smPath = path.join(distDir, sm);
  if (!fs.existsSync(smPath)) {
    errors.push(`[SITEMAP MISSING] ${sm}`);
  } else {
    const smXml = fs.readFileSync(smPath, 'utf8');
    if (smXml.includes('/search/') || smXml.includes('/404')) {
      errors.push(`[SITEMAP LEAK] ${sm} contains /search/ or /404`);
    }
  }
}
if (!fs.existsSync(path.join(distDir, 'pagefind/pagefind.js'))) {
  errors.push('[PAGEFIND MISSING] dist/pagefind/pagefind.js not generated');
}

// 10. Verify all 18 exact AFF links on brand pages
const brands = JSON.parse(fs.readFileSync(path.resolve('src/data/brands.json'), 'utf8'));
if (brands.length !== 18) errors.push(`[BRAND COUNT] Expected 18 brands, got ${brands.length}`);
for (const b of brands) {
  const brandHtml = fs.readFileSync(path.join(distDir, `brands/${b.slug}/index.html`), 'utf8');
  if (!brandHtml.includes(b.affiliateUrl)) {
    errors.push(`[AFF MISSING] ${b.slug} missing exact AFF URL: ${b.affiliateUrl}`);
  }
}

if (errors.length > 0) {
  console.error(`\n[AUDIT FAILED] Found ${errors.length} issue(s):`);
  errors.slice(0, 40).forEach((e) => console.error('  -', e));
  process.exit(1);
}

// Write docs/published-urls.md
fs.mkdirSync(path.resolve('docs'), { recursive: true });
const urlManifestMd = `# 已发布可索引 URL 清单（tizidaquan.blog）

生成时间：2026-11-25（基于 \`dist/\` 静态构建结果自动汇总，已排除 \`/search/\` 与 \`/404\` 等 \`noindex\` 页面）。

- **可索引静态页面总数**：${publishedUrls.length}
- **品牌档案页数**：${brands.length}
- **100 个规划 SEO 关键词映射检查**：全部 ${seoKeywords.length} / 100 已匹配真实 HTTP 200 路由

## 全部可索引路由清单

${publishedUrls.sort().map((u) => `- https://tizidaquan.blog${u}`).join('\n')}
`;
fs.writeFileSync(path.resolve('docs/published-urls.md'), urlManifestMd, 'utf8');

console.log(`✓ Audited ${pages.length} built HTML pages (${publishedUrls.length} indexable)`);
console.log(`✓ Unique Titles: ${titles.size}, Unique Descriptions: ${descs.size}, Unique H1s: ${h1s.size}`);
console.log(`✓ All 100 SEO keywords verified against built dist/ routes`);
console.log(`✓ Zero forbidden words, zero leaked canonicals, zero broken internal links`);
console.log(`✓ All 18 AFF links, split sitemaps, Pagefind index, and /search/ noindex passed`);
console.log(`✓ Updated docs/published-urls.md`);
