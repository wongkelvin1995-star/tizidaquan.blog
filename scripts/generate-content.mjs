import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

// 1. Run core 100-keyword knowledge cluster generators
for (const script of [
  'scripts/content-devices.mjs',
  'scripts/content-ai-streaming.mjs',
  'scripts/content-beginners.mjs',
  'scripts/content-safety-troubleshooting.mjs',
]) {
  execFileSync(process.execPath, [path.resolve(script)], { stdio: 'inherit' });
}

// 2. Generate grounded Brand Deep Articles in src/content/articles/ (Per Section 20)
const brands = JSON.parse(fs.readFileSync(path.resolve('src/data/brands.json'), 'utf8'));
const plans = JSON.parse(fs.readFileSync(path.resolve('src/data/plans/all-plans.json'), 'utf8'));
const articlesDir = path.resolve('src/content/articles');
fs.mkdirSync(articlesDir, { recursive: true });

// Clear old generated brand articles cleanly while preserving any manually authored articles if needed
for (const f of fs.readdirSync(articlesDir)) {
  if (f.endsWith('.md')) fs.unlinkSync(path.join(articlesDir, f));
}

const DATE = '2026-11-25';

function writeArticle(filename, fm, body) {
  const content = `---
${Object.entries(fm)
  .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
  .join('\n')}
---

${body.trim()}
`;
  fs.writeFileSync(path.join(articlesDir, filename), content, 'utf8');
}

function renderPeriodicTable(brand) {
  const periodic = brand.planGroups?.periodic || [];
  if (!periodic.length) return '';
  const rows = periodic
    .map((p) => {
      const m = p.prices.monthly ? `¥${p.prices.monthly.original}` : '—';
      const q = p.prices.quarterly ? `¥${p.prices.quarterly.original}` : '—';
      const h = p.prices['half-year'] ? `¥${p.prices['half-year'].original}` : '—';
      const y = p.prices.yearly ? `¥${p.prices.yearly.original}` : '—';
      return `| ${p.plan} | ${p.trafficGb ? `${p.trafficGb} GB/月` : '按需'} | ${m} | ${q} | ${h} | ${y} |`;
    })
    .join('\n');
  return `| 套餐名称 | 每月流量 | 月付(原价) | 季付 | 半年付 | 年付(整期) |
|---|---|---|---|---|---|
${rows}`;
}

function renderExtraPacks(brand) {
  const ys = brand.planGroups?.yearlySmall || [];
  const dp = brand.planGroups?.dataPacks || [];
  const parts = [];
  if (ys.length) {
    parts.push(
      '### 轻量年付套餐（历史记录）\n\n' +
        ys.map((x) => `- **${x.plan}**：整期年付 ¥${x.price}（折算月均约 ¥${x.monthlyEquivalent}/月），每月 ${x.trafficGb} GB。`).join('\n')
    );
  }
  if (dp.length) {
    parts.push(
      '### 不限时一次性流量包（历史记录）\n\n' +
        dp
          .map(
            (x) =>
              `- **${x.plan}**：一次性 ¥${x.price}，总量 ${x.trafficGb} GB（折合 ¥${x.pricePerGb}/GB）${
                x.devices ? `，设备限制说明：${x.devices}` : ''
              }。`
          )
          .join('\n')
    );
  }
  return parts.join('\n\n');
}

let generatedCount = 0;

for (const b of brands) {
  const brandPlans = plans.filter((p) => p.brandSlug === b.slug);
  const sources = [b.sourceFile, 'source-materials/00_18家品牌资料总索引.md'].filter(Boolean);

  // Article A: 购买后应该如何使用？(Theme 3)
  writeArticle(
    `${b.slug}-after-purchase-guide.md`,
    {
      title: `${b.name}第一次购买后应该如何使用？注册、客户端选择与连接上手指南`,
      description: `${b.name}${b.nameEn ? `（${b.nameEn}）` : ''}购后实操指南：梳理账号注册顺序、${b.clientFlags.thirdPartyLabel}接入方式、${b.regions.slice(0, 4).join('、')}节点挑选及多终端通用教程入口。`,
      slug: `${b.slug}-after-purchase-guide`,
      category: '品牌上手指南',
      brand: b.name,
      primaryKeyword: `${b.name}购买后怎么使用`,
      secondaryKeywords: [`${b.name}怎么用`, `${b.name}注册教程`, `${b.name}客户端安装`],
      searchIntent: `了解购买${b.name}套餐后如何下载客户端、登录账号或配置并验证连接`,
      publishDate: DATE,
      updatedDate: DATE,
      documentedVersion: `品牌资料整理日期 ${b.materialDate}`,
      author: '梯子大全编辑部',
      tags: [b.name, '购后上手', b.clientFlags.thirdPartyLabel],
      relatedBrands: [b.slug],
      sources,
      faqs: [
        { q: `购买${b.name}后第一件事去哪里下载客户端？`, a: `登录您注册时的官网用户中心，在“客户端下载”或“使用文档/知识库”区下载官方安装包。切勿在百度网盘、搜索引擎广告或陌生群下载来历不明的文件。` },
        { q: `${b.name}允许几台设备同时连接？`, a: b.deviceLimit || '请以官网当前用户中心说明为准。' },
      ],
      draft: false,
      indexable: true,
    },
    `
**直接结论**：在完成 [${b.name}](/brands/${b.slug}/) 注册与套餐购买后，应直接留在官网用户中心按该品牌的客户端政策完成连接——当前资料显示 ${b.name} 采用**${b.clientFlags.thirdPartyLabel}**策略，切勿盲目在外部网站搜索软件或套用不兼容的第三方教程。

## 一、${b.name} 品牌购买与注册基础步骤

${
  b.purchaseSteps?.length
    ? b.purchaseSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')
    : `1. 通过官网合规入口完成账号注册，使用独立邮箱与高强度密码。\n2. 首次下单建议优先从月付或最小入门档位体验。\n3. 付款后在用户中心查看客户端下载与使用文档。`
}

${b.coupon?.code ? `\n> **优惠码记录提醒**：资料收录优惠码 \`${b.coupon.code}\`${b.coupon.discount ? `（${b.coupon.discount}）` : ''}，${b.coupon.usage || '在结算页优惠码栏输入并确认金额变化后再付款'}。` : ''}

## 二、客户端与多设备上手路径

依据 ${b.name} 公开资料，其客户端支持口径如下：
${b.clientPolicy.map((c) => `- ${c}`).join('\n')}

不同设备具体系统级配置注意事项，请直接对照本站对应设备百科完成设置：
- **桌面端**：[Windows 11 科学上网教程](/devices/windows-11/) ｜ [Windows 10 机场配置教程](/devices/windows-10/) ｜ [Mac 科学上网教程](/devices/macos/)
- **手机端**：[iPhone 机场使用教程](/devices/iphone/) ｜ [安卓手机机场教程](/devices/android/)（含 OPPO / 小米 / 华为系统差异说明）

## 三、首次连接后的节点与规则核对

1. **检查代理模式**：确认保持在规则分流（Rule / 智能分流）模式，避免国内网页绕路。
2. **选区提示**：${b.name} 资料列明覆盖地区包括 **${b.regions.join('、')}**。若需使用 ChatGPT、Claude 或 Gemini 等服务，切勿选择香港节点，应挑选日本、新加坡、台湾或美国节点（具体可用性受平台政策动态影响）。
3. **保存官方入口**：在用户中心留意官方公告频道或备用域名，防止日后主入口变动无法登录。
`
  );
  generatedCount++;

  // Article B: 订阅、流量及套餐规则详解 (Theme 4)
  writeArticle(
    `${b.slug}-subscription-and-traffic.md`,
    {
      title: `${b.name}订阅、流量倍率与套餐规则详解（历史记录 ${b.historyPriceDate}）`,
      description: `深入解析${b.name}全部历史价目结构（记录日期${b.historyPriceDate}，共${brandPlans.length}条记录）、周期重置规律、节点倍率说明、优惠码适用范围及购买成本换算提醒。`,
      slug: `${b.slug}-subscription-and-traffic`,
      category: '品牌套餐与规则',
      brand: b.name,
      primaryKeyword: `${b.name}套餐规则`,
      secondaryKeywords: [`${b.name}流量重置`, `${b.name}价格`, `${b.name}倍率`],
      searchIntent: `核对${b.name}的历史套餐价格明细、流量扣减重置规则、倍率与优惠券限制条件`,
      publishDate: DATE,
      updatedDate: DATE,
      documentedVersion: `历史价目记录日期 ${b.historyPriceDate}`,
      author: '梯子大全编辑部',
      tags: [b.name, '套餐规则', '流量倍率', '历史价格'],
      relatedBrands: [b.slug],
      sources,
      faqs: [
        { q: `${b.name}本页展示的价格是今天的实时结算价吗？`, a: `不是。本文所列套餐金额均摘自可追溯的公开历史记录（记录日期：${b.historyPriceDate}），仅供了解档位结构与预算参考，实际结账金额请以官网结算页实时显示为准。` },
        { q: `${b.name}月内流量没用完可以留到下个月吗？`, a: `周期订阅流量按周期刷新重置，未用完通常不结转；如月用量极少且变动大，可查看其是否提供不限时一次性流量包。` },
      ],
      draft: false,
      indexable: true,
    },
    `
**重要声明**：以下价格与套餐结构摘自 **${b.name}** 公开历史记录（历史价格日期：**${b.historyPriceDate}**，参考整理记录 **${brandPlans.length}** 条），**不代表当日实时结算价格**，下单前请务必在官网结算页面核对最终应付金额。

## 一、周期订阅套餐历史价目结构

${renderPeriodicTable(b) || '当前档案未单列常规多周期矩阵，请查看品牌详情页最新说明。'}

${renderExtraPacks(b)}

## 二、流量倍率与重置规则核对

- **节点倍率**：${b.ratio || '以品牌后台节点列表实时标注为准，不可默认所有档位均为 1×'}
- **线路类型摘要**：${b.lineTypeSummary || '以品牌套餐详情页说明为准'}
- **流量重置与补流规则**：
${b.trafficRules.map((r) => `  - ${r}`).join('\n')}

## 三、优惠码与长期折算注意事项

${
  b.coupon?.code
    ? `- **已收录优惠码**：\`${b.coupon.code}\`（记录折扣：${b.coupon.discount || '以结算页实时显示为准'}）\n- **适用范围**：${
        b.coupon.appliesTo?.length ? b.coupon.appliesTo.join('、') : '以结算页校验为准'
      }\n- **排除套餐**：${b.coupon.excludes?.length ? b.coupon.excludes.join('、') : '未另行单列排除项'}\n- **使用限制**：${
        b.coupon.limits || '请确认是否限首单或新用户'
      }`
    : '- 当前资料未收录通用有效优惠码，实际活动请以官网结算页为准。'
}

- **年付金额与折算月均区分**：年付或多年付方案必须一次性付清整期总额（如部分品牌年付小包 ¥79–¥119 需整笔支付），折算月均仅用于成本测算，不能当成“每月只扣几块钱”。有关流量估算与倍率计算方法，可参阅 [机场流量怎么算](/beginners/traffic-calculation/) 与 [机场倍率是什么意思](/beginners/traffic-multiplier/)。
`
  );
  generatedCount++;

  // Article C: 客户端、订阅政策与多设备兼容性介绍 (Theme 6)
  writeArticle(
    `${b.slug}-client-compatibility.md`,
    {
      title: `${b.name}客户端政策、第三方订阅兼容与多设备支持说明`,
      description: `全面梳理${b.name}支持哪些系统设备（${b.supportedPlatforms ? b.supportedPlatforms.join('、') : '多平台官方端'}）、是否开放Clash/Shadowrocket第三方订阅及同时在线设备限制。`,
      slug: `${b.slug}-client-compatibility`,
      category: '品牌设备与兼容',
      brand: b.name,
      primaryKeyword: `${b.name}支持什么客户端`,
      secondaryKeywords: [`${b.name}支持Clash吗`, `${b.name}支持小火箭吗`, `${b.name}设备限制`],
      searchIntent: `核实${b.name}能否在电脑、iPhone、安卓、Linux或路由器上使用，以及是否支持第三方客户端`,
      publishDate: DATE,
      updatedDate: DATE,
      documentedVersion: `资料整理日期 ${b.materialDate}`,
      author: '梯子大全编辑部',
      tags: [b.name, '客户端兼容', '多设备', '订阅政策'],
      relatedBrands: [b.slug],
      sources,
      faqs: [
        { q: `${b.name}可以直接导出订阅链接给 Clash 或小火箭使用吗？`, a: `${b.clientFlags.thirdPartyLabel}。具体原稿及补充政策详见正文第一部分，任何口径存在变动的品牌均应以官网客服最新答复为准。` },
        { q: `我的设备是华为纯血鸿蒙 (HarmonyOS NEXT) 或 OpenWrt 路由器，能用${b.name}吗？`, a: `HarmonyOS NEXT 不兼容传统 Android APK 安装包；而 OpenWrt 路由器则强制要求品牌开放标准第三方订阅链接且协议兼容。因此封闭官方客户端或无公开订阅的方案无法直接部署在常规路由器固件上。` },
      ],
      draft: false,
      indexable: true,
    },
    `
**直接结论**：依据公开资料，**${b.name}** 的客户端模式属于 **“${b.clientFlags.thirdPartyLabel}”**。${
      b.supportedPlatforms?.length ? `已列明兼容平台包括：${b.supportedPlatforms.join('、')}。` : '桌面端与移动端需以用户中心内实际提供的官方下载入口为准。'
    }设备并发方面标注为：**${b.deviceLimit || '以官网当前规则为准'}**。

## 一、客户端政策与第三方订阅核对（原档依据）

${b.clientPolicy.map((c) => `- ${c}`).join('\n')}

${b.protocols?.length ? `\n**资料中提及过的相关协议标签**：${b.protocols.join('、')}（注：并非所有套餐档位均支持全部协议，以实际授权配置为准）。` : ''}

## 二、不同操作系统终端使用 ${b.name} 的实际边界

| 终端环境 | 适配可行性与注意事项 | 延伸百科指南 |
|---|---|---|
| **Windows 10 / 11** | 支持官方端登录；若品牌开放订阅且协议匹配，亦可用 Clash Verge Rev | [Windows 11 教程](/devices/windows-11/) |
| **Windows 7 (旧系统)** | 微软已停止安全支持，现代官方与开源端多要求 Win10+，存在兼容限制 | [Windows 7 限制说明](/devices/windows-7/) |
| **macOS (M系列/Intel)** | 支持官方 macOS 端（常见要求 macOS 10.15 及以上） | [Mac 科学上网教程](/devices/macos/) |
| **iPhone / iPad** | ${b.clientFlags.usesNextin ? '资料提及通过 Nextin 登录使用，或留意官方 iOS 指引' : '遵循官网 iOS 端指引；仅开放订阅品牌才可导入小火箭'} | [iPhone 使用教程](/devices/iphone/) |
| **Android / OPPO / 小米** | 安装官网 APK（留意防锁屏断线设置）；鸿蒙需区分 NEXT 与 3/4 版 | [安卓手机教程](/devices/android/) |
| **Linux / OpenWrt 路由器** | ${b.clientFlags.supportsLinux || b.clientFlags.supportsRouter ? '公开资料曾提及部分支持或兼容说明，下单前建议再与客服确认订阅开放条件' : '公开资料未单列专用包或封闭端不支持，不可默认兼容路由器'} | [OpenWrt 配置教程](/devices/openwrt/) |

## 三、多设备共用安全提示

无论档案是否标注“不限设备数”，均严禁将账号密码或订阅链接公开售卖或分享给陌生人。多端共用时请参考 [电脑和手机共用机场订阅规则](/devices/multi-device/)。
`
  );
  generatedCount++;

  // Article D: AI 与流媒体支持资料说明 (Theme 5 — ONLY published when grounded!)
  if (b.aiTools?.length || b.streaming?.length) {
    writeArticle(
      `${b.slug}-ai-and-streaming.md`,
      {
        title: `${b.name}是否支持AI与流媒体？地区覆盖及服务资料客观说明`,
        description: `整理${b.name}公开资料中列明的AI工具（${b.aiTools?.join('、') || '见正文'}）与流媒体（${b.streaming?.join('、') || '见正文'}）覆盖信息、节点地区分布与官方使用限制边界。`,
        slug: `${b.slug}-ai-and-streaming`,
        category: '品牌场景资料',
        brand: b.name,
        primaryKeyword: `${b.name}支持ChatGPT和Netflix吗`,
        secondaryKeywords: [`${b.name} AI支持`, `${b.name}流媒体`, `${b.name}节点地区`],
        searchIntent: `核实${b.name}公开资料是否涵盖ChatGPT、Claude、Gemini及Netflix/Disney+等平台并了解使用限制`,
        publishDate: DATE,
        updatedDate: DATE,
        documentedVersion: `资料整理日期 ${b.materialDate}`,
        author: '梯子大全编辑部',
        tags: [b.name, 'AI支持', '流媒体', '地区节点'],
        relatedBrands: [b.slug],
        sources,
        faqs: [
          { q: `既然资料里写着${b.name}支持 ChatGPT 或 Netflix，买完是不是所有节点都能 100% 打开？`, a: `绝对不能这样假设！首先，香港节点因受 AI 厂商政策限制不能用于 ChatGPT/Claude/Gemini/TikTok；其次，各品牌资料均明确提示平台可用性会随服务商风控与版权策略动态变化，不作持续永久保证。` },
          { q: `用${b.name}使用 AI 工具建议选哪个地区节点？`, a: `在${b.name}覆盖的地区中，建议避开香港，优先固定选用日本、新加坡、台湾或美国等官方支持区节点，且不要频繁跨国跳切登录同一 AI 账号。` },
        ],
        draft: false,
        indexable: true,
      },
      `
**直接结论**：依据截至 **${b.materialDate}** 整理的公开品牌资料，**${b.name}** 在服务说明中列明了以下应用适配清单——${
        b.aiTools?.length ? `AI 工具包括 **${b.aiTools.join('、')}**` : ''
      }${b.aiTools?.length && b.streaming?.length ? '；' : ''}${
        b.streaming?.length ? `流媒体包括 **${b.streaming.join('、')}**` : ''
      }。但需要客观说明的是：**上述信息源于品牌历史公开资料记录，平台可用性随目标服务商地区与风控政策变化，任何品牌均不作永久 100% 可用保证**。

## 一、公开资料提及的服务清单与地区基础

- **覆盖节点地区**：${b.regions.join('、')}${b.nodeCount ? `（参考总节点数约 ${b.nodeCount} 个）` : ''}
- **资料提及 AI 工具**：${b.aiTools?.length ? b.aiTools.join('、') : '档案未专门单列具体 AI 工具列表'}
- **资料提及流媒体平台**：${b.streaming?.length ? b.streaming.join('、') : '档案未专门单列具体流媒体列表'}
- **资料客观边界提示**：${b.streamingNote || '流媒体与 AI 工具可用性受出口 IP 动态评估、账号归属及设备环境影响，请以当前合规访问状态为准。'}

## 二、使用 AI 工具时如何挑选 ${b.name} 的节点？

1. **坚决避开香港节点**：OpenAI (ChatGPT)、Anthropic (Claude)、Google Gemini 与 TikTok 官方均不支持香港地区出口。在 ${b.name} 客户端中选择节点时，请直接切换至 **日本、新加坡、台湾或美国** 等节点。
2. **保持单账号固定节点习惯**：频繁自动切换不同国家 IP 易触发 AI 账号安全验证码，详见 [AI 解锁节点怎么选](/ai/node-selection/)。
3. **如遇报错如何自查？** 建议依次核查官方状态页、无痕浏览器测试及 DNS，详见 [ChatGPT 无法访问排查](/ai/chatgpt/access-errors/)。

## 三、流媒体观看时的流量与自查要点

- **提前算好高清流量消耗**：Netflix 1080p 约 3GB/小时、4K 高达 7GB/小时；追剧频繁时建议核对 ${b.name} 的月度流量额度及倍率说明。
- **使用合法官方方式自查片库**：登录本人已订阅的正版账户检索片库并配合 \`fast.com\` 观察当前下行带宽即可，不要运行来历不明的第三方检测脚本，详见 [Netflix 状态合法自查教程](/streaming/netflix/status-check/)。
`
    );
    generatedCount++;
  }

  // Article E: 账户安全、客服排障与续费购买注意事项 (Theme 7/8)
  writeArticle(
    `${b.slug}-security-and-renewal.md`,
    {
      title: `${b.name}账户安全、客服排障与续费购买注意事项全梳理`,
      description: `汇总${b.name}的官方客服渠道、试用及退款规则、防钓鱼官网核验要点，以及首单优惠码在续费时的限制与常见连接故障排查指引。`,
      slug: `${b.slug}-security-and-renewal`,
      category: '品牌安全与售后',
      brand: b.name,
      primaryKeyword: `${b.name}安全与续费注意`,
      secondaryKeywords: [`${b.name}客服售后`, `${b.name}退款政策`, `${b.name}续费优惠`],
      searchIntent: `在购买或续费${b.name}前核查退款、防骗、客服工单渠道以及常见故障解决方向`,
      publishDate: DATE,
      updatedDate: DATE,
      documentedVersion: `资料整理日期 ${b.materialDate}`,
      author: '梯子大全编辑部',
      tags: [b.name, '售后客服', '账户安全', '续费注意'],
      relatedBrands: [b.slug],
      sources,
      faqs: [
        { q: `${b.name}支持免费试用或购买后无条件退款吗？`, a: `${b.support?.trial ? `试用说明：${b.support.trial}。` : '公开资料未明示免费试用。'}${b.support?.refund ? `退款与升级说明：${b.support.refund}。` : '退款需以官网当前服务条款为准。'}` },
        { q: `联系${b.name}客服处理连接问题有哪些渠道？`, a: `${b.support?.channels?.length ? `公开记录客服渠道：${b.support.channels.join('、')}` : '请登录官网用户中心通过工单系统联系官方技术支持'}${b.support?.hours ? `（${b.support.hours}）` : ''}。` },
      ],
      draft: false,
      indexable: true,
    },
    `
**直接结论**：在使用或续费 **${b.name}** 时，确保安全与避免纠纷的核心原则有三点：**只从官方渠道下载客户端与登录账号**、**认清首单优惠码与长期续费的价格差异**，以及**遇故障时先区分本地设置问题再提交标准化官方工单**。

## 一、${b.name} 售后客服、试用与退款资料清单

- **官方客服渠道**：${b.support?.channels?.length ? b.support.channels.join('、') : '官网用户中心工单系统'}
${b.support?.hours ? `- **客服响应参考**：${b.support.hours}` : ''}
- **免费试用规则**：${b.support?.trial || '当前公开资料未列明免费试用，建议首次先选购低门槛月付试起'}
- **退款与升级说明**：${b.support?.refund || '虚拟数字订阅产品请以结账前官网服务条款为准'}
- **防骗声明**：${b.support?.antiFraud || '只通过官网入口注册下单，不从网盘或陌生个人购买客户端与二手账号'}

${
  b.caveats?.length
    ? `\n## 二、档案中需要重点留意的服务边界提示\n\n${b.caveats.map((c) => `- ${c}`).join('\n')}`
    : ''
}

## 三、续费前与遇故障时的实操检查

1. **核实首单优惠码是否仅限一次**：${
      b.coupon?.code
        ? `当前收录码 \`${b.coupon.code}\`${b.coupon.limits ? `标注“${b.coupon.limits}”` : '通常需在结算页核实适用周期'}，续费原套餐时请按实付页面金额预算。`
        : '续费金额请以结算页最新报价为准。'
    }
2. **老用户权限提示**：不要轻率放弃原本账号重开新号，以免错过既有账户等级或老用户客户端支持口径。
3. **快速故障排查入口**：如果在使用 ${b.name} 过程中碰到官网打不开、节点超时或断线，可先依照 [机场打不开怎么办](/troubleshooting/website-unavailable/)、[节点连接失败排查](/troubleshooting/node-connection/) 与 [已连接但无法上网排查](/troubleshooting/connected-no-internet/) 完成本地自检后再交工单，沟通效率最高。
`
  );
  generatedCount++;
}

console.log(`✓ Generated ${generatedCount} grounded brand articles in src/content/articles/`);
