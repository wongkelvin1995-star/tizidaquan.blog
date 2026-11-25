---
title: "Linux科学上网教程：官方Linux端核对、Clash Verge Rev与终端代理设置"
description: "Linux桌面与命令行科学上网完整知识：汇总18家品牌中资料标明支持Linux的品牌，讲解AppImage/deb客户端安装、Mihomo CLI与HTTP_PROXY/ALL_PROXY环境变量规范。"
slug: "linux"
category: "设备与系统教程"
platform: "Linux"
device: "Linux 系统"
primaryKeyword: "Linux科学上网教程"
secondaryKeywords: ["Ubuntu代理设置","Linux机场客户端","Linux终端走代理"]
searchIntent: "在Ubuntu、Debian、Arch等Linux环境下合规部署官方或开源代理工具并配置命令行环境变量"
keywordOwnerDomain: "tizidaquan.blog"
publishDate: "2026-11-25"
updatedDate: "2026-11-25"
documentedVersion: "Ubuntu 20.04+ / Debian 11+ / Arch Linux (x86_64 & ARM64)"
author: "梯子大全编辑部"
tags: ["Linux","Ubuntu","终端代理","Mihomo"]
relatedBrands: ["yinxingren","flashleap","lightspeed","feimaoyun"]
sources: ["18家品牌 Linux 支持公开记录","Clash Verge Rev / Mihomo 官方发布文档"]
faqs: [{"q":"为什么很多机场买了之后在 Linux 上找不到官方客户端？","a":"绝大多数机场官方客户端优先开发 Windows/macOS/Android/iOS 四端，目前 18 家品牌公开资料中仅有隐形人、闪跃、光速云等明确列出 Linux 平台支持。其余不开放第三方订阅的品牌在无官方 Linux 包的情况下无法直接在 Linux 桌面使用。"},{"q":"Linux 客户端开了系统代理，为什么终端里 git clone 或 curl 还是超慢/超时？","a":"Linux 桌面环境（GNOME/KDE）的“网络代理”设置主要服务于浏览器和部分 GUI 应用，多数命令行工具默认不读取桌面图形代理设置，必须在 Shell 中手动设置 http_proxy / https_proxy / all_proxy 环境变量或开启 TUN 模式。"}]
---

**直接结论**：Linux 用户选购机场前**必须先核实两点**：一是品牌是否直接提供官方 Linux 安装包，二是品牌是否开放标准通用订阅以供开源 Linux 客户端（如 Clash Verge Rev、Mihomo、sing-box）使用。在 18 家品牌公开资料中，[隐形人](/brands/yinxingren/)、[闪跃](/brands/flashleap/)、[光速云](/brands/lightspeed/) 明确标注支持 Linux；而如梯子云在档案中也客观写明“未发现可直接引用的 Linux 专用安装包，需品牌实际开放订阅方可尝试第三方内核”。

## 一、Linux 桌面端（Ubuntu / Debian / Fedora / Arch）部署路线

### 路线 1：使用品牌官方 Linux 客户端
如果品牌用户中心提供官方 `.deb`、`.AppImage` 或 `.tar.gz` 包：
1. 核对系统 CPU 架构（`uname -m` 查看为 `x86_64` 还是 `aarch64`）。
2. 若下载的是 `AppImage`，仅需赋予可执行权限 `chmod +x ./client.AppImage` 后运行（Ubuntu 22.04/24.04 可能需要安装 `libfuse2` 或 `libfuse2t64` 支持包）。
3. 使用注册邮箱登录即可连接，无需手动处理配置文件。

### 路线 2：开放订阅品牌搭配开源图形端或无头 CLI 内核
对于明确开放订阅的品牌（如飞猫云或按政策可申请订阅的品牌）：
- **图形桌面用户**：可从官方 GitHub Release 下载 **Clash Verge Rev**（提供 `.deb`、`.rpm` 与 `.AppImage`）导入订阅。
- **纯命令行 / 无图形服务器用户**：可部署 **Mihomo** 或 **sing-box** 二进制文件，通过 `systemd` 托管后台服务并使用 Web 控制面板（如 Metacubexd）切换节点。

## 二、Linux 终端命令行代理环境变量设置

即使桌面客户端已运行，终端下的 `curl`、`wget`、`git`、`pip`、`npm` 或 `apt` 往往仍需要显式读取环境变量（假设本地客户端混合监听端口为 `7890`，请以实际客户端端口为准）：

```bash
# 临时在当前终端会话启用代理
export http_proxy="http://127.0.0.1:7890"
export https_proxy="http://127.0.0.1:7890"
export all_proxy="socks5://127.0.0.1:7890"

# 取消代理环境变量
unset http_proxy https_proxy all_proxy HTTP_PROXY HTTPS_PROXY ALL_PROXY
```

如果需要为 `git` 单独设置仅针对 GitHub 的代理而不影响国内内网仓库，推荐使用针对域名的局部配置：
```bash
git config --global http.https://github.com.proxy http://127.0.0.1:7890
```

## 三、Linux TUN 模式权限与系统 DNS（systemd-resolved）注意事项

- **TUN 权限**：在 Linux 下以普通用户运行内核时，创建 `tun0` 虚拟网卡需要赋予二进制文件 `CAP_NET_ADMIN` 能力（通过 `sudo setcap cap_net_admin,cap_net_bind_service=+ep`）或运行客户端内置的提权后台服务，**不要习惯性直接用 root 全权限运行 GUI 桌面软件**。
- **systemd-resolved 53 端口冲突**：Ubuntu 等现代发行版默认由 `systemd-resolved` 占用 `127.0.0.53:53`。如果在 Mihomo/sing-box 中开启内置 DNS 监听到 `0.0.0.0:53` 会引发端口占用报错，推荐将内核 DNS 监听端口改为 `1053` 等高位端口或搭配 Fake-IP 模式使用。
