---
title: '存储层次与缓存'
description: '寄存器、Cache、内存、磁盘构成金字塔。局部性原理让缓存得以用小容量换大命中率。'
pubDate: '2026-04-17'
section: '计算机组成原理'
chapter: '03 · 存储层次'
series: '计算机组成原理'
order: 3
readingTime: '8 min read'
tags:
  - architecture
  - cache
  - memory-hierarchy
---

寄存器、Cache、内存、磁盘构成金字塔。局部性原理让缓存得以用小容量换大命中率。

## 1. 局部性原理

- **时间局部性**：刚访问的数据很可能再次被访问
- **空间局部性**：访问某地址后，邻近地址也很可能被访问

## 2. Cache 映射方式

直接映射、组相联、全相联。相联度越高冲突越少，但硬件越复杂。

<div class="callout">
<span style="font-size:18px;">💡</span>
<p><strong>平均访问时间：</strong>AMAT = 命中时间 + 缺失率 × 缺失代价。优化缓存就是在这三项之间权衡。</p>
</div>
