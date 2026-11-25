import fs from 'node:fs';
import path from 'node:path';

const brands = JSON.parse(fs.readFileSync(path.resolve('src/data/brands.json'), 'utf8'));
const aiDir = path.resolve('src/content/ai');
const streamDir = path.resolve('src/content/streaming');

fs.mkdirSync(path.join(aiDir, 'chatgpt'), { recursive: true });
fs.mkdirSync(path.join(aiDir, 'claude'), { recursive: true });
fs.mkdirSync(path.join(aiDir, 'gemini'), { recursive: true });
fs.mkdirSync(path.join(streamDir, 'netflix'), { recursive: true });
fs.mkdirSync(path.join(streamDir, 'youtube'), { recursive: true });
fs.mkdirSync(path.join(streamDir, 'disney-plus'), { recursive: true });

function writeDoc(baseDir, relPath, fm, body) {
  const fullPath = path.join(baseDir, relPath);
  const content = `---
${Object.entries(fm)
  .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
  .join('\n')}
---

${body.trim()}
`;
  fs.writeFileSync(fullPath, content, 'utf8');
}

const DATE = '2026-11-25';

function brandsWithAi(tool) {
  return brands.filter((b) => (b.aiTools || []).some((t) => t.toLowerCase().includes(tool.toLowerCase())));
}

function brandsWithStreaming(platform) {
  return brands.filter((b) => (b.streaming || []).some((s) => s.toLowerCase().includes(platform.toLowerCase())));
}

function renderBrandTable(list, typeLabel) {
  if (!list.length) return '当前已核对资料暂无明确列明此平台的品牌记录。';
  const rows = list
    .map(
      (b) =>
        `| [${b.name}](/brands/${b.slug}/) | ${b.regions.join('、')} | ${b.clientFlags.thirdPartyLabel} | ${
          typeLabel === 'ai' ? b.aiTools.join('、') : b.streaming.join('、')
        } |`
    )
    .join('\n');
  return `| 品牌（按资料核对） | 公开节点地区 | 客户端政策 | 资料提及支持范围 |
|---|---|---|---|
${rows}`;
}

const chatgptBrands = brandsWithAi('ChatGPT');
const claudeBrands = brandsWithAi('Claude');
const geminiBrands = brandsWithAi('Gemini');

const netflixBrands = brandsWithStreaming('Netflix');
const youtubeBrands = brandsWithStreaming('YouTube');
const disneyBrands = brandsWithStreaming('Disney+');
const tiktokBrands = brandsWithStreaming('TikTok');

const AI_PAGES = [
  {
    file: 'chatgpt.md',
    fm: {
      title: 'ChatGPT机场推荐与使用条件：官方支持地区、账号条件与品牌资料汇总',
      description: '客观解析访问ChatGPT与OpenAI服务的网络前提：核对OpenAI官方支持地区清单、香港节点受限说明、账户风控边界，以及18家品牌资料中明确标注支持ChatGPT的机场清单。',
      slug: 'chatgpt',
      category: 'AI 工具网络知识',
      platform: 'ChatGPT / OpenAI',
      primaryKeyword: 'ChatGPT机场推荐',
      secondaryKeywords: ['OpenAI支持机场', 'ChatGPT节点选择', 'ChatGPT用什么地区'],
      searchIntent: '了解访问ChatGPT所需的节点地区条件、账户安全规范以及资料列明适配ChatGPT的品牌',
      publishDate: DATE,
      updatedDate: DATE,
      documentedVersion: 'OpenAI 官方支持地区与Web/App客户端规范',
      tags: ['ChatGPT', 'OpenAI', 'AI网络', '地区限制'],
      relatedBrands: chatgptBrands.slice(0, 4).map((b) => b.slug),
      sources: ['OpenAI Supported Countries and Territories 官方文档', '18家品牌 AI 适配公开资料'],
      faqs: [
        { q: '为什么买了支持 ChatGPT 的机场，选香港节点还是打不开？', a: '因为 OpenAI 官方支持国家与地区列表一直未包含中国香港。无论机场线路本身多优秀，只要最终出口 IP 归属为香港，ChatGPT 网页端与 App 都会提示当前地区不支持。应切换至日本、新加坡、台湾或美国等官方支持地区节点。' },
        { q: '品牌资料写支持 ChatGPT 就代表 100% 永久不封号或不弹窗吗？', a: '不是。品牌资料仅说明其在整理日期时有节点针对 AI 工具做了地区适配；OpenAI 是否放行还受官方政策变动、账号注册合规性、浏览器 Cookie 残留以及同一共享出口 IP 的并发风控评分影响，任何机场均无法做出 100% 永久可用的保证。' },
      ],
    },
    body: `
**直接结论**：能否正常访问 ChatGPT，同时取决于**节点出口位于 OpenAI 官方支持地区（如美国、日本、新加坡、台湾，避开香港）**、**出口 IP 未触发 Cloudflare 或风控黑名单**，以及**账号与浏览器环境本身合规**。在 18 家已核对品牌中，共有 **${chatgptBrands.length} 家** 在公开品牌资料中明确提及适配 ChatGPT（实际可用性仍随平台政策动态变化，各品牌普遍注明不作持续保证）。

## 一、使用 ChatGPT 必须区分的五个核心层面

很多用户一遇到打不开或报错就以为是“机场坏了”，其实需要逐层区分：

1. **平台官方支持地区**：OpenAI 官方维护一份公开的支持国家/地区清单。美国、日本、新加坡、台湾、英国、德国、韩国等均在列表内；**香港与澳门通常不在支持列表内**。
2. **账号登录与风控条件**：使用临时一次性邮箱注册、共享多人同号或短时间内频繁跨大洲跳变 IP 登录，容易引发 OpenAI 账户安全验证或停用。
3. **网络连接与浏览器环境**：WebSocket 连接中断、浏览器旧版缓存/Cookie 残留了受限地区标记、或浏览器扩展注入异常请求头，都会导致对话窗口卡在生成中或提示错误。
4. **DNS 与系统网络冲突**：本地安全 DNS (DoH) 绕过了客户端规则导致域名解析走错出口。
5. **OpenAI 平台自身服务故障**：ChatGPT 高峰期偶发官方宕机，需先查 [OpenAI 官方状态页](https://status.openai.com) 再排障。

## 二、公开资料列明适配 ChatGPT 的机场品牌清单（${chatgptBrands.length} 家）

以下依据品牌原始档案整理，按编辑展示顺序排列（并非性能或解锁率排行，不代表香港等非支持地区可用）：

${renderBrandTable(chatgptBrands, 'ai')}

## 三、选节点与日常使用的稳妥建议

- **固定 1–2 个官方支持地区**：在客户端将常用 AI 节点固定在日本、新加坡、台湾或美国之一，避免开启“自动每分钟切换最低延迟”导致账号 IP 归属反复跳变。
- **App 与网页端一致性**：在 iPhone / Android 上使用官方 ChatGPT App 时，除节点地区外，还需使用外区应用商店（如美区 App Store / Google Play）获取正版官方客户端，切勿安装来历不明的套壳应用。
- **遇到报错怎么办？** 请按步骤阅读 [ChatGPT 节点无法访问与 OpenAI 服务问题排查](/ai/chatgpt/access-errors/)。
`,
  },
  {
    file: 'claude.md',
    fm: {
      title: 'Claude机场节点选择：Anthropic支持地区、IP纯净度与品牌适配清单',
      description: 'Claude (Anthropic) 网络使用百科：介绍Anthropic官方支持地区、手机号与账号风控特征、为何Claude对共享出口IP比ChatGPT更敏感，以及资料明确提及Claude的品牌汇总。',
      slug: 'claude',
      category: 'AI 工具网络知识',
      platform: 'Claude (Anthropic)',
      primaryKeyword: 'Claude机场节点选择',
      secondaryKeywords: ['Claude节点推荐', 'Anthropic支持地区', 'Claude防风控'],
      searchIntent: '了解使用Claude所需的节点地区与IP稳定性条件，并核对公开资料标注适配Claude的机场品牌',
      publishDate: DATE,
      updatedDate: DATE,
      documentedVersion: 'Anthropic Claude Supported Regions 规范',
      tags: ['Claude', 'Anthropic', 'AI节点', '防风控'],
      relatedBrands: claudeBrands.slice(0, 4).map((b) => b.slug),
      sources: ['Anthropic Supported Countries 官方说明', '18家品牌 AI 适配公开资料'],
      faqs: [
        { q: '为什么能打开 ChatGPT 的节点，登录 Claude 却被提示限制或禁用？', a: 'Anthropic 对出口 IP 纯净度、数据中心段识别以及多用户高并发共享行为更为敏感；同时 Claude 官方支持地区清单与 OpenAI 存在细微差异。使用共享机场节点访问 Claude 时，稳定性更容易受同节点其他用户行为波及。' },
        { q: '哪些品牌在公开资料中专门标注了支持 Claude？', a: `在已核对的 18 家品牌中，共有 ${claudeBrands.length} 家品牌资料明确提及适配 Claude（包括灵动云、暮光加速、微风网络、飞猫云、FLYV、全球云、闪跃、U1S1、Sogo云、跨界等），但各品牌资料同样提示可用性随平台风控变化。` },
      ],
    },
    body: `
**直接结论**：相较于其他 AI 平台，**Anthropic Claude 对出口 IP 归属地、共享 IP 并发人数以及账号地理一致性更加严格**。并非所有能访问 ChatGPT 的机场节点都能稳定登录 Claude；选择节点时应优先避开香港等不受支持地区，并在美国、日本、新加坡等 Anthropic 官方支持地区中固定使用单一低切换频率节点。

## 一、Claude 对网络环境与账号条件的特殊要求

1. **官方支持地区核对**：Anthropic 公开支持美国、英国、日本、新加坡、台湾及多数欧洲国家，但同样**不支持中国香港**。使用前应核对当前 Anthropic 官方支持列表。
2. **共享机场节点的固有局限**：普通机场为多用户共享出口 IP 模式，同一时间可能有大量用户通过同一个日本或美国出口 IP 访问 claude.ai。当该 IP 出现高频注册或异常自动化请求时，Anthropic 的风控系统极易触发验证码拦截甚至要求重新验证账号。
3. **跨国频繁跳切极易触发风控**：不要在早上用日本节点登录 Claude、下午切到英国、晚上切回美国，这种地理瞬移在安全模型中属于高风险信号。

## 二、资料明确提及适配 Claude 的品牌（${claudeBrands.length} 家）

需要特别强调：以下仅反映公开品牌档案中列明适配 \`Claude\` 的记录，**不代表剩余未列明品牌一定不可用或已列明品牌永久不会触发风控**。

${renderBrandTable(claudeBrands, 'ai')}

## 三、降低 Claude 登录与使用异常的实用操作规范

- **固定单一支持区节点**：建议为 \`claude.ai\` 和 \`api.anthropic.com\` 在客户端规则中指派固定的“美国”或“日本”节点组，不随自动测延频繁漂移。
- **使用浏览器无痕窗口验证问题**：遇到登录报错或网页白屏时，先用无痕模式确认是否为浏览器扩展或旧 Cookie 导致，详见 [Claude 登录网络异常排查](/ai/claude/login-errors/)。
- **对稳定性有极高要求的工作流**：若长期重度依赖 Claude 进行开发或企业协同，需评估共享型机场的风控概率，必要时了解品牌是否提供[独享定制 IP 服务](/comparison/)或通过合规 API 渠道接入。
`,
  },
  {
    file: 'gemini.md',
    fm: {
      title: 'Gemini机场推荐与地区说明：Google账号区服、出口IP与品牌列表',
      description: 'Google Gemini与AI Studio网络百科：解析Google账号关联地区与出口IP双重判断机制、香港节点不可用原因，以及18家品牌中资料标明支持Gemini的机场列表。',
      slug: 'gemini',
      category: 'AI 工具网络知识',
      platform: 'Google Gemini',
      primaryKeyword: 'Gemini机场推荐',
      secondaryKeywords: ['Google Gemini节点', 'Gemini支持地区', 'AI Studio网络'],
      searchIntent: '了解使用Google Gemini和AI Studio的节点与账号地区前提，查看资料标注适配Gemini的品牌',
      publishDate: DATE,
      updatedDate: DATE,
      documentedVersion: 'Google Gemini & Google AI Studio 可用地区文档',
      tags: ['Gemini', 'Google AI', '地区限制', '账号区服'],
      relatedBrands: geminiBrands.slice(0, 4).map((b) => b.slug),
      sources: ['Google Gemini Apps 可用国家/地区支持文档', '18家品牌 AI 适配公开资料'],
      faqs: [
        { q: '为什么我切换到了美国节点，打开 Gemini 还是提示“当前所在地区不受支持”？', a: '因为 Google 服务不仅读取实时出口 IP，还会核对您的 Google 账号自身“国家/地区归属（Terms of Service 归属地）”以及浏览器的定位授权缓存。如果账号历史长期被绑定在不受支持区域或未退出旧缓存，单纯切节点仍可能被拦截。' },
        { q: 'Google Gemini 可以使用香港节点访问吗？', a: '不可以。Google 官方 Gemini 可用地区文档明确未覆盖中国香港。使用香港节点访问 gemini.google.com 或 AI Studio 会直接显示不受支持提示。' },
      ],
    },
    body: `
**直接结论**：正常使用 **Google Gemini** 与 **Google AI Studio** 需要“**双匹配**”——**一是网络出口 IP 必须处于 Google 官方支持地区**（例如美国、日本、新加坡、台湾、韩国、英国等，**不能选香港**）；**二是所登录的 Google 账号本身未处于受限国家/地区归属且浏览器未残留旧定位缓存**。

## 一、Google Gemini 与 OpenAI / Claude 的判断机制差异

| 判断维度 | Google Gemini 特点 | 常见误区 |
|---|---|---|
| **出口 IP 地区** | 实时检测请求源 IP；支持美国、日本、台湾、新加坡等，不支持香港 | 误用机场默认的“自动选延迟最低（往往是香港）”节点 |
| **Google 账号归属区** | Google 后台会为每个账号记录服务条款适用国家（Country Association） | 换了美国节点却用关联在受限区的旧账号，导致一直提示不可用 |
| **DNS 与 IPv6 泄漏** | Google 对 IPv6 支持极其广泛；若客户端仅代理 IPv4 而本地直连 IPv6 会暴露真实位置 | 本地宽带下发了 IPv6，未在客户端正确接管或禁用本地 IPv6 分流 |
| **手机 App 商店区服** | Android 需通过海外区 Google Play 更新 Google/Gemini App | 在部分无 GMS 的设备上强行安装修改版安装包导致无法登录 |

## 二、公开资料明确提及支持 Gemini 的品牌（${geminiBrands.length} 家）

以下依据 18 家品牌整理档案列出明确写明适配 \`Gemini\` 的品牌；其余品牌若具备日本、新加坡、台湾、美国节点，亦可自行参考 [Gemini 地区限制排查](/ai/gemini/availability/) 核对：

${renderBrandTable(geminiBrands, 'ai')}

## 三、提高 Gemini 与 AI Studio 可用性的实践做法

1. **优先选用日本 / 新加坡 / 美国节点**：这三类地区在 18 家品牌中覆盖最广，且同时属于 Google Gemini 与 AI Studio 的官方支持区。
2. **排查 Google 账号国家关联**：在登录 Google 账号后，可查阅 Google 官方“服务条款国家/地区”政策说明页面确认当前账号归属是否影响功能开放。
3. **排除浏览器扩展与 Edge 安全网络干扰**：确认未开启可能将请求路由至其他地区的第三方浏览器扩展。更多排障细节见 [Gemini 地区限制排查](/ai/gemini/availability/)。
`,
  },
  {
    file: 'network-guide.md',
    fm: {
      title: 'AI工具网络加速指南：网页对话、API接口与IDE编程助手代理配置原理',
      description: '面向ChatGPT、Claude、Gemini及GitHub Copilot/Cursor等AI开发工具的网络配置指南：讲清WebSocket长连接、IDE终端环境变量、TUN模式选择及地区分流策略。',
      slug: 'network-guide',
      category: 'AI 工具网络知识',
      platform: '全平台 AI 工具',
      primaryKeyword: 'AI工具网络加速指南',
      secondaryKeywords: ['AI编程网络设置', 'Copilot代理设置', 'Cursor代理配置'],
      searchIntent: '系统配置浏览器AI网页端与桌面IDE开发工具所需的稳定代理网络规则',
      publishDate: DATE,
      updatedDate: DATE,
      documentedVersion: 'WebSocket / HTTP2 / 系统代理 & TUN 规范',
      tags: ['AI加速', 'WebSocket', 'TUN模式', '开发者工具'],
      relatedBrands: ['lingdongyun', 'flyv', 'yinxingren', 'breezenet'],
      sources: ['18家品牌 AI 工具资料（含 GitHub Copilot / Hugging Face / Midjourney）', '桌面客户端网络代理文档'],
      faqs: [
        { q: '网页端能打开 ChatGPT，为什么 VS Code / Cursor / 终端里的 AI 插件却一直转圈或报错？', a: '因为浏览器自动读取系统的 HTTP 代理（System Proxy），而部分代码编辑器、内置终端或 CLI 工具默认不遵循系统代理，必须额外在编辑器设置填写代理地址，或在电脑上开启客户端的 TUN 虚拟网卡模式。' },
        { q: '为什么 AI 回复到一半经常卡住或提示 Network Error？', a: 'AI 对话采用 SSE（Server-Sent Events）或 WebSocket 流式持续输出，如果节点瞬间丢包、代理软件切换了自动测速节点、或者浏览器休眠中断了长连接，就会导致半截断流。' },
      ],
    },
    body: `
**直接结论**：为 AI 工具提供稳定的网络环境，并不在于追求虚无缥缈的“跑分最高”，而在于满足三项底层技术条件：**① 出口地区稳定命中官方支持国别（避开香港）**；**② 桌面编程工具/CLI 环境能正确走到代理通道（合理启用系统代理或 TUN 模式）**；**③ 保持 SSE / WebSocket 流式长连接不因频繁自动切节点而断开**。

## 一、三大类 AI 场景的网络通信特点

| AI 工具场景 | 核心技术协议特征 | 网络配置重点 |
|---|---|---|
| **网页对话端**（ChatGPT / Claude / Gemini） | HTTPS + SSE 流式推送 + 严格地区/风控校验 | 固定单一非香港节点，保证 Chrome/Edge 不启用冲突的外部安全 DNS |
| **IDE 编程助手**（Copilot / Cursor / Windsurf） | 桌面应用内部 gRPC / HTTP2 长连接 + 终端脚本请求 | 若仅开系统代理可能遗漏子进程，建议开启客户端 **TUN 模式**或在 IDE 设置内显式配置 \`http.proxy\` |
| **图像生成与模型仓库**（Midjourney / Hugging Face） | Discord 长连接 + 大体积模型权重文件下载 | 注意流量消耗与高倍率节点扣费，大文件拉取建议选择全节点 1× 倍率套餐 |

在 18 家品牌公开资料中，[FLYV](/brands/flyv/) 与 [隐形人](/brands/yinxingren/) 等均明确在支持清单中列出了 **GitHub Copilot** 或 **Hugging Face**，[灵动云](/brands/lingdongyun/)、[U1S1](/brands/u1s1/)、[Sogo云](/brands/sogoyun/) 亦提及 **Midjourney**。

## 二、开发者 IDE 与命令行访问 AI API 的两种打通方式

### 方式 1：开启客户端 TUN 虚拟网卡模式（省心通用）
在 [Windows 11](/devices/windows-11/) 或 [macOS](/devices/macos/) 桌面客户端中开启 TUN（或增强模式）后，虚拟网卡会在操作系统网络层直接接管流量，无论是 VS Code 插件、Python SDK 还是 Node.js 脚本调用 OpenAI/Anthropic API，都会按分流规则顺畅通过，无需逐个软件填端口。

### 方式 2：为编辑器和终端单独配置本地代理端口
如果不希望开启全局虚拟网卡，可记录客户端本地监听端口（假设为 \`7890\`）：
- 在 VS Code / Cursor 的设置中搜索 \`Proxy\`，于 **Http: Proxy** 填入 \`http://127.0.0.1:7890\`。
- 在终端调用 API 脚本前设置 \`export HTTPS_PROXY=http://127.0.0.1:7890\`（Windows PowerShell 为 \`$env:HTTPS_PROXY="http://127.0.0.1:7890"\`）。

## 三、防止 AI 对话“输出一半中断”的配置要点

1. **关闭“极高频自动测延切换”**：部分第三方客户端若设置每隔几分钟按延迟自动切换节点，会在切换瞬间切断正在进行的 SSE 长连接，造成 ChatGPT/Claude 输出半途报错。
2. **避免国内代码仓库绕远路**：使用规则分流（Rule）将 Gitee、国内 npm/pip 镜像设为直连，将 \`openai.com\`、\`anthropic.com\`、\`googleapis.com\`、\`github.com\`、\`huggingface.co\` 纳入代理规则，既省流量又不影响日常国内开发速度。
`,
  },
  {
    file: 'chatgpt/access-errors.md',
    fm: {
      title: 'ChatGPT节点无法访问与OpenAI服务访问问题全流程排查指南',
      description: '合并解决ChatGPT网页打不开与OpenAI服务访问异常：区分status.openai.com官方服务故障、香港/不支持地区拦截、Cloudflare人机拦截、浏览器Cookie冲突与DNS异常。',
      slug: 'chatgpt/access-errors',
      category: 'AI 工具网络知识',
      platform: 'ChatGPT / OpenAI',
      primaryKeyword: 'ChatGPT节点无法访问',
      secondaryKeywords: ['OpenAI服务访问问题', 'ChatGPT地区不支持', 'ChatGPT 403错误'],
      searchIntent: '系统诊断并解决ChatGPT网页、App及OpenAI API无法访问或频繁报错的原因',
      publishDate: DATE,
      updatedDate: DATE,
      documentedVersion: 'OpenAI Web / iOS / Android & API 访问规范',
      tags: ['ChatGPT故障', 'OpenAI', '访问排查', 'DNS'],
      relatedBrands: ['lingdongyun', 'breezenet', 'twilight', 'feimaoyun'],
      sources: ['OpenAI Help Center 常见错误排查指南', 'OpenAI Status Page (status.openai.com)'],
      faqs: [
        { q: '打开 ChatGPT 提示“Access denied / Error 1020”或“Sorry, you have been blocked”是什么原因？', a: '这是 Cloudflare 安全网关拦截了当前节点出口 IP（常见于共享节点短时间并发请求过多或被判定为高风险数据中心 IP）。通常更换同支持地区的另一条节点，配合无痕窗口重试即可；切勿盲目频繁刷新。' },
        { q: '为什么网页端能打开 OpenAI，但一直提示“Something went wrong”或对话发不出去？', a: '先检查 status.openai.com 确认是否 OpenAI 官方正在局部宕机；若官方运行正常，则多为浏览器扩展冲突、旧登录态 Token 过期或本地系统时间偏差引起，建议退出重新登录并在无痕模式对比测试。' },
      ],
    },
    body: `
**直接结论**：遇到 **ChatGPT 节点无法访问** 或 **OpenAI 服务报错**，不要第一时间就判定机场彻底失效，更不要到处下载不明“修复脚本”。按照 **官方服务状态 -> 节点地区归属 -> Cloudflare / IP 风险 -> 浏览器环境与 DNS** 这四步依次排查，90% 以上的访问问题都能迅速准确定位。

## 一、常见 OpenAI / ChatGPT 报错对照与成因诊断

| 报错现象 / 提示 | 核心原因分类 | 推荐安全处理动作 |
|---|---|---|
| **"OpenAI's services are not available in your country"** | **节点地区不在支持范围**（最常见：误用了香港节点） | 在客户端切换至美国、日本、新加坡、台湾或英国节点，清除浏览器对应站点 Cookie 后刷新 |
| **Error 1020 / Sorry, you have been blocked** | **Cloudflare WAF 拦截**（共享出口 IP 请求密度过高） | 更换至同地区的其他备用节点（例如从“日本 01”切至“日本 03”或“新加坡”），避免高频刷页面 |
| **Unusual activity has been detected** | **账号环境或 IP 风控评分异常** | 停用可疑自动脚本或翻译/划词高频并发插件，固定单一地区节点并使用无痕模式重新登录 |
| **无限转圈 / 提示 "Verify you are human" 循环** | **浏览器指纹或时间偏差** | 开启系统“自动设置日期与时间”，禁用干扰性的广告/脚本拦截扩展后在标准浏览器正常通过官方人机校验 |
| **网页全员报错或 API 返回 502 / 503** | **OpenAI 自身服务端故障** | 直接访问官方状态页 \`https://status.openai.com\` 查看最新事故公告，等待官方恢复 |

## 二、标准五步排查流程

1. **第一步：先查官方状态页**
   在浏览器访问 \`status.openai.com\`，查看 ChatGPT 与 API 栏是否显示绿色 *Operational*。如果官方正处于 *Major Outage* 或 *Partial Outage*，切换任何机场节点都无效。
2. **第二步：核对节点出口地区**
   打开机场客户端，确认当前选中的不是“香港”或“自动选择（可能选到低延迟香港节点）”，手动固定选为 **日本、新加坡、台湾或美国**。
3. **第三步：用无痕窗口排除 Cookie 与扩展干扰**
   按 \`Ctrl + Shift + N\`（Mac 为 \`Cmd + Shift + N\`）开启无痕模式访问 \`chatgpt.com\`。如果无痕模式可以正常对话，说明原窗口被旧的地区 Cookie 缓存或某个浏览器扩展（如第三方提示词插件、安全 DNS 冲突）卡住。
4. **第四步：排查浏览器安全 DNS 与客户端规则**
   检查 Chrome / Edge 是否开启了受干扰的外部安全 DNS（DoH），并确认 \`chatgpt.com\`、\`openai.com\`、\`oaistatic.com\`、\`oaiusercontent.com\`、\`auth0.com\` 等关联域名均处于代理规则下（官方客户端一般已内置，第三方 Clash 用户需确认规则库保持更新）。
5. **第五步：联系对应客服确认节点状态**
   如果确认系统时间准确、非香港节点且套餐流量充足，但该机场所有支持地区节点均返回 403/拦截，再截图当前连接节点名称提交工单给品牌客服核对，详见 [机场客服售后怎么判断](/safety/customer-support/)。
`,
  },
  {
    file: 'claude/login-errors.md',
    fm: {
      title: 'Claude登录网络异常排查：验证码接收、地区拦截与账号安全风控分析',
      description: '系统排查Claude (Anthropic) 登录失败与网络异常：区分邮箱/手机号验证阻断、不支持地区拦截、IP频繁切换触发的风控与浏览器兼容问题，提供官方状态检查方法。',
      slug: 'claude/login-errors',
      category: 'AI 工具网络知识',
      platform: 'Claude (Anthropic)',
      primaryKeyword: 'Claude登录网络异常',
      secondaryKeywords: ['Claude无法登录', 'Anthropic登录报错', 'Claude账号风控'],
      searchIntent: '排查Claude注册与登录过程中出现的网络跳转失败、邮箱验证码无响应或地区拒绝提示',
      publishDate: DATE,
      updatedDate: DATE,
      documentedVersion: 'Anthropic Claude Web & Mobile 登录认证流程',
      tags: ['Claude', '登录异常', 'Anthropic', '排查'],
      relatedBrands: ['lingdongyun', 'twilight', 'breezenet', 'flyv'],
      sources: ['Anthropic 官方支持文档', 'status.anthropic.com 服务状态页'],
      faqs: [
        { q: '为什么 Claude 登录后立刻提示“Your account has been disabled”或登录邮件链接点开报错？', a: 'Anthropic 对注册与登录期间的 IP 一致性、邮箱域名信誉以及虚拟号段审查极严。使用高风险共享 IP 或不稳定的接码平台注册极易触发风控。若为正常个人账号误拦，应通过 Anthropic 官方支持渠道申诉，不要反复换节点尝试撞库登录。' },
        { q: '点击 Continue with Google 登录 Claude 时一直跳转失败怎么办？', a: '第三方 Google 授权登录需要同时打通 accounts.google.com 与 claude.ai 的重定向回调。请确保两个域名走同一个国家的出口节点，不要把 Google 规则分到香港而把 Claude 分到美国，否则回调会校验失败。' },
      ],
    },
    body: `
**直接结论**：**Claude 登录网络异常**大多不是单纯的“网速慢”，而是由 **授权回调域名分流不一致**（Google 登录跨区）、**Anthropic 地区不支持**、**共享出口 IP 触发风险评分**，或 **邮箱验证链接打开环境与发起登录环境 IP 不同** 导致。

## 一、Claude 登录异常的四大核心诱因与应对

1. **发起登录与点击邮件验证链接时的 IP 不一致**
   - **现象**：输入邮箱收到登录 Magic Link，但从手机邮箱 App 点开链接却显示失效或被拦截。
   - **原因与处理**：如果电脑上开着美国节点发起登录，却在未开同一节点的手机上直接点开邮件链接，Anthropic 会判定跨地区会话异常。务必在同一台设备、同一个固定节点与同一个浏览器内复制登录链接或输入验证码完成登录。
2. **Google 一键登录回调（OAuth）跨区分流断裂**
   - **现象**：点 *Continue with Google* 弹出授权页，点确认后跳回 \`claude.ai\` 报网络错误。
   - **原因与处理**：部分用户的第三方规则将 \`google.com\` 分流至香港节点，而将 \`claude.ai\` 分流至美国/新加坡节点。由于香港不在 Claude 支持地区，这种分裂规则会导致登录异常。应将 AI 平台与 Google 登录域名共同置于非香港的同一支持地区分组下。
3. **官方服务状态波动或维护**
   - 处理前先查看 \`https://status.anthropic.com\`，确认 \`claude.ai\` 和身份认证服务是否全部正常。
4. **共享节点出口拥挤触发安全拦截**
   - 若页面提示安全阻止或风控验证无法通过，可切换至机场内另一个支持地区的低负载节点（如从常见美国节点换至日本或欧洲支持地区节点），并使用纯净无痕浏览器窗口重试。

## 二、安全与合规提醒

- **切勿购买来路不明的共享 Claude 成品号**：多人合用同一凭证或绑定未知邮箱，不仅隐私内容完全暴露，还极易因他人违规操作导致连带封号。
- **妥善保存合法验证方式**：确保使用的邮箱与联系方式归本人长期可控；若遇账号风控提示，按 Anthropic 官方帮助中心指引提交申诉，不要使用任何宣称可“绕过限制”的第三方破解插件。

更多节点选区方法请查看 [Claude 机场节点选择](/ai/claude/) 与 [AI 工具多地区节点对比](/ai/region-comparison/)。
`,
  },
  {
    file: 'gemini/availability.md',
    fm: {
      title: 'Gemini地区限制排查：国家支持清单、Google账号归属与IPv6检查',
      description: '深度排查Google Gemini与AI Studio地区限制原因：解释Google服务条款国家归属机制、为什么非香港节点仍可能报地区不可用、IPv6泄露检查及官方支持文档核对方法。',
      slug: 'gemini/availability',
      category: 'AI 工具网络知识',
      platform: 'Google Gemini',
      primaryKeyword: 'Gemini地区限制排查',
      secondaryKeywords: ['Gemini当前地区不支持', 'Gemini不可用怎么办', 'Google账号地区修改'],
      searchIntent: '排查Google Gemini提示“所在国家/地区不支持”的多重原因并按合规途径核对解决',
      publishDate: DATE,
      updatedDate: DATE,
      documentedVersion: 'Google Gemini 可用地区支持政策',
      tags: ['Gemini', 'Google账号', '地区限制', 'IPv6'],
      relatedBrands: ['breezenet', 'wavenet', 'firefly', 'guangsuyun'],
      sources: ['Google Help Center: Where Gemini web app is available', 'Google 隐私政策与国家/地区关联说明'],
      faqs: [
        { q: '为什么换了新加坡或美国节点，Gemini 还是显示“目前无法在您所在的国家/地区使用”？', a: '首先确认无痕模式下未登录账号时提示是否消失；若未登录可打开而一登录个人 Google 账号就报错，说明是您该 Google 账号后台关联的“服务条款国家/地区”或 Google Play 国家设在了非支持地区。' },
        { q: '如何合规查询或核实 Google 账号的关联地区？', a: '可访问 Google 官方公布的“更新您用于 Google 服务的国家/地区”帮助表单页查看当前账户关联记录；切勿轻信网传随意提交虚假住址证明的违规教程。' },
      ],
    },
    body: `
**直接结论**：当 **Google Gemini** 弹出地区限制提示时，不能只看当前选的是不是“美国/日本”节点，还必须同时排查 **Google 账号自身关联的地区（Country Association）**、**本地 IPv6 流量泄漏** 以及 **浏览器历史位置缓存** 这三个常见盲区。

## 一、快速定位问题在“节点”还是“Google 账号”的对照测试法

1. **打开无痕浏览器窗口（不登录 Google 账号）**，连接日本、新加坡或美国节点访问 \`gemini.google.com\`。
   - **情况 A：无痕未登录时页面依然显示地区不支持**：说明当前**节点出口 IP 本身有问题**（可能节点实际出口落在香港、本地宽带 IPv6 直接泄漏了真实位置，或该 IP 段被 Google 误识别为受限地区）。
   - **情况 B：无痕未登录时显示正常登录按钮，但一登录自己的账号就提示地区限制**：说明**节点没问题，限制来自该 Google 账号本身的服务国家/地区属性**。

## 二、逐项解决节点层与系统层因素

- **避开香港与澳门节点**：再次核查节点列表，切勿把默认香港节点当成全局常用节点。
- **排查本地 IPv6 泄露**：目前国内三大运营商宽带和手机 5G 网络普遍自带原生 IPv6。Google 是全球对 IPv6 优先级最高的站点之一；如果客户端只接管了 IPv4 而放行 IPv6 直连，浏览器会直接通过本地 IPv6 访问 Google 并立即暴露真实归属地。建议在客户端设置中启用完整的 IPv6 代理接管，或在本地网络环境排查 IPv6 分流策略。
- **检查手机端系统定位权限**：Android / iOS 上的 Gemini 独立 App 有时会参考系统区域与 Google App 缓存，确保设备未向无关应用授予异常位置覆盖，且使用正规海外区商店下载官方版。

## 三、应对 Google 账号关联地区锁定的正规途径

如果通过第一步测试确认为**账号层限制**：
1. 登录 Google 账号进入 **Google 付款中心（pay.google.com）** 检查是否有遗留的付款资料或地区信息。
2. 参考 Google 官方帮助中心中关于“服务条款适用国家/地区”的说明表单，如实核对账户归属原因。
3. 切勿在网络上购买所谓的“已改区 Google 成品号”，此类批量账号存在较高的找回、封停或隐私安全风险。

如需查看明确在资料中提及 Gemini 兼容的品牌清单，请返回 [Gemini 机场推荐与地区说明](/ai/gemini/)。
`,
  },
  {
    file: 'node-selection.md',
    fm: {
      title: 'AI解锁节点怎么选？面向ChatGPT、Claude与Gemini的选区与稳态原则',
      description: '建立实用AI节点选择标准：总结日本、新加坡、台湾、美国等官方支持区的分工差异，解释为什么不应开启高频率自动切换节点，以及如何兼顾AI稳定与日常流量倍率。',
      slug: 'node-selection',
      category: 'AI 工具网络知识',
      platform: '全平台 AI',
      primaryKeyword: 'AI解锁节点怎么选',
      secondaryKeywords: ['AI节点地区', 'ChatGPT选哪个国家', 'Claude节点策略'],
      searchIntent: '掌握不同AI工具挑选节点的通用地区原则、切换频率控制与流量倍率注意事项',
      publishDate: DATE,
      updatedDate: DATE,
      documentedVersion: '2026 主流 AI 服务区域策略汇总',
      tags: ['AI选区', '节点选择', '规则分流', '防风控'],
      relatedBrands: ['lingdongyun', 'breezenet', 'flyv', 'shanyue'],
      sources: ['OpenAI / Anthropic / Google Gemini 官方地区文档', '18家品牌地区覆盖与倍率档案'],
      faqs: [
        { q: '日本、新加坡、台湾、美国节点访问 AI 到底选哪个最好？', a: '没有绝对唯一的最佳国家，需结合平台支持范围与拥挤度决定：ChatGPT、Claude、Gemini 均官方支持美国、日本、新加坡和台湾；其中日本与新加坡通常地理距离更近、网页响应更干脆，而美国节点则在面对少数仅限北美测试的 AI 新功能时覆盖最全。' },
        { q: '可以在客户端开启“每 5 分钟自动测速选最快节点”来用 AI 吗？', a: '非常不建议！高频自动切换节点不仅会在切换瞬间打断 AI 流式输出，还会让你的同一个 AI 账号在一天内不断在多个 IP 与国家间跳变，明显增加触发账号风控的概率。' },
      ],
    },
    body: `
**直接结论**：为 AI 工具挑选机场节点，应遵循 **“三不原则 + 三优原则”**：**不用香港节点、不用高频自动切换组、不用来历不明的低信誉共享入口**；**优先选用日本/新加坡/美国等官方全支持区、优先固定单个可用节点、优先配合域名规则分流以节省流量并降低风险**。

## 一、四大主力非香港地区的 AI 场景适配对比

| 节点地区 | 官方政策覆盖（ChatGPT / Claude / Gemini） | 实际使用场景特点 | 18家品牌覆盖度 |
|---|---|---|---|
| **日本** | 均在官方支持清单内 | 地理距离近，日常交互响应较快；注意避免使用极度拥挤的“01号”默认节点 | 全部 18 家品牌均标注包含日本 |
| **新加坡** | 均在官方支持清单内 | 东南亚常用枢纽节点，部分平台对其 IP 段风控相对温和，英文界面友好 | 全部 18 家品牌均标注包含新加坡 |
| **台湾** | 均在官方支持清单内 | 繁体中文提示更自然，适合搭配中文语境工具与常规对话；部分流媒体/AI 测试功能更新略晚于美国 | 17 家品牌明确标注包含台湾 |
| **美国** | 均在官方支持清单内（且新功能首发最多） | OpenAI/Anthropic/Google 新特性（如 Sora、新模型内测）常优先面向美国区开放 | 全部 18 家品牌均标注包含美国 |
| **香港** | **均不在常规支持清单内** | 只适合日常网页检索、GitHub、常规开发文档与普通海外站；**禁止用于 ChatGPT/Claude/Gemini/TikTok** | 全部 18 家品牌均包含香港 |

## 二、客户端内“策略组隔离”最佳实践

如果您使用的是支持自定义策略组的工具（或官方客户端带有“AI 专用分组”），最佳实践是将**日常业务**与 **AI 业务**拆开：
- **日常通用海外访问**：可选香港、新加坡或日本。
- **AI 工具专项分组**：仅包含日本、新加坡、台湾、美国节点，**把香港节点彻底排除在该分组外**，并设为“手动固定选择”一个稳定可用的节点。

## 三、AI 使用时容易忽略的倍率与流量细节

虽然纯文字对话本身消耗流量极小（100 万字纯文本交互通常不到几十 MB），但以下两类场景消耗会骤增：
1. **上传图片/PDF 文档与语音实时对话**：多模态交互与高清长文档分析会明显增大上行与下行传输量。
2. **注意品牌节点倍率**：选择例如全节点 **1× 倍率** 的品牌（如灵动云、微风网络等）更利于精准估算流量；若所购品牌某些 AI 专用或专线节点标注 **2× 或更高倍率**，实际扣减流量会翻倍，详见 [机场倍率是什么意思](/beginners/traffic-multiplier/)。
`,
  },
  {
    file: 'region-comparison.md',
    fm: {
      title: 'AI工具多地区节点对比：官方可用政策差异与18家品牌地区覆盖表',
      description: '客观对比美国、日本、新加坡、台湾、韩国、欧洲与香港地区在ChatGPT、Claude、Gemini官方政策上的差异，并完整列出18家机场品牌的实际地区覆盖资料，不编造延迟数据。',
      slug: 'region-comparison',
      category: 'AI 工具网络知识',
      platform: '多地区政策对照',
      primaryKeyword: 'AI工具多地区节点对比',
      secondaryKeywords: ['AI地区对比', '机场节点地区覆盖', '多地区AI支持'],
      searchIntent: '通过官方支持地区政策与18家品牌地区覆盘，合理规划多地区备用节点方案',
      publishDate: DATE,
      updatedDate: DATE,
      documentedVersion: '2026 官方区域清单与 18 家品牌地区资料',
      tags: ['多地区对比', '节点覆盖', 'AI政策', '品牌数据库'],
      relatedBrands: ['feimaoyun', 'guangsuyun', 'sogoyun', 'v2yun'],
      sources: ['OpenAI / Anthropic / Google 官方可用地区清单', '18家品牌节点地区公开档案'],
      faqs: [
        { q: '买机场时是不是节点国家越多，用 AI 就越好用？', a: '不一定。对于 AI 工具而言，重点在于日本、新加坡、台湾、美国、英国等官方核心支持区是否有足够可用的备用节点，而不是一味追求几十个冷门小国。冷门地区不仅物理绕远，还可能触发账号异常异地登录风控。' },
        { q: '为什么这里不列出各地区节点的延迟毫秒数和解锁率排行榜？', a: '因为本地实际延迟取决于用户所在城市运营商（电信/联通/移动）、本地宽带环境及当日动态路由，且 AI 平台风控策略随时调整。本站坚持不虚构任何“实测延迟”或“解锁率百分比”，只提供真实官方地区政策与品牌原始覆盖资料。' },
      ],
    },
    body: `
**直接结论**：对比不同地区的 AI 节点，必须把**平台官方政策可用性**与**品牌实际覆盖节点池**分开来看。**美国、日本、新加坡、台湾、英国、德国、韩国**均位于主流 AI 官方支持列表中；**中国香港**则普遍被 ChatGPT、Claude 与 Gemini 排除在消费级支持地区之外。

## 一、18 家机场品牌公开地区覆盖对照（依据历史资料核对）

| 品牌 | 编辑序 | 公开资料列明覆盖地区 | 资料提及 AI 工具 |
|---|---|---|---|
| [灵动云](/brands/lingdongyun/) | 01 | 香港、台湾、日本、新加坡、美国（共 60 节点） | ChatGPT、Claude、Midjourney |
| [暮光加速](/brands/twilight/) | 02 | 香港、台湾、日本、新加坡、美国（共 60 节点） | ChatGPT、Claude |
| [微风网络](/brands/breezenet/) | 03 | 香港、日本、新加坡、美国、台湾（共 53 节点） | ChatGPT、Claude、Gemini |
| [飞猫云](/brands/feimaoyun/) | 04 | 港、台、日、新、美、韩、马、越、菲、泰、印、英、法、德、阿等 15 地区（63 节点） | ChatGPT、Claude |
| [FLYV](/brands/flyv/) | 05 | 香港、台湾、日本、新加坡、美国（共 60 节点） | ChatGPT、Claude、Midjourney、Copilot |
| [浪网](/brands/wavenet/) | 06 | 香港、台湾、日本、新加坡、美国 | ChatGPT、Gemini |
| [隐形人](/brands/yinxingren/) | 07 | 香港、台湾、日本、新加坡、马来西亚、美国（共 60 节点） | ChatGPT、GitHub Copilot、Hugging Face |
| [无忧链接](/brands/wuyou/) | 08 | 香港、台湾、日本、新加坡、美国、东南亚、欧美 | ChatGPT、Gemini |
| [Firefly](/brands/firefly/) | 09 | 香港、台湾、日本、新加坡、美国 | ChatGPT、Gemini、Meta AI |
| [全球云](/brands/quanqiuyun/) | 10 | 香港、台湾、日本、新加坡、美国、马来西亚、德国、土耳其、巴西 | ChatGPT、Claude |
| [唯兔云](/brands/v2yun/) | 11 | 港、台、日、新、马、美、英、德、法、泰、菲、印等 12 地区 | ChatGPT、Gemini |
| [灵猫](/brands/lingmao/) | 12 | 香港、台湾、日本、新加坡、美国 | ChatGPT、Gemini |
| [闪跃](/brands/flashleap/) | 13 | 香港、台湾、日本、新加坡、美国 | ChatGPT、Claude、Gemini |
| [梯子云](/brands/laddercloud/) | 14 | 覆盖香港、日本、新加坡、美国等常用地区 | ChatGPT（资料提示其他 AI 视政策而定） |
| [光速云](/brands/lightspeed/) | 15 | 港、台、日、新、美、韩、马、英、法、德、土、泰、巴等 13 地区 | ChatGPT、Gemini |
| [U1S1](/brands/u1s1/) | 16 | 香港、台湾、日本、新加坡、美国、英国、德国、法国 | ChatGPT、Claude、Midjourney |
| [Sogo云](/brands/sogoyun/) | 17 | 港、台、日、新、美、韩、马、英、法、德、土、泰、巴等 13 地区（55 节点） | ChatGPT、Claude、Midjourney |
| [跨界](/brands/kuajie/) | 18 | 香港、台湾、日本、新加坡、美国 | ChatGPT、Gemini、Claude |

## 二、多地区节点规划的实操建议

1. **核心 5 区足以覆盖 95% 需求**：全部 18 家品牌几乎都把资源重心放在香港、台湾、日本、新加坡、美国五个核心区。使用 AI 工具时，日/新/台/美四区互为备份已经足够。
2. **欧洲与韩国地区的补充意义**：若某个热门亚太节点在高峰时段触发了 Cloudflare 验证，切换至飞猫云、光速云、唯兔云、Sogo云或 U1S1 提供的英国、德国、法国或韩国节点往往能提供不错的备用入口。
3. **不要只看地区名而忽略协议与线路类型**：实际跨地区体验取决于运营商互联、带宽负载与个人账号信誉，推荐通过各品牌最低月付档先行验证日常工作流，详见 [机场长期稳定性怎么判断](/safety/reliability/)。
`,
  },
];

const STREAMING_PAGES = [
  {
    file: 'netflix.md',
    fm: {
      title: 'Netflix机场推荐与观影知识：版权区域、账号条件与品牌资料汇总',
      description: '全面解析使用Netflix所需的网络与合规前提：区分不同国家版权片库差异、非自制剧数据中心IP限制、Widevine硬件DRM画质要求，及18家品牌Netflix公开适配资料。',
      slug: 'netflix',
      category: '流媒体网络知识',
      platform: 'Netflix',
      primaryKeyword: 'Netflix机场推荐',
      secondaryKeywords: ['奈飞机场', 'Netflix节点选择', 'Netflix自制剧限制'],
      searchIntent: '了解Netflix地区版权机制、播放条件及公开资料提及Netflix适配的品牌列表',
      publishDate: DATE,
      updatedDate: DATE,
      documentedVersion: 'Netflix 区域版权与设备 DRM 播放规范',
      tags: ['Netflix', '奈飞', '流媒体', 'DRM画质'],
      relatedBrands: netflixBrands.slice(0, 4).map((b) => b.slug),
      sources: ['Netflix 帮助中心：播放画质与区域内容说明', '18家品牌流媒体公开资料'],
      faqs: [
        { q: '为什么连上美国节点打开 Netflix 还是只能搜到《怪奇物语》等自制剧？', a: '当 Netflix 识别到出口 IP 属于商业数据中心或大规模共享代理 IP 时，平台出于版权协议限制会屏蔽第三方授权影视（仅展示 Netflix Originals 全球自制剧）。这属于平台版权风控机制，而非网速问题。' },
        { q: '18 家机场都能保证永久看 Netflix 非自制剧和 4K 吗？', a: '不能！所有品牌在公开资料中均明确说明“不作流媒体永久保证”，Netflix 的 IP 封禁库会动态更新；同时 4K 画质不仅依赖带宽，还要求您的 Netflix 订阅属于高级套餐且播放设备通过 Widevine L1 / HDCP 2.2 硬件认证。' },
      ],
    },
    body: `
**直接结论**：流畅观看合规订阅的 **Netflix**，需要同时满足三方面条件：**有效的高级/标准 Netflix 会员账号**、**支持对应地区授权内容与防数据中心误判的节点出口**，以及**满足 DRM 版权解码级别的播放终端与稳定带宽**。18 家已整理品牌资料中，虽然均在公开介绍里提及适配 Netflix，但也普遍附带“可用性随平台政策动态变化，不作持续保证”的客观提示。

## 一、Netflix 网络与画质的三大常见误解

| 误解 | 客观事实与真实原理 |
|---|---|
| **“只要节点能打开 Netflix 就能看全片库”** | Netflix 按国家购买影片版权。例如港剧、部分日漫、美剧分别只存在于特定国家区库；且若出口 IP 被判定为常规代理段，账户只能看到 Netflix 全球自制剧。 |
| **“网速快就一定能看 4K HDR”** | Netflix 4K 必须同时满足：账户是支持 4K 的高级订阅（Premium）+ 浏览器/设备支持硬件 DRM（例如 Windows 用 Edge 浏览器或官方 App 支持 PlayReady 4K，而部分 Linux/普通安卓机型若无 Widevine L1 仅能输出 720p/1080p）。 |
| **“单月 50GB 流量够天天追 4K 美剧”** | Netflix 官方标注标准 1080p 高清约消耗 **3 GB/小时**，4K 超高清高达 **7 GB/小时**。每天看 2 小时 4K 一周就会用掉近 100 GB 流量！ |

## 二、公开资料提及 Netflix 的品牌覆盖情况

以下汇总 18 家品牌资料中涉及 \`Netflix\` 的公开信息（按编辑顺序展示，非实测排名）：

${renderBrandTable(netflixBrands, 'streaming')}

## 三、合法观看 Netflix 的地区选择与防卡顿要点

1. **按片库偏好选地区**：偏好中文界面和部分港台剧/动画可优先考虑**香港或台湾**节点；偏好欧美院线及完整英语原声片库优先考虑**美国或英国**；偏好最新日漫与特摄可考虑**日本**；新加坡节点则常提供较丰富的多语种中文字幕支持。
2. **避免在同户验证期间频繁跨国切节点**：Netflix 推行同户设备限制（Household），在短时间内跨多个大洲来回登录同一账号容易触发额外邮箱/短信确认提示。
3. **如何自行核查当前节点片库状态？** 请阅读 [Netflix 解锁检测教程（合法官方自查方法）](/streaming/netflix/status-check/)。
`,
  },
  {
    file: 'youtube.md',
    fm: {
      title: 'YouTube机场推荐与网络指南：1080p/4K带宽估算、流量消耗与会员注意',
      description: 'YouTube油管网络使用百科：汇总1080p/4K/8K视频播放带宽要求与流量消耗表、YouTube Premium区服注意事项，以及影响播放流畅度的核心网络因素。',
      slug: 'youtube',
      category: '流媒体网络知识',
      platform: 'YouTube',
      primaryKeyword: 'YouTube机场推荐',
      secondaryKeywords: ['油管机场', 'YouTube 4K流量', 'YouTube看视频选什么套餐'],
      searchIntent: '了解观看YouTube高清视频所需的带宽与每月流量预算，并排查常见账号与画质问题',
      publishDate: DATE,
      updatedDate: DATE,
      documentedVersion: 'YouTube 视频流传输规范',
      tags: ['YouTube', '油管', '4K视频', '流量计算'],
      relatedBrands: youtubeBrands.slice(0, 4).map((b) => b.slug),
      sources: ['YouTube 官方系统与网络带宽建议文档', '18家品牌资料'],
      faqs: [
        { q: '为什么 YouTube 是所有流媒体里对节点“地区解锁”要求最低的？', a: '因为 YouTube 绝大多数视频面向全球公开分发，不像 Netflix 或 Disney+ 那样在多数常规国家地区做严格的数据中心 IP 屏蔽，因此几乎所有正常可用节点都能打开观看，核心门槛主要在于持续稳定的下行带宽与每月流量包大小。' },
        { q: '每天在电脑上看 1–2 小时 YouTube 1080p 或 4K，一个月买多少 GB 流量合适？', a: '按常规码率估算：1080p (30/60fps) 每小时约消耗 1.2–2.0 GB，每天 1.5 小时一个月约需 60–90 GB；若经常看 4K 视频（每小时 3–5 GB 以上），建议月流量额度至少准备 200 GB–500 GB 或选择全节点 1× 倍率的大容量套餐。' },
      ],
    },
    body: `
**直接结论**：相比 Netflix 和 Disney+，**YouTube 对出口 IP 归属与商业 IP 封禁的限制最宽松**。选择适合看 YouTube 的机场套餐时，最关键的指标不是花哨的宣传词，而是**充足的月流量额度（尤其是 1080p/4K 高频观看者）**、**全节点 1× 倍率计费规则**以及**稳定的传输带宽**。

## 一、YouTube 不同画质官方建议网速与流量消耗参照

| 画质等级 | YouTube 官方建议持续下行速率 | 每小时大致流量消耗（估算范围） | 适合的机场流量档位 |
|---|---|---|---|
| **720p HD** | 2.5 Mbps 以上 | 约 0.7 – 1.0 GB/小时 | 40–100 GB/月轻量档 |
| **1080p Full HD (含 60fps)** | 5 – 8 Mbps 以上 | 约 1.2 – 2.2 GB/小时 | 100–200 GB/月主力档 |
| **1440p (2K)** | 12 Mbps 以上 | 约 2.5 – 3.5 GB/小时 | 200–500 GB/月进阶档 |
| **2160p (4K)** | 20 – 35 Mbps 以上 | 约 4.5 – 7.5 GB/小时 | 500 GB – 1 TB/月高流量档 |

> **倍率提醒**：部分品牌会对特定高级专线设置 \`1.5×\` 或 \`2×\` 倍率扣费。如果用 \`2×\` 倍率节点看 4K 视频，看 1 小时就会扣掉约 10–15 GB 套餐额度；优先选用**全节点 1× 倍率**或容量充沛的套餐更能准确控制预算。

## 二、资料提及适配 YouTube 的品牌记录

虽然几乎所有正常代理节点均可访问 YouTube，以下品牌在公开资料中额外显式列出了 \`YouTube\` 或 \`YouTube Premium\` 适配说明：

${renderBrandTable(youtubeBrands, 'streaming')}

## 三、YouTube 使用中常见网络与账号注意点

1. **YouTube 登录“送中”提示或广告地区异常**：当部分共享出口 IP 被大量境内用户访问时，Google 的定位算法可能临时将该 IP 判定为其他区域，导致部分地区限定的音乐/视频或 YouTube Premium 家庭组验证受影响。此时切换至其他冷门一点的同区节点即可缓解。
2. **后台播放卡顿或反复缓冲怎么查？** 请不要盲目更换客户端，先用浏览器内置的“详细统计信息”确认问题源头，详见 [YouTube 缓冲慢怎么办](/streaming/youtube/buffering/)。
`,
  },
  {
    file: 'disney-plus.md',
    fm: {
      title: 'Disney+机场推荐与使用条件：区服差异、Error 83 排查与品牌清单',
      description: 'Disney+迪士尼流媒体使用百科：解析美区/港区/台区/日区/新加坡区内容区别、错误代码83成因、设备兼容性要求与18家品牌公开Disney+适配资料。',
      slug: 'disney-plus',
      category: '流媒体网络知识',
      platform: 'Disney+',
      primaryKeyword: 'Disney+机场推荐',
      secondaryKeywords: ['迪士尼流媒体节点', 'Disney+ Error 83', 'Disney+看不了'],
      searchIntent: '了解Disney+的地区账号机制、常见错误代码成因及品牌公开适配记录',
      publishDate: DATE,
      updatedDate: DATE,
      documentedVersion: 'Disney+ 区域内容授权与客户端规范',
      tags: ['Disney+', '流媒体', '地区片库', 'Error83'],
      relatedBrands: disneyBrands.slice(0, 4).map((b) => b.slug),
      sources: ['Disney+ 帮助中心支持设备与地区说明', '18家品牌流媒体公开资料'],
      faqs: [
        { q: '为什么我在香港节点能打开 Disney+，切换到美国节点却提示无法播放或黑屏？', a: 'Disney+ 的部分区域账户体系（特别是特定时期注册的账号或订阅渠道）与内容片库高度绑定。此外，部分机场在北美与亚太地区对 Disney+ 的 IP 适配程度并不同步，换区时需重新核对当前账号支持的服务区域。' },
        { q: 'Disney+ 提示 Error Code 83 是机场节点被封了吗？', a: '不一定。Error 83 是 Disney+ 最常见的通用兼容报错，成因既可能是出口 IP 被识别限制，也可能是设备浏览器不支持所需 DRM 安全级别、系统时间偏差或客户端 App 版本过旧。' },
      ],
    },
    body: `
**直接结论**：**Disney+** 对跨地区登录、账号归属一致性以及客户端 DRM 加密环境要求较高。在 18 家已核对品牌中，几乎所有主流品牌的资料均提及适配 Disney+，但不同地区节点（美区、港区、台区、日区、新加坡区）所呈现的片库与可播放性差异明显，**切忌认为买了套餐就能在任意国家节点无缝漫游 Disney+**。

## 一、Disney+ 不同地区版本与网络核心要求

1. **Star 板块与全年龄分级差异**：在**香港、台湾、新加坡、日本及欧洲**区，Disney+ 内置成人向与大量日韩/华语影视的 **Star** 板块；而在**美国本土**，部分成人或 Hulu 版权内容需配合联合套餐体系观看。
2. **账号区服与节点匹配原则**：如果您订阅的是亚太区常见账号，优先使用**香港、台湾、新加坡或日本**节点登录，不仅加载顺滑，字幕（繁中/简中）也最齐全；具体各区对照请看 [Disney+ 地区节点选择](/streaming/disney-plus/regions/)。

## 二、公开资料明确列明 Disney+ 适配的品牌记录

${renderBrandTable(disneyBrands, 'streaming')}

## 三、常见错误代码（如 Error 83 / Error 73）快速排查思路

- **Error 73（仅在特定地区可用）**：明确指向出口 IP 地区受限或本地 IPv6 泄漏了不支持的地理归属，需切换明确支持 Disney+ 的地区节点并关闭本地干扰性位置权限。
- **Error 83（设备或环境兼容报错）**：
  1. 确认使用的不是过旧浏览器或非官方修改版系统环境。
  2. 尝试退出账号后清除浏览器缓存，或在 iOS/Android 官方端更新至最新版再重试。
  3. 检查当前是否同时启用了多款网络拦截或广告屏蔽工具拦截了 Disney+ 的 DRM 认证域名。
`,
  },
  {
    file: 'tiktok.md',
    fm: {
      title: 'TikTok节点推荐与使用前提：地区屏蔽政策、SIM卡检测与合规环境',
      description: 'TikTok国际版网络与设备环境百科：说明为什么香港节点不可访问TikTok、设备SIM卡与系统时区语言检测机制、直播与日常观看差异及资料标注支持TikTok的品牌。',
      slug: 'tiktok',
      category: '流媒体网络知识',
      platform: 'TikTok',
      primaryKeyword: 'TikTok节点推荐',
      secondaryKeywords: ['TikTok用什么节点', 'TikTok无网络连接', 'TikTok机场'],
      searchIntent: '了解访问国际版TikTok所需的节点地区及设备软硬件前置条件，避开无效香港节点与修改版风险',
      publishDate: DATE,
      updatedDate: DATE,
      documentedVersion: 'TikTok 国际版区域与移动客户端环境要求',
      tags: ['TikTok', '短视频', '香港限制', '设备环境'],
      relatedBrands: tiktokBrands.map((b) => b.slug),
      sources: ['18家品牌 TikTok 适配公开记录', '移动设备环境与网络服务公开文档'],
      faqs: [
        { q: '为什么其他海外网站都能正常看，一打开 TikTok 却一直转圈黑屏或提示无网络连接？', a: '有两个最常见原因：① 选用了香港节点（TikTok 国际版已停止对香港地区服务，选香港节点必然无法刷出内容）；② 手机内插入了中国大陆运营商 SIM 卡，而客户端或设备未满足目标地区环境要求，触发了应用内地区屏蔽。' },
        { q: '在网上下载“去限制破解版 TikTok APK/IPA”安全吗？', a: '强烈不建议！第三方来历不明的修改版客户端不仅容易导致账号异常（零播放/限流/封号），更可能植入窃取本地通讯录、相册或社媒凭证的恶意代码。' },
      ],
    },
    body: `
**直接结论**：使用 **TikTok 国际版** 与一般网页浏览的最大不同在于：**它同时检测“网络出口地区”与“手机硬件/系统环境”**。首先**绝对不能使用香港节点**（TikTok 官方已退出香港服务）；其次在移动端使用官方原版 App 时，还需要留意设备 SIM 卡归属地、系统语言/时区以及 App Store 下载区域。

## 一、公开资料明确提及 TikTok 支持的品牌（${tiktokBrands.length} 家）

在 18 家品牌核对档案中，明确在列表写明支持 \`TikTok\` 或 TikTok 直播定位的品牌如下（注意各品牌均不提供永久保障，且需配合正确非香港地区节点）：

${renderBrandTable(tiktokBrands, 'streaming')}

*(注：若您计划用于跨境直播推流等高稳定性、固定纯净住宅 IP 要求极高的商业用途，普通共享机场节点通常难以替代专门的定制独享方案，详见 [视频直播低延迟节点说明](/streaming/live-streaming/)。)*

## 二、TikTok 无法加载内容的两大层原因拆解

### 1. 网络层限制（节点选区错误）
- **误选香港节点**：这是 90% 初学者的第一误区。请切换至 **日本、新加坡、台湾、美国或英国** 节点，并把代理软件的规则中 \`tiktokv.com\`、\`tiktokcdn.com\`、\`byteoversea.com\` 全部划入目标非香港分组。

### 2. 终端设备层特征检测（手机端常见）
- **SIM 卡归属地检测**：手机版原版 TikTok App 会读取设备移动网络国家代码（MCC）。对于插有境内实体 SIM 卡的手机，有时即便开启了美国节点，原版 App 依然显示无网络。若仅作普通浏览观看，在电脑/平板桌面浏览器访问 \`tiktok.com\` 网页版往往更简单，不受手机 SIM 卡硬件读取限制。
- **时区与定位一致性**：移动设备若长时间处于未同步的目标国时区或向 TikTok 授予了精准 GPS 定位，也可能引起内容推荐异常或登录拦截。

## 三、安全使用边界提醒

- 坚持从海外区 App Store 或 Google Play 下载官方原版 TikTok，不要在主力手机安装网上流传的修改版安装包。
- 不要盲目相信“买某个普通共享节点就能保证做百万播放带货账号”的营销宣传，商业运营对独立环境与合规资质有更高要求。
`,
  },
  {
    file: 'service-selection.md',
    fm: {
      title: '流媒体解锁机场怎么选？理解版权限制、共享IP局限与官方资料筛选法',
      description: '客观剖析“流媒体解锁机场”概念：解释流媒体服务商识别商业IP的技术原理、为何不存在100%永久解锁承诺，以及如何依据18家品牌真实资料而非虚假排行榜筛选套餐。',
      slug: 'service-selection',
      category: '流媒体网络知识',
      platform: '多平台流媒体',
      primaryKeyword: '流媒体解锁机场',
      secondaryKeywords: ['流媒体解锁原理', '机场流媒体怎么选', '原生IP与解锁'],
      searchIntent: '理解流媒体解锁的技术边界，学会依据真实品牌资料与使用场景理性挑选套餐',
      publishDate: DATE,
      updatedDate: DATE,
      documentedVersion: '2026 流媒体地区授权与代理技术通则',
      tags: ['流媒体解锁', '地区版权', '理性选购', '带宽'],
      relatedBrands: ['lingdongyun', 'twilight', 'breezenet', 'guangsuyun'],
      sources: ['18家品牌流媒体声明与服务边界档案'],
      faqs: [
        { q: '所谓的“流媒体解锁”到底是指什么技术？', a: '流媒体平台（如 Netflix、Disney+）根据版权方要求屏蔽非本地商业数据中心 IP。“流媒体解锁”通常指机场服务商通过更换住宅/本土ISP广播IP落地节点，或将特定流媒体域名通过 DNS 解锁转发给具备当地合法版权访问资格的落地出口，使其显示为正常本地居民访问状态。' },
        { q: '为什么同一家机场，上个月能看 Disney+，这个月突然提示地区不支持？', a: '因为流媒体平台的 IP 数据库是持续动态更新的。只要共享该出口 IP 的人数过多，一旦被平台风控系统重新标记为数据中心或代理段，就会暂时失效，直到服务商维护调整落地 IP。这也是没有任何负责任的资料敢承诺“永久解锁”的原因。' },
      ],
    },
    body: `
**直接结论**：所谓“**流媒体解锁机场**”，本质上是服务商在部分地区节点后端配置了能够通过 Netflix、Disney+、Abema、HBO 等版权方区域校验的出口 IP 或分流落地。然而，**所有流媒体平台都在持续升级对代理 IP 的识别机制**，因此理性选型的正确方式是：**看清服务商标注的支持清单与地区覆盖，拒绝“永久100%解锁”的虚假承诺，并优先用月付方案检验自己的主力剧集平台**。

## 一、看懂主流流媒体平台的严格程度分级

| 严格分级 | 代表平台 | 常见限制特征 | 选型重点 |
|---|---|---|---|
| **宽松级** | YouTube、Spotify | 仅个别版权音乐或广告区域变化，极少大面积封锁 IP | 关注持续带宽、每小时流量消耗与 1× 倍率 |
| **中度敏感级** | Netflix、HBO Max、Prime Video | 会屏蔽常规机房 IP 段，拦截时仅保留平台自制剧 | 关注节点地区数量（日/新/台/美多线备份）与 DNS 分流支持 |
| **高度敏感级** | Disney+、Abema、TVer、BBC iPlayer、TikTok | 严格校验当地原生/ISP 归属，并交叉核对账号区服与设备环境 | 关注品牌是否在资料中明确标注对应平台（例如隐形人/灵动云/FLYV提及 Abema/TVer/BBC） |

## 二、18 家品牌中含特殊小众流媒体标注的参考（依据原始档案）

除了常见的 Netflix 与 Disney+，部分品牌档案中记载了更细分的区域流媒体标注：
- **日本本土流媒体（Abema / TVer）**：[灵动云](/brands/lingdongyun/)、[隐形人](/brands/yinxingren/)、[FLYV](/brands/flyv/) 公开资料均列明覆盖 Abema（隐形人与 FLYV 亦提及 TVer）。
- **英国 / 欧美流媒体（BBC / HBO / Hulu / DAZN）**：[隐形人](/brands/yinxingren/) 提及 BBC；[暮光加速](/brands/twilight/)、[全球云](/brands/quanqiuyun/)、[跨界](/brands/kuajie/) 等提及 Hulu、HBO、DAZN。
*(注：上述信息均源于品牌公开资料存档，是否适配当前在播剧集请以实时登录观看状态为准。)*

## 三、购买前必读的三条理性防踩坑建议

1. **先备齐合规账户与终端**：流媒体服务本身需要合法付费会员才能观看正版内容，机场仅提供网络通道，并不赠送 Netflix 或 Disney+ 账号。
2. **估算流量配额再选档位**：高清视频比文字网页消耗高出数十倍流量，经常看 1080p/4K 的用户应重点查看 [大流量预算与流媒体流量估算](/beginners/traffic-calculation/)。
3. **优先选择月付体验**：不要因为一张网页广告上的“全解锁列表”就一次性购买两三年套餐，详见 [购买风险与预付边界](/safety/purchase-risk/)。
`,
  },
  {
    file: 'netflix/status-check.md',
    fm: {
      title: 'Netflix解锁检测教程：通过官方账户与合规方式自行核查片库状态',
      description: '合法合规的Netflix状态自查教程：说明如何在已登录官方账户中检索非自制剧确认当前片库可见性、使用fast.com评估带宽，解释为何不轻信第三方检测脚本及避免伪造检测报告。',
      slug: 'netflix/status-check',
      category: '流媒体网络知识',
      platform: 'Netflix',
      primaryKeyword: 'Netflix解锁检测教程',
      secondaryKeywords: ['Netflix自查', 'Netflix非自制剧测试', 'fast.com测速'],
      searchIntent: '学习安全、官方允许的个人自查方法，确认当前登录账号下的Netflix片库与传输状态',
      publishDate: DATE,
      updatedDate: DATE,
      documentedVersion: 'Netflix 官方网页端与 fast.com 公开检查方式',
      tags: ['Netflix检测', '自查教程', 'fast.com', '合规检查'],
      relatedBrands: ['lingdongyun', 'twilight', 'breezenet'],
      sources: ['Netflix 帮助中心：VPN 或代理错误排查说明', 'Fast.com 官方带宽测速说明'],
      faqs: [
        { q: '为什么不用来历不明的一键检测脚本去批量扫描别人机场的 IP？', a: '首先，非授权的自动化高频脚本探测本身可能违反平台或服务商条款，且把陌生探测脚本跑在本地可能带来安全风险；其次，许多第三方脚本仅判断某一部老电影的返回码，常常与您自己正版账号实际能播放的内容存在误差。' },
        { q: '最准确、合规的自查方法是什么？', a: '直接登录您自己的正版 Netflix 账号（网页端或官方 App），在搜索框里检索当前地区经典第三方版权片名（如所在区的知名非自制电影/动画），能看到播放按钮且播放时不弹代理限制提示，同时在 fast.com 观察实际连接稳定性，就是最准确的个人检查方式。' },
      ],
    },
    body: `
**直接结论**：确认当前网络环境在 **Netflix** 下的真实可见片库与传输能力，**最可靠且合规的方式并非运行来历不明的第三方“解锁脚本”，而是直接在已登录的官方 Netflix 界面中进行标准检索与播放验证，并搭配 Netflix 官方推出的 fast.com 检查实际带宽**。本站仅介绍用户自行核查的原理与方法，不生成任何虚拟或第三方检测报告。

## 一、两步合规自查法（无需安装任何额外插件）

### 第一步：官方登录态下检查非自制剧可见性
1. 在桌面浏览器（或官方 App）连接您要使用的机场节点。
2. 登录您本人合法订阅的 Netflix 账号，进入主界面。
3. **区分“全局自制剧”与“区域授权片库”**：
   - 如果搜索栏只能搜出如 *Stranger Things（怪奇物语）*、*Squid Game（鱿鱼游戏）* 等标有红色 **N** 字标的 Netflix 自制剧（Originals），而搜不到常规好莱坞院线片、经典美剧或当地热门日漫（如 *绝命毒师 Breaking Bad*、*进击的巨人* 等非 Netflix 独家版权剧集），说明当前节点 IP 暂时仅被允许访问自制剧范围。
   - 若能正常搜出对应区域版权剧集且点击播放不报错，则表明当前账号与该出口网络在当前时刻兼容该区域授权内容。

### 第二步：使用 Netflix 官方 fast.com 检查链路带宽
1. 在同一个代理连接状态下，打开 Netflix 官方维护的无广告纯网速测试页 \`https://fast.com/\`。
2. 该页面直接向 Netflix 自家的 Open Connect CDN 服务器发起并发请求测试。
3. 测试完成后点击 **Show more info（显示更多信息）**，可参考下载速率（若达 25 Mbps 以上即符合 4K 建议带宽）、延迟及上行速率，帮助你判断是否足够支撑高清播放。

## 二、为什么必须警惕网传“一键检测工具”与“测速截图”？

1. **避免脚本安全隐患**：部分论坛传播的所谓“流媒体解锁测试工具”要求用户在本地电脑或路由器执行未经审核的远程 \`curl | bash\` 脚本，极易引入恶意后门或上传本地代理配置。
2. **结果具有时效性与个体差异**：即使某个时间点某位网友发出过一张“全绿截图”，也可能在几天后因出口 IP 调整或同节点拥挤而发生变化。切忌仅凭静态截图判断一个机场数月后的长期状态。

## 三、若发现仅限自制剧时的排查建议

- 先确认浏览器未启用冲突的安全 DNS（DoH）或本地 IPv6 未被接管（IPv6 泄露常会导致 Netflix 触发代理检测）。
- 在客户端内尝试切换同品牌下另一个节点或地区，观察改善情况；同时记住流媒体可用性不作永久保证，详见 [流媒体解锁机场理性选型](/streaming/service-selection/)。
`,
  },
  {
    file: 'youtube/buffering.md',
    fm: {
      title: 'YouTube缓冲慢怎么办？用Stats for nerds区分本地解码与网络瓶颈',
      description: '系统排查YouTube播放卡顿、反复转圈或自动降为360p的原因：教您看懂YouTube内置详细统计信息(Stats for nerds)中的Connection Speed与Dropped Frames，排查QUIC与分流设置。',
      slug: 'youtube/buffering',
      category: '流媒体网络知识',
      platform: 'YouTube',
      primaryKeyword: 'YouTube缓冲慢怎么办',
      secondaryKeywords: ['油管卡顿排查', 'YouTube 4K缓冲', 'Stats for nerds怎么看'],
      searchIntent: '准确找出YouTube看视频卡顿或画质自动降低的真正原因（网速、协议还是硬件解码）',
      publishDate: DATE,
      updatedDate: DATE,
      documentedVersion: 'YouTube Web / App 播放器诊断工具',
      tags: ['YouTube', '缓冲卡顿', 'Stats for nerds', 'QUIC'],
      relatedBrands: ['lingdongyun', 'wavenet', 'lightspeed'],
      sources: ['YouTube 官方播放疑难解答文档'],
      faqs: [
        { q: '为什么明明宽带很快，看 YouTube 4K 还是隔几秒转一次圈？', a: '右键点击视频画面选择“详细统计信息 (Stats for nerds)”，先看两个数字：如果 Connection Speed（连接速度）低于 15,000 Kbps，属于节点当前带宽不足；如果 Connection Speed 很高但 Dropped Frames（丢帧）持续飙升，则属于电脑/手机本地显卡硬件解码性能跟不上 AV1/VP9 4K 渲染！' },
        { q: '关掉浏览器的 QUIC 真的能解决部分机场看 YouTube 慢的问题吗？', a: '在部分对 UDP 传输不太友好或存在运营商 QoS 限制的环境中，关闭 Chrome/Edge 的实验性 QUIC 协议让 YouTube 回退到传统 TCP (HTTPS) 传输，确实可能消除周期性卡顿；但并非所有网络都有必要关闭，建议作为对比测试手段。' },
      ],
    },
    body: `
**直接结论**：**YouTube 缓冲慢或自动降画质**并不一定总是机场节点速度慢。打开 YouTube 内置的 **详细统计信息（Stats for nerds）** 看清 \`Connection Speed\` 和 \`Dropped Frames\` 两项真实指标，就能在 10 秒内分清是**网络链路传输瓶颈**还是**设备本地解码/浏览器协议问题**。

## 一、看懂 YouTube“详细统计信息（Stats for nerds）”

在桌面端 YouTube 视频画面上**鼠标右键** -> 点击最底部的 **详细统计信息（Stats for nerds）**（手机端可在“设置 > 常规”打开启用统计信息开关后在视频右上角齿轮菜单中调出）：

| 关键参数 | 含义说明 | 判断标准 |
|---|---|---|
| **Connection Speed** | 当前客户端向 YouTube CDN 拉取视频块的瞬时速度 | 看 1080p 建议持续高于 \`8,000 Kbps\`；看 4K 建议持续高于 \`25,000 Kbps\` |
| **Buffer Health** | 播放器提前缓存好的未来可播放秒数 | 若长期接近 \`0 s\` 且不断卡顿，说明下行传输跟不上码率消耗 |
| **Dropped / Total Frames** | 画面渲染丢失帧数 / 总帧数 | 若 \`Connection Speed\` 很高但丢帧迅速上涨，说明是**电脑或手机显卡解码 AV1/VP9 吃力**，与网速无关 |
| **Codecs** | 视频编码格式（常见 \`av01\` / \`vp09\` / \`avc1\`） | 老旧设备不支持 AV1 硬解时，CPU 软解 4K 会造成整段视频幻灯片式卡顿 |

## 二、如果是网络与代理侧问题，按以下 4 步排查

1. **检查客户端是否误开“全局模式”或规则错误**：当后台同时挂着其他国内大流量下载或误将国内视频/网盘走入海外节点时，节点通道被占满会导致 YouTube 急剧减速。确保开启 **Rule（规则分流）**。
2. **排查晚间共享链路拥挤并切换备用节点**：同一品牌往往在同一国家配备多条线路或不同地区入口（例如香港、日本、新加坡），切换另一条物理地区或低编号以外的备用节点测试 \`Connection Speed\` 变化。
3. **测试浏览器 QUIC (HTTP/3) 兼容影响**：YouTube 网页端默认优先走基于 UDP 的 QUIC 协议。如果当前所用代理协议或本地宽带环境对 UDP 转发丢包较敏感，可测试在客户端确认 UDP 转发是否开启，或在 \`chrome://flags/#enable-quic\` 临时对比 Disabled 与 Default 的表现差异。
4. **查看品牌线路定位与套餐流量余量**：如果套餐月流量已接近耗尽或某些低价入门档标注了特定带宽上限，也会表现为突发降速。参考 [机场速度慢怎么解决](/troubleshooting/slow-connection/) 进行全面检查。
`,
  },
  {
    file: 'disney-plus/regions.md',
    fm: {
      title: 'Disney+地区节点选择：港区、台区、日区、新加坡区与美区差异详解',
      description: '对比Disney+各大主流地区片库内容、字幕支持、成人内容Star板块差异与18家品牌地区覆盖匹配，帮助合法订阅用户正确选择对应地区节点。',
      slug: 'disney-plus/regions',
      category: '流媒体网络知识',
      platform: 'Disney+',
      primaryKeyword: 'Disney+地区节点选择',
      secondaryKeywords: ['Disney+港区台区区别', 'Disney+选哪个节点', 'Disney+ Star板块'],
      searchIntent: '依据自身账号体系、语言字幕与片库需求选择最匹配的Disney+地区节点',
      publishDate: DATE,
      updatedDate: DATE,
      documentedVersion: 'Disney+ 区域内容分类参考',
      tags: ['Disney+', '地区对比', 'Star板块', '字幕'],
      relatedBrands: ['lingdongyun', 'twilight', 'breezenet', 'v2yun'],
      sources: ['Disney+ 各区域官方服务内容介绍', '18家品牌节点地区清单'],
      faqs: [
        { q: '中文用户看 Disney+ 选港区、台区还是新加坡区更好？', a: '对于亚太区常见订阅账户，台湾与香港节点通常自带完整的繁体中文字幕与 Star 板块华语/日韩剧集（新加坡节点同样支持丰富中英文字幕与 Star 内容）。选择哪个地区主要看您账号原属区域及当前节点对该平台的实际通过状态。' },
        { q: '为什么美国节点的 Disney+ 界面和亚太区不一样，找不到“Star”标签？', a: '因为美国本土的成人及泛娱乐剧集由 Disney 旗下的 Hulu 平台体系独立或捆绑运营，因此美国版 Disney+ 原界面早期并不单独展示“Star”频道，而是通过整合入口或需对应美区复合订阅观看。' },
      ],
    },
    body: `
**直接结论**：选择 **Disney+** 节点地区时，应当遵循“**账号区服优先、亚太看重 Star 与中文字幕、美区看重美本土首发整合**”的思路。对于大多数持有亚太区合法会员的用户而言，**台湾、香港、新加坡与日本**是最常用且功能体验完整的四个首选地区。

## 一、五大主流 Disney+ 节点地区特性对照表

| 节点地区 | 包含 Star 板块 | 华语/中文字幕支持 | 内容侧重特点 | 18家品牌覆盖参考 |
|---|---|---|---|---|
| **香港 / 台湾** | 是 | 最完整（含大量粤语/国语配音与繁中字幕） | 华语影视、热门韩剧、迪士尼/漫威经典最贴合中文观众习惯 | 全部 18 家含香港；17 家含台湾 |
| **新加坡** | 是 | 丰富（多语种字幕含简繁中文字幕） | 东南亚核心英语与中文双语片库，部分欧美剧同步快 | 全部 18 家均覆盖新加坡 |
| **日本** | 是 | 常见全球新片有中文字幕，部分日剧/日漫仅日语字幕 | 独占或首发日本动画、日剧资源极其丰富 | 全部 18 家均覆盖日本 |
| **美国** | 架构不同（结合 Hulu 体系） | 常见原声新片含多国字幕，部分本地内容仅英/西语 | 漫威、星战等北美本土宣发及衍生内容最早覆盖 | 全部 18 家均覆盖美国 |

## 二、切换地区节点时的关键注意事项

1. **关注账号漫游限制**：部分特定电信捆绑账单账号或限定区域购买的订阅，跨离本土太远的区域登录后会遇到片库缩水或无法播放提示。
2. **避免使用被大规模屏蔽的默认拥堵入口**：同一地区下如果有多个可用节点，建议避开排在最前列的极高拥堵节点，同时排查本地是否开启了未代理的 IPv6（IPv6 暴露会导致 Disney+ 提示地区错误 Error 73）。
3. **配合品牌资料筛选备选节点**：18 家品牌在资料中对 Disney+ 的适配情况可回到 [Disney+ 机场推荐与使用条件](/streaming/disney-plus/) 查阅完整列表。
`,
  },
  {
    file: 'network-types.md',
    fm: {
      title: '流媒体专线机场科普：普通中转、BGP与IEPL/IPLC线路原理及品牌标注汇总',
      description: '客观解释“流媒体专线机场”背后的技术名词：区分直连、BGP中转、IEPL与IPLC内网专线概念差异，梳理18家机场品牌真实资料中各自的线路类型标注，不夸大物理链路验证。',
      slug: 'network-types',
      category: '流媒体网络知识',
      platform: '网络传输架构',
      primaryKeyword: '流媒体专线机场',
      secondaryKeywords: ['IEPL和IPLC区别', 'BGP中转线路', '机场专线原理'],
      searchIntent: '看懂机场宣传中常见的BGP中转、IEPL、IPLC等线路术语，了解18家品牌真实套餐标注差异',
      publishDate: DATE,
      updatedDate: DATE,
      documentedVersion: '代理网络传输架构与品牌公开线路标签汇总',
      tags: ['IEPL', 'IPLC', 'BGP中转', '网络架构'],
      relatedBrands: ['lingdongyun', 'wavenet', 'laddercloud', 'wuyou'],
      sources: ['18家品牌线路类型公开资料档案'],
      faqs: [
        { q: '宣传页写着“IEPL 专线机场”，就一定比普通中转线路速度快很多吗？', a: '不一定！IEPL/IPLC 只是传输拓扑概念（利用跨境内网传输降低公网国际出口高峰期波动与丢包）。但用户最终体验同样取决于服务商购买的专线总带宽有多大、共享人数有多少以及套餐是否分档限速——部分品牌甚至只有高价套餐才配专线，入门档实际为普通中转。' },
        { q: '为什么本站对品牌线路都要加注“品牌公开资料标签，非物理链路独立核验”？', a: '因为外部访客无法对机房底层物理跨境光缆进行端到端审计。严谨的百科态度是如实转述品牌在套餐页公开标明的线路类别，同时提醒用户注意不同套餐档位之间的差异（例如梯子云就明确在初阶用基础中转、高阶才用 IEPL）。' },
      ],
    },
    body: `
**直接结论**：在网络代理领域，“**流媒体专线机场**”并不是一个单一技术标准，而是指服务商在跨境入口与落地节点之间采用 **BGP 多线中转** 或 **IEPL / IPLC 内网专线** 等转发架构，以减少公网国际出口在晚间高峰期产生的拥塞丢包。选购时绝不能只听信一个总标题宣传“全专线”，而必须核实**具体到您购买的那一档套餐究竟标注了什么线路**。

## 一、常见四种传输架构概念对比

| 线路名称 | 传输原理与特征 | 常见适用定位 |
|---|---|---|
| **直连（Direct）** | 本地宽带直接经过公网国际出口连接海外 VPS | 成本最低，但极易在晚间高峰期受到公网国际出口拥塞与阻断波动影响 |
| **公网中转 / BGP 中转** | 先连接国内 BGP 多线机房入口（智能匹配电信/联通/移动），再转发至海外落地 | 显著改善三网跨网互联体验，是当前中端主力套餐的常见配置 |
| **IPLC（国际私有租用线路）** | 点对点跨境私有物理/二层传输通道，理论上不经过公网国际出口路由 | 常见于较高定位套餐，延迟抖动相对可控，带宽采购成本高 |
| **IEPL（国际以太网专线）** | 基于以太网架构的跨境专线传输，拓展性与冗余调度更灵活 | 目前中高端机场资料中标注最普遍的专线标签 |

## 二、18 家品牌公开资料中的线路标注汇总（按档案记录）

必须强调：下表为各品牌公开文档中的自我标注摘要，并非本站物理光缆级验证；且部分品牌在不同档位采用不同线路：

- **灵动云**：标注 IEPL 专线 + BGP 智能调度（穿云套餐特别标注为 IPLC 专线）。
- **梯子云**：明确分级——初阶为基础中转、中阶为 BGP 中转、高阶为 IEPL 专线、顶阶为企业级专线集群。
- **无忧链接**：公开资料同时出现 IPLC 与 IEPL 标签，提示套餐级线路可能不同。
- **浪网**：资料定位为纯专线架构套餐。
- **微风网络 / 暮光加速 / 飞猫云 / 隐形人 / FLYV / 全球云 / 唯兔云 / 闪跃 / 光速云 / U1S1 / Sogo云 / 跨界 / Firefly / 灵猫**：在各自公开品牌资料或价目描述中均有标注 BGP 中转、IEPL 或混合专线方案（具体以各品牌详情页所列套餐备注为准）。

## 三、选购流媒体或高画质用途套餐时的实操参考

1. **区分“品牌整体标签”与“入门档实际配置”**：部分品牌的“年付轻量保活包”与“高阶大流量包”在可用节点池上可能存在分化，买前应看清套餐列表备注。
2. **先月付检验自身运营商互联效果**：北方联通、南方电信与移动宽带接入同一个国内入口机房的效果各不相同，用最小月付档体验日常播放流畅度远比听信跑分图可靠。详见 [机场长期稳定性怎么判断](/safety/reliability/)。
`,
  },
  {
    file: 'live-streaming.md',
    fm: {
      title: '视频直播低延迟节点说明：推流上行带宽、抖动控制与独享定制边界',
      description: '解析跨境视频直播（如TikTok直播、YouTube Live、Twitch推流）对网络代理的特殊需求：区分观看与推流的本质差异、上行带宽与抖动影响，及共享节点与独享专线的适用边界。',
      slug: 'live-streaming',
      category: '流媒体网络知识',
      platform: '视频直播与推流',
      primaryKeyword: '视频直播低延迟节点',
      secondaryKeywords: ['TikTok直播网络', '跨境直播专线', '直播推流节点'],
      searchIntent: '理解跨境直播观看与推流对上行带宽、IP纯净度及独享资源的真实要求',
      publishDate: DATE,
      updatedDate: DATE,
      documentedVersion: '跨境视频推流与直播传输技术要求',
      tags: ['视频直播', 'TikTok直播', '独享专线', '上行带宽'],
      relatedBrands: ['lingdongyun', 'feimaoyun', 'quanqiuyun', 'wuyou'],
      sources: ['18家品牌独享定制专线公开资料', 'OBS / RTMP 直播推流网络规范'],
      faqs: [
        { q: '几十块钱一个月的普通共享机场，适合用来做 TikTok 海外直播带货吗？', a: '如果仅是“看别人直播”通常可以胜任；但如果是“自己开播推流（尤其涉及商业店铺运营）”，普通多人共享机场存在两大硬伤：① 上行带宽和抖动受同节点其他用户影响较大，易掉帧断播；② 数十上百人共用同一出口 IP 极易触发直播平台账号风控限流。' },
        { q: '哪些品牌在公开资料中提到了针对 TikTok 直播或跨境业务的定制方案？', a: '例如灵动云在资料中明确提到其“至尊私人定制”定位适合跨境电商、独立站与 TikTok 直播；飞猫云、无忧链接、全球云、浪网、梯子云等也均列有高门槛的月付独享定制专线档位（通常 ¥500–¥680/月起，具体资源与独享 IP 需联系客服确认合同细节）。' },
      ],
    },
    body: `
**直接结论**：在网络技术需求上，**“观看低延迟直播”** 与 **“主播推流直播”** 完全是两个量级的问题。普通共享型机场套餐可以满足常规低延迟观看与互动；但若涉及商业 **TikTok 直播推流** 或跨境电商长期直播间运营，则必须关注**稳定持续上行带宽（Upload）**、**极低包抖动（Jitter）** 以及 **独享纯净住宅/原生 IP**，通常超出了普通几十元共享套餐的保障范围。

## 一、看直播与开播推流的网络要求对比

| 维度 | 观众端：观看视频直播 | 主播端：RTMP / SRT 视频推流 |
|---|---|---|
| **带宽方向重点** | 依赖**下行带宽**（1080p 直播约 6–10 Mbps） | 高度依赖**持续稳定上行带宽**（720p/1080p 推流需稳定 4–8 Mbps 上行且禁止剧烈波动） |
| **丢包敏感度** | 播放器有 2–5 秒缓冲池可容忍轻微抖动 | 哪怕 2 秒上行拥堵就会引发 OBS 丢帧、画面马赛克甚至直播间强行中断 |
| **IP 纯净度要求** | 常规合法支持地区即可 | 多人共享的数据中心 IP 极易引起主播账号限流、0 推荐或直播权限审核异常 |

## 二、18 家品牌中涉及独享定制专线的参考资料

如果您的需求属于严肃的跨境电商、团队协同或视频直播业务，18 家品牌中部分厂商单独划分出了**独享/私人定制档位**（以下金额均为历史公开档案起步价参考，具体 IP 归属、带宽承诺与售后条款须联系对应品牌客服签订确认）：

- **灵动云**：资料提及“至尊私人定制”定位适合跨境电商、独立站与 TikTok 直播（历史档案参考起步价 ¥680/月起，独享配置由客服确认）。
- **飞猫云 / 无忧链接 / 全球云 / 梯子云 / 浪网**：均在价目结构中单独保留了定制或独享专线档位，需根据实际并发设备数、上行带宽要求及目标国家单独报价。

## 三、直播与低延迟场景的四项实用排查与避坑建议

1. **不要忽视国内宽带自身上行上限**：国内家庭宽带通常“下行高、上行低”（例如 500M 宽带上行往往只有 30–50M，且受限于光猫 NAT 转发性能）。推流卡顿务必先测试本地裸连上行抖动。
2. **尽可能使用有线网线连接推流电脑或硬件**：Wi-Fi 无线信道在多人环境下极易产生毫秒级微丢包，对于实时音视频推流影响极大。
3. **测试期先通过正规小额度验证，再决定大额投入**：即使接触任何商业定制线路，也应先与客服明确书面/工单承诺的退款规则、IP 更换策略及带宽保障，详见 [购买风险与预付风险说明](/safety/purchase-risk/)。
`,
  },
];

for (const page of AI_PAGES) {
  writeDoc(aiDir, page.file, page.fm, page.body);
}

for (const page of STREAMING_PAGES) {
  writeDoc(streamDir, page.file, page.fm, page.body);
}

console.log(`✓ Generated ${AI_PAGES.length} AI guides and ${STREAMING_PAGES.length} Streaming guides`);
