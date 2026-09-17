---
title: 'Ring Algorithm'
description: '整理 ring collective 的执行阶段、chunk pipeline 和带宽利用特点。'
pubDate: '2026-07-01'
section: 'CCL'
chapter: '02.01 · Ring'
series: 'CCL'
order: 201
readingTime: '6 min read'
tags:
  - CCL
  - ring
---

Ring algorithm 把 ranks 串成环，通过分块和流水线提高带宽利用。

## 1. 基本结构

- rank ordering：
- neighbor relation：
- chunk layout：

## 2. 执行阶段

- reduce-scatter phase：
- all-gather phase：

## 3. 适用边界

- 适合：
- 不适合：
- 对拓扑的依赖：
