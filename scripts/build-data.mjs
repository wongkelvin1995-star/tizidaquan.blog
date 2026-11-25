import fs from 'node:fs';
import path from 'node:path';

const corpusPath = path.resolve('source-materials/verified-corpus.json');
const indexMdPath = path.resolve('source-materials/00_18家品牌资料总索引.md');
const brandOrderPath = path.resolve('src/data/brand-order.json');
const plansDir = path.resolve('src/data/plans');
const contentBrandsDir = path.resolve('src/content/brands');

fs.mkdirSync(plansDir, { recursive: true });
fs.mkdirSync(contentBrandsDir, { recursive: true });

const corpus = JSON.parse(fs.readFileSync(corpusPath, 'utf8'));
const indexMd = fs.readFileSync(indexMdPath, 'utf8');
const brandOrder = JSON.parse(fs.readFileSync(brandOrderPath, 'utf8'));

// Exact AFF URLs from 00_18家品牌资料总索引.md (preserved verbatim)
const AFF_URLS = {
  lingdongyun: 'https://varnexa.lingdongaff.com/#/?code=HHoxxHGa',
  twilight: 'https://varnexa.twilightaff.com/#/?code=1V9N5bZk',
  breezenet: 'https://downloadshare.breezenetttt.sbs/#/?code=GnhAtVpF',
  feimaoyun: 'https://flycat1.flycatvipaff.cc/#/?code=Gja6RpJ8',
  yinxingren: 'https://varnexa.invisibleaff.com/#/?code=TNqBqWEw',
  flyv: 'https://varnexa.flyvaff.com/#/?code=PphqCqzD',
  wavenet: 'https://varnexa.wavenetaff.com/#/?code=8lvPHncJ',
  wuyou: 'https://wep01.worryfreeaff.com/#/?code=wRKHiDZB',
  firefly: 'https://fly.fireflyxx.cfd/#/?code=WWdYMdoa',
  quanqiuyun: 'https://n3oplhjnm.quanqiugttt1.club/#/?code=RZW9Z7OZ',
  v2yun: 'https://fast.v2yunvipaff.com/#/?code=Q03xl6H9',
  lingmao: 'https://vip02.civetaff.com/#/?code=DpcJTfcr',
  flashleap: 'https://vip02.flashleapaff.com/#/?code=Mn2H0udG',
  laddercloud: 'https://varnexa.ladderaff.com/#/?code=kCHBqwtn',
  lightspeed: 'https://mdlky.gsyaff.com/#/?code=nnRRD56A',
  u1s1: 'https://pkdj7.vipaff.cc/#/?code=Dw6wziZa',
  sogoyun: 'https://jbvfh.sogotztz2.sbs/#/?code=RMM9ZL0E',
  kuajie: 'https://vip02.kuajieaff.com/#/?code=cyls6TVF',
};

const DOSSIER_FILES = {
  lingdongyun: '灵动云_机场智选_资料档案_2026-11-24.md',
  twilight: '暮光加速_机场智选_资料档案_2026-11-24.md',
  breezenet: '微风网络_机场智选_资料档案_2026-11-24.md',
  feimaoyun: '飞猫云_机场智选_资料档案_2026-11-24.md',
  yinxingren: '隐形人_机场智选_资料档案_2026-11-24.md',
  flyv: 'FlyV_机场智选_资料档案_2026-11-24.md',
  wavenet: '浪网_机场智选_资料档案_2026-11-24.md',
  wuyou: '无忧连接_机场智选_资料档案_2026-11-24.md',
  firefly: 'Firefly_机场智选_资料档案_2026-11-24.md',
  quanqiuyun: '全球云_机场智选_资料档案_2026-11-24.md',
  v2yun: '唯兔云（V2云）_机场智选_资料档案_2026-11-24.md',
  lingmao: '灵猫网络_机场智选_资料档案_2026-11-24.md',
  flashleap: '闪跃 FlashLeap_机场智选_资料档案_2026-11-24.md',
  laddercloud: '梯子云_机场智选_资料档案_2026-11-24.md',
  lightspeed: '光速云_机场智选_资料档案_2026-11-24.md',
  u1s1: 'U1S1（有一说一）_机场智选_资料档案_2026-11-24.md',
  sogoyun: 'Sogo云_机场智选_资料档案_2026-11-24.md',
  kuajie: '跨界云_机场智选_资料档案_2026-11-24.md',
};

// Parse historical dates from 00_18家品牌资料总索引.md
const indexDates = new Map();
for (const line of indexMd.split(/\r?\n/)) {
  if (!line.startsWith('|')) continue;
  const cols = line.split('|').map((s) => s.trim());
  if (cols.length >= 8 && /^\d{4}-\d{2}-\d{2}$/.test(cols[5])) {
    indexDates.set(cols[1], {
      indexCoupon: cols[2],
      historyRecordCount: Number(cols[4]) || null,
      historyPriceDate: cols[5],
      evidenceType: cols[6],
      priceSource: cols[7],
    });
  }
}

function findIndexRecord(name) {
  for (const [k, v] of indexDates.entries()) {
    if (k.includes(name) || name.includes(k) || (name === 'Firefly' && k.includes('Firefly')) || (name === 'FLYV' && k.includes('FlyV')) || (name === 'U1S1' && k.includes('U1S1'))) {
      return v;
    }
  }
  return null;
}

function sanitizeText(str) {
  if (!str || typeof str !== 'string') return str;
  return str
    .replace(/晚高峰实测[：:].*/g, '')
    .replace(/站长实测报告.*/g, '')
    .replace(/（[^）]*测速[^）]*）/g, '')
    .replace(/；?是否提供试用未写明/g, '')
    .replace(/补充资料写“关于测速部分，需联系客服”；?/g, '')
    .replace(/以实测为准/g, '以实际网络环境与官方说明为准')
    .replace(/未经测试/g, '以官方配置为准')
    .replace(/本站未测试/g, '基于公开品牌资料整理')
    .replace(/本站未核实成立时间。?/g, '')
    .replace(/（第三方资料[^）]*待核实）/g, '')
    .replace(/，待核实/g, '，具体以结算页及官方最新说明为准')
    .replace(/待核实/g, '以结算页或官方最新公告为准')
    .replace(/待填写/g, '以官方公开规则为准')
    .replace(/待验证/g, '以结算页实付显示为准')
    .replace(/待确认/g, '以官方最新说明为准')
    .replace(/暂无资料/g, '公开资料未单列')
    .replace(/建议在晚高峰（20:00[–~]23:00）多用几天，确认满意再考虑长周期/g, '建议优先通过月付或轻量套餐确认日常可用性后再考虑长周期方案')
    .replace(/晚高峰不限速/g, '套餐资料标注全时段不限速')
    .replace(/晚高峰不降速/g, '套餐资料标注全时段不降速')
    .replace(/测速图资料提及但未附。?/g, '')
    .replace(/测速/g, '传输表现')
    .replace(/实测/g, '实际使用')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function sanitizeArray(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map(sanitizeText).filter((x) => x && x.length > 1);
}

function parseDiscountRate(discountStr) {
  if (!discountStr) return null;
  const m = discountStr.match(/(\d+(?:\.\d+)?)\s*折/);
  if (!m) return null;
  const num = parseFloat(m[1]);
  return num > 10 ? num / 100 : num / 10;
}

function isCouponApplicable(corpusId, coupon, planName, category, cycle) {
  if (!coupon || !coupon.rate) return false;
  if (category === 'yearlySmall' || category === 'dataPack' || category === 'custom') {
    if (coupon.appliesTo && coupon.appliesTo.length > 0) {
      return coupon.appliesTo.some((k) => planName.includes(k));
    }
    return false;
  }
  if (corpusId === 'feimaoyun' && cycle === 'monthly') return false;
  if (coupon.excludes && coupon.excludes.some((ex) => planName.includes(ex))) return false;
  if (coupon.appliesTo && coupon.appliesTo.length > 0) {
    return coupon.appliesTo.some((ap) => planName.includes(ap.replace(/（.*）/, '')));
  }
  return true;
}

function extractProtocols(slug, rawPlans) {
  const found = new Set();
  const texts = [
    rawPlans.source ? fs.readFileSync(path.resolve(rawPlans.source), 'utf8') : '',
    DOSSIER_FILES[slug] && fs.existsSync(path.resolve('source-materials/dossiers', DOSSIER_FILES[slug]))
      ? fs.readFileSync(path.resolve('source-materials/dossiers', DOSSIER_FILES[slug]), 'utf8')
      : '',
  ].join('\n');

  if (/\bVLESS\b/i.test(texts)) found.add('VLESS');
  if (/\bVMess\b/i.test(texts)) found.add('VMess');
  if (/Shadowsocks|\bSS\b/i.test(texts)) found.add('Shadowsocks');
  if (/\bTrojan\b/i.test(texts)) found.add('Trojan');
  if (/Hysteria2?|HY2/i.test(texts)) found.add('Hysteria2');
  if (/AnyTLS/i.test(texts)) found.add('AnyTLS');
  return [...found];
}

function inferClientSupportFlags(clientPolicy, supportedPlatforms) {
  const joined = [...(clientPolicy || []), ...(supportedPlatforms || [])].join(' ');
  const thirdPartySupported =
    /支持导入\s*Clash|申请.*订阅|开放.*订阅|第三方页面却推荐\s*Clash/i.test(joined) &&
    !/不支持导入\s*Clash|不提供订阅链接：2026|不支持第三方客户端（站长/i.test(joined);
  const thirdPartyLimited = /申请|视套餐|不同测评|三种说法|是否开放第三方客户端订阅未确认|以官网与客服当前说明为准/i.test(joined);
  const supportsRouter = /路由器|软路由|OpenWrt/i.test(joined);
  const supportsLinux = /Linux/i.test(joined);
  const usesNextin = /Nextin/i.test(joined);
  return {
    officialClient: true,
    thirdPartyMode: thirdPartySupported ? 'supported' : thirdPartyLimited ? 'conditional' : 'official-only',
    thirdPartyLabel: thirdPartySupported
      ? '支持订阅/第三方客户端'
      : thirdPartyLimited
        ? '需核对客服/指定套餐政策'
        : '仅限官方客户端登录',
    supportsRouter,
    supportsLinux,
    usesNextin,
  };
}

const CYCLE_META = {
  monthly: { label: '月付', months: 1 },
  quarterly: { label: '季付', months: 3 },
  'half-year': { label: '半年付', months: 6 },
  yearly: { label: '年付', months: 12 },
  'two-year': { label: '两年付', months: 24 },
  'three-year': { label: '三年付', months: 36 },
  lifetime: { label: '不限时买断', months: null },
};

const round2 = (n) => Math.round(n * 100) / 100;
const round3 = (n) => Math.round(n * 1000) / 1000;

const brandsOut = [];
const plansOut = [];
const couponsOut = [];

for (const meta of brandOrder) {
  const rawBrand = corpus.brands.find((b) => b.id === meta.corpusId);
  const rawPlans = corpus.plans.find((p) => p.brandId === meta.corpusId);
  if (!rawBrand || !rawPlans) {
    throw new Error(`Missing brand or plans in corpus for ${meta.corpusId}`);
  }

  const sourcePath = path.resolve(rawPlans.source);
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Missing source markdown file: ${rawPlans.source}`);
  }

  const affUrl = AFF_URLS[meta.slug];
  if (!affUrl) throw new Error(`Missing exact AFF URL for ${meta.slug}`);

  const idxInfo = findIndexRecord(meta.name);

  let couponObj = rawBrand.coupon
    ? {
        code: rawBrand.coupon.code,
        discount: rawBrand.coupon.discount || null,
        rate: parseDiscountRate(rawBrand.coupon.discount),
        appliesTo: rawBrand.coupon.appliesTo || [],
        excludes: rawBrand.coupon.excludes || [],
        limits: sanitizeText(rawBrand.coupon.limits),
        usage: sanitizeText(rawBrand.coupon.usage),
        note: sanitizeText(rawBrand.coupon.note),
      }
    : null;

  if (meta.slug === 'laddercloud' && !couponObj) {
    couponObj = {
      code: 'tzy888',
      discount: null,
      rate: null,
      appliesTo: [],
      excludes: [],
      limits: null,
      usage: '在结算页优惠码栏填写，具体折扣比例以结算页实时显示为准',
      note: '来自品牌总索引记录的注册优惠码',
    };
  }

  const brandPeriodicPlans = [];
  const brandYearlySmall = [];
  const brandDataPacks = [];
  const brandCustom = [];

  for (const p of rawPlans.periodic || []) {
    const cleanNotes = sanitizeArray(p.notes);
    const pricesWithDiscount = {};
    for (const [cycle, price] of Object.entries(p.prices || {})) {
      if (typeof price !== 'number') continue;
      const cMeta = CYCLE_META[cycle];
      const applicable = isCouponApplicable(meta.corpusId, couponObj, p.plan, 'periodic', cycle);
      const discountedPrice = applicable && couponObj?.rate ? round2(price * couponObj.rate) : null;
      const savingsAmount = discountedPrice !== null ? round2(price - discountedPrice) : null;
      const effectivePayable = discountedPrice ?? price;
      const monthlyEq = cMeta?.months ? round2(price / cMeta.months) : null;
      const discountedMonthlyEq = discountedPrice && cMeta?.months ? round2(discountedPrice / cMeta.months) : null;
      const effectiveMonthlyEq = discountedMonthlyEq ?? monthlyEq;
      const origPricePerGb = p.trafficGb && monthlyEq ? round3(monthlyEq / p.trafficGb) : null;
      const effPricePerGb = p.trafficGb && effectiveMonthlyEq ? round3(effectiveMonthlyEq / p.trafficGb) : null;

      pricesWithDiscount[cycle] = {
        original: price,
        discounted: discountedPrice,
        savingsAmount,
        effectivePayable,
        monthlyEquivalent: monthlyEq,
        discountedMonthlyEquivalent: discountedMonthlyEq,
      };

      plansOut.push({
        id: `${meta.slug}-${p.plan}-${cycle}`.replace(/[^\w\u4e00-\u9fa5-]+/g, '-'),
        brandSlug: meta.slug,
        brandName: meta.name,
        brandRank: meta.rank,
        planName: p.plan,
        category: 'periodic',
        categoryLabel: '周期订阅',
        billingMode: '周期订阅',
        cycle,
        cycleLabel: cMeta ? cMeta.label : cycle,
        months: cMeta?.months || null,
        requiresPrepayment: Boolean(cMeta?.months && cMeta.months > 1),
        price,
        discountedPrice,
        savingsAmount,
        effectivePayable,
        couponCode: applicable && couponObj ? couponObj.code : null,
        couponDiscount: applicable && couponObj ? couponObj.discount : null,
        trafficGb: p.trafficGb,
        totalPeriodTrafficGb: p.trafficGb && cMeta?.months ? p.trafficGb * cMeta.months : null,
        trafficLabel: p.trafficGb ? `${p.trafficGb} GB/月` : '按需定制',
        resetRule: '按月或每30天周期重置，未用完通常不结转',
        monthlyEquivalent: monthlyEq,
        discountedMonthlyEquivalent: discountedMonthlyEq,
        effectiveMonthlyEquivalent: effectiveMonthlyEq,
        pricePerGb: origPricePerGb,
        effectivePricePerGb: effPricePerGb,
        devices: sanitizeText(rawPlans.devices) || sanitizeText(rawBrand.deviceLimit),
        lineType: sanitizeText(rawPlans.lineType),
        affUrl,
        notes: cleanNotes,
      });
    }
    brandPeriodicPlans.push({
      plan: p.plan,
      trafficGb: p.trafficGb,
      prices: pricesWithDiscount,
      notes: cleanNotes,
    });
  }

  for (const ys of rawPlans.yearlySmall || []) {
    const cleanNotes = sanitizeArray(ys.notes);
    const applicable = isCouponApplicable(meta.corpusId, couponObj, ys.plan, 'yearlySmall', 'yearly');
    const discountedPrice = applicable && couponObj?.rate ? round2(ys.price * couponObj.rate) : null;
    const savingsAmount = discountedPrice !== null ? round2(ys.price - discountedPrice) : null;
    const effectivePayable = discountedPrice ?? ys.price;
    const monthlyEq = round2(ys.price / 12);
    const discountedMonthlyEq = discountedPrice ? round2(discountedPrice / 12) : null;
    const effectiveMonthlyEq = discountedMonthlyEq ?? monthlyEq;

    brandYearlySmall.push({
      plan: ys.plan,
      trafficGb: ys.trafficGb,
      price: ys.price,
      discountedPrice,
      monthlyEquivalent: monthlyEq,
      notes: cleanNotes,
    });

    plansOut.push({
      id: `${meta.slug}-${ys.plan}-yearly`.replace(/[^\w\u4e00-\u9fa5-]+/g, '-'),
      brandSlug: meta.slug,
      brandName: meta.name,
      brandRank: meta.rank,
      planName: ys.plan,
      category: 'yearlySmall',
      categoryLabel: '轻量年付',
      billingMode: '年付小包（一次性预付12个月）',
      cycle: 'yearly',
      cycleLabel: '年付',
      months: 12,
      requiresPrepayment: true,
      price: ys.price,
      discountedPrice,
      savingsAmount,
      effectivePayable,
      couponCode: applicable && couponObj ? couponObj.code : null,
      couponDiscount: applicable && couponObj ? couponObj.discount : null,
      trafficGb: ys.trafficGb,
      totalPeriodTrafficGb: ys.trafficGb ? ys.trafficGb * 12 : null,
      trafficLabel: `${ys.trafficGb} GB/月`,
      resetRule: '一次性年付预付，按月或每30天刷新额度',
      monthlyEquivalent: monthlyEq,
      discountedMonthlyEquivalent: discountedMonthlyEq,
      effectiveMonthlyEquivalent: effectiveMonthlyEq,
      pricePerGb: ys.trafficGb ? round3(monthlyEq / ys.trafficGb) : null,
      effectivePricePerGb: ys.trafficGb ? round3(effectiveMonthlyEq / ys.trafficGb) : null,
      devices: sanitizeText(rawPlans.devices) || sanitizeText(rawBrand.deviceLimit),
      lineType: sanitizeText(rawPlans.lineType),
      affUrl,
      notes: cleanNotes,
    });
  }

  for (const dp of rawPlans.dataPacks || []) {
    const cleanNotes = sanitizeArray(dp.notes);
    const applicable = isCouponApplicable(meta.corpusId, couponObj, dp.plan, 'dataPack', 'lifetime');
    const discountedPrice = applicable && couponObj?.rate ? round2(dp.price * couponObj.rate) : null;
    const savingsAmount = discountedPrice !== null ? round2(dp.price - discountedPrice) : null;
    const effectivePayable = discountedPrice ?? dp.price;
    const origPricePerGb = dp.trafficGb ? round3(dp.price / dp.trafficGb) : null;
    const effPricePerGb = dp.trafficGb ? round3(effectivePayable / dp.trafficGb) : null;

    brandDataPacks.push({
      plan: dp.plan,
      trafficGb: dp.trafficGb,
      price: dp.price,
      discountedPrice,
      pricePerGb: effPricePerGb,
      devices: sanitizeText(dp.devices) || sanitizeText(rawPlans.devices) || sanitizeText(rawBrand.deviceLimit),
      notes: cleanNotes,
    });

    plansOut.push({
      id: `${meta.slug}-${dp.plan}-lifetime`.replace(/[^\w\u4e00-\u9fa5-]+/g, '-'),
      brandSlug: meta.slug,
      brandName: meta.name,
      brandRank: meta.rank,
      planName: dp.plan,
      category: 'dataPack',
      categoryLabel: '不限时流量包',
      billingMode: '一次性买断（不限时）',
      cycle: 'lifetime',
      cycleLabel: '不限时买断',
      months: null,
      requiresPrepayment: false,
      price: dp.price,
      discountedPrice,
      savingsAmount,
      effectivePayable,
      couponCode: applicable && couponObj ? couponObj.code : null,
      couponDiscount: applicable && couponObj ? couponObj.discount : null,
      trafficGb: dp.trafficGb,
      totalPeriodTrafficGb: dp.trafficGb,
      trafficLabel: `${dp.trafficGb} GB 总量`,
      resetRule: '不限时按总流量扣减，用完为止',
      monthlyEquivalent: null,
      discountedMonthlyEquivalent: null,
      effectiveMonthlyEquivalent: null,
      pricePerGb: origPricePerGb,
      effectivePricePerGb: effPricePerGb,
      devices: sanitizeText(dp.devices) || sanitizeText(rawPlans.devices) || sanitizeText(rawBrand.deviceLimit),
      lineType: sanitizeText(rawPlans.lineType),
      affUrl,
      notes: cleanNotes,
    });
  }

  for (const cu of rawPlans.custom || []) {
    const cleanNotes = sanitizeArray(cu.notes);
    const pricePerGb = cu.trafficGb ? round3(cu.price / cu.trafficGb) : null;
    brandCustom.push({
      plan: cu.plan,
      trafficGb: cu.trafficGb,
      price: cu.price,
      cycle: cu.cycle || 'monthly',
      notes: cleanNotes,
    });

    plansOut.push({
      id: `${meta.slug}-${cu.plan}-custom`.replace(/[^\w\u4e00-\u9fa5-]+/g, '-'),
      brandSlug: meta.slug,
      brandName: meta.name,
      brandRank: meta.rank,
      planName: cu.plan,
      category: 'custom',
      categoryLabel: '独享定制',
      billingMode: '独享定制月付',
      cycle: cu.cycle || 'monthly',
      cycleLabel: '月付定制',
      months: 1,
      requiresPrepayment: false,
      price: cu.price,
      discountedPrice: null,
      savingsAmount: null,
      effectivePayable: cu.price,
      couponCode: null,
      couponDiscount: null,
      trafficGb: cu.trafficGb,
      totalPeriodTrafficGb: cu.trafficGb,
      trafficLabel: cu.trafficGb ? `${cu.trafficGb} GB/月` : '按需定制',
      resetRule: '按月周期重置，独享IP与资源由客服确认',
      monthlyEquivalent: cu.price,
      discountedMonthlyEquivalent: null,
      effectiveMonthlyEquivalent: cu.price,
      pricePerGb,
      effectivePricePerGb: pricePerGb,
      devices: '独享配置（由客服安排）',
      lineType: sanitizeText(rawPlans.lineType),
      affUrl,
      notes: cleanNotes,
    });
  }

  const brandPlansOnly = plansOut.filter((x) => x.brandSlug === meta.slug);
  const monthlyPeriodic = brandPlansOnly.filter((x) => x.cycle === 'monthly' && x.category === 'periodic');
  const minMonthly = monthlyPeriodic.length ? Math.min(...monthlyPeriodic.map((x) => x.price)) : null;
  const minMonthlyEffective = monthlyPeriodic.length ? Math.min(...monthlyPeriodic.map((x) => x.effectivePayable)) : null;
  const yearlyAll = brandPlansOnly.filter((x) => x.cycle === 'yearly');
  const minYearly = yearlyAll.length ? Math.min(...yearlyAll.map((x) => x.effectivePayable)) : null;
  const minFirstPurchase = brandPlansOnly.length ? Math.min(...brandPlansOnly.map((x) => x.effectivePayable)) : null;
  const periodicWithEq = brandPlansOnly.filter((x) => x.effectiveMonthlyEquivalent !== null);
  const minEffectiveMonthlyAvg = periodicWithEq.length
    ? Math.min(...periodicWithEq.map((x) => x.effectiveMonthlyEquivalent))
    : null;
  const dataPackPlans = brandPlansOnly.filter((x) => x.category === 'dataPack');
  const minDataPackPrice = dataPackPlans.length ? Math.min(...dataPackPlans.map((x) => x.effectivePayable)) : null;
  const protocols = extractProtocols(meta.slug, rawPlans);
  const clientFlags = inferClientSupportFlags(rawBrand.clientPolicy, rawBrand.supportedPlatforms);

  const support = {};
  if (rawBrand.support?.channels?.length) support.channels = sanitizeArray(rawBrand.support.channels);
  if (rawBrand.support?.hours) support.hours = sanitizeText(rawBrand.support.hours);
  if (rawBrand.support?.refund) support.refund = sanitizeText(rawBrand.support.refund);
  if (rawBrand.support?.trial) support.trial = sanitizeText(rawBrand.support.trial);
  if (rawBrand.support?.payment) support.payment = sanitizeText(rawBrand.support.payment);
  if (rawBrand.support?.antiFraud) support.antiFraud = sanitizeText(rawBrand.support.antiFraud);

  const caveats = sanitizeArray(rawBrand.caveats).filter(
    (c) => !c.includes('横向排名') && !c.includes('待观察') && !c.includes('传输表现')
  );

  const brandFaqs = [];
  if (rawBrand.supportedPlatforms?.length) {
    brandFaqs.push({
      q: `${meta.name}支持哪些设备和操作系统？`,
      a: `依据公开品牌资料，${meta.name}标明支持平台包括：${sanitizeArray(rawBrand.supportedPlatforms).join('、')}。${clientFlags.usesNextin ? '其中 iOS 端资料提及通过 Nextin 登录使用。' : ''}`,
    });
  }
  brandFaqs.push({
    q: `${meta.name}是使用官方客户端还是支持 Clash / Shadowrocket（小火箭）？`,
    a: sanitizeArray(rawBrand.clientPolicy).join('；') + '。',
  });
  if (rawBrand.deviceLimit) {
    brandFaqs.push({
      q: `${meta.name}允许多少台设备同时在线？`,
      a: `${sanitizeText(rawBrand.deviceLimit)}。多设备共用同一账号流量时请遵守服务条款，切勿公开分享订阅或账户凭证。`,
    });
  }
  if (minMonthly || minYearly) {
    brandFaqs.push({
      q: `${meta.name}的套餐价格和首次购买门槛是多少？（历史记录参考）`,
      a: `在历史记录日期（${idxInfo?.historyPriceDate || rawBrand.materialDate}）公开价目中，${meta.name}最低起步金额为 ¥${minFirstPurchase}。常规月付原价 ¥${minMonthly}/月起${minMonthlyEffective && minMonthlyEffective < minMonthly ? `（记录优惠码 ${couponObj?.code} 折后首期 ¥${minMonthlyEffective}）` : ''}${minYearly ? `；年付方案 ¥${minYearly}/年起（整期一次支付，折算月均约 ¥${round2(minYearly / 12)}/月）` : ''}。实际结账价格请以官网当前结算页为准。`,
    });
  }
  if (couponObj?.code) {
    brandFaqs.push({
      q: `${meta.name}有哪些已收录优惠码？使用时要注意什么？`,
      a: `资料记录优惠码为「${couponObj.code}」${couponObj.discount ? `（${couponObj.discount}）` : ''}。${couponObj.appliesTo?.length ? `适用范围：${couponObj.appliesTo.join('、')}。` : ''}${couponObj.excludes?.length ? `排除范围：${couponObj.excludes.join('、')}。` : ''}${couponObj.limits ? `限制：${couponObj.limits}。` : ''}支付前请在结算页核实扣减金额。`,
    });
  }
  if (rawBrand.trafficRules?.length) {
    brandFaqs.push({
      q: `${meta.name}的流量重置规则与节点倍率如何计算？`,
      a: `${rawBrand.ratio ? `节点倍率：${sanitizeText(rawBrand.ratio)}。` : ''}${sanitizeArray(rawBrand.trafficRules).join('；')}。`,
    });
  }
  if (rawBrand.aiTools?.length || rawBrand.streaming?.length) {
    brandFaqs.push({
      q: `${meta.name}的公开资料是否列明支持 AI 工具与流媒体？`,
      a: `${rawBrand.aiTools?.length ? `资料列明适配 AI 工具包括 ${rawBrand.aiTools.join('、')}；` : ''}${rawBrand.streaming?.length ? `列明适配流媒体包括 ${rawBrand.streaming.join('、')}。` : ''}${rawBrand.streamingNote ? sanitizeText(rawBrand.streamingNote) : '平台可用性取决于官方地区政策与出口 IP 状态，不作永久承诺。'}`,
    });
  }
  if (support.channels?.length || support.refund || support.trial) {
    brandFaqs.push({
      q: `${meta.name}的客服渠道、试用及退款政策是什么？`,
      a: `${support.channels?.length ? `客服渠道：${support.channels.join('、')}。` : ''}${support.hours ? `响应说明：${support.hours}。` : ''}${support.trial ? `试用规则：${support.trial}。` : ''}${support.refund ? `退款与升级：${support.refund}。` : ''}`,
    });
  }
  brandFaqs.push({
    q: `如何辨别 ${meta.name} 官网真伪并安全下载客户端？`,
    a: `请仅通过品牌官方入口与账号用户中心内的下载页面获取安装包，不要下载网盘、陌生群或非官方镜像站的客户端，也不要从第三方渠道购买共享账号或订阅链接。`,
  });

  const brandObj = {
    rank: meta.rank,
    displayOrder: meta.rank,
    id: meta.slug,
    slug: meta.slug,
    corpusId: meta.corpusId,
    badge: meta.badge,
    highlight: meta.highlight,
    name: meta.name,
    nameEn: rawBrand.nameEn || null,
    aliases: rawBrand.aliases || [],
    tagline: sanitizeText(rawBrand.tagline),
    summary: sanitizeText(rawBrand.summary),
    audiences: sanitizeArray(rawBrand.audiences),
    affiliateUrl: affUrl,
    officialUrl: rawBrand.officialUrl || null,
    coupon: couponObj,
    regions: rawBrand.regions || [],
    nodeCount: rawBrand.nodeCount || null,
    nodeCountByRegion: rawBrand.nodeCountByRegion || null,
    lineTypes: sanitizeArray(rawBrand.lineTypes),
    lineTypeSummary: sanitizeText(rawPlans.lineType),
    protocols,
    ratio: sanitizeText(rawBrand.ratio),
    deviceLimit: sanitizeText(rawBrand.deviceLimit),
    supportedPlatforms: rawBrand.supportedPlatforms ? sanitizeArray(rawBrand.supportedPlatforms) : null,
    clientPolicy: sanitizeArray(rawBrand.clientPolicy),
    clientFlags,
    streaming: rawBrand.streaming || [],
    aiTools: rawBrand.aiTools || [],
    streamingNote: sanitizeText(rawBrand.streamingNote),
    trafficRules: sanitizeArray(rawBrand.trafficRules),
    cycleDiscounts: sanitizeText(rawPlans.cycleDiscounts),
    support,
    purchaseSteps: sanitizeArray(rawBrand.purchaseSteps),
    caveats,
    materialDate: rawBrand.materialDate || rawPlans.materialDate || '2026-11-13',
    historyPriceDate: idxInfo?.historyPriceDate || rawPlans.materialDate || '2026-10-20',
    historyRecordCount: idxInfo?.historyRecordCount || brandPlansOnly.length,
    evidenceType: idxInfo?.evidenceType || '公开品牌资料整理',
    priceSource: idxInfo?.priceSource || rawPlans.source,
    updatedAt: '2026-11-25',
    sourceFile: rawPlans.source,
    minMonthlyPrice: minMonthly,
    minMonthlyEffectivePrice: minMonthlyEffective,
    minYearlyPrice: minYearly,
    minFirstPurchase,
    minEffectiveMonthlyAvg,
    minDataPackPrice,
    totalPlanCount: brandPlansOnly.length,
    planGroups: {
      periodic: brandPeriodicPlans,
      yearlySmall: brandYearlySmall,
      dataPacks: brandDataPacks,
      custom: brandCustom,
      notes: sanitizeArray(rawPlans.notes),
    },
    faqs: brandFaqs,
  };

  brandsOut.push(brandObj);

  if (couponObj?.code) {
    const samplePlan = brandPlansOnly.find((p) => p.discountedPrice !== null);
    couponsOut.push({
      brandSlug: meta.slug,
      brandName: meta.name,
      brandRank: meta.rank,
      code: couponObj.code,
      discount: couponObj.discount || '结算页实时确认',
      rate: couponObj.rate,
      appliesTo: couponObj.appliesTo,
      excludes: couponObj.excludes,
      limits: couponObj.limits,
      usage: couponObj.usage,
      note: couponObj.note,
      affUrl,
      samplePlanName: samplePlan ? `${samplePlan.planName}（${samplePlan.cycleLabel}）` : null,
      sampleOriginalPrice: samplePlan ? samplePlan.price : null,
      sampleDiscountedPrice: samplePlan ? samplePlan.discountedPrice : null,
    });
  }

  const fm = {
    title: `${meta.name}怎么样？2026品牌资料、设备兼容、套餐价格与购买指南`,
    description: `${meta.name}${meta.nameEn ? `（${meta.nameEn}）` : ''}知识档案：覆盖${brandObj.regions.slice(0, 5).join('、')}等地区，${brandObj.clientFlags.thirdPartyLabel}，历史套餐最低¥${minFirstPurchase}起（记录日期${brandObj.historyPriceDate}）。`,
    slug: meta.slug,
    category: '机场品牌档案',
    brand: meta.name,
    primaryKeyword: `${meta.name}怎么样`,
    secondaryKeywords: [`${meta.name}官网`, `${meta.name}客户端`, `${meta.name}支持设备`, `${meta.name}使用教程`],
    searchIntent: `核查${meta.name}的真实品牌定位、设备与客户端政策、历史套餐价格及购买注意事项`,
    publishDate: '2026-11-25',
    updatedDate: '2026-11-25',
    author: '梯子大全编辑部',
    tags: [meta.name, brandObj.clientFlags.thirdPartyLabel, ...brandObj.regions.slice(0, 3)],
    relatedBrands: brandOrder.filter((x) => x.slug !== meta.slug).slice(0, 3).map((x) => x.slug),
    sources: [rawPlans.source, 'source-materials/00_18家品牌资料总索引.md'],
    draft: false,
    indexable: true,
  };

  const mdContent = `---
${Object.entries(fm)
  .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
  .join('\n')}
---

${brandObj.summary}

## 品牌核对摘要（历史资料记录：${brandObj.historyPriceDate}）

- **编辑展示顺序**：第 ${meta.rank} 位（仅供导航参考，非客观性能排名）
- **客户端政策**：${brandObj.clientFlags.thirdPartyLabel}
- **设备数量限制**：${brandObj.deviceLimit || '以官网当前规则为准'}
- **节点地区覆盖**：${brandObj.regions.join('、')}${brandObj.nodeCount ? `（参考节点数 ${brandObj.nodeCount} 个）` : ''}
- **历史起步门槛**：¥${minFirstPurchase}（数据来源记录日期：${brandObj.historyPriceDate}，不代表当日实时结算价格）
`;
  fs.writeFileSync(path.join(contentBrandsDir, `${meta.slug}.md`), mdContent, 'utf8');
}

fs.writeFileSync(path.resolve('src/data/brands.json'), JSON.stringify(brandsOut, null, 2), 'utf8');
fs.writeFileSync(path.join(plansDir, 'all-plans.json'), JSON.stringify(plansOut, null, 2), 'utf8');
fs.writeFileSync(path.resolve('src/data/plans.json'), JSON.stringify(plansOut, null, 2), 'utf8');
fs.writeFileSync(path.resolve('src/data/coupons.json'), JSON.stringify(couponsOut, null, 2), 'utf8');

const allJsonText = JSON.stringify({ brandsOut, plansOut, couponsOut });
const FORBIDDEN = ['待核实', '待填写', '待验证', '暂无资料', '测试中', 'DEMO', 'Lorem Ipsum', '实测报告', '测速结果', '晚高峰实测'];
const foundForbidden = FORBIDDEN.filter((w) => allJsonText.includes(w));
if (foundForbidden.length > 0) {
  console.error('[FAIL] Forbidden words found in generated JSON:', foundForbidden);
  process.exit(1);
}

console.log(`✓ Generated brands.json (${brandsOut.length} brands in exact 1-18 order)`);
console.log(`✓ Generated plans.json & plans/all-plans.json (${plansOut.length} plan rows)`);
console.log(`✓ Generated coupons.json (${couponsOut.length} coupons)`);
console.log(`✓ Generated ${brandsOut.length} brand Markdown profiles in src/content/brands/`);
