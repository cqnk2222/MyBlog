---
title: '网络分层模型'
description: 'OSI 七层与 TCP/IP 四层。分层的本质是把复杂问题切成职责清晰、可替换的模块。'
pubDate: '2026-04-06'
section: '计算机网络'
chapter: '01 · 分层模型'
series: '计算机网络'
order: 1
readingTime: '7 min read'
tags:
  - network
  - osi
  - tcp-ip
---

OSI 七层与 TCP/IP 四层。分层的本质是把复杂问题切成职责清晰、可替换的模块。

## 1. 两套模型对照

```text
OSI            TCP/IP
应用 / 表示 / 会话   →  应用层
传输              →  传输层
网络              →  网络层
数据链路 / 物理      →  网络接口层
```

## 2. 封装与解封装

数据每下一层就加一个头部（封装），到对端再逐层剥掉（解封装）。这是分层协作的核心机制。
