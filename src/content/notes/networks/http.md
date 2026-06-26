---
title: 'HTTP 与应用层'
description: '从 HTTP/1.1 的队头阻塞到 HTTP/2 多路复用，再到 HTTP/3 基于 QUIC。应用层协议的演进逻辑。'
pubDate: '2026-04-08'
section: '计算机网络'
chapter: '03 · HTTP 与应用层'
series: '计算机网络'
order: 3
readingTime: '8 min read'
tags:
  - network
  - http
  - quic
---

从 HTTP/1.1 的队头阻塞到 HTTP/2 多路复用，再到 HTTP/3 基于 QUIC。应用层协议的演进逻辑。

## 1. HTTP/1.1 的瓶颈

每个 TCP 连接同一时刻只能处理一个请求，导致**队头阻塞**。浏览器靠开多个连接缓解。

## 2. HTTP/2 与 HTTP/3

- **HTTP/2**：单连接内多路复用（stream），头部压缩（HPACK）
- **HTTP/3**：放弃 TCP 改用 QUIC（基于 UDP），解决 TCP 层面的队头阻塞
