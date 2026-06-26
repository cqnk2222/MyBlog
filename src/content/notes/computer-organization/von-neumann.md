---
title: '冯·诺依曼体系结构'
description: '存储程序、指令与数据同存内存、顺序执行。现代计算机的底层骨架仍是这套思想。'
pubDate: '2026-04-15'
section: '计算机组成原理'
chapter: '01 · 体系结构基础'
series: '计算机组成原理'
order: 1
readingTime: '6 min read'
tags:
  - architecture
  - von-neumann
---

存储程序、指令与数据同存内存、顺序执行。现代计算机的底层骨架仍是这套思想。

## 五大部件

运算器、控制器、存储器、输入设备、输出设备。前两者合为 CPU。

## 取指—译码—执行

CPU 的基本工作循环：从内存取指令 → 译码 → 执行 → 写回，PC 自增指向下一条。
