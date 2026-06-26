---
title: 'TCP 可靠传输'
description: 'TCP 如何在不可靠的 IP 之上做出可靠、有序、流量受控的字节流？靠序号、确认、重传、窗口。'
pubDate: '2026-04-07'
section: '计算机网络'
chapter: '02 · TCP 可靠传输'
series: '计算机网络'
order: 2
readingTime: '10 min read'
tags:
  - network
  - tcp
  - reliability
---

TCP 如何在不可靠的 IP 之上做出可靠、有序、流量受控的字节流？靠序号、确认、重传、窗口。

## 1. 三次握手

建立连接需要双方各自同步初始序号（ISN）：`SYN` → `SYN+ACK` → `ACK`。

## 2. 可靠性机制

- **序号 / 确认号**：标识字节、确认收到
- **超时重传 + 快速重传**：丢包恢复
- **滑动窗口**：流量控制
- **拥塞控制**：慢启动、拥塞避免、快恢复

<div class="callout">
<span style="font-size:18px;">💡</span>
<p><strong>区分两个窗口：</strong>流量控制窗口（rwnd）由接收方决定，拥塞窗口（cwnd）由发送方根据网络状况估计，实际发送量取两者最小值。</p>
</div>
