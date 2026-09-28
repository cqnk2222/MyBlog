---
title: 'Data Plane'
description: '整理 CCL 系统中 chunk pipeline、GPU kernel、channels、send/recv 等数据面执行细节。'
pubDate: '2026-07-01'
section: 'CCL'
chapter: '04.02 · Data Plane'
series: 'CCL'
order: 402
readingTime: '7 min read'
tags:
  - CCL
  - data-plane
---

Data plane 负责把控制面生成的 schedule 真正执行出来。

## 1. Chunk Pipeline

- chunk size：
- pipeline depth：
- overlap：

## 2. GPU Kernel

- copy：
- reduce：
- synchronization：

## 3. Channels

- channel assignment：
- parallelism：
- contention：

## 4. Send / Recv

- transport abstraction：
- buffer management：
- progress：
