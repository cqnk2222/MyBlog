---
title: '词法分析与有限自动机'
description: '词法分析的核心是把正则定义编译成 DFA，然后用它扫描字符流、切出 token。'
pubDate: '2026-04-02'
section: '编译原理'
chapter: '02 · 词法分析'
series: '编译原理'
order: 2
readingTime: '8 min read'
tags:
  - compiler
  - lexing
  - automata
---

词法分析的核心是把正则定义编译成 DFA，然后用它扫描字符流、切出 token。

## 1. 从正则到 NFA 再到 DFA

经典路径是 Thompson 构造法（正则 → NFA）+ 子集构造法（NFA → DFA），最后再做 DFA 最小化。

## 2. 最长匹配原则

扫描时遵循**最长匹配**：在能继续匹配时不停下，直到无法前进才回退到最近的接受状态。

- 关键字 vs 标识符：先按标识符匹配，再查关键字表
- 注意处理注释、字符串这类需要状态的结构
