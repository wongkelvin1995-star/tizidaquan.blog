---
title: "OpenWrt代理配置教程：旁路由拓扑、内核选择与DNS防泄露要点"
description: "OpenWrt软路由与旁路由代理配置知识百科：对比OpenClash(Mihomo)与HomeProxy(sing-box)核心差异、主路由与旁路由网关配置原理、内存优化与DNS防泄露排查。"
slug: "openwrt"
category: "设备与系统教程"
platform: "OpenWrt"
device: "OpenWrt 软路由"
primaryKeyword: "OpenWrt代理配置教程"
secondaryKeywords: ["OpenClash配置","HomeProxy教程","OpenWrt旁路由设置"]
searchIntent: "掌握OpenWrt部署代理内核的系统要求、旁路由网关拓扑及防止DNS污染与环路的配置原则"
keywordOwnerDomain: "tizidaquan.blog"
publishDate: "2026-11-25"
updatedDate: "2026-11-25"
documentedVersion: "OpenWrt 22.03 / 23.05 / 24.10 (Mihomo / sing-box 内核)"
author: "梯子大全编辑部"
tags: ["OpenWrt","旁路由","OpenClash","DNS防泄露"]
relatedBrands: ["feimaoyun","lingdongyun","quanqiuyun","sogoyun"]
sources: ["OpenWrt 官方网络配置文档","sing-box / Mihomo 官方文档"]
faqs: [{"q":"OpenWrt 选 OpenClash 还是 HomeProxy？","a":"HomeProxy 基于 sing-box 内核，是 OpenWrt 新版官方源集成度更高、内存占用更轻的方案，原生支持 VLESS/Hysteria2 等新协议；OpenClash 则基于 Mihomo (Clash.Meta) 内核，对机场直接下发的 Clash YAML 订阅兼容性最好。选择前需看机场下发的配置格式。"},{"q":"为什么配置好 OpenWrt 旁路由后，家里其他设备反而连不上网或频繁掉线？","a":"最常见原因有两个：① 旁路由网关或 DHCP 配置错误形成了内网路由环路；② DNS 转发模式（Fake-IP 与 Redir-Host）或端口（53/7874）配置冲突。建议先确保旁路由自身在关闭代理时能正常 ping 通外网，再逐项开启分流。"}]
---

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
2. **旁路由模式（推荐新手先试行）**：保留原有的运营商光猫或稳定硬路由作为主路由（假设主路由 IP 为 `192.168.1.1`），将 OpenWrt 作为局域网内一台普通静态 IP 主机接入（例如 `192.168.1.2`，网关和 DNS 指向 `192.168.1.1`，关闭旁路由的 DHCP 服务）。
   - **按需指定设备走代理**：只需在电脑、Apple TV 或手机的 Wi-Fi 静态设置中，把“网关”和“DNS”手动填为 `192.168.1.2`，该设备就会经过 OpenWrt；其余全家设备默认继续走 `192.168.1.1`，互不干扰。

## 三、OpenWrt 防 DNS 污染与防环路关键配置

- **禁用主旁双开 DHCP 冲突**：如果采用旁路由且主路由已开启 DHCP，务必关闭旁路由接口的 DHCP 服务；仅当全屋都想自动走旁路由时才在主路由下发旁路由为默认网关。
- **Fake-IP vs Redir-Host 取舍**：在 OpenWrt 环境下，**Fake-IP** 模式可以彻底屏蔽本地 ISP 对海外域名的 DNS 劫持并缩短初次解析延迟，但需要清理一次局域网设备 DNS 缓存；若局域网内有 NAS 内网域名或特殊软件不兼容 `198.18.0.0/16` 假 IP 段，则需在配置中添加 `fake-ip-filter` 白名单或切换为 Redir-Host 配合加密 DoH/DoT 上游。
- **IPv6 泄露检查**：国内家庭宽带大多已下发原生 IPv6 地址。若仅接管了 IPv4 转发而放行了 IPv6 直连，部分支持双栈的平台（如 YouTube、Netflix 或 DNS 请求）可能会直接通过本地 IPv6 暴露真实归属或请求失败。可在客户端内核中确认是否对 IPv6 流量进行了同等规则接管，或对不需要 IPv6 的旁路由入口做合理分流策略。

更多排障细节请参考 [机场 DNS 问题排查](/troubleshooting/dns/) 与 [机场节点连接失败排查](/troubleshooting/node-connection/)。
