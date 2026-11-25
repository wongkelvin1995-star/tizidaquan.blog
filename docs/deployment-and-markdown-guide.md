# 独立部署配置与 Markdown 内容维护说明（tizidaquan.blog）

## 一、Cloudflare Pages 独立部署清单

本项目为独立静态站点（Astro SSG + Pagefind），输出目录为 `dist/`，完全独立于 `jichangyouhui.blog`、`jichang-wending.blog`、`jichang-pianyi.blog` 与 `mofatizi.blog`。

1. **创建独立 Git 仓库与 Cloudflare Pages 项目**：
   - 新建独立仓库（例如 `tizidaquan-blog`）并推送本目录代码（切勿推送到其他四站仓库）。
   - Cloudflare Pages 新建独立项目：`tizidaquan-blog`。
   - **Build command**：`npm run prebuild && npm run build`
   - **Build output directory**：`dist`
   - **环境变量**：`NODE_VERSION=22`（或 `20`）。
2. **自定义域名与 HTTPS 规范化**：
   - 绑定主域名 `tizidaquan.blog`，开启 **Always Use HTTPS**。
   - `www.tizidaquan.blog` 与 `http://` 到 `https://tizidaquan.blog` 的 301 重定向已在 [public/_redirects](file:///c:/Users/USERR/Desktop/博客/tizidaquan.blog/public/_redirects) 配置。
3. **缓存与安全头配置**：
   - [public/_headers](file:///c:/Users/USERR/Desktop/博客/tizidaquan.blog/public/_headers) 已配置安全响应头（`X-Content-Type-Options: nosniff`、`X-Frame-Options: SAMEORIGIN`、`Referrer-Policy`），并为 `/_astro/*`、`/illustrations/*`、`/search-index.json` 与 `/pagefind/*` 设置合理缓存。
4. **上线后必验项目**：
   - 验证首页、`/brands/lingdongyun/`、`/devices/windows-11/`、`/search/?q=苹果手机` 刷新访问正常。
   - 验证不存在路径（如 `/non-existent-test/`）返回真实 `404` 状态及自定义 404 页面。
   - 验证 `/sitemap.xml`、`/robots.txt` 可直接访问。

## 二、Markdown 数据与内容维护工作流

1. **更新品牌资料或历史价格**：
   - 更新 `source-materials/` 原始档案与 `verified-corpus.json`（务必更新历史价格对应记录日期 `historyPriceDate`，切勿删改 AFF 参数）。
   - 运行 `node scripts/build-data.mjs` 重新生成 `src/data/brands.json`、`src/data/plans/all-plans.json`、`src/data/coupons.json` 和 `src/content/brands/*.md`。
   - 运行 `node scripts/generate-content.mjs` 同步更新品牌相关深度文章。
2. **更新或新增百科文章**：
   - 100 关键词核心集群文章对应生成脚本位于 `scripts/content-*.mjs`（亦可直接编辑 `src/content/devices/`、`ai/`、`streaming/`、`beginners/`、`safety/`、`troubleshooting/` 下的 Markdown，注意如后续运行生成器会覆盖由脚本托管的文件）。
   - 新增文章前先核对 [src/data/seo-keywords.json](file:///c:/Users/USERR/Desktop/博客/tizidaquan.blog/src/data/seo-keywords.json)，确保 `primaryKeyword` 不与现有页面争夺同一意图，并将草稿设 `draft: true`。
3. **重建索引与上线前体检**：
   - 执行 `npm run prebuild && npm run build && npm run audit`，全部校验通过后再发布部署。
