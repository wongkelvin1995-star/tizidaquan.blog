import fs from 'node:fs';
import path from 'node:path';

const outDir = path.resolve('src/content/devices');
fs.mkdirSync(path.join(outDir, 'android'), { recursive: true });
fs.mkdirSync(path.join(outDir, 'iphone'), { recursive: true });

function writeDoc(relPath, fm, body) {
  const fullPath = path.join(outDir, relPath);
  const content = `---
${Object.entries(fm)
  .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
  .join('\n')}
---

${body.trim()}
`;
  fs.writeFileSync(fullPath, content, 'utf8');
}

const COMMON_DATE = '2026-11-25';

const DEVICE_PAGES = [
  {
    file: 'windows-11.md',
    fm: {
      title: 'Windows 11科学上网教程：系统代理、TUN模式与客户端安全配置指南',
      description: 'Windows 11 (22H2/23H2/24H2) 科学上网与机场客户端完整知识：涵盖x64与ARM64架构区分、官方客户端与Clash Verge Rev差异、系统代理和TUN虚拟网卡选择、防火墙与开机自启设置。',
      slug: 'windows-11',
      category: '设备与系统教程',
      platform: 'Windows 11',
      device: 'Windows 电脑',
      primaryKeyword: 'Windows 11科学上网教程',
      secondaryKeywords: ['Win11机场教程', 'Win11代理设置', 'Windows 11 TUN模式'],
      searchIntent: '在Windows 11系统下正确安装机场客户端、选择代理模式并排查常见连接问题',
      keywordOwnerDomain: 'tizidaquan.blog',
      publishDate: COMMON_DATE,
      updatedDate: COMMON_DATE,
      documentedVersion: 'Windows 11 22H2 / 23H2 / 24H2 (x64 & ARM64)',
      author: '梯子大全编辑部',
      tags: ['Windows 11', '桌面系统', '系统代理', 'TUN模式'],
      relatedBrands: ['lingdongyun', 'breezenet', 'twilight', 'feimaoyun'],
      sources: ['Microsoft Windows 11 支持周期与网络代理文档', '18家机场品牌Windows兼容公开资料'],
      faqs: [
        { q: 'Windows 11 使用机场必须开 TUN 模式吗？', a: '不需要。若仅使用 Chrome、Edge 等常规浏览器访问海外网页，开启“系统代理 (System Proxy)”即可；只有当终端命令行（Git/Node/Python）、游戏客户端或桌面 UWP 应用不读取系统代理时，才需启用 TUN 虚拟网卡模式。' },
        { q: 'Windows 11 ARM64 笔记本（如骁龙本）能用所有客户端吗？', a: '部分仅提供 x86/x64 安装包的官方客户端在 ARM64 上依赖微软转译层运行，且虚拟网卡驱动（Wintun）需要对应 ARM64 签名驱动。建议先确认品牌用户中心是否提供 ARM64 版本，或确认品牌支持第三方 ARM64 客户端。' },
        { q: 'Windows Defender 弹窗拦截客户端怎么办？', a: '若从官网用户中心或官方 GitHub Release 下载的合规客户端触发 SmartScreen 提醒，应先核对文件 SHA256 与发布来源；切勿直接永久关闭 Windows 安全中心实时防护来运行来源不明的程序。' },
      ],
      howToSteps: [
        { name: '确认硬件架构与系统版本', text: '在“设置 > 系统 > 系统信息”确认设备为 x64 还是 ARM64，以及当前 Windows 11 版本号。' },
        { name: '核对所购品牌的客户端政策', text: '登录已购买品牌的官网用户中心，确认是下载官方桌面端还是获取通用订阅链接。' },
        { name: '从官方来源下载并校验安装包', text: '仅通过品牌官网用户中心或开源项目官方 GitHub Release 获取安装文件。' },
        { name: '登录或导入配置并选择分流模式', text: '使用账号登录官方端（或向支持订阅端导入链接），推荐默认保持规则分流 (Rule) 与系统代理。' },
      ],
    },
    body: `
**直接结论**：在 Windows 11（22H2 / 23H2 / 24H2）上使用机场或网络代理工具，首先要根据所购品牌的客户端政策选择路径——**封闭官方客户端品牌**（如微风网络、隐形人、FLYV、Sogo云等）直接下载官方 Windows 安装包用账号登录；**开放第三方订阅的品牌**（如飞猫云或按条件开放的灵动云）则可在桌面端搭配支持 Mihomo/sing-box 内核的现代客户端。浏览器日常使用优先开启**系统代理**，命令行或全应用接管再启用 **TUN 虚拟网卡模式**。

## 一、Windows 11 环境特性与硬件架构检查

在下载任何客户端之前，建议先打开 Windows 11 的 **设置 > 系统 > 系统信息**，确认两项核心参数：

1. **系统类型（x64 vs ARM64）**：主流 Intel 与 AMD 笔记本均属于 64 位 x64 架构；搭载高通骁龙 X Elite / Plus 的 Windows 11 Copilot+ PC 属于 **ARM64** 架构。x64 程序虽可通过 Prism 转译运行，但涉及底层虚拟网卡驱动（Wintun）时必须匹配系统架构驱动，否则 TUN 模式会无法启动。
2. **WebView2 运行库状态**：Windows 11 默认已内置 Microsoft Edge WebView2 Runtime。部分精简版系统若手动卸载过 Edge 组件，可能导致基于 Tauri/Electron 的桌面客户端打开后白屏，可在微软官网重新补装 WebView2 引导程序。

| 对比维度 | Windows 11 系统代理模式 | Windows 11 TUN 虚拟网卡模式 |
|---|---|---|
| **工作层级** | 应用层（HTTP / SOCKS5 本地端口） | 网络层（虚拟网卡接管系统流量） |
| **接管范围** | Chrome、Edge 及遵循系统代理的桌面软件 | 几乎全部桌面应用、命令行终端、UWP 应用 |
| **权限要求** | 普通用户权限即可开关 | 首次安装服务或开启 TUN 需管理员授权 |
| **常见冲突** | 若异常退出可能残留代理端口导致断网 | 与企业 VPN、部分网游反作弊或虚拟机网桥易冲突 |

## 二、18 家品牌在 Windows 11 下的适配方式分类

并非所有机场都支持导入 Clash Verge Rev 等第三方客户端。根据截至 2026-11 的品牌公开资料，在 Windows 11 上可分为三类接入方式：

- **纯官方自研客户端登录型**：包括 [暮光加速](/brands/twilight/)、[微风网络](/brands/breezenet/)（标注 Windows 10 及以上）、[隐形人](/brands/yinxingren/)、[FLYV](/brands/flyv/)、[浪网](/brands/wavenet/)、[Firefly](/brands/firefly/)（标注 Windows 10 及以上）、[Sogo云](/brands/sogoyun/) 等。此类品牌在用户中心提供官网直链客户端，安装后输入注册邮箱与密码即可选择节点，无需手动配置 YAML 规则。
- **支持或可申请第三方订阅型**：例如 [飞猫云](/brands/feimaoyun/) 资料标明支持导入 Clash 等第三方客户端，[灵动云](/brands/lingdongyun/) 标注高流量套餐用户可联系客服申请订阅，[跨界](/brands/kuajie/) 在部分公开资料中提及兼容 Clash Verge Rev（实际以当前客服说明为准）。
- **需登录后台确认型**：如 [梯子云](/brands/laddercloud/)、[唯兔云](/brands/v2yun/) 等，不同时期后台与测评对通用订阅口径存在差异，务必登录账号后台“客户端下载”或“使用文档”核对最新说明。

## 三、Windows 11 安全下载与权限配置规范

1. **核实官方发布入口**：只从已注册品牌的官方用户中心下载安装包；如使用开源第三方客户端（如 Clash Verge Rev），应前往其官方 GitHub Releases 页面核对版本号与 SHA256 校验值，警惕搜索引擎广告中的高仿下载站和网盘压缩包。
2. **勿关闭核心安全防护**：不要为了安装来源不明的绿色版软件而永久关闭 Windows 安全中心（Windows Defender）或防火墙。若正规签名程序被系统提示放行网络访问，在确认文件哈希来源可信的前提下，仅针对该程序允许专用网络或公用网络通信即可。
3. **区分“规则模式”与“全局模式”**：日常浏览建议选择**规则分流（Rule）**，国内网站与本地局域网直连，海外业务走节点。只有在排查特定境外站点规则遗漏时才临时切换为全局，详见 [代理模式和直连模式区别](/beginners/proxy-modes/)。

## 四、Windows 11 常见网络冲突与排障要点

- **Windows 11 多网卡与 WSL2 / Hyper-V 冲突**：若同时开启 WSL2 或 Docker Desktop，TUN 模式可能会出现内网互通异常，此时需要在规则配置文件中保留 \`172.16.0.0/12\`、\`192.168.0.0/16\` 与 \`10.0.0.0/8\` 的局域网绕过（skip-proxy / route-exclude-address）。
- **UWP 应用回环限制（Loopback）**：部分微软商店应用（如早期 UWP 客户端或商店本身）在系统代理模式下无法访问本地回环端口 \`127.0.0.1\`，如遇到此类应用断网，可开启 TUN 模式或在客户端内按需配置 UWP 回环豁免。
- **浏览器安全 DNS 干扰**：Chrome 与 Edge 默认开启的“使用安全 DNS”有时会跳过本地客户端的 DNS 分流规则，详见 [Chrome 代理设置教程](/devices/chrome/) 与 [Edge 浏览器代理设置](/devices/edge/)。
- **开机自启残留代理**：若勾选了开机自启，请同步开启“退出时自动清除系统代理”，详见 [代理软件开机自启设置](/devices/auto-start/) 与 [显示连接但无法上网排查](/troubleshooting/connected-no-internet/)。
`,
  },
  {
    file: 'windows-10.md',
    fm: {
      title: 'Windows 10机场配置教程：版本支持边界、WebView2依赖与代理设置',
      description: '详解Windows 10配置机场与代理客户端的注意事项：区分22H2消费版与LTSC支持计划差异、WebView2运行库缺失白屏解决、TLS 1.2/1.3兼容与品牌官方客户端支持情况。',
      slug: 'windows-10',
      category: '设备与系统教程',
      platform: 'Windows 10',
      device: 'Windows 电脑',
      primaryKeyword: 'Windows 10机场配置教程',
      secondaryKeywords: ['Win10科学上网', 'Win10客户端白屏', 'Windows 10代理设置'],
      searchIntent: '了解Windows 10不同版本的支持状态，正确安装机场客户端并处理常见环境依赖报错',
      keywordOwnerDomain: 'tizidaquan.blog',
      publishDate: COMMON_DATE,
      updatedDate: COMMON_DATE,
      documentedVersion: 'Windows 10 (1903 / 21H2 / 22H2 / LTSC)',
      author: '梯子大全编辑部',
      tags: ['Windows 10', 'WebView2', '系统代理', '版本兼容'],
      relatedBrands: ['breezenet', 'firefly', 'kuajie', 'lingdongyun'],
      sources: ['Microsoft Windows 10 Lifecycle 公开文档', '微软 Edge WebView2 运行时分发文档', '18家品牌系统支持公开信息'],
      faqs: [
        { q: 'Windows 10 还能长期安全使用机场客户端吗？', a: '需要区分具体版本。Windows 10 家庭版与专业版 22H2 的微软官方标准主流支持已于 2025 年 10 月结束（除非购买了 ESU 扩展安全更新或使用仍在生命周期内的 LTSC 长期服务版本）。虽然多数客户端仍以 Windows 10 作为最低安装要求，但不再建议在长期缺失安全补丁的环境下进行高敏感操作。' },
        { q: '为什么在 Windows 10 上安装客户端打开后一片空白？', a: 'Windows 10 早期版本未预装 Microsoft Edge WebView2 Runtime。现代官方客户端与 Clash Verge Rev 等界面高度依赖 WebView2 渲染，前往微软官方页面下载安装 Evergreen Standalone Installer 即可解决白屏。' },
      ],
      howToSteps: [
        { name: '核对 Windows 10 内部版本号', text: '按 Win+R 输入 winver 查看系统是否处于 1903 及以上（推荐 22H2 或在保 LTSC）。' },
        { name: '安装缺失的 WebView2 运行库', text: '若客户端界面白屏或提示缺少运行环境，从微软官网补充安装 Edge WebView2 Runtime。' },
        { name: '获取品牌对应客户端或订阅', text: '微风网络、Firefly、跨界等品牌均明确标注支持 Windows 10 及以上官方客户端。' },
      ],
    },
    body: `
**直接结论**：目前微风网络、Firefly、跨界等机场品牌均明确将 **Windows 10 及以上**列为官方客户端的基准兼容系统。在 Windows 10 上配置代理工具，操作逻辑与 Windows 11 基本一致，但需要额外核对**系统小版本生命周期**、**WebView2 运行库**以及**老旧系统根证书更新**三项前提条件。

## 一、必须区分 Windows 10 具体版本与支持计划

在网络教程中常能看到“Win10 永久支持”的模糊说法，这并不严谨。不同 Windows 10 分支的支持周期截然不同：

- **Windows 10 Home / Pro 22H2**：常规免费安全更新已于 2025 年 10 月 14 日到达生命周期终点；仅通过 Microsoft ESU（扩展安全更新）计划付费或合规延保的设备才会继续接收安全补丁。
- **Windows 10 Enterprise LTSC 2021 / IoT Enterprise LTSC 2021**：分别具备更长的支持周期（IoT LTSC 2021 主流支持延续至 2032 年），在工业或精简桌面环境中较为常见。
- **早于 1903 的极早期 Win10（如 1507 / 1607 / 1809 普通版）**：部分现代桌面客户端与内核（如新版 Electron / Tauri 应用）已经停止对过旧 Windows 10 SDK 的兼容。

因此，如果您的电脑仍停留在极早期 Win10，建议先确认系统版本（\`Win + R\` 运行 \`winver\`），并及时升级至仍在接收补丁的环境，不要将未打补丁的系统视为长期无风险环境。

## 二、Windows 10 客户端常见依赖组件与安装要点

| 依赖项目 | 常见报错或现象 | 合规解决方法 |
|---|---|---|
| **Microsoft Edge WebView2** | 客户端打开后窗口空白、无按钮显示 | 从微软官方开发者页面下载 WebView2 Evergreen 独立安装程序 |
| **Visual C++ 运行库** | 提示缺少 \`VCRUNTIME140.dll\` | 从微软官方下载站安装最新版 VC++ 2015–2022 Redistributable (x64) |
| **Wintun 虚拟网卡驱动** | 开启 TUN 模式报错或无法创建网卡 | 以管理员身份运行客户端服务模式，或确认系统未禁用网络适配器安装 |
| **TLS 1.2 / 根证书** | 无法拉取 HTTPS 订阅链接或登录报 SSL 错误 | 通过 Windows Update 更新根证书，不要关闭客户端证书校验 |

## 三、在 Windows 10 配置系统代理与分流步骤

1. **选择合规路径**：若使用 [微风网络](/brands/breezenet/)、[Firefly](/brands/firefly/)、[跨界](/brands/kuajie/)、[暮光加速](/brands/twilight/) 等官方客户端品牌，从官网用户中心下载 Windows 安装包并用账号登录即可；若使用开放通用订阅的品牌，可在确认官方仓库校验后部署 Clash Verge Rev 等桌面客户端。
2. **开启系统代理验证**：连接节点后，打开 **Windows 设置 > 网络和 Internet > 代理**，可在“手动设置代理”处观察到地址 \`127.0.0.1\` 及对应本地端口已自动填入（具体端口号视客户端而定）。
3. **关闭冲突扩展与重复软件**：不要同时开启多个代理软件，也不要保留老旧浏览器里的第三方免费代理插件，否则会相互覆盖 \`127.0.0.1\` 系统代理端口导致断网。

## 四、Windows 10 升级建议与安全提醒

在 2026 年的软件生态下，如果您的硬件配置满足 TPM 2.0 与处理器要求，从已停止标准支持的 Windows 10 消费版平稳过渡到 [Windows 11](/devices/windows-11/) 能获得更完善的驱动、TLS 协议栈与系统安全支持。如果设备硬件较老无法升级，请务必保持浏览器与客户端处于官网最新版本，不从网盘下载来路不明的精简修改包，并参考 [官网真假识别](/safety/website-verification/) 保护账号安全。
`,
  },
  {
    file: 'windows-7.md',
    fm: {
      title: 'Windows 7代理客户端选择：安全支持终止现状与软件兼容限制说明',
      description: '客观说明Windows 7在2026年使用代理与机场客户端的实际限制：微软安全支持已终止、主流官方端与Tauri/Electron内核不再支持Win7、TLS/根证书老化风险及替代建议。',
      slug: 'windows-7',
      category: '设备与系统教程',
      platform: 'Windows 7',
      device: '老旧 Windows 电脑',
      primaryKeyword: 'Windows 7代理客户端选择',
      secondaryKeywords: ['Win7科学上网', 'Win7还能用机场吗', 'Windows 7 Clash限制'],
      searchIntent: '评估Windows 7系统能否继续使用机场客户端，了解软件兼容性限制与安全替代方案',
      keywordOwnerDomain: 'tizidaquan.blog',
      publishDate: COMMON_DATE,
      updatedDate: COMMON_DATE,
      documentedVersion: 'Windows 7 SP1 (已停止微软官方安全支持)',
      author: '梯子大全编辑部',
      tags: ['Windows 7', '旧系统兼容', '安全限制', '替代方案'],
      relatedBrands: ['breezenet', 'firefly', 'kuajie', 'quanqiuyun'],
      sources: ['Microsoft Windows 7 生命周期终止公告', 'Chromium / Electron 官方停止支持 Win7 说明'],
      faqs: [
        { q: '为什么新版机场客户端在 Windows 7 上打不开或直接闪退？', a: '因为微软已于 2020 年 1 月停止 Windows 7 安全支持，Chromium、Electron、WebView2 以及新版 Go/Rust 编译工具链均已正式移除对 Windows 7 的兼容。目前微风网络、Firefly、跨界等品牌公开资料也已明确标注要求 Windows 10 及以上系统。' },
        { q: '旧电脑只能跑 Windows 7，还有其他安全合规的联网方案吗？', a: '若无法将电脑升级至 Windows 10/11 或轻量级 Linux 发行版，更稳妥的替代方式是在局域网前端部署一台支持开放订阅品牌的 OpenWrt 软路由或家用路由器，由路由器统一完成加密转发，避免在 Win7 本机运行不兼容或来路不明的旧版软件。' },
      ],
    },
    body: `
**直接结论**：截至 2026 年，Windows 7 已经停止微软官方安全更新超过六年，**绝大多数现代机场官方客户端与开源桌面代理客户端均已不再支持 Windows 7**。如果强行在网上搜索所谓的“Win7 魔改破解版客户端”，极易遭遇木马捆绑或因 TLS 协议与根证书过期而无法连接。老旧主机更建议切换为轻量级 Linux 发行版，或通过前端路由器方案接入。

## 一、Windows 7 的实际安全状态与生态现状

在技术选型时必须正视以下客观事实：

1. **系统安全更新已完全终止**：微软对 Windows 7 的扩展支持已于 2020 年 1 月 14 日结束。系统内暴露的新型网络漏洞与浏览器漏洞不再获得官方修复。
2. **现代前端渲染框架不再兼容**：包括 Electron（v23 起）、Microsoft Edge WebView2、Tauri 依赖的组件以及 Chrome/Edge 浏览器（109 版本之后），均已停止支持 Windows 7。这意味着市面上绝大多数界面美观的机场客户端根本无法在 Win7 上启动。
3. **品牌官方明确门槛**：例如在 18 家品牌资料中，[微风网络](/brands/breezenet/)、[Firefly](/brands/firefly/)、[跨界](/brands/kuajie/) 均在公开兼容信息中明确写明需要 **Windows 10 及以上**；其余品牌虽部分只简写“Windows”，但也无法保证兼容早已退役的 Win7 SP1。

## 二、Windows 7 运行代理协议的技术障碍

- **TLS 1.2 / TLS 1.3 与根证书缺失**：现代机场的订阅拉取接口、登录 API 以及主流节点协议（Trojan、VLESS、Hysteria2）高度依赖现代 TLS 握手与较新的 CA 根证书。未打全补丁的 Windows 7 默认未启用 TLS 1.2，且缺少新版根证书（如 ISRG Root X1），极易出现“订阅获取失败”或登录界面报证书无效。
- **Wintun 驱动签名兼容问题**：现代 TUN 虚拟网卡模式要求支持较新 Windows 内核签名验证机制，在未安装特定 SHA-2 签名补丁的 Win7 上会出现蓝屏或驱动加载失败。
- **第三方旧版本软件的安全风险**：网盘或论坛流传的“Win7 专用旧版 Clash/v2rayN”往往存在内核已停止维护（缺少安全漏洞修复与新协议如 Hysteria2 / AnyTLS 支持），或被恶意注入远控木马的风险。

## 三、Windows 7 用户的三条可行替代路线

| 替代方案 | 适用条件 | 优势与注意事项 |
|---|---|---|
| **方案 1：升级操作系统至 Windows 10/11** | 电脑具备 4GB 以上内存与 SSD | 全面恢复现代浏览器、官方客户端与安全补丁兼容；参见 [Windows 10 教程](/devices/windows-10/) |
| **方案 2：改用轻量级 Linux 桌面系统** | 老旧硬件内存 2GB–4GB，仅用于网页与文档 | Ubuntu XFCE / Linux Mint 占用极低且持续接收安全更新，可运行现代内核；参见 [Linux 教程](/devices/linux/) |
| **方案 3：局域网路由器 / 旁路由代理** | 电脑因特定工业软件不能更换 Win7 系统 | 由前端 OpenWrt 旁路由统一处理加密连接（需选用开放订阅的品牌），Win7 本机无需安装代理客户端；参见 [OpenWrt 教程](/devices/openwrt/) |

## 四、严禁采取的高风险错误操作

- **切勿购买或下载“Win7 魔改绿色包”**：此类非官方分发的压缩包常伴随劫持浏览器首页、窃取账号凭证的行为。
- **切勿随意关闭系统 TLS 校验证书或防火墙**：关闭证书校验相当于将加密通信门户完全敞开给中间人攻击。如需核实客户端是否可安全获取，请对照 [官网真假识别](/safety/website-verification/) 与 [客户端安全下载规范](/beginners/client-download/)。
`,
  },
  {
    file: 'macos.md',
    fm: {
      title: 'Mac科学上网教程：macOS客户端安装、Apple Silicon兼容与网络扩展权限',
      description: '2026 Mac科学上网与macOS代理配置百科：涵盖Intel与M系列芯片(Apple Silicon)区分、macOS 10.15+兼容基线、隐私与安全性授权流程及Network Extension增强模式。',
      slug: 'macos',
      category: '设备与系统教程',
      platform: 'macOS',
      device: 'Mac / MacBook',
      primaryKeyword: 'Mac科学上网教程',
      secondaryKeywords: ['macOS机场教程', 'Mac代理设置', 'Apple Silicon客户端'],
      searchIntent: '在macOS电脑上安全安装机场官方端或开源客户端，并正确完成系统网络权限配置',
      keywordOwnerDomain: 'tizidaquan.blog',
      publishDate: COMMON_DATE,
      updatedDate: COMMON_DATE,
      documentedVersion: 'macOS 10.15 Catalina 及以上（推荐 macOS 13–15）',
      author: '梯子大全编辑部',
      tags: ['macOS', 'MacBook', 'Apple Silicon', '网络扩展'],
      relatedBrands: ['lingdongyun', 'twilight', 'breezenet', 'flyv'],
      sources: ['Apple macOS 系统安全与 Network Extension 官方文档', '18家品牌 macOS 兼容公开记录'],
      faqs: [
        { q: 'Mac 芯片分 Intel 和 M1/M2/M3/M4，安装包怎么选？', a: '点击屏幕左上角苹果菜单 >“关于本机”查看处理器：显示“Apple M1/M2/M3/M4”属于 Apple Silicon (arm64)，应优先下载 arm64 或 Universal 通用包；显示“Intel”则选择 x86_64/x64 版本。' },
        { q: '打开 macOS 客户端提示“无法验证开发者”怎么办？', a: '首先确认安装包严格来自品牌官网用户中心或官方 GitHub Release。确认来源可信后，在“系统设置 > 隐私与安全性”页面底部点击“仍要打开”并输入开机密码放行，切勿通过不明终端脚本长期禁用 Gatekeeper。' },
      ],
      howToSteps: [
        { name: '确认 Mac 芯片架构与系统版本', text: '查看“关于本机”，确认系统在 macOS 10.15 以上，并区分 Apple Silicon 与 Intel。' },
        { name: '从品牌官方渠道获取安装包', text: '优先登录品牌用户中心下载官方 macOS 端；仅对明确开放订阅的品牌使用第三方工具。' },
        { name: '拖入应用程序并授予网络权限', text: '将应用拖入 Applications 文件夹，首次启用代理时允许添加 VPN/系统代理配置。' },
      ],
    },
    body: `
**直接结论**：18 家已整理品牌均面向 Mac 用户提供了官方 macOS 客户端或对应的第三方订阅兼容方案（例如微风网络、Firefly、跨界公开标注支持 **macOS 10.15 及以上**）。在 Mac 上使用机场工具的核心在于：**选对芯片架构包（Apple Silicon vs Intel）**、**按苹果正规流程完成系统隐私授权**，以及**根据软件需要切换系统代理或增强模式（Network Extension / TUN）**。

## 一、确认 Mac 芯片架构与系统版本基线

在下载任何 \`.dmg\` 安装包前，先点击屏幕左上角 ** > 关于本机**：

- **Apple Silicon（M1 / M2 / M3 / M4 系列）**：架构为 \`arm64\`（或 \`aarch64\`）。应优先选择标注 \`arm64\`、\`Apple Silicon\` 或 \`Universal\`（通用二进制）的安装包；使用原生 arm64 客户端可以显著降低内存占用与发热。
- **Intel 处理器 Mac**：架构为 \`x86_64\`（或 \`x64\`），切勿误装仅限 arm64 的安装包。
- **系统版本要求**：大部分现代机场客户端要求 **macOS 10.15 Catalina 及以上**；若需流畅运行最新的安全更新和 Swift/Electron 客户端，建议保持在 macOS 13 Ventura 至 macOS 15 Sequoia。

## 二、macOS 系统代理与增强模式（Network Extension）对比

| 模式名称 | 原理与权限 | 适用场景 |
|---|---|---|
| **系统代理（System Proxy）** | 修改“系统设置 > 网络 > 代理”中的 HTTP/SOCKS 端口 | Safari、Chrome、Edge 等常规浏览器网页浏览，无需复杂底层权限 |
| **TUN / 增强模式** | 通过 macOS Network Extension / utun 接口接管路由 | iTerm2 / Terminal 命令行（curl、git、brew）、部分不走系统代理的桌面 App |

## 三、macOS 正规安装与安全授权步骤

1. **严格核对来源**：从所购机场官网用户中心（如 [灵动云](/brands/lingdongyun/)、[暮光加速](/brands/twilight/)、[FLYV](/brands/flyv/)）直接下载官方 \`.dmg\`。若品牌明确开放第三方订阅且您使用开源工具（如 Clash Verge Rev），应从项目官方 GitHub Release 页面下载。
2. **规范解决 Gatekeeper 提醒**：部分中小规模开源或官方端未使用苹果付费公证签名，首次打开可能提示“无法打开，因为无法验证开发者”。请先确认自己下载的是官方原版文件，然后进入 **系统设置 > 隐私与安全性**，在安全性下方点击“仍要打开”。**切勿运行网上传播的一键关闭 SIP 或永久禁用 Gatekeeper 命令**。
3. **允许 VPN / 代理配置弹窗**：首次开启连接时，macOS 会弹出“想要添加 VPN 配置”或“允许修改网络设置”提示，需点击“允许”并输入 Mac 登录密码或使用 Touch ID 确认。

## 四、Mac 使用技巧与高频问题处理

- **Safari 与 Chrome 分流一致性**：macOS 上 Safari 严格遵循系统代理与系统 DNS，而 Chrome 可能会受其自带“安全 DNS (DoH)”设置影响。遇到 Safari 正常而 Chrome 异常时，请查看 [Chrome 代理设置教程](/devices/chrome/)。
- **异常退出后的断网清理**：如果客户端意外崩溃导致系统代理端口未被还原，打开 **系统设置 > 网络 > 当前连接的 Wi-Fi > 详细信息 > 代理**，将网页代理（HTTP）、安全网页代理（HTTPS）和 SOCKS 代理开关手动关闭即可恢复常规直连。
- **终端命令行走代理**：如果不想常驻 TUN 模式，可在需要使用终端下载资源时临时导出环境变量：\`export https_proxy=http://127.0.0.1:端口\`（具体端口以客户端界面显示为准）。
`,
  },
  {
    file: 'iphone.md',
    fm: {
      title: 'iPhone机场使用教程：官方端、Nextin协作登录与海外区工具安全指南',
      description: '2026 iPhone (iOS) 机场完整使用百科：区分官方iOS客户端/Nextin识别码登录与海外区App Store购买第三方工具两条路径，重点警告共享Apple ID锁机风险。',
      slug: 'iphone',
      category: '设备与系统教程',
      platform: 'iOS',
      device: 'iPhone',
      primaryKeyword: 'iPhone机场使用教程',
      secondaryKeywords: ['苹果手机科学上网', 'iOS机场怎么用', 'iPhone Nextin教程'],
      searchIntent: '在iPhone上通过正规安全的渠道获取客户端并成功连接机场服务，避免iCloud锁机风险',
      keywordOwnerDomain: 'tizidaquan.blog',
      publishDate: COMMON_DATE,
      updatedDate: COMMON_DATE,
      documentedVersion: 'iOS 12.0 – iOS 18.x（部分品牌需 iOS 15.0+）',
      author: '梯子大全编辑部',
      tags: ['iPhone', 'iOS', 'Nextin', '防锁机安全'],
      relatedBrands: ['weifeng-wangluo', 'wuyou', 'flyv', 'feimaoyun'],
      sources: ['Apple App Store 区域账号安全指南', '18家品牌 iOS 客户端支持资料'],
      faqs: [
        { q: 'iPhone 用机场一定要买小火箭（Shadowrocket）吗？', a: '不一定。18 家品牌中有多家（如暮光加速、微风网络、隐形人、FLYV、Firefly、Sogo云等）主打官方客户端或通过 Nextin 识别码直接账号登录，不支持导入第三方订阅；只有支持开放订阅链接的品牌，才需要配合小火箭等第三方工具。' },
        { q: '切换海外区 Apple ID 下载软件安全吗？怎么防止锁机？', a: '绝对不要在 iPhone“系统设置 > 顶部头像 (iCloud)”里登录他人提供的共享 Apple ID！正确且安全的做法是仅使用自己注册或安全可控的海外区 Apple ID，且只登录在“App Store 应用商店右上角头像”内，下载完成后立即退出换回本人主账号。' },
      ],
      howToSteps: [
        { name: '确认所购机场的 iOS 接入方式', text: '登录机场官网查看支持“官方 iOS 应用 / Nextin 识别登录”还是“第三方通用订阅”。' },
        { name: '安全准备合规的 App Store 账号（如需切换区服）', text: '仅在 App Store 内切换个人海外区 Apple ID，绝不在系统设置 iCloud 登录共享账号。' },
        { name: '安装应用并允许添加 VPN 配置', text: '打开客户端登录后首次连接，在 iOS 系统弹窗中点击“允许”并验证面容 ID 或锁屏密码。' },
      ],
    },
    body: `
**直接结论**：由于中国大陆区 App Store 未上架绝大多数网络代理类工具，iPhone（iOS）用户使用机场必须先分辨所购品牌的接入模式：**模式 A（官方端 / Nextin 模式）**直接根据用户中心指引下载官方 iOS 协作应用并输入账号密码或品牌识别码连接；**模式 B（第三方订阅模式）**需自备非大陆区 Apple ID 在 App Store 购买 [Shadowrocket（小火箭）](/devices/iphone/shadowrocket-install/) 后导入开放的订阅链接。无论哪种模式，**严禁在系统设置 iCloud 中登录他人共享 Apple ID**。

## 一、18 家品牌在 iPhone 上的两种主流接入机制

在购入或下载前，务必确认品牌属于哪一类（依据公开品牌档案整理）：

| 接入模式 | 工作方式 | 代表品牌与公开说明特征 |
|---|---|---|
| **官方客户端 / Nextin 登录模式** | 通过官网提供的 App Store 海外区应用或 TestFlight / Nextin（输入品牌识别码）登录账号 | 微风网络（iOS 15+ 通过 Nextin 登录）、隐形人、FLYV、Firefly（iOS 12+）、Sogo云等，均不支持导入外部订阅 |
| **开放第三方通用订阅模式** | 从用户中心复制订阅链接，导入 Shadowrocket / Stash 等工具 | 飞猫云（资料明确支持小火箭）、灵动云（符合条件的高流量档可向客服申请）、跨界（部分公开页面提及兼容小火箭） |

## 二、iPhone 切换 App Store 账号防锁机铁律

很多新手在搜索教程时，最容易踩中的高危陷阱就是“在手机设置里登录商家提供的共享外区 Apple ID”。一旦对方远程启用“查找我的 iPhone”锁定设备，手机将无法正常使用。请牢记以下三项安全边界：

1. **只登录 App Store，不登录系统设置**：打开桌面的 **App Store 蓝色图标** -> 点击右上角个人头像 -> 拉到底部退出当前账号 -> 仅在此处输入外区账号。**绝对不要打开手机桌面灰色的“设置”去退出自己的 iCloud**。
2. **下载完毕立即退出**：应用下载安装完成后，立刻在 App Store 右上角退出外区账号，重新登录回本人常用的国区 Apple ID（已安装的 App 仍可正常连接使用）。
3. **优先自己注册个人外区账号**：使用自己的邮箱与手机号注册合规个人海外区 Apple ID，远比借用任何“共享免费号”安全。

## 三、iOS 系统版本门槛与首次连接授权

- **系统版本要求**：[Firefly](/brands/firefly/) 与 [跨界](/brands/kuajie/) 公开资料标注最低兼容 **iOS 12.0+**，而 [微风网络](/brands/breezenet/) 明确标注需 **iOS 15.0+**（Nextin 登录）。老旧 iPhone 6 / 6s 等无法升级至 iOS 15 的机型选购前需仔细核查品牌说明。
- **添加 VPN 配置权限**：iOS 要求所有网络代理应用通过官方 \`NEPacketTunnelProvider\` 接口工作。首次点击连接开关时，系统会弹出“应用想要添加 VPN 配置”，点击 **允许** 并输入锁屏密码/Face ID 后，状态栏或控制中心才会出现 \`VPN\` 标志。

## 四、iPhone 使用中的常见误区排查

- **误以为状态栏显示 VPN 图标就一定消耗国内流量**：客户端开启规则分流（Rule）后，虽然 iOS 系统显示 VPN 处于连接状态以接管流量判断，但国内主流软件的流量仍按规则走直连通道，不消耗机场套餐流量。
- **切换 Wi-Fi 与 5G 移动数据时短暂断流**：iOS 在网络切换瞬间会重新建立隧道，若发现个别 App 长时间卡在转圈，可在客户端内断开重连一次，或检查手机“设置 > 无线局域网”是否关闭了限制无线网络追踪导致的冲突。
- **需要更多 iPhone 小火箭条件说明？** 请参阅 [苹果手机小火箭安装指南](/devices/iphone/shadowrocket-install/)。
`,
  },
  {
    file: 'ipad.md',
    fm: {
      title: 'iPad科学上网教程：iPadOS端配置、流媒体画质适配与多终端共用',
      description: 'iPad (iPadOS) 科学上网与机场使用指南：解释iPadOS客户端兼容逻辑、大屏观看Netflix/YouTube高清流媒体的账号与区服匹配要点，以及电脑手机平板共用规则。',
      slug: 'ipad',
      category: '设备与系统教程',
      platform: 'iPadOS',
      device: 'iPad 平板',
      primaryKeyword: 'iPad科学上网教程',
      secondaryKeywords: ['iPadOS代理设置', 'iPad机场怎么用', 'iPad看Netflix教程'],
      searchIntent: '在iPad上配置与iPhone一致的合规代理应用，并满足大屏流媒体及AI学习场景需要',
      keywordOwnerDomain: 'tizidaquan.blog',
      publishDate: COMMON_DATE,
      updatedDate: COMMON_DATE,
      documentedVersion: 'iPadOS 15.0 及以上',
      author: '梯子大全编辑部',
      tags: ['iPad', 'iPadOS', '流媒体', '多设备'],
      relatedBrands: ['wavenet', 'lingdongyun', 'twilight', 'flyv'],
      sources: ['Apple iPadOS 平台应用兼容说明', '18家品牌 iOS/iPadOS 支持记录'],
      faqs: [
        { q: 'iPad 需要单独买一个机场套餐吗？', a: '绝大多数情况下不需要。目前 18 家品牌常规周期套餐普遍标注“不限同时在线设备数”或允许合理多端在线，iPad 可以和您的 iPhone、电脑共用同一个账号与流量额度（仅少数一次性流量包限制 1–3 台设备，需注意核对）。' },
        { q: 'iPad 上为什么用相同节点看流媒体还是提示地区不对？', a: 'iPad 上的 Netflix、Disney+ 或 ChatGPT 客户端不仅看出口 IP，还会读取设备定位权限、App Store 下载区服以及 App 本地缓存。建议关闭不必要的精确位置共享，并确认登录账号本身的归属地区。' },
      ],
    },
    body: `
**直接结论**：iPad（iPadOS）在网络接口与客户端生态上与 [iPhone (iOS)](/devices/iphone/) 高度同源，浪网等品牌公开资料也直接将支持系统标注为 \`iOS / iPadOS\`。通常只需在 iPad 的 App Store（仅限应用商店内登录个人外区账号，切勿登录系统 iCloud）安装与手机端相同的品牌官方 App、Nextin 或已购入的第三方工具，即可与电脑和手机共用同一个机场套餐。

## 一、iPadOS 与 iOS 客户端兼容及多屏特征

1. **应用通用性**：绝大多数提供 iOS 官方端或上架在海外区 App Store 的代理客户端（包括 Shadowrocket 等）均同时支持 iPadOS；即使部分早期官方端仅做竖屏适配，也可以在 iPad 上通过窗口缩放运行。
2. **多任务（台前调度 / 分屏）稳定性**：在 iPad 上一边分屏打开 PDF/课程视频，一边运行 ChatGPT 或 YouTube 时，应避免在后台频繁强制杀掉代理应用进程，让客户端持续维持 VPN 接口在线。
3. **多设备共享规范**：按照 [电脑和手机共用机场订阅](/devices/multi-device/) 整理的品牌规则，18 家品牌的常规周期套餐大多不限同时在线设备数，所有终端共享同一套月流量池。但若您选购的是部分品牌（如隐形人）的**一次性流量包**，可能存在 **1 / 2 / 3 台设备限制**，将 iPad 接入前务必确认剩余设备配额。

## 二、iPad 大屏观看流媒体与使用 AI 的核心要点

由于 iPad 屏幕尺寸与分辨率远高于手机，以下三点在平板场景尤为突出：

- **高清流量消耗明显放大**：iPad 观看 YouTube 或 Netflix 时，播放器常默认自动切换至 1080p 或 4K（HDR），每小时可消耗 2 GB 至 7 GB 不等的流量，月流量较少的小包用户需在播放器内合理控制最高画质，详见 [机场流量怎么算](/beginners/traffic-calculation/)。
- **App Store 与流媒体区服一致性**：例如安装海外版 TikTok 或 Disney+ 时，须使用对应可用区服的 App Store 下载官方原版 App，并在节点地区、账户注册地区之间保持一致。
- **香港节点在平板 AI / TikTok 场景的限制**：在 iPad 上使用官方版 ChatGPT App、Gemini 或 TikTok 时，应避开香港节点，优先切换至平台官方支持地区（如日本、新加坡、台湾或美国），详见 [AI 解锁节点怎么选](/ai/node-selection/)。

## 三、iPad 安装与安全自检清单

1. **严守 iCloud 安全边界**：不要在 iPad“设置”顶部的 Apple ID 处登录第三方共享账号，防止 iPad 被远程锁机。
2. **更新订阅或刷新官方客户端登录状态**：如果之前在手机上更改过机场账号密码或重置了订阅，记得在 iPad 上同步重新登录或刷新配置。
3. **排障优先查系统时间与分流模式**：iPad 长时间未关机或跨时区出行后若发现节点全部超时，先检查“设置 > 通用 > 日期与时间”是否开启自动设置。
`,
  },
  {
    file: 'android.md',
    fm: {
      title: '安卓手机机场教程：官方APK、开源内核获取来源与系统VPN配置指南',
      description: '2026安卓手机(Android)使用机场通用教程：覆盖Android 5.0+兼容基线、官网安装包来源核查与SHA256校验、系统VPN接口授权、分应用代理与后台保活原理。',
      slug: 'android',
      category: '设备与系统教程',
      platform: 'Android',
      device: '安卓手机',
      primaryKeyword: '安卓手机机场教程',
      secondaryKeywords: ['Android科学上网', '安卓机场配置', '安卓代理软件'],
      searchIntent: '在Android手机上通过官方安全渠道安装代理客户端并解决系统授权与分流问题',
      keywordOwnerDomain: 'tizidaquan.blog',
      publishDate: COMMON_DATE,
      updatedDate: COMMON_DATE,
      documentedVersion: 'Android 5.0 及以上（主流新客户端建议 Android 8.0+）',
      author: '梯子大全编辑部',
      tags: ['Android', '安卓手机', '分应用代理', 'APK安全'],
      relatedBrands: ['lingdongyun', 'breezenet', 'feimaoyun', 'firefly'],
      sources: ['Android VpnService 官方开发文档', '18家品牌 Android 支持公开信息'],
      faqs: [
        { q: '安卓手机安装客户端提示“高风险应用”需要关闭手机安全防护吗？', a: '不建议直接永久关闭系统全部安全防护！只要确认 APK 下载自机场官网用户中心或开源项目官方 GitHub Release（建议对比 SHA256 哈希），按照系统自带的授权确认流程完成单次安装验证即可，切勿关闭全部防护后去安装陌生群或网盘转发的文件。' },
        { q: '为什么安卓开着代理，微信或国内快递软件反而打不开了？', a: '通常是因为启用了全局模式，或分流规则库未正确识别新域名。建议在客户端使用规则分流，或借助安卓特有的“分应用代理（白名单/绕过模式）”将国内银行、政务和微信等应用直接设为绕过代理。' },
      ],
      howToSteps: [
        { name: '核对品牌 Android 客户端与架构版本', text: '进入官网用户中心下载官方 Android APK，现代手机普遍对应 arm64-v8a 架构。' },
        { name: '通过官方来源核验安装包完整性', text: '不下载搜索引擎推广站或网盘里的来历不明安装文件。' },
        { name: '授予系统 VPN 连接请求与后台保活权限', text: '首次开启连接时点击确认系统 VPN 授权，并视手机品牌适当放行电池优化。' },
      ],
    },
    body: `
**直接结论**：在 Android 手机上使用机场具备极高的灵活性。微风网络、Firefly、跨界等品牌均标明兼容 **Android 5.0 及以上**（实际现代客户端以 Android 8.0+ 体验最佳）。安卓用户既可以使用各品牌官方自带的 Android 客户端账号登录，也可以在品牌开放通用订阅的前提下使用开源内核（如 Clash Meta for Android / v2rayNG / NekoBox）。关键在于**认准官网下载源**、**善用分应用代理**，并处理好各国产手机系统的**后台省电管控**。

## 一、安卓安装包（APK）安全来源与架构区分

下载 Android 安装包时，官网或开源仓库通常会提供多种 ABI 架构包：

- **arm64-v8a**：2017 年后上市的绝大多数主流 64 位安卓手机（高通骁龙、联发科天玑、麒麟芯片）均首选此版本，体积更小、性能更优。
- **armeabi-v7a**：仅适用于极老旧的 32 位安卓设备。
- **universal**：同时包含多种架构的通用包，不确定设备型号时可选用。

**安全红线**：务必仅从**所购品牌官网用户中心**，或开源项目的**官方 GitHub Releases 页面**下载安装包。任何在网盘、贴吧、Telegram 陌生群私信发送的“破解版/加速版/去广告版 APK”均存在极高盗号与后门风险。

## 二、安卓系统 VPN 接口授权与“分应用代理”优势

Android 所有代理客户端均调用系统标准 \`VpnService\` 接口接管流量，因此：

1. **同时只能运行一个 VPN 类软件**：如果在开着机场客户端的同时又打开了企业 VPN 或某些本地抓包/广告拦截软件，系统会自动断开前者。
2. **分应用代理（Per-App Proxy）**：这是 Android 相比 iOS 的一大实用优势。对于支持分应用控制的工具，您可以将**银行客户端、支付软件、网约车、本地办公软件**勾选为“绕过代理（直连）”，让它们完全不经过代理隧道，既保护隐私又防止风控误判。

## 三、常见国产安卓手机品牌系统差异入口

不同国产手机定制系统对后台进程、私人 DNS 和应用安装检测的策略明显不同，请根据您的手机品牌查阅专门说明：

- **OPPO / 一加 / 真我用户**：重点处理 ColorOS 电池耗电保护与关联启动，详见 [OPPO 手机代理设置](/devices/android/oppo/)。
- **小米 / Redmi 用户**：重点处理 HyperOS / MIUI 省电无限制、应用锁定与私人 DNS 冲突，详见 [小米手机机场订阅教程](/devices/android/xiaomi/)。
- **华为用户**：**必须严格区分 HarmonyOS 3/4 与 HarmonyOS NEXT**，并非所有华为手机均兼容 Android APK，详见 [华为手机科学上网教程](/devices/android/huawei/)。

## 四、安卓手机使用第三方 Clash 的前提条件

如果您计划在安卓端安装 Clash 系工具，请务必提前确认您购买的品牌支持导入第三方订阅（例如 [飞猫云](/brands/feimaoyun/) 资料明确写明支持）；像 [微风网络](/brands/breezenet/)、[隐形人](/brands/yinxingren/)、[FLYV](/brands/flyv/)、[Sogo云](/brands/sogoyun/) 等已明确实行封闭官方客户端政策的机场，无法导入通用 Clash 订阅。详细安装注意事项请阅读 [安卓手机 Clash 安装指南](/devices/android/clash-install/)。
`,
  },
  {
    file: 'android/oppo.md',
    fm: {
      title: 'OPPO手机代理设置：ColorOS后台保活、私人DNS与安装检测说明',
      description: '专为OPPO、一加(OnePlus)与真我(realme) ColorOS系统整理的代理使用百科：讲解ColorOS耗电保护引起的锁屏断流、后台自启动权限、系统私人DNS冲突及Wi-Fi代理概念。',
      slug: 'android/oppo',
      category: '设备与系统教程',
      platform: 'ColorOS (Android)',
      device: 'OPPO 手机',
      primaryKeyword: 'OPPO手机代理设置',
      secondaryKeywords: ['OPPO手机科学上网', 'ColorOS代理断线', 'OPPO后台保活'],
      searchIntent: '解决OPPO手机ColorOS系统使用机场客户端时锁屏断线、安装校验及Wi-Fi代理疑问',
      keywordOwnerDomain: 'tizidaquan.blog',
      publishDate: COMMON_DATE,
      updatedDate: COMMON_DATE,
      documentedVersion: 'ColorOS 12 / 13 / 14 / 15 (Android 底座)',
      author: '梯子大全编辑部',
      tags: ['OPPO', 'ColorOS', 'Android', '断线排查'],
      relatedBrands: ['lingdongyun', 'breezenet', 'twilight'],
      sources: ['OPPO ColorOS 应用省电与后台管理帮助说明', 'Android 通用客户端兼容资料'],
      faqs: [
        { q: '为什么 OPPO 手机一锁屏几分钟后节点就自动断开了？', a: 'ColorOS 为延长续航默认会在屏幕熄灭后限制未列入白名单的后台网络活动（包含代理服务）。进入“设置 > 应用 > 应用管理 > 对应官方或合规客户端 > 耗电管理”，调整允许后台行为及自启动即可明显改善。' },
        { q: 'ColorOS 系统提示“未在软件商店上架”需要关闭安全检测吗？', a: '不需要彻底关闭安全防护。只要安装包确认来源于机场官网用户中心或官方 GitHub Release，按照 ColorOS 标准安装流程完成单次安全核验与身份验证即可，始终保持对陌生来源文件的警惕。' },
      ],
    },
    body: `
**直接结论**：OPPO（含一加、真我）搭载的 ColorOS 基于 Android 底层，因此机场账号注册、官方客户端登录或开放订阅导入的基础步骤与 [安卓手机通用教程](/devices/android/) 完全一致。OPPO 用户的核心差异与高频困扰主要集中在 **ColorOS 严格的后台冻结与耗电管理（导致锁屏断线）**、**安装官网 APK 时的安全核验提示**，以及 **系统“私人 DNS”引起的域名分流冲突**。

## 一、OPPO / ColorOS 与通用安卓的核心差异点

| 维度 | ColorOS 系统默认行为 | 对机场使用的影响与处理方式 |
|---|---|---|
| **后台耗电管理** | 锁屏或切换到后台后智能限制唤醒与联网 | 客户端进程被冻结，表现为“切回应用才恢复，锁屏即断线”；需在耗电管理中允许完全后台行为 |
| **最近任务清理** | 一键清理后台时会连带关闭正在运行的服务 | 在多任务视图下拉或点击应用卡片右上角锁定该客户端，防止误杀 |
| **应用安装检测** | 非官方商店下载的 APK 触发风险扫描与密码验证 | 核对安装包确实来自机场官网或 GitHub 官方 Release 后，按系统引导完成单次安装确认即可 |
| **私人 DNS** | 若用户此前手动开启了加密 DNS，可能与客户端 DNS 接管冲突 | 在“设置 > 连接与共享 > 私人 DNS”确认默认设为自动或关闭，交给客户端统一接管 |

## 二、ColorOS 防锁屏断线设置思路

如果您发现亮屏时浏览完全正常，但锁屏听海外播客、或切到桌面几分钟后再切回来就断流，可按以下顺序核查（不同 ColorOS 大版本菜单命名略有微调，以实机“设置”为准）：

1. **应用自启动与后台运行**：打开手机系统 **设置 > 应用 > 应用管理**（部分版本为“应用列表”），找到正在使用的机场官方客户端或合规代理工具，进入 **耗电管理**，开启 **允许完全后台行为**（或“允许后台运行”）及 **允许自启动**。
2. **关闭系统睡眠待机优化限制**：在 **设置 > 电池 > 更多设置** 中查看是否开启了“睡眠待机优化”或“超级省电模式”；在需要使用长连接时避免触发全局极速省电冻结后台 VPN 通道。
3. **多任务卡片加锁**：在桌面底部上滑进入多任务后台，找到该客户端卡片点击右上角菜单选择 **锁定**。

## 三、OPPO 系统 Wi-Fi“手动代理”与机场客户端的区别

不少用户会在 ColorOS 的 **设置 > WLAN > 点击已连接 Wi-Fi 右侧感叹号 > 代理** 里看到“无 / 手动 / 自动”选项：

- **常规使用不要去改 Wi-Fi 里的手动代理**：机场客户端（官方端或 Clash 等）使用的是 Android 全局 \`VpnService\` 虚拟接口，打开客户端连接后会自动接管所有应用，无需在 Wi-Fi 设置里填写代理端口。
- **Wi-Fi 代理仅用于局域网电脑共享**：只有当您希望这台 OPPO 手机不装任何客户端，直接通过同一局域网内另一台电脑（开启了“允许局域网连接”）充当网关时，才会在 Wi-Fi 手动代理中填写电脑的内网 IP 与端口。

## 四、ColorOS 上选择官方端还是第三方客户端？

- **官方客户端用户**（如暮光加速、微风网络、隐形人、FLYV 等）：直接从品牌用户中心下载 Android 安装包，登录账号即可使用，规则内置无需额外配置。
- **第三方订阅用户**（如飞猫云等支持订阅的品牌）：安装官方 GitHub 发布的 Clash Meta for Android 后，同样要遵循上述耗电管理加白名单与分应用代理原则，详见 [安卓手机 Clash 安装指南](/devices/android/clash-install/)。
`,
  },
  {
    file: 'android/xiaomi.md',
    fm: {
      title: '小米手机机场订阅教程：HyperOS / MIUI 省电无限制与DNS冲突排查',
      description: '小米与Redmi手机(HyperOS澎湃OS / MIUI)使用机场知识详解：说明省电无限制、后台锁定、安装包纯净核验、系统私人DNS冲突及品牌订阅政策核对要点。',
      slug: 'android/xiaomi',
      category: '设备与系统教程',
      platform: 'HyperOS / MIUI (Android)',
      device: '小米 / Redmi 手机',
      primaryKeyword: '小米手机机场订阅教程',
      secondaryKeywords: ['小米手机科学上网', '澎湃OS代理设置', 'MIUI后台断线'],
      searchIntent: '在小米或Redmi手机上正确设置HyperOS/MIUI权限防止断连，并依据品牌规则登录或导入订阅',
      keywordOwnerDomain: 'tizidaquan.blog',
      publishDate: COMMON_DATE,
      updatedDate: COMMON_DATE,
      documentedVersion: 'Xiaomi HyperOS 1.0 / 2.0 & MIUI 13 / 14',
      author: '梯子大全编辑部',
      tags: ['小米', 'HyperOS', 'MIUI', 'Android'],
      relatedBrands: ['feimaoyun', 'lingdongyun', 'breezenet', 'v2yun'],
      sources: ['小米 HyperOS / MIUI 省电与后台管理说明', '18家品牌 Android 客户端政策'],
      faqs: [
        { q: '小米手机导入机场订阅总是提示失败或拉取不到节点怎么办？', a: '先排查两个前提：① 您购买的品牌是否真的开放第三方订阅（例如微风、隐形人、Sogo云等新订单仅限官方客户端登录，没有通用订阅链接）；② 确认链接复制完整且未受小米系统浏览器缓存或本地网络阻断。' },
        { q: '澎湃 OS 安装官方 APK 提示安全风险怎么处理？', a: '小米系统的安全检测会对未在小米应用商店上架的加密通信类 APK 发出提示。切勿关闭系统全部安全防护；在确认文件确实来自官网用户中心或官方 GitHub Release 并完成校验后，按单次安装确认流程授权即可。' },
      ],
    },
    body: `
**直接结论**：小米与 Redmi 手机（搭载 **Xiaomi HyperOS 澎湃 OS** 或 **MIUI**）使用机场的基础客户端步骤与 [安卓通用教程](/devices/android/) 相同。小米设备最需要注意的是三点：**将客户端省电策略改为“无限制”并在后台卡片加锁**、**根据所购机场决定登录官方端还是导入第三方订阅**，以及**排查“私人 DNS”和特定安全检测提示**。

## 一、先确认品牌是否允许订阅导入，避免找错入口

搜索“小米手机机场订阅教程”的用户中，最常见的误区是买了不支持外部订阅的机场却一直寻找“订阅链接”：

- **支持官方客户端登录即可使用的品牌**：如 [暮光加速](/brands/twilight/)、[微风网络](/brands/breezenet/)、[隐形人](/brands/yinxingren/)、[FLYV](/brands/flyv/)、[Firefly](/brands/firefly/)、[Sogo云](/brands/sogoyun/) 等，在小米手机上直接安装官网提供的 Android 客户端登录账号即可连接，**不需要**复制订阅链接到 Clash。
- **开放或按条件支持订阅导入的品牌**：如 [飞猫云](/brands/feimaoyun/) 资料标明支持 Clash 等第三方客户端，[灵动云](/brands/lingdongyun/) 符合条件的高流量套餐可向客服申请订阅。在确定拥有合法订阅链接后，才需安装 Clash Meta for Android 等工具导入，操作门槛详见 [订阅链接在哪里找](/beginners/subscription-links/)。

## 二、HyperOS / MIUI 防后台断连核心设置

小米的后台内存与电源调度较为积极，若不设置“无限制”，客户端常在熄屏 5–10 分钟后被系统回收：

1. **调整省电策略为“无限制”**：长按桌面的机场官方端或合规代理应用图标 -> 点击 **应用信息** -> 进入 **省电策略** -> 选择 **无限制**（允许应用在后台持续保持连接）。
2. **开启自启动（按需）**：在同一个“应用信息”界面查看 **自启动** 开关；对于需要开机即连或断网自恢复的官方端，可根据需要开启。
3. **多任务后台锁定应用**：从屏幕底部上滑悬停进入最近任务视图，长按该客户端卡片并点击小锁图标（锁定后一键清理内存不会关闭该 VPN 服务）。

## 三、小米系统安装提示与“私人 DNS”排查

- **规范应对安装包安全提示**：在小米澎湃 OS 中安装非小米应用商店的 APK 时，系统会进行安全扫描并可能要求输入小米账号密码或等待倒计时确认。请**只核准来源于品牌官网用户中心或开源项目官方 GitHub Release 的安装包**，不要为了贪图方便而彻底关闭“纯净模式”后安装来历不明的文件。
- **私人 DNS 冲突排查**：打开小米 **设置 > 更多连接 > 私人 DNS**。若此前手动填写过第三方加密 DNS 地址，而开启机场后发现网页解析缓慢或规则分流错乱，可将该项恢复为 **关闭** 或 **自动**，让代理客户端接管 DNS 解析。详见 [机场 DNS 问题排查](/troubleshooting/dns/)。

## 四、小米手机连接后仍打不开网页的快速自检

1. 确认没有同时开启小米手机自带的“全球上网”虚拟卡服务或其他企业 VPN。
2. 核实系统时间是否开启自动校时（误差过大会导致节点 TLS 握手失败）。
3. 核对套餐月流量是否已经用完，详见 [节点连接失败排查](/troubleshooting/node-connection/)。
`,
  },
  {
    file: 'android/huawei.md',
    fm: {
      title: '华为手机科学上网教程：区分HarmonyOS 3/4与HarmonyOS NEXT兼容边界',
      description: '华为手机使用机场与科学上网必读指南：客观区分兼容Android APK的HarmonyOS 3/4与不兼容传统APK的HarmonyOS NEXT（纯血鸿蒙），避免误购无法使用的设备方案。',
      slug: 'android/huawei',
      category: '设备与系统教程',
      platform: 'HarmonyOS',
      device: '华为手机',
      primaryKeyword: '华为手机科学上网教程',
      secondaryKeywords: ['华为鸿蒙机场教程', 'HarmonyOS NEXT梯子', '华为手机用Clash'],
      searchIntent: '确认自己的华为设备鸿蒙版本是否兼容安卓客户端，了解纯血鸿蒙系统的真实限制与替代方式',
      keywordOwnerDomain: 'tizidaquan.blog',
      publishDate: COMMON_DATE,
      updatedDate: COMMON_DATE,
      documentedVersion: 'HarmonyOS 3.x / 4.x vs HarmonyOS NEXT (5.0+)',
      author: '梯子大全编辑部',
      tags: ['华为', 'HarmonyOS', '鸿蒙NEXT', '系统兼容'],
      relatedBrands: ['lingdongyun', 'feimaoyun', 'quanqiuyun', 'u1s1'],
      sources: ['华为 HarmonyOS 版本架构公开说明', '18家品牌 Android 兼容资料'],
      faqs: [
        { q: '所有华为手机都能直接安装机场安卓 APK 或 Clash 吗？', a: '不能一概而论！HarmonyOS 2/3/4 系统仍具备 AOSP 安卓兼容层，可以正常安装官方 Android APK 与 Clash Meta；但已升级或出厂搭载 HarmonyOS NEXT（HarmonyOS 5.0 及以上纯血鸿蒙）的设备不再兼容传统 Android APK 安装包。' },
        { q: '如果是 HarmonyOS NEXT 纯血鸿蒙设备，还有办法使用海外网络服务吗？', a: '对于不兼容 APK 的设备，购买机场前应优先核实对应品牌是否推出了鸿蒙原生应用（当前 18 家品牌公开资料中均尚未列出原生 HarmonyOS NEXT 客户端）；若无原生端，可通过局域网前端的 OpenWrt 软路由或支持开放订阅的家用路由器提供网关连接。' },
      ],
    },
    body: `
**直接结论**：在华为手机上讨论使用机场或网络工具，**第一步必须先确认设备运行的是哪一代鸿蒙系统**，绝不能默认全部华为手机都能安装 Android 客户端。**HarmonyOS 2 / 3 / 4.x** 仍保留 Android 兼容环境，可运行官网 Android APK 与 Clash Meta；而 **HarmonyOS NEXT（纯血鸿蒙，5.0 及以上）** 移除了传统 Android 运行环境，**无法直接安装或运行任何 \`.apk\` 客户端**。

## 一、如何查看您的华为设备系统版本与兼容能力

打开华为手机 **设置 > 关于手机**，查看“HarmonyOS 版本”：

| 系统版本分支 | Android APK 兼容性 | 可行接入方式 |
|---|---|---|
| **HarmonyOS 2 / 3.x / 4.x**（含 EMUI 老机型） | **兼容**（可执行标准 APK） | 与通用安卓手机相同：安装品牌官网 Android 客户端或（在支持第三方订阅前提下）使用 Clash Meta for Android |
| **HarmonyOS NEXT (5.0 及以上)** | **不兼容**（纯血鸿蒙，无 APK 运行层） | 目前 18 家品牌公开资料均尚未提供原生 HarmonyOS NEXT 端；家庭场景建议改用 OpenWrt 路由器网关方案 |

## 二、HarmonyOS 3 / 4 华为手机的正确安装与配置注意事项

如果您的华为手机处于 HarmonyOS 4.2 或更早版本，安装流程遵循 [安卓通用教程](/devices/android/)，同时留意两项系统特点：

1. **关于“纯净模式”的正确认识**：华为系统默认开启“纯净模式”以拦截未经审核的应用。**不要永久关闭增强防护去安装来历不明的网盘 APK**；在严格核实安装包来自品牌官网用户中心或官方 GitHub Release 后，按系统指引验证华为账号密码完成单次授权安装即可。
2. **后台耗电启动管理**：进入 **设置 > 应用和服务 > 应用启动管理**，找到代理客户端后关闭“自动管理”，在弹窗中手动打开 **允许自启动、允许关联启动、允许后台活动**，防止熄屏断网。
3. **海外应用依赖 GMS (Google 移动服务) 说明**：即便网络连接正常，部分需要完整 Google 服务框架的海外应用（如 Gemini 官方 App、Google Play 商店）在未配备 GMS 的华为国行机型上仍可能无法直接运行或登录，这属于系统框架层限制，而非机场节点故障，网页端使用浏览器访问则不受 GMS 限制。

## 三、HarmonyOS NEXT 纯血鸿蒙用户的真实边界与替代策略

对于已经升级至 HarmonyOS NEXT 的 Mate / Pura 系列用户，目前需要注意：

- **请勿轻信“纯血鸿蒙一键安装安卓版 Clash”等虚假教程**：网传的第三方修改包或强行转换工具不仅不可用，还极易带来隐私泄露风险。
- **使用浏览器网页端配合局域网路由器代理**：在家庭或办公 Wi-Fi 下，若您购买了开放第三方订阅的品牌（例如全球云、U1S1 等在部分资料中涉及路由器支持，或飞猫云等开放订阅品牌），可将订阅部署在前端 [OpenWrt 旁路由](/devices/openwrt/) 中，让华为设备连接该 Wi-Fi 网关即可通过浏览器访问网页版服务。
- **多设备场景下避免盲目购买仅限手机的封闭端**：如果您只有纯血鸿蒙手机一台设备，且品牌仅限封闭官方端、不提供鸿蒙原生版，在确认支持前切勿直接购买长期年付套餐，以免买后无法在主力手机上使用。详见 [第一次买机场怎么选](/beginners/choosing-service/)。
`,
  },
  {
    file: 'router.md',
    fm: {
      title: '路由器科学上网教程：家用路由器支持条件、固件门槛与品牌订阅要求',
      description: '客观解析家用路由器配置科学上网的前提条件：区分原厂封闭固件与OpenWrt/梅林等第三方固件、硬件内存闪存门槛，以及为什么封闭官方客户端机场无法在路由器使用。',
      slug: 'router',
      category: '设备与系统教程',
      platform: 'Router Firmware',
      device: '家用路由器',
      primaryKeyword: '路由器科学上网教程',
      secondaryKeywords: ['家用路由器挂梯子', '路由器支持机场吗', '梅林固件代理'],
      searchIntent: '判断家中现有路由器能否配置机场代理，了解硬件固件门槛和机场品牌订阅前置条件',
      keywordOwnerDomain: 'tizidaquan.blog',
      publishDate: COMMON_DATE,
      updatedDate: COMMON_DATE,
      documentedVersion: 'OpenWrt / Asuswrt-Merlin 等支持代理插件的第三方固件',
      author: '梯子大全编辑部',
      tags: ['路由器', '固件条件', '多设备', '硬件门槛'],
      relatedBrands: ['quanqiuyun', 'u1s1', 'sogoyun', 'feimaoyun'],
      sources: ['OpenWrt 硬件最低配置文档', '18家品牌路由器与订阅政策公开资料'],
      faqs: [
        { q: '运营商送的光猫或者普通百元家用路由器能直接装机场插件吗？', a: '绝大多数情况下不能。运营商光猫与常见百元原厂固件路由器系统封闭、闪存和内存极小，没有提供导入机场订阅的插件入口。通常需要单独购置可刷入 OpenWrt 或 Asuswrt-Merlin 固件的路由器，或者串联一台 OpenWrt 旁路由。' },
        { q: '是不是所有机场都能放到路由器上用？', a: '不是。路由器插件（如 OpenClash、HomeProxy）必须依靠标准订阅链接或节点配置运行；对于仅限账号密码登录自研官方端、不提供第三方订阅的机场（如微风网络、隐形人、FLYV、Firefly、Sogo云新订单），无法直接导入家用第三方路由器固件。' },
      ],
    },
    body: `
**直接结论**：将机场代理部署在路由器端可以让电视、游戏主机（PS5/Switch）、Apple TV 或不支持安装软件的终端共同连接，但前提必须同时满足两个硬性条件：**第一，路由器硬件可运行支持代理内核的固件（如 OpenWrt 或梅林改版固件）**；**第二，所购机场品牌明确开放了兼容的第三方订阅链接或节点参数**。

## 一、先评估家中硬件：哪些路由器可以运行代理？

| 路由器类型 | 能否直接配置机场 | 原因与处理建议 |
|---|---|---|
| **运营商光猫 / 原厂封闭家用路由** | 否 | 固件权限封闭，无插件生态；建议将其仅作拨号或桥接，后端另接独立路由器或旁路由 |
| **华硕部分支持 Merlin 改版固件机型** | 有条件支持 | 需确认具体型号与内存（建议至少 256MB–512MB RAM）及可合法获取的插件支持 |
| **ARM / x86 OpenWrt 软路由或刷机硬路由** | **推荐方案** | 生态最完善，支持 Mihomo (OpenClash) 与 sing-box (HomeProxy)；详见 [OpenWrt 教程](/devices/openwrt/) |

**硬件规格提醒**：运行现代代理内核与分流规则库（GeoIP / GeoSite）需要持续的内存开销，若设备内存低于 128MB 或闪存小于 32MB，极易在更新订阅或并发下载时出现 OOM（内存溢出）死机，建议至少选择 **512MB 内存以上** 的路由或旁路由设备。

## 二、核查 18 家品牌的路由器与订阅兼容资料

在 18 家已整理品牌资料中，对路由器的支持口径存在明显分化，选购前务必看清：

- **资料提及支持路由器或开放订阅的品牌**：[全球云](/brands/quanqiuyun/) 与 [U1S1](/brands/u1s1/) 在支持平台栏目中提及路由器（同时注意两家公开资料对第三方订阅链接存在口径说明，需以客服最新确认为准）；[飞猫云](/brands/feimaoyun/) 资料写明支持 Clash 等第三方客户端，具备导入条件；[梯子云](/brands/laddercloud/) 资料特别提示“未获得官方路由器固件，若需在 OpenWrt 使用前提是品牌实际开放订阅且协议兼容”。
- **资料注明仅限官方客户端、不开放订阅的品牌**：[微风网络](/brands/breezenet/)（2026-10 起新订单）、[隐形人](/brands/yinxingren/)、[FLYV](/brands/flyv/)、[Firefly](/brands/firefly/) 等明确不提供第三方订阅链接。这类品牌适合电脑与手机直装官方 App，**不适合**买来刷进普通 OpenWrt 路由器。

## 三、路由器端配置与安全使用注意事项

1. **避免直接将未知来源的“集成一键固件”刷入主路由**：非官方或来源不明的预打包固件可能内置后门或篡改 DNS。应使用 OpenWrt 官方镜像并从正规 GitHub 开源仓库安装插件包。
2. **注意局域网设备流量消耗与多终端分流**：路由器开启代理后，家中智能电视自动更新或主机下载大型游戏可能会在不知不觉中跑空几百 GB 月流量，必须在路由器插件中合理设置**仅代理特定设备（MAC/IP 过滤）**或开启**绕过大陆 IP**。
3. **协议版本匹配**：当前机场常见协议包括 Shadowsocks、Trojan、VMess、VLESS、Hysteria2 等。老旧路由器插件若停留在数年前的 SSR 或旧版 Clash 内核，将无法识别 Hysteria2 或 VLESS Reality 节点。

如需了解具体的旁路由组网架构、DNS 防泄露与 OpenClash / HomeProxy 内核差异，请继续阅读 [OpenWrt 代理配置教程](/devices/openwrt/)。
`,
  },
  {
    file: 'openwrt.md',
    fm: {
      title: 'OpenWrt代理配置教程：旁路由拓扑、内核选择与DNS防泄露要点',
      description: 'OpenWrt软路由与旁路由代理配置知识百科：对比OpenClash(Mihomo)与HomeProxy(sing-box)核心差异、主路由与旁路由网关配置原理、内存优化与DNS防泄露排查。',
      slug: 'openwrt',
      category: '设备与系统教程',
      platform: 'OpenWrt',
      device: 'OpenWrt 软路由',
      primaryKeyword: 'OpenWrt代理配置教程',
      secondaryKeywords: ['OpenClash配置', 'HomeProxy教程', 'OpenWrt旁路由设置'],
      searchIntent: '掌握OpenWrt部署代理内核的系统要求、旁路由网关拓扑及防止DNS污染与环路的配置原则',
      keywordOwnerDomain: 'tizidaquan.blog',
      publishDate: COMMON_DATE,
      updatedDate: COMMON_DATE,
      documentedVersion: 'OpenWrt 22.03 / 23.05 / 24.10 (Mihomo / sing-box 内核)',
      author: '梯子大全编辑部',
      tags: ['OpenWrt', '旁路由', 'OpenClash', 'DNS防泄露'],
      relatedBrands: ['feimaoyun', 'lingdongyun', 'quanqiuyun', 'sogoyun'],
      sources: ['OpenWrt 官方网络配置文档', 'sing-box / Mihomo 官方文档'],
      faqs: [
        { q: 'OpenWrt 选 OpenClash 还是 HomeProxy？', a: 'HomeProxy 基于 sing-box 内核，是 OpenWrt 新版官方源集成度更高、内存占用更轻的方案，原生支持 VLESS/Hysteria2 等新协议；OpenClash 则基于 Mihomo (Clash.Meta) 内核，对机场直接下发的 Clash YAML 订阅兼容性最好。选择前需看机场下发的配置格式。' },
        { q: '为什么配置好 OpenWrt 旁路由后，家里其他设备反而连不上网或频繁掉线？', a: '最常见原因有两个：① 旁路由网关或 DHCP 配置错误形成了内网路由环路；② DNS 转发模式（Fake-IP 与 Redir-Host）或端口（53/7874）配置冲突。建议先确保旁路由自身在关闭代理时能正常 ping 通外网，再逐项开启分流。' },
      ],
    },
    body: `
**直接结论**：在 OpenWrt（22.03 / 23.05 / 24.10）上配置全屋或指定设备代理，核心工作包含四步：**确认机场提供开放订阅且协议匹配** -> **在 x86 或充足内存的 ARM 设备部署 Mihomo (OpenClash) 或 sing-box (HomeProxy) 内核** -> **规划稳定的主路由或旁路由网关拓扑** -> **严格校验 DNS 防泄露与大陆 IP 绕过**。

## 一、OpenWrt 常用代理方案与内核技术对比

| 组件方案 | 底层内核 | 格式与协议兼容特点 | 硬件资源建议 |
|---|---|---|---|
| **OpenClash** | Mihomo (Clash.Meta) | 直接拉取常见机场 Clash YAML 订阅，支持 VLESS/Trojan/SS/Hysteria2 | 建议 512MB+ 内存（规则库开启后占 120–250MB） |
| **HomeProxy** | sing-box | OpenWrt 23.05/24.10 官方 LuCI 生态兼容性极佳，结构轻量 | 256MB+ 内存即可流畅运行 |
| **PassWall / PassWall2** | Xray / sing-box | 擅长节点组精细分流，对单节点 URI 与订阅导入友好 | 建议 256MB–512MB 内存 |

**前提重申**：再次提醒，OpenWrt 插件无法登录封闭自研客户端账号。如果您的机场属于“不提供订阅链接、仅限桌面/手机官方 App 登录”的类型，请勿尝试强行在 OpenWrt 上抓取或破解接口。

## 二、主路由模式与旁路由模式（单臂路由）对比

1. **主路由一体模式**：OpenWrt 直接承担拨号（PPPoE）和 DHCP 分配任务。架构简单、无额外转发跳数，但一旦调试失误会导致全家人同时断网，适合硬件性能充沛（如 x86 小主机）且调试熟练的用户。
2. **旁路由模式（推荐新手先试行）**：保留原有的运营商光猫或稳定硬路由作为主路由（假设主路由 IP 为 \`192.168.1.1\`），将 OpenWrt 作为局域网内一台普通静态 IP 主机接入（例如 \`192.168.1.2\`，网关和 DNS 指向 \`192.168.1.1\`，关闭旁路由的 DHCP 服务）。
   - **按需指定设备走代理**：只需在电脑、Apple TV 或手机的 Wi-Fi 静态设置中，把“网关”和“DNS”手动填为 \`192.168.1.2\`，该设备就会经过 OpenWrt；其余全家设备默认继续走 \`192.168.1.1\`，互不干扰。

## 三、OpenWrt 防 DNS 污染与防环路关键配置

- **禁用主旁双开 DHCP 冲突**：如果采用旁路由且主路由已开启 DHCP，务必关闭旁路由接口的 DHCP 服务；仅当全屋都想自动走旁路由时才在主路由下发旁路由为默认网关。
- **Fake-IP vs Redir-Host 取舍**：在 OpenWrt 环境下，**Fake-IP** 模式可以彻底屏蔽本地 ISP 对海外域名的 DNS 劫持并缩短初次解析延迟，但需要清理一次局域网设备 DNS 缓存；若局域网内有 NAS 内网域名或特殊软件不兼容 \`198.18.0.0/16\` 假 IP 段，则需在配置中添加 \`fake-ip-filter\` 白名单或切换为 Redir-Host 配合加密 DoH/DoT 上游。
- **IPv6 泄露检查**：国内家庭宽带大多已下发原生 IPv6 地址。若仅接管了 IPv4 转发而放行了 IPv6 直连，部分支持双栈的平台（如 YouTube、Netflix 或 DNS 请求）可能会直接通过本地 IPv6 暴露真实归属或请求失败。可在客户端内核中确认是否对 IPv6 流量进行了同等规则接管，或对不需要 IPv6 的旁路由入口做合理分流策略。

更多排障细节请参考 [机场 DNS 问题排查](/troubleshooting/dns/) 与 [机场节点连接失败排查](/troubleshooting/node-connection/)。
`,
  },
  {
    file: 'linux.md',
    fm: {
      title: 'Linux科学上网教程：官方Linux端核对、Clash Verge Rev与终端代理设置',
      description: 'Linux桌面与命令行科学上网完整知识：汇总18家品牌中资料标明支持Linux的品牌，讲解AppImage/deb客户端安装、Mihomo CLI与HTTP_PROXY/ALL_PROXY环境变量规范。',
      slug: 'linux',
      category: '设备与系统教程',
      platform: 'Linux',
      device: 'Linux 系统',
      primaryKeyword: 'Linux科学上网教程',
      secondaryKeywords: ['Ubuntu代理设置', 'Linux机场客户端', 'Linux终端走代理'],
      searchIntent: '在Ubuntu、Debian、Arch等Linux环境下合规部署官方或开源代理工具并配置命令行环境变量',
      keywordOwnerDomain: 'tizidaquan.blog',
      publishDate: COMMON_DATE,
      updatedDate: COMMON_DATE,
      documentedVersion: 'Ubuntu 20.04+ / Debian 11+ / Arch Linux (x86_64 & ARM64)',
      author: '梯子大全编辑部',
      tags: ['Linux', 'Ubuntu', '终端代理', 'Mihomo'],
      relatedBrands: ['yinxingren', 'flashleap', 'lightspeed', 'feimaoyun'],
      sources: ['18家品牌 Linux 支持公开记录', 'Clash Verge Rev / Mihomo 官方发布文档'],
      faqs: [
        { q: '为什么很多机场买了之后在 Linux 上找不到官方客户端？', a: '绝大多数机场官方客户端优先开发 Windows/macOS/Android/iOS 四端，目前 18 家品牌公开资料中仅有隐形人、闪跃、光速云等明确列出 Linux 平台支持。其余不开放第三方订阅的品牌在无官方 Linux 包的情况下无法直接在 Linux 桌面使用。' },
        { q: 'Linux 客户端开了系统代理，为什么终端里 git clone 或 curl 还是超慢/超时？', a: 'Linux 桌面环境（GNOME/KDE）的“网络代理”设置主要服务于浏览器和部分 GUI 应用，多数命令行工具默认不读取桌面图形代理设置，必须在 Shell 中手动设置 http_proxy / https_proxy / all_proxy 环境变量或开启 TUN 模式。' },
      ],
    },
    body: `
**直接结论**：Linux 用户选购机场前**必须先核实两点**：一是品牌是否直接提供官方 Linux 安装包，二是品牌是否开放标准通用订阅以供开源 Linux 客户端（如 Clash Verge Rev、Mihomo、sing-box）使用。在 18 家品牌公开资料中，[隐形人](/brands/yinxingren/)、[闪跃](/brands/flashleap/)、[光速云](/brands/lightspeed/) 明确标注支持 Linux；而如梯子云在档案中也客观写明“未发现可直接引用的 Linux 专用安装包，需品牌实际开放订阅方可尝试第三方内核”。

## 一、Linux 桌面端（Ubuntu / Debian / Fedora / Arch）部署路线

### 路线 1：使用品牌官方 Linux 客户端
如果品牌用户中心提供官方 \`.deb\`、\`.AppImage\` 或 \`.tar.gz\` 包：
1. 核对系统 CPU 架构（\`uname -m\` 查看为 \`x86_64\` 还是 \`aarch64\`）。
2. 若下载的是 \`AppImage\`，仅需赋予可执行权限 \`chmod +x ./client.AppImage\` 后运行（Ubuntu 22.04/24.04 可能需要安装 \`libfuse2\` 或 \`libfuse2t64\` 支持包）。
3. 使用注册邮箱登录即可连接，无需手动处理配置文件。

### 路线 2：开放订阅品牌搭配开源图形端或无头 CLI 内核
对于明确开放订阅的品牌（如飞猫云或按政策可申请订阅的品牌）：
- **图形桌面用户**：可从官方 GitHub Release 下载 **Clash Verge Rev**（提供 \`.deb\`、\`.rpm\` 与 \`.AppImage\`）导入订阅。
- **纯命令行 / 无图形服务器用户**：可部署 **Mihomo** 或 **sing-box** 二进制文件，通过 \`systemd\` 托管后台服务并使用 Web 控制面板（如 Metacubexd）切换节点。

## 二、Linux 终端命令行代理环境变量设置

即使桌面客户端已运行，终端下的 \`curl\`、\`wget\`、\`git\`、\`pip\`、\`npm\` 或 \`apt\` 往往仍需要显式读取环境变量（假设本地客户端混合监听端口为 \`7890\`，请以实际客户端端口为准）：

\`\`\`bash
# 临时在当前终端会话启用代理
export http_proxy="http://127.0.0.1:7890"
export https_proxy="http://127.0.0.1:7890"
export all_proxy="socks5://127.0.0.1:7890"

# 取消代理环境变量
unset http_proxy https_proxy all_proxy HTTP_PROXY HTTPS_PROXY ALL_PROXY
\`\`\`

如果需要为 \`git\` 单独设置仅针对 GitHub 的代理而不影响国内内网仓库，推荐使用针对域名的局部配置：
\`\`\`bash
git config --global http.https://github.com.proxy http://127.0.0.1:7890
\`\`\`

## 三、Linux TUN 模式权限与系统 DNS（systemd-resolved）注意事项

- **TUN 权限**：在 Linux 下以普通用户运行内核时，创建 \`tun0\` 虚拟网卡需要赋予二进制文件 \`CAP_NET_ADMIN\` 能力（通过 \`sudo setcap cap_net_admin,cap_net_bind_service=+ep\`）或运行客户端内置的提权后台服务，**不要习惯性直接用 root 全权限运行 GUI 桌面软件**。
- **systemd-resolved 53 端口冲突**：Ubuntu 等现代发行版默认由 \`systemd-resolved\` 占用 \`127.0.0.53:53\`。如果在 Mihomo/sing-box 中开启内置 DNS 监听到 \`0.0.0.0:53\` 会引发端口占用报错，推荐将内核 DNS 监听端口改为 \`1053\` 等高位端口或搭配 Fake-IP 模式使用。
`,
  },
  {
    file: 'chrome.md',
    fm: {
      title: 'Chrome代理设置教程：系统代理继承、ZeroOmega分流与安全DNS排查',
      description: '详解Google Chrome浏览器如何配合本地机场客户端工作：解释Chrome系统代理读取逻辑、ZeroOmega/SwitchyOmega扩展配合端口用法，以及安全DNS(DoH)和QUIC导致无法上网的排查。',
      slug: 'chrome',
      category: '设备与系统教程',
      platform: 'Google Chrome',
      device: 'Chrome 浏览器',
      primaryKeyword: 'Chrome代理设置教程',
      secondaryKeywords: ['Chrome插件代理', 'Chrome安全DNS', 'SwitchyOmega配置'],
      searchIntent: '让Chrome浏览器正确走代理访问网页，并排查浏览器扩展或安全DNS导致的访问故障',
      keywordOwnerDomain: 'tizidaquan.blog',
      publishDate: COMMON_DATE,
      updatedDate: COMMON_DATE,
      documentedVersion: 'Google Chrome 桌面稳定版 (Windows / macOS / Linux)',
      author: '梯子大全编辑部',
      tags: ['Chrome', '浏览器代理', 'DoH', 'ZeroOmega'],
      relatedBrands: ['lingdongyun', 'twilight', 'breezenet'],
      sources: ['Google Chrome 网络代理与安全 DNS 官方说明'],
      faqs: [
        { q: '只在 Chrome 里装一个代理扩展（如 SwitchyOmega），不买机场和客户端能上网吗？', a: '不能！SwitchyOmega 或 ZeroOmega 这类浏览器扩展只是“本地交通指挥员”，它本身不提供任何海外服务器节点，必须把请求转发给您电脑后台正在运行的机场客户端（例如 127.0.0.1 的本地端口）才能生效。' },
        { q: '为什么其他软件都能连上外网，偏偏 Chrome 打开很多网站报错或转圈？', a: '常见原因有三类：① Chrome 中安装了互相冲突的老旧“一键免费加速”扩展抢占了浏览器代理控制权；② Chrome 默认开启的“使用安全 DNS”向受干扰的上游发起 DoH 解析；③ 浏览器缓存或 QUIC (UDP) 特性与代理环境产生冲突。' },
      ],
    },
    body: `
**直接结论**：Google Chrome 本身**没有独立的内置账号系统或翻墙线路**。在 Windows 和 macOS 上，Chrome 默认直接读取操作系统的[系统代理](/beginners/system-proxy/)设置——也就是说，只要机场官方客户端或第三方桌面端已经正常开启并启用了“系统代理”，Chrome 无需任何额外插件即可直接按规则访问网页。只有当您希望“只让 Chrome 走代理、系统其他软件保持直连”，或者需要逐个域名微调浏览器规则时，才需配合本地端口与代理扩展。

## 一、Chrome 的两种代理工作方式对比

| 使用方式 | 前置要求 | 适用人群与优缺点 |
|---|---|---|
| **方式 1：默认跟随系统代理（推荐新手）** | 客户端开启“系统代理”开关 | 零额外设置，与客户端规则分流同步；注意确保扩展列表里没有其他抢占代理权的插件 |
| **方式 2：客户端不开启系统代理，仅 Chrome 装扩展连本地端口** | 关闭客户端“系统代理”，记下本地 HTTP/SOCKS 端口，在 Chrome 安装 ZeroOmega 等扩展指向 \`127.0.0.1:端口\` | 适合只想让浏览器访问外部资料、同时确保电脑上其他工作软件绝对不走代理的开发者或办公用户 |

**提醒**：原经典扩展 Proxy SwitchyOmega 已因 Chrome Manifest V3 迁移逐渐停更，如需类似功能建议优先在 Chrome 应用商店核验使用兼容 Manifest V3 的继任开源扩展（如 ZeroOmega），不要安装来源不明的第三方打包 \`.crx\` 文件。

## 二、排查 Chrome 连不上网的四大高频原因

1. **多个代理扩展相互冲突**：打开 \`chrome://extensions/\`，检查是否残留过早期安装的其他 VPN/学术加速/比价插件。只要有一个扩展声明接管了 \`chrome.proxy\` 权限，就会直接覆盖客户端的“系统代理”设置。如果不需要扩展控制，应将其彻底禁用或卸载。
2. **Chrome“使用安全 DNS (DoH)”冲突**：进入 Chrome **设置 > 隐私和安全 > 安全 > 使用安全 DNS**。如果设置了不可达的自定义 DoH 提供商，而您的代理客户端使用的是本地 DNS 劫持或 Fake-IP 模式，会导致域名无法正常经由代理分流。建议排查时先暂时关闭安全 DNS 或设为与客户端兼容的模式，详见 [机场 DNS 问题排查](/troubleshooting/dns/)。
3. **强制代理与 \`--proxy-server\` 启动参数**：Linux 部分轻量桌面下 Chrome 若读取不到系统代理，可在桌面快捷方式或终端启动时检查 \`chrome://net-internals/#proxy\` 页面，查看 Chrome 当前实际识别到的有效代理配置。
4. **实验性 QUIC 协议影响**：某些网络环境下浏览器默认启用的 HTTP/3 (QUIC) 会与部分不转发 UDP 或高丢包环境产生轻微卡顿，可在 \`chrome://flags\` 中观察 \`Experimental QUIC protocol\` 状态进行对照排查（通常保持默认即可，仅异常时测试关闭）。

## 三、AI 与流媒体场景的 Chrome 隐私窗口测试法

当您在 Chrome 中遇到 ChatGPT 提示拒绝访问、Claude 登录报错或 Netflix 地区显示错误时，往往并非节点本身故障，而是浏览器保留了旧的 Cookie、LocalStorage 或历史地理位置缓存。在确认节点地区合法后，建议按下 \`Ctrl + Shift + N\`（Mac 为 \`Cmd + Shift + N\`）打开 **无痕窗口** 重新登录验证。更多细节参见 [ChatGPT 节点无法访问排查](/ai/chatgpt/access-errors/)。
`,
  },
  {
    file: 'edge.md',
    fm: {
      title: 'Edge浏览器代理设置：系统代理联动、工作配置文件与安全网络冲突排查',
      description: 'Microsoft Edge浏览器代理配置与排障指南：解析Edge与Windows系统代理的同步机制、Edge安全DNS及内置安全网络冲突、企业策略覆盖与独立代理参数说明。',
      slug: 'edge',
      category: '设备与系统教程',
      platform: 'Microsoft Edge',
      device: 'Edge 浏览器',
      primaryKeyword: 'Edge浏览器代理设置',
      secondaryKeywords: ['Edge代理设置', 'Edge安全DNS冲突', 'Edge打不开网页'],
      searchIntent: '在Windows/macOS下正确配置Edge代理，排查Edge内置安全网络与安全DNS引发的代理失效',
      keywordOwnerDomain: 'tizidaquan.blog',
      publishDate: COMMON_DATE,
      updatedDate: COMMON_DATE,
      documentedVersion: 'Microsoft Edge 桌面稳定版 (Windows 10/11 & macOS)',
      author: '梯子大全编辑部',
      tags: ['Edge', 'Windows', '浏览器代理', 'DoH'],
      relatedBrands: ['breezenet', 'firefly', 'lingdongyun'],
      sources: ['Microsoft Edge 代理配置与安全网络官方文档'],
      faqs: [
        { q: '为什么在 Edge 设置里点“打开计算机的代理设置”跳转到了 Windows 系统设置？', a: '因为 Microsoft Edge 在 Windows 和 macOS 上默认没有独立的网络代理界面，而是完全复用操作系统网络代理配置。开启机场客户端的“系统代理”后，Edge 会自动跟随生效。' },
        { q: '为什么同样电脑上 Chrome 能打开海外网站，Edge 却打不开？', a: '重点排查三处：① Edge 是否开启了内置“Microsoft Edge 安全网络”；② Edge 设置中的“使用安全 DNS 指定如何查找网站的网络地址”是否选择了受干扰的服务器；③ 是否登录了公司工作账号导致触发了企业组策略代理限制。' },
      ],
    },
    body: `
**直接结论**：Microsoft Edge（Windows 10/11 预装核心浏览器）在架构上基于 Chromium，代理读取逻辑默认**直接同步操作系统代理设置**。与 Chrome 相比，在 Edge 上更容易触发代理异常的特有因素是：**Microsoft Edge 安全网络（内置混淆代理）**、**安全 DNS 默认策略**以及**工作/学校账号下发的组策略限制**。

## 一、Edge 与系统代理的联动及独立排查入口

在 Edge 地址栏输入 \`edge://settings/system\` 可看到“打开计算机的代理设置”入口：

- **正常自动同步**：当您在 Windows 10/11 或 macOS 上打开机场官方客户端（或 Clash Verge Rev 并勾选“系统代理”）时，Windows Internet 选项的代理地址会自动写入 \`127.0.0.1:端口\`，Edge 无需额外配置即可同步加载代理规则。
- **检查当前生效代理状态**：在 Edge 地址栏输入 \`edge://net-internals/#proxy\`（或部分版本的 \`edge://net-export\`），可以清晰看到当前 Edge 究竟是在使用“Direct（直连）”还是“Fixed proxy（本地代理端口）”，这是区分“客户端没接管系统代理”和“网页本身打不开”的最快方法。

## 二、Edge 特有功能的冲突排查（与 Chrome 差异点）

| Edge 特有/相关功能 | 设置位置 | 可能造成的影响与建议 |
|---|---|---|
| **Microsoft Edge 安全网络** | 设置 > 隐私、搜索和服务 > 安全性 | 这是 Edge 自带的 Cloudflare 合作网络保护功能。若与本地机场客户端同时运行，可能抢占流量隧道导致打不开网站，使用机场时建议将其关闭 |
| **安全 DNS (DoH)** | 设置 > 隐私、搜索和服务 > 安全性 | 若选用了外部 DoH 地址，可能跳过客户端规则导致国内走慢或海外域名解析错乱；建议切换为“使用当前服务提供商”或关闭后交由客户端处理 |
| **工作/学校账户策略** | 地址栏输入 \`edge://policy/\` | 如果 Edge 登录了企业/学校邮箱并启用了策略同步，管理员可能锁定了 \`ProxyMode\`，导致机场客户端无法修改系统代理 |
| **效率模式与休眠标签页** | 设置 > 系统和性能 | 与节点断开无直接关系，但部分网页端 AI 对话长期挂在后台休眠后恢复时需刷新页面以重连 WebSocket |

## 三、Edge 仅让特定网页走代理的配置方法

如果您在使用企业内网系统时不便开启电脑“系统代理”，只想单独使用 Edge 访问海外科研资料或 AI 工具，可以采取以下两种方式之一：

1. **安装兼容扩展**：在 Microsoft Edge 加载项商店安装合规的分流扩展（如 ZeroOmega），将情景模式指向本地运行客户端的 HTTP/SOCKS 端口，同时保持机场客户端的“系统代理”开关处于关闭状态。
2. **多配置文件隔离**：使用 Edge 右上角头像创建两个独立的浏览器配置文件——例如“日常办公配置”（走直连扩展模式）和“海外资料配置”（配置本地代理端口），实现工作与资料查阅完全隔离。

## 四、Edge 访问 AI 工具与微软服务的特别提醒

许多用户习惯在 Edge 侧边栏直接调用 Copilot 或访问 Gemini/ChatGPT。需注意 **Microsoft 账号本身区域、Windows 系统区域设置以及当前节点地区**之间可能产生交叉判断。如果侧边栏功能提示当前地区不可用，除了核查机场节点地区之外，也要确认不是 Edge 内置安全网络将流量路由到了未支持区域。相关跨地区策略详见 [AI 工具多地区节点对比](/ai/region-comparison/)。
`,
  },
  {
    file: 'multi-device.md',
    fm: {
      title: '电脑和手机共用机场订阅与多设备同时在线规则全解（18家品牌对照）',
      description: '解析一个机场账号如何同时在Windows、Mac、iPhone、安卓与iPad间安全共用：汇总18家品牌同时在线设备数限制、共享流量原则及一次性流量包设备上限差异。',
      slug: 'multi-device',
      category: '设备与系统教程',
      platform: '多终端通用',
      device: '电脑与手机多设备',
      primaryKeyword: '电脑和手机共用机场订阅',
      secondaryKeywords: ['机场多设备同时在线', '一个机场可以几台设备用', '多终端共用账号'],
      searchIntent: '确认18家品牌是否允许电脑和手机同时使用同一份机场账号，了解设备数与流量共用限制',
      keywordOwnerDomain: 'tizidaquan.blog',
      publishDate: COMMON_DATE,
      updatedDate: COMMON_DATE,
      documentedVersion: '全平台 (Windows / macOS / iOS / Android / Linux / 路由器)',
      author: '梯子大全编辑部',
      tags: ['多设备', '电脑手机共用', '设备限制', '品牌规则'],
      relatedBrands: ['lingdongyun', 'yinxingren', 'quanqiuyun', 'u1s1'],
      sources: ['18家机场品牌设备数量与订阅政策公开资料'],
      faqs: [
        { q: '买一份机场套餐，电脑和手机可以同时挂着在线吗？', a: '绝大多数品牌在常规周期套餐上标注“不限同时在线设备数”，可以在自己的电脑、手机和平板上同时登录使用，但所有设备会共同消耗同一份月度流量额度。' },
        { q: '为什么有的套餐写不限设备，买了一次性包却只允许 1–3 台设备？', a: '因为部分品牌对常规周期套餐和不限时/一次性流量包采取不同规则！例如隐形人资料明确写明：周期套餐不限设备，而一次性流量包限制 1 / 2 / 3 台设备；另有个别品牌不同渠道资料对入门档设备数记载存在差异（如全球云/U1S1），购买前建议以官网套餐详情为准。' },
      ],
    },
    body: `
**直接结论**：您**不需要**为 Windows 电脑、Mac、iPhone 和安卓手机分别购买多个机场账号。按照截至 2026-11 的 18 家品牌公开资料，**绝大多数常规周期套餐均允许在自己的电脑与手机等多台终端上同时在线使用**，所有设备共同扣减同一个套餐的流量额度。但必须警惕两类特殊情况：**部分一次性流量包存在 1–3 台设备上限**，以及**不可将账号或订阅分享给陌生人造成多 IP 并发封号**。

## 一、18 家品牌多设备在线限制与客户端政策速查

| 品牌名称 | 资料标注设备数量限制 | 多端登录/共用方式 | 特殊规则提示 |
|---|---|---|---|
| **灵动云** | 不限同时在线设备数 | 官方多端登录；符合高流量档可申请订阅 | 所有终端共享套餐月流量 |
| **暮光加速** | 不限同时在线设备数 | 官方客户端账号登录 | 不推荐导出第三方订阅 |
| **微风网络** | 不限同时在线设备数 | 官方客户端/Nextin账号登录 | 所有设备共用同一份流量 |
| **飞猫云** | 不限同时在线设备数 | 支持官方端与 Clash/小火箭多端 | 注意优惠码仅限季付及以上新用户 |
| **隐形人** | 周期套餐不限；**一次性流量包限 1/2/3 台** | 官方客户端账号登录 | 不可混用两类套餐的设备配额预期 |
| **FLYV** | 常规周期不限同时在线设备数 | 官方客户端账号登录 | 禁止将账号分享给他人 |
| **浪网** | 标注无限设备 | 官网客户端一键登录 | 目前暂不支持外部订阅链接 |
| **无忧链接** | 不限同时在线设备数 | 官方端 / iOS Nextin | 不同渠道文档对订阅口径有差异 |
| **Firefly** | 不限同时在线设备数 | 官方客户端账号登录 | Win10+/macOS10.15+/iOS12+/Android5+ |
| **全球云** | 常规不限（第三方有写限 5 台） | 官方客户端为主 | 多人共用需以当前后台规则为准 |
| **唯兔云** | 不限同时在线设备数 | 官网客户端或通用订阅（以客服为准） | 购买前核对当前客户端政策 |
| **灵猫** | 不限同时在线设备数 | 官方客户端为主 | 小包与常规档规则分开 |
| **闪跃** | 不限设备 | 官方客户端或特定订阅方式 | 注意三种资料对 Clash 订阅口径不同 |
| **梯子云** | 资料标注不限设备数量 | 账号后台下载指定客户端 | 独享定制专线设备由客服另行配置 |
| **光速云** | 不限设备，多端同时在线 | 官方客户端账号登录 | 支持 Win/macOS/Linux/iOS/Android |
| **U1S1** | 不限（第三方有入门档 3 台说法） | 官方客户端为主 | 实际以官网结算页规则为准 |
| **Sogo云** | 不限同时在线设备数 | 自研官方客户端 | 已暂停第三方订阅功能 |
| **跨界** | 不限登录设备数（并发上限未写） | 官方端或第三方（以客服为准） | 勿在过多不同出口 IP 同时并发 |

## 二、“不限设备”不等于“可以合租分享给陌生人”

新手最容易误解的一点是把“不限设备数”等同于“可以拉十几个人一起拼车合租”。实际上：

1. **风控监测基于 IP 并发与异常地理跳变**：个人拥有 1 台电脑 + 1 部手机 + 1 台平板，即使全部同时连接，通常处于同一宽带公网 IP 或同城移动基站下；而将账号卖给或分享给全国不同城市的十几名陌生人，会触发后台防滥用风控甚至直接停封账号。
2. **订阅链接泄露风险**：对于开放订阅的品牌，若将带有个人 Token 的订阅链接误贴到公开文档或群聊中，他人的连接也会扣减您的月流量并挤占设备额度。请阅读 [订阅链接保护规范](/beginners/subscription-links/)。

## 三、电脑与手机共用时的实用建议

- **统一通过官网账号管理**：使用官方客户端的品牌（如微风网络、暮光加速、FLYV），在电脑和手机上安装各自系统的官方软件并登录同一个账号密码，两端的节点状态和套餐剩余流量会自动同步。
- **路由器分担固定设备**：如果家里不仅有电脑手机，还有智能电视与游戏机，建议评估开放订阅品牌配合 [家用路由器](/devices/router/) 或 [OpenWrt 旁路由](/devices/openwrt/)，路由器在后台通常仅计作较少在线连接入口，还能省去每台设备单独配置客户端的麻烦。
`,
  },
  {
    file: 'iphone/shadowrocket-install.md',
    fm: {
      title: '苹果手机小火箭安装指南：Shadowrocket正规购买渠道、账号前提与适用条件',
      description: 'Shadowrocket（小火箭）iOS苹果手机合规安装条件指南：说明海外区App Store正版付费获取条件、防iCloud锁机安全警示，以及如何分辨哪些机场真正支持小火箭导入。',
      slug: 'iphone/shadowrocket-install',
      category: '设备与系统教程',
      platform: 'iOS / iPadOS',
      device: 'iPhone / iPad',
      primaryKeyword: '苹果手机小火箭安装指南',
      secondaryKeywords: ['Shadowrocket下载', '小火箭正版购买', '苹果小火箭支持哪些机场'],
      searchIntent: '了解Shadowrocket在iPhone上的正规付费购买前提、账号安全边界与机场兼容性判断',
      keywordOwnerDomain: 'tizidaquan.blog',
      publishDate: COMMON_DATE,
      updatedDate: COMMON_DATE,
      documentedVersion: 'Shadowrocket (海外区 App Store 正版付费应用)',
      author: '梯子大全编辑部',
      tags: ['Shadowrocket', '小火箭', 'iPhone', 'App Store'],
      relatedBrands: ['feimaoyun', 'lingdongyun', 'kuajie'],
      sources: ['Apple App Store 应用分发安全规则', '18家品牌第三方订阅兼容公开资料'],
      faqs: [
        { q: '为什么中国大陆区 App Store 搜不到 Shadowrocket（小火箭）？', a: 'Shadowrocket 从未在中国大陆区 App Store 上架，仅在美区、港区、日区等非中国大陆区 App Store 作为付费工具软件（原价约 2.99 美元）销售。网上声称免费提供“国内直接安装企业签名版小火箭”均非正版渠道且极易掉签或藏有木马。' },
        { q: '买了小火箭之后，所有机场都能直接导入使用吗？', a: '不是！小火箭是一款纯第三方代理工具，需要机场“开放通用/Shadowrocket 订阅链接”才能导入节点。在 18 家品牌中，微风网络、隐形人、FLYV、Firefly、Sogo云、浪网等明确不支持第三方订阅链接，这类品牌无法导入小火箭，只需直接用官方提供的 iOS 应用即可。' },
      ],
    },
    body: `
**直接结论**：**Shadowrocket（俗称“小火箭”）** 是 iOS/iPadOS 上最常用的正版第三方代理客户端之一，但它**不在中国大陆区 App Store 销售**，必须满足两个前提才能安全使用：**第一，通过个人合规的非大陆区 Apple ID 在 App Store 官方商店付费购入正版应用**（切勿使用陌生人共享账号登录系统 iCloud）；**第二，您选择的机场必须明确允许导出第三方订阅链接**。有关 Shadowrocket 内部详细分流规则与界面操作进阶教程，可参考专注客户端玩法的魔法梯子（mofatizi.blog），本指南重点帮您理清获取合规条件、安全边界与品牌适配前提。

## 一、安装 Shadowrocket 前必须确认的三个前提

1. **确认所购机场是否支持小火箭**
   买前核对尤为关键，以免花钱买了小火箭却发现所买机场不开放订阅：
   - **资料确认支持或可申请**：[飞猫云](/brands/feimaoyun/) 公开资料明确支持导入小火箭等第三方客户端；[灵动云](/brands/lingdongyun/) 标注符合条件的高流量套餐用户可向官方客服申请订阅链接。
   - **资料表述存在差异（购买前先问客服）**：[跨界](/brands/kuajie/)、[闪跃](/brands/flashleap/)、[唯兔云](/brands/v2yun/)、[无忧链接](/brands/wuyou/) 在不同历史文档中对是否提供第三方订阅说法不一，务必下单前咨询客服。
   - **明确不支持第三方订阅（无需买小火箭）**：[微风网络](/brands/breezenet/)（2026-10 起）、[隐形人](/brands/yinxingren/)、[FLYV](/brands/flyv/)、[Firefly](/brands/firefly/)、[Sogo云](/brands/sogoyun/)、[浪网](/brands/wavenet/)，此类机场均提供官方客户端或 Nextin 登录方案，买完直接用官方指引登录即可，无需额外购买小火箭。
2. **区分“正版商店购买”与“企业证书签名假冒包”**
   正版 Shadowrocket 必须通过 **App Store** 付费下载（通常定价 2.99 美元）。任何引导您点击网页链接直接安装“描述文件 + 免费企业签名版小火箭”的网站均为高危风险源，轻则几天后证书吊销闪退，重则窃取订阅或手机数据。
3. **个人海外区 Apple ID 准备与支付**
   合规方式是自行使用海外邮箱注册一个个人外区（如美区）Apple ID，并通过正规官方礼品卡渠道充值余额后购买应用，做到应用永久归属本人账号名下。

## 二、安全切换 App Store 账号的标准步骤（防锁机）

无论何时借用或切换非大陆区 Apple ID，请严格执行“**只动商店，不动设置**”原则：

1. 打开桌面的 **App Store** 应用（不要打开“设置”）。
2. 点击右上角的个人圆形头像，滑动至页面最底部，点击 **退出登录**。
3. 滑动回到顶部，输入您的海外区 Apple ID 账号与密码登录。
4. 登录成功后搜索 **Shadowrocket**（核对开发者名称为 *Shadow Launch Technology Limited* 与真实付费标志，警惕山寨同名应用），完成购买并下载至桌面。
5. 安装完毕后，立即在 App Store 右上角头像处退出外区账号，重新登录本人主用 Apple ID。

## 三、常见报错与避坑提示

- **搜索出大量“小火箭图标但名称不同”的免费软件**：App Store 中存在不少仿冒图标的广告应用甚至诱骗高额订阅费的假工具，购买前务必认准英文全称 **Shadowrocket** 与开发者信息。
- **提示“应用已不再共享”或更新弹窗要密码**：这正是使用了他人共享账号购买的后果——一旦共享号主更改密码或停用，该应用就无法随 iOS 系统升级更新。拥有个人外区账号即可一劳永逸解决更新问题。
- **导入订阅报错**：先确认机场是否真的给了通用/Shadowrocket 订阅链接，而非网页登录面板网址！详见 [机场订阅链接失效排查](/troubleshooting/subscription-invalid/)。
`,
  },
  {
    file: 'android/clash-install.md',
    fm: {
      title: '安卓手机Clash安装指南：官方开源仓库校验与第三方订阅前置条件',
      description: 'Android手机安装Clash系客户端的安全与前置指南：说明Clash Meta for Android官方GitHub来源核对、APK架构选择、禁止使用网盘破解包，以及支持第三方订阅的品牌筛选。',
      slug: 'android/clash-install',
      category: '设备与系统教程',
      platform: 'Android',
      device: '安卓手机',
      primaryKeyword: '安卓手机Clash安装指南',
      secondaryKeywords: ['安卓Clash下载', 'Clash Meta for Android', '安卓Clash怎么用'],
      searchIntent: '在Android设备安全获取正版开源Clash客户端，并明确哪些机场支持Clash订阅导入',
      keywordOwnerDomain: 'tizidaquan.blog',
      publishDate: COMMON_DATE,
      updatedDate: COMMON_DATE,
      documentedVersion: 'Clash Meta for Android (Android 8.0+ 推荐)',
      author: '梯子大全编辑部',
      tags: ['Clash', 'Android', '开源校验', 'APK安全'],
      relatedBrands: ['feimaoyun', 'lingdongyun', 'kuajie'],
      sources: ['MetaCubeX / ClashMetaForAndroid GitHub Releases', '18家品牌客户端政策公开记录'],
      faqs: [
        { q: '原来的 Clash for Android (CFA) 还能继续下载使用吗？', a: '原作者的 Clash for Android 已于 2023 年底归档停更，不兼容近年的 Hysteria2、VLESS Reality 等新协议，且存在已知漏洞风险。目前 Android 端开源社区主流替代品为基于 Mihomo 内核的 Clash Meta for Android（CMFA）或 sing-box 系客户端。' },
        { q: '为什么我在机场后台找不到 Clash 订阅按钮？', a: '因为目前越来越多机场采用“封闭官方客户端”路线以防订阅外泄或被滥用。购买前需确认品牌是否支持第三方客户端；如果不开放，直接安装该品牌自研官方 Android APK 即可，不需要强求 Clash。' },
      ],
    },
    body: `
**直接结论**：在 Android 手机上安装 Clash 系客户端，核心不是到处找教程截图，而是做到两件事：**一是从开源项目的官方 GitHub Releases 核对最新维护分支（如 Clash Meta for Android）并校验安装来源**，**二是提前核对您购买的机场品牌是否真正开放了 Clash 订阅链接**。至于 Clash 软件内部的详细规则组写法与高级面板操作，可参考魔法梯子（mofatizi.blog）的客户端专题，本文专注于安装前置条件、安全校验及手机系统适配。

## 一、为什么不能随便下载“搜索第一条的 Clash APK”？

由于原版 Clash 与 Clash for Android 早已停止维护，中文搜索结果中充斥着大量高仿站和注入了窃密木马的“安卓 Clash 官网”。请务必牢记：

1. **Clash 开源项目没有中文独立商用官网**：任何打着“Clash 中文官网”“Clash 安卓高速版下载”旗号且引导充值会员或下载不明 EXE/APK 的网站，均非开源项目官方站点。
2. **认准当前仍在维护的开源内核分支**：Android 端应选择支持现代协议（VLESS / Hysteria2 / Trojan / Shadowsocks）的 **Clash Meta for Android (CMFA)**，从 GitHub 官方组织仓库 Releases 下载对应的 \`arm64-v8a.apk\`。
3. **优先核查品牌后台推荐**：如果您购买的品牌支持第三方订阅（例如 [飞猫云](/brands/feimaoyun/)），其用户中心知识库内通常会附带匹配当前节点协议的客户端说明。

## 二、哪些品牌适合安卓 Clash？哪些只需用官方端？

- **适合或不排斥导入第三方 Clash**：[飞猫云](/brands/feimaoyun/) 明确标注支持 Clash 等第三方客户端；[灵动云](/brands/lingdongyun/) 允许符合条件的高流量档向客服申请订阅。
- **无需安装 Clash（官方客户端直接账号登录）**：[微风网络](/brands/breezenet/)、[隐形人](/brands/yinxingren/)、[FLYV](/brands/flyv/)、[Firefly](/brands/firefly/)、[Sogo云](/brands/sogoyun/)、[浪网](/brands/wavenet/)、[暮光加速](/brands/twilight/) 均主推或强制使用官方客户端，安卓手机安装官方端登录账号即可。

## 三、安装后首次运行的标准系统配置

1. **选择正确架构包**：主流 64 位安卓手机选 \`arm64-v8a\`；若不确定设备 CPU，可选体积稍大的 \`universal\` 通用包。
2. **系统安全确认**：安装未上架国内应用商店的开源 APK 时，OPPO、小米或华为 HarmonyOS 3/4 会触发安全核验提示。**不要为了省事关闭全机所有安全保护**，核对安装包确系从正规渠道下载后完成单次确认即可。
3. **华为纯血鸿蒙限制提醒**：如果您的华为手机是 **HarmonyOS NEXT（5.0 及以上）**，无法安装任何 \`.apk\` 文件，请勿尝试强制安装，详见 [华为手机科学上网教程](/devices/android/huawei/)。
4. **授予 VPN 权限与后台白名单**：导入有效订阅后首次开启连接开关，点击允许创建 VPN 连接；随后按手机品牌放行电池无限制，避免锁屏断线（参见 [OPPO 设置](/devices/android/oppo/) 与 [小米设置](/devices/android/xiaomi/)）。

## 四、导入订阅失败常见原因对照

- 复制的不是订阅链接，而是机场官网登录网址。
- 该品牌实际已暂停开放第三方订阅（例如 2026 年 10 月起多家机场调整政策），详见 [机场订阅链接失效排查](/troubleshooting/subscription-invalid/)。
`,
  },
  {
    file: 'auto-start.md',
    fm: {
      title: '代理软件开机自启设置：Windows、macOS与安卓自启动及断网防护',
      description: '跨平台代理客户端开机自启安全配置指南：讲解Windows任务计划/软件内置开关、macOS登录项授权、Android自启动白名单，以及如何避免开机后因系统代理残留导致断网。',
      slug: 'auto-start',
      category: '设备与系统教程',
      platform: 'Windows / macOS / Android',
      device: '全平台终端',
      primaryKeyword: '代理软件开机自启设置',
      secondaryKeywords: ['Clash开机自启', '机场软件自启动', '开机断网解决'],
      searchIntent: '安全设置电脑与手机代理软件开机自启，并解决开机自启带来的系统代理残留断网问题',
      keywordOwnerDomain: 'tizidaquan.blog',
      publishDate: COMMON_DATE,
      updatedDate: COMMON_DATE,
      documentedVersion: 'Windows 10/11 · macOS 13+ · Android 10+',
      author: '梯子大全编辑部',
      tags: ['开机自启', '系统代理', 'Windows', 'macOS'],
      relatedBrands: ['lingdongyun', 'twilight', 'flyv'],
      sources: ['Windows / macOS 系统登录项官方管理文档'],
      faqs: [
        { q: '为什么设置了代理软件开机自启，电脑刚开机反而网页全部打不开？', a: '最常见的原因是：上一次电脑强制关机或重启时，代理软件没来得及清除“系统代理”设置；而本次开机时，客户端的启动速度慢于浏览器，导致浏览器在代理服务就绪前向空的 127.0.0.1 端口发出了请求。开启客户端内的“静默启动”并在异常断网时等待 5 秒或重置代理即可。' },
        { q: 'macOS 打开自启后为什么开机没有自动接管 TUN 模式？', a: '涉及底层虚拟网卡（TUN）的服务在 macOS 上需要系统级守护进程或后台辅助程序权限；如果仅勾选了普通登录项而未开启服务模式，重启后仍可能弹出一次密码授权请求。' },
      ],
    },
    body: `
**直接结论**：代理客户端的“开机自启”建议优先使用**软件设置页面内自带的“开机自启 (Launch at Startup)”开关**，而不是手动把程序拖进系统启动目录，因为内置开关通常能联动控制“静默启动至托盘”以及与系统代理的同步顺序。如果设置不当，开机自启最容易引发的问题是**关机未清理代理或启动顺序错位导致的开机瞬间断网**。

## 一、Windows 10 / 11 规范设置自启与避坑要点

1. **优先开启软件自带自启开关**：无论是品牌官方桌面端还是 Clash Verge Rev，在“设置”中均提供“开机自启 / Auto Launch”及“静默启动（Start Minimized）”。同时建议勾选 **“退出时关闭系统代理”**，确保每次正常关机都能恢复直连状态。
2. **配合“任务管理器 > 启动应用”检查**：开启后可按 \`Ctrl + Shift + Esc\` 打开任务管理器，在“启动应用”选项卡确认对应客户端状态为“已启用”，避免同时勾选多个互斥代理软件的自启。
3. **管理员权限与 UAC 拦截问题**：如果客户端启用了需要管理员权限的 TUN 模式，直接通过普通注册表启动项可能会在开机时被 Windows UAC 弹窗拦截而无法自动拉起。正确的做法是安装软件自带的 **Service Mode（系统服务模式）**，由后台服务接管网卡权限，主界面即可在无 UAC 弹窗下正常自启。

## 二、macOS 登录项与后台运行权限

1. 打开桌面客户端设置开启 **开机自启**；或者前往苹果电脑的 **系统设置 > 通用 > 登录项与扩展**，在“登录时打开”和“允许在后台运行”中核对应用权限。
2. **避免网络尚未就绪即报错**：Mac 从休眠唤醒或冷启动连接 Wi-Fi 往往需要 2–3 秒，部分客户端自启后立刻检测更新订阅可能提示一次网络错误，待 Wi-Fi 图标就绪后通常会自动恢复，无需惊慌。

## 三、Android（OPPO / 小米 / 华为）开机自启差异

手机系统与电脑不同，出于续航和安全考虑，Android 默认限制普通软件在开机后自动拉起 VPN 服务：

- **OPPO (ColorOS) / 小米 (HyperOS) / 华为 (HarmonyOS 3/4)**：即使在客户端内开启了开机启动选项，若未在手机系统的“应用管理 > 自启动”中允许，系统仍会拦截开机广播。
- **Android 系统级“始终开启的 VPN”**：在原生或部分定制 Android 的 **设置 > 网络和互联网 > VPN** 中（点击对应客户端右侧齿轮），可看到 **“始终开启的 VPN”** 开关。仅在您确信需要全天候不间断代理且已设置好可靠分流规则时再开启，切勿在未配置绕过内网规则的情况下同时勾选“阻断不使用 VPN 的连接”，否则节点一旦失效会导致全机完全断网。

## 四、开机后显示断网的快速自救顺序

如果某天开机发现所有国内国外网页都报错（例如 \`ERR_PROXY_CONNECTION_FAILED\`）：
1. 看一眼右下角（或菜单栏）代理客户端图标是否已经运行；如未运行，先手动启动它。
2. 如果不打算开客户端，直接打开 Windows“设置 > 网络和 Internet > 代理”（或 macOS“网络 > 代理”），将残留的“使用代理服务器”手动拨回关闭即可立刻恢复常规上网。详见 [机场显示连接但无法上网排查](/troubleshooting/connected-no-internet/)。
`,
  },
];

for (const page of DEVICE_PAGES) {
  writeDoc(page.file, page.fm, page.body);
}

console.log(`✓ Generated ${DEVICE_PAGES.length} Device & OS knowledge guides in src/content/devices/`);
