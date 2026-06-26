---
title: '操作系统是什么'
description: '操作系统是硬件之上的一层抽象与管理者：虚拟化、并发、持久化是它的三个核心主题。'
pubDate: '2026-04-10'
section: '操作系统'
chapter: '01 · 操作系统概览'
series: '操作系统'
order: 1
readingTime: '6 min read'
tags:
  - os
  - overview
---

操作系统是硬件之上的一层抽象与管理者：虚拟化、并发、持久化是它的三个核心主题。

## 三大主题

1. **虚拟化**：把 CPU 虚拟成进程，把内存虚拟成地址空间
2. **并发**：多个执行流共享资源时的正确性（锁、条件变量）
3. **持久化**：文件系统在崩溃后仍保证数据可靠

<div class="callout">
<span style="font-size:18px;">💡</span>
<p><strong>主线：</strong>OS 几乎所有机制，都是在「给上层一个干净抽象」和「高效复用底层硬件」之间做权衡。</p>
</div>
