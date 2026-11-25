import fs from 'node:fs';
import path from 'node:path';

const brands = JSON.parse(fs.readFileSync(path.resolve('src/data/brands.json'), 'utf8'));
const plans = JSON.parse(fs.readFileSync(path.resolve('src/data/plans/all-plans.json'), 'utf8'));
const coupons = JSON.parse(fs.readFileSync(path.resolve('src/data/coupons.json'), 'utf8'));
const synonymsRaw = fs.readFileSync(path.resolve('src/data/search-synonyms.json'), 'utf8');

function stripMarkdown(md) {
  return String(md || '')
    .replace(/^---[\s\S]*?---\s*/m, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[#>*`|_-]{1,}/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseFrontmatter(md) {
  const m = md.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!m) return { data: {}, body: md };
  const data = {};
  for (const line of m[1].split(/\r?\n/)) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim();
    try {
      data[key] = JSON.parse(val);
    } catch {
      data[key] = val.replace(/^["']|["']$/g, '');
    }
  }
  return { data, body: m[2] };
}

const docs = [];

// 1. 18 Brands
for (const b of brands) {
  const faqText = (b.faqs || []).map((f) => `${f.q} ${f.a}`).join(' ');
  docs.push({
    kind: 'brand',
    kindLabel: '机场品牌',
    title: `${b.name}${b.nameEn ? ` (${b.nameEn})` : ''}`,
    subtitle: b.tagline,
    url: `/brands/${b.slug}/`,
    category: '机场品牌档案',
    keywords: [
      b.name,
      b.nameEn,
      ...(b.aliases || []),
      b.coupon?.code,
      ...(b.regions || []),
      ...(b.protocols || []),
      ...(b.aiTools || []),
      ...(b.streaming || []),
      ...(b.supportedPlatforms || []),
      b.clientFlags?.thirdPartyLabel,
      b.lineTypeSummary,
    ]
      .filter(Boolean)
      .join(' '),
    body: `${b.summary} ${(b.clientPolicy || []).join(' ')} ${faqText}`.slice(0, 1100),
    meta: `${b.clientFlags?.thirdPartyLabel || '官方客户端'} · ${b.regions?.slice(0, 3).join('/')}`,
  });
}

// 2. Coupons & Plans (linked directly to brand anchor)
for (const c of coupons) {
  docs.push({
    kind: 'brand',
    kindLabel: '优惠码记录',
    title: `${c.brandName} 优惠码：${c.code}`,
    subtitle: `${c.discount}${c.appliesTo?.length ? ` · 适用：${c.appliesTo.join('、')}` : ''}`,
    url: `/brands/${c.brandSlug}/#plans`,
    category: '品牌套餐与优惠',
    keywords: `${c.code} ${c.brandName} 优惠码 折扣 ${c.discount}`,
    body: `${c.usage || ''} ${c.limits || ''} ${c.note || ''}`,
    meta: c.sampleDiscountedPrice ? `历史折后样本 ¥${c.sampleDiscountedPrice}` : '以结算页为准',
  });
}

const planNamesByBrand = new Map();
for (const p of plans) {
  if (!planNamesByBrand.has(p.brandSlug)) planNamesByBrand.set(p.brandSlug, new Set());
  planNamesByBrand.get(p.brandSlug).add(p.planName);
}
for (const [slug, names] of planNamesByBrand.entries()) {
  const b = brands.find((x) => x.slug === slug);
  if (!b) continue;
  docs.push({
    kind: 'brand',
    kindLabel: '品牌套餐',
    title: `${b.name} 历史套餐与计费规则（${[...names].slice(0, 4).join('、')}）`,
    subtitle: `共 ${b.totalPlanCount} 条套餐记录（记录日期 ${b.historyPriceDate}）`,
    url: `/brands/${b.slug}/#plans`,
    category: '套餐价格数据库',
    keywords: `${b.name} 套餐 ${[...names].join(' ')} ${b.ratio || ''}`,
    body: `${(b.trafficRules || []).join(' ')} ${b.cycleDiscounts || ''}`,
    meta: `历史最低 ¥${b.minFirstPurchase}`,
  });
}

// 3. Content Collections
const COLLECTIONS = [
  { dir: 'src/content/devices', kind: 'device', kindLabel: '设备教程', urlPrefix: '/devices/' },
  { dir: 'src/content/ai', kind: 'ai', kindLabel: 'AI 知识', urlPrefix: '/ai/' },
  { dir: 'src/content/streaming', kind: 'streaming', kindLabel: '流媒体', urlPrefix: '/streaming/' },
  { dir: 'src/content/beginners', kind: 'beginners', kindLabel: '新手百科', urlPrefix: '/beginners/' },
  { dir: 'src/content/safety', kind: 'safety', kindLabel: '安全隐私', urlPrefix: '/safety/' },
  { dir: 'src/content/troubleshooting', kind: 'troubleshooting', kindLabel: '网络排障', urlPrefix: '/troubleshooting/' },
  { dir: 'src/content/articles', kind: 'article', kindLabel: '深度文章', urlPrefix: '/articles/' },
];

function walkMdFiles(dir, base = '') {
  if (!fs.existsSync(dir)) return [];
  const res = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = base ? `${base}/${entry.name}` : entry.name;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      res.push(...walkMdFiles(full, rel));
    } else if (entry.name.endsWith('.md')) {
      res.push({ rel, full });
    }
  }
  return res;
}

for (const col of COLLECTIONS) {
  const files = walkMdFiles(path.resolve(col.dir));
  for (const f of files) {
    const raw = fs.readFileSync(f.full, 'utf8');
    const { data, body } = parseFrontmatter(raw);
    if (data.draft || data.indexable === false) continue;
    const relSlug = (data.slug || f.rel.replace(/\.md$/, '')).replace(/^\/+|\/+$/g, '');
    const url = `${col.urlPrefix}${relSlug}/`;
    const faqStr = Array.isArray(data.faqs) ? data.faqs.map((x) => `${x.q} ${x.a}`).join(' ') : '';
    docs.push({
      kind: col.kind,
      kindLabel: col.kindLabel,
      title: data.title,
      subtitle: data.description,
      url,
      category: data.category || col.kindLabel,
      keywords: [
        data.title,
        data.primaryKeyword,
        ...(Array.isArray(data.secondaryKeywords) ? data.secondaryKeywords : []),
        data.brand,
        data.platform,
        data.device,
        ...(Array.isArray(data.tags) ? data.tags : []),
      ]
        .filter(Boolean)
        .join(' '),
      body: `${stripMarkdown(body)} ${faqStr}`.slice(0, 900),
      meta: `${data.category || col.kindLabel} · ${data.updatedDate || '2026-11-25'}`,
    });
  }
}

// 4. Core Hubs & Static Pages
const hubs = [
  {
    kind: 'hub',
    kindLabel: '知识百科首页',
    title: '2026梯子大全｜设备使用教程、机场新手指南与网络问题排查',
    url: '/',
    category: '全站总览',
    keywords: '梯子大全 机场使用教程大全 网络工具知识百科 机场新手入门大全 多设备网络使用指南 梯子推荐 2026梯子推荐',
    body: '汇集18家机场品牌真实资料、Windows/macOS/iPhone/iPad/安卓/OPPO/小米/华为/Linux/OpenWrt设备教程、AI与流媒体知识、新手入门与安全排障指南。',
  },
  {
    kind: 'hub',
    kindLabel: '工具知识',
    title: '网络代理工具与客户端生态知识中心',
    url: '/tools/',
    category: '梯子知识',
    keywords: '梯子推荐 2026梯子推荐 科学上网梯子 魔法梯子推荐 翻墙梯子推荐 魔法上网工具有哪些 Clash Shadowrocket 官方客户端',
    body: '系统梳理品牌官方自研客户端、Nextin、Clash Verge Rev/Mihomo、Shadowrocket 与 sing-box 等网络工具分类及设备兼容性。',
  },
  {
    kind: 'hub',
    kindLabel: '协议科普',
    title: 'VPN 和机场有什么区别？加密隧道与规则分流对比',
    url: '/tools/vpn-and-proxy/',
    category: '梯子知识',
    keywords: 'VPN梯子哪个好 VPN和机场有什么区别 机场和VPN哪个划算 VPN加速器推荐 协议区别',
    body: '深入对比传统商业 VPN、游戏加速器与机场代理服务在协议原理、分流机制、设备限制与计费模式上的核心差异。',
  },
  {
    kind: 'device',
    kindLabel: '设备中心',
    title: '设备与操作系统使用教程中心（15 类终端）',
    url: '/devices/',
    category: '设备教程',
    keywords: '魔法上网教程 Windows 11 Windows 10 Windows 7 Mac iPhone iPad 安卓 OPPO 小米 华为 Linux 路由器 OpenWrt Chrome Edge',
    body: '覆盖桌面电脑、苹果与安卓各品牌手机、平板、家用路由器及浏览器代理设置的系统级百科入口与智能设备选择助手。',
  },
  {
    kind: 'ai',
    kindLabel: 'AI 专区',
    title: 'AI 工具网络使用知识中心（ChatGPT / Claude / Gemini）',
    url: '/ai/',
    category: 'AI 知识',
    keywords: 'ChatGPT Claude Gemini OpenAI AI工具网络加速 AI解锁节点 AI地区限制',
    body: '依据平台官方地区支持清单，区分账号验证、节点地区、浏览器缓存与服务状态故障，帮助解决 AI 工具访问难题。',
  },
  {
    kind: 'streaming',
    kindLabel: '流媒体专区',
    title: '流媒体网络使用知识中心（Netflix / YouTube / Disney+ / TikTok）',
    url: '/streaming/',
    category: '流媒体知识',
    keywords: 'Netflix YouTube Disney+ TikTok 流媒体解锁 缓冲慢 直播低延迟',
    body: '介绍平台区域版权差异、视频画质带宽估算、合法自查状态方法及 18 家品牌流媒体公开资料覆盖情况。',
  },
  {
    kind: 'beginners',
    kindLabel: '新手百科',
    title: '机场新手入门知识百科与网络术语词典',
    url: '/beginners/',
    category: '新手百科',
    keywords: '科学上网入门指南 机场是什么 机场订阅 节点 代理 直连 流量 倍率 流量重置 系统代理 DNS 客户端',
    body: '六阶段新手学习路径与 12 个核心网络术语词典，零基础掌握账号注册、流量计算、倍率与买前选型方法。',
  },
  {
    kind: 'safety',
    kindLabel: '安全中心',
    title: '隐私安全、官网真假识别与购买风险中心',
    url: '/safety/',
    category: '安全与隐私',
    keywords: '机场安全吗 官网真假识别 钓鱼网站识别 购买风险 隐私保护 日志政策',
    body: '提供官网识别检查清单、防钓鱼指引、订阅链接保护、日志政策边界及短期试错买前风控知识。',
  },
  {
    kind: 'troubleshooting',
    kindLabel: '排障中心',
    title: '网络故障排查中心与智能排障导航助手',
    url: '/troubleshooting/',
    category: '网络排障',
    keywords: '机场打不开 节点连接失败 节点超时 订阅链接失效 速度慢 频繁断线 DNS问题 已连接无法上网 Clash无法访问',
    body: '按 11 类常见故障现象快速区分本地网络与服务端故障，提供安全的基础自查清单与各设备排障入口。',
  },
  {
    kind: 'hub',
    kindLabel: '品牌目录',
    title: '18 家机场品牌资料总目录与编辑展示顺序',
    url: '/brands/',
    category: '机场品牌',
    keywords: '魔法机场推荐 科学上网机场推荐 翻墙机场推荐 18家品牌 套餐 优惠码',
    body: '按编辑展示顺序汇总灵动云、暮光加速、微风网络、飞猫云、隐形人、FLYV等 18 家品牌完整核对档案。',
  },
  {
    kind: 'safety',
    kindLabel: '对比与方法论',
    title: '机场横向对比怎么做？公开评分标准与评估维度说明',
    url: '/comparison/methodology/',
    category: '方法论',
    keywords: '机场横向对比怎么做 机场评分标准 评估维度 价格比较方法',
    body: '公开本站横向对比的五大可核验维度（价格成本、客户端政策、地区覆盖、售后条款、透明风险）及数据边界。',
  },
  {
    kind: 'hub',
    kindLabel: '交互对比库',
    title: '18 家机场历史套餐与多维度横向对比表',
    url: '/comparison/',
    category: '品牌对比',
    keywords: '横向对比 客户端支持对比 设备限制对比 AI流媒体资料对比',
    body: '对比 18 家品牌的客户端政策、协议标注、地区节点、设备数量限制与历史最低套餐门槛。',
  },
];

for (const h of hubs) {
  docs.push({
    ...h,
    subtitle: h.body,
    meta: h.category,
  });
}

fs.mkdirSync(path.resolve('public'), { recursive: true });
fs.writeFileSync(path.resolve('public/search-index.json'), JSON.stringify(docs), 'utf8');
fs.writeFileSync(path.resolve('public/search-synonyms.json'), synonymsRaw, 'utf8');
console.log(`✓ Generated public/search-index.json (${docs.length} searchable Chinese documents)`);
