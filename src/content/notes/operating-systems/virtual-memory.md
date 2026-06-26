---
title: '虚拟内存与分页'
description: '虚拟内存让每个进程都以为自己独占连续地址空间。分页 + 页表 + TLB 是实现的关键。'
pubDate: '2026-04-12'
section: '操作系统'
chapter: '03 · 虚拟内存'
series: '操作系统'
order: 3
readingTime: '9 min read'
tags:
  - os
  - memory
  - paging
---

虚拟内存让每个进程都以为自己独占连续地址空间。分页 + 页表 + TLB 是实现的关键。

## 1. 地址翻译

虚拟地址 = 页号 + 页内偏移。页表把页号映射到物理帧号，MMU 在硬件层完成翻译。

## 2. TLB 与缺页

- **TLB**：缓存最近的地址翻译，命中则免去查页表
- **缺页中断**：访问的页不在内存时触发，由 OS 从磁盘换入

<div class="callout">
<span style="font-size:18px;">💡</span>
<p><strong>性能关键：</strong>多级页表节省空间但增加翻译开销，TLB 命中率因此至关重要。</p>
</div>
