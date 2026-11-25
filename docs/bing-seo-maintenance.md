# Bing Webmaster、IndexNow 与长期排名维护指南（tizidaquan.blog）

## 一、Bing Webmaster Tools 站长验证配置

1. 登录 [Bing Webmaster Tools](https://www.bing.com/webmasters) 添加独立站点属性：`https://tizidaquan.blog`。
2. 选择 **XML 文件验证**，下载官方生成的真实 `BingSiteAuth.xml`（本仓库已预留模板 [BingSiteAuth.xml.example](file:///c:/Users/USERR/Desktop/博客/tizidaquan.blog/public/BingSiteAuth.xml.example)），将其保存至 `public/BingSiteAuth.xml` 后重新构建部署。
3. 验证成功后，提交站点地图主入口：
   - `https://tizidaquan.blog/sitemap.xml`
   - 或直接提交各分模块子地图：`sitemap-devices.xml`、`sitemap-beginners.xml`、`sitemap-safety.xml`、`sitemap-troubleshooting.xml`、`sitemap-ai.xml`、`sitemap-streaming.xml`、`sitemap-brands.xml`、`sitemap-articles.xml`。

## 二、IndexNow 增量提交配置说明

本项目内置 [scripts/indexnow.mjs](file:///c:/Users/USERR/Desktop/博客/tizidaquan.blog/scripts/indexnow.mjs)，严格遵守“仅提交实际变化 URL”原则：

1. 生成 32 位十六进制随机密钥（例如 `openssl rand -hex 16`），假设为 `<KEY>`。
2. 在 `public/<KEY>.txt` 写入纯文本 `<KEY>`（不含空格或多余字符）。
3. 执行构建并完成线上部署后，先在浏览器确认 `https://tizidaquan.blog/<KEY>.txt` 返回 HTTP 200。
4. 本地或 CI 执行干跑比对：
   `INDEXNOW_KEY=<KEY> node scripts/indexnow.mjs`
5. 确认仅列出了新增或修改的 URL 后再正式推送：
   `INDEXNOW_KEY=<KEY> node scripts/indexnow.mjs --submit`
   *(脚本会自动比对 `.indexnow-cache.json` 中的内容哈希，绝不会每次构建重复全量提交。)*

## 三、长期 Bing SEO 内容巡检维度（非伪造更新）

上线后应按月在 Bing Webmaster Tools 追踪以下真实数据指标，优先优化已有真实曝光（Impressions）但点击率（CTR）偏低的页面：

- **收录与抓取状态**：核对已提交 URL 与已索引 URL 差额，排查是否存在软 404 或重定向异常。
- **关键词冲突监测**：查看是否出现两个页面争夺同一搜索词（如设备教程与品牌文章）导致排名互相拖累，必要时合并或微调锚文本。
- **内容真实时效性维护**：
  - 仅在操作系统版本支持周期变化（如 Windows 10/11、HarmonyOS、iOS 新大版）、开源客户端停更、或 18 家品牌价格/订阅政策确实更新时，才修改对应文章内容与 `updatedDate`。
  - **严禁批量自动改写所有文章日期，严禁机械将“2026”全局替换为“2027”制造虚假新鲜度。**
