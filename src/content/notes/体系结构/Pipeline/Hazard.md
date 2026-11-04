---
title: 'Hazard'
description: 'Hazard'
space: 'course-notes'
pubDate: '2026-10-27'
series: '体系结构'
order: 2
readingTime: '1 min read'
---

Hazard:流水线中的指令由于资源冲突、数据依赖或控制流尚未确定，无法在原定时钟周期保证正确执行。

| Type | Question | Example |
|---|---|---|
| Structural hazard | 硬件资源无法同时满足多条指令的需求 | 取指和数据访存争用同一个单端口存储器 |
| Data hazard | 指令的数据读写时序不满足依赖约束 | 后一条指令需要读取前一条指令尚未提供的结果 |
| Control hazard | 后续应执行的指令地址尚未确定 | 条件分支的结果尚未算出，跳转方向未确定 |
