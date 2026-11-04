---
title: 'Super-pipelining'
description: 'Super-pipelining'
space: 'course-notes'
pubDate: '2026-10-26'
series: '体系结构'
order: 3
---

时间并行

提高时钟频率:
弊端：这样会让流水线过深，一旦branch prediction出错，在pipeline上的指令都会被冲刷，研究表明最优流水线深度在15级左右。
