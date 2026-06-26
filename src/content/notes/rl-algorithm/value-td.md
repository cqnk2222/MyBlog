---
title: '价值函数与时序差分'
description: 'V 与 Q 衡量「处境有多好」。TD 学习把蒙特卡洛的无偏与动态规划的自举结合起来。'
pubDate: '2026-04-21'
section: 'RL Algorithm'
chapter: '02 · 价值函数与 TD'
series: 'RL Algorithm'
order: 2
readingTime: '9 min read'
tags:
  - reinforcement-learning
  - value-function
  - td-learning
---

V 与 Q 衡量「处境有多好」。TD 学习把蒙特卡洛的无偏与动态规划的自举结合起来。

## 1. 两个价值函数

- **状态价值** `V(s)`：从状态 s 出发的期望回报
- **动作价值** `Q(s,a)`：在 s 执行 a 后的期望回报

## 2. TD(0) 更新

```text
V(s) ← V(s) + α [ r + γ V(s') − V(s) ]
```

方括号内是 **TD 误差**，它驱动价值估计向更准的方向移动。Q-learning 就是基于 Q 的 off-policy TD 控制。
