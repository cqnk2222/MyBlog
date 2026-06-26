---
title: '自顶向下与自底向上语法分析'
description: '语法分析的两大流派：递归下降 / LL 自顶向下，和 LR 系列自底向上。各有取舍。'
pubDate: '2026-04-03'
section: '编译原理'
chapter: '03 · 语法分析'
series: '编译原理'
order: 3
readingTime: '10 min read'
tags:
  - compiler
  - parsing
  - grammar
---

语法分析的两大流派：递归下降 / LL 自顶向下，和 LR 系列自底向上。各有取舍。

## 1. 自顶向下（LL）

从开始符号出发尝试推导出输入串。递归下降直观、易手写，但需要消除左递归、提取左公因子。

## 2. 自底向上（LR）

从输入串规约回开始符号，能力更强（LR(1) / LALR），但表难手写，通常用工具生成（yacc / bison）。

<div class="callout">
<span style="font-size:18px;">💡</span>
<p><strong>选择建议：</strong>手写小语言用递归下降；处理复杂文法用 LR 工具。冲突（shift/reduce）几乎都来自文法二义性。</p>
</div>
