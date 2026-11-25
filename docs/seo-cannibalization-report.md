# 关键词防冲突与去重审计报告（tizidaquan.blog）

更新日期：2026-11-25

## 一、同站内部近义词合并处理记录

为避免同一网站内部多个 URL 争夺相同搜索意图（Keyword Cannibalization），以下近义关键词已合并至唯一规范专题：

1. **136（电脑和手机共用机场订阅）+ 137（机场多设备同时在线）** → 合并至 `/devices/multi-device/`，统一对照 18 家品牌同时在线限制与共享规则。
2. **145（ChatGPT节点无法访问）+ 148（OpenAI服务访问问题）** → 合并至 `/ai/chatgpt/access-errors/`，同时覆盖网页端、App 与 API 报错及 `status.openai.com` 官方状态查询。
3. **167（订阅链接在哪里找）+ 168（订阅链接怎么复制）** → 合并至 `/beginners/subscription-links/`，兼顾“官方端无订阅链接”现状与“防 token 外泄”。
4. **189（机场横向对比怎么做）+ 190（机场评分标准）** → 合并至 `/comparison/methodology/`，公开五大可核验维度与透明度边界。
5. **192（机场节点连接失败）+ 199（机场节点超时原因）** → 合并至 `/troubleshooting/node-connection/`，合并拆解 Timeout 成因与 10 步排障。
6. **081/082/086/087/091/097（梯子工具类辅助词）** → 统一收口于 `/tools/` 与 `/tools/vpn-and-proxy/`，不创建大量相似长尾落地页。

## 二、索引策略与页面排除清单

- **允许索引（`index, follow`）**：首页、全部栏目中心页、18 家品牌详情页、设备/AI/流媒体/新手/安全/排障独立专题与原创品牌解析文章。
- **禁止索引（`noindex, follow`）**：`/search/`（含带 `?q=` 搜索结果页）及 `/404/`。上述页面严格从 Sitemap 中排除，并在 `robots.txt` 允许抓取以便搜索引擎读取 `noindex` 指令。
- **不以跨域 Canonical 掩盖重复内容**：本站所有文章与教程均为独立搜索意图和结构重新撰写，未使用跨域 Canonical 指向其他四个博客。

## 三、品牌文章防重复约束（Section 20）

- 18 家品牌仅在具有明确数据时才发布对应 AI 与流媒体文章（`<slug>-ai-and-streaming`）。
- 通用操作系统步骤（Windows / macOS / iPhone / Android）不在 18 家品牌文章中机械复制 18 次，而是聚焦该品牌特有的**客户端政策差异**并自然链接至 `/devices/` 对应主教程。
