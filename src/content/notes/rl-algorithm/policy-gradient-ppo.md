---
title: '策略梯度与 PPO'
description: '直接对策略求梯度上升，是连续控制和大模型 RLHF 的主流路线。PPO 用裁剪稳住更新步长。'
pubDate: '2026-04-22'
section: 'RL Algorithm'
chapter: '03 · 策略梯度与 PPO'
series: 'RL Algorithm'
order: 3
readingTime: '11 min read'
tags:
  - reinforcement-learning
  - policy-gradient
  - ppo
---

直接对策略求梯度上升，是连续控制和大模型 RLHF 的主流路线。PPO 用裁剪稳住更新步长。

## 1. 策略梯度定理

```text
∇J(θ) = E[ ∇ log π_θ(a|s) · A(s,a) ]
```

用优势函数 `A` 替代原始回报可显著降低方差（Actor-Critic）。

## 2. PPO 的核心

PPO 用概率比的**裁剪**限制单步更新幅度，避免策略一步走太远导致崩溃：

```text
L = E[ min( r_t·A_t,  clip(r_t, 1−ε, 1+ε)·A_t ) ]
```

<div class="callout">
<span style="font-size:18px;">💡</span>
<p><strong>为什么流行：</strong>PPO 实现简单、超参鲁棒、效果稳定，是 RLHF 对齐大模型时的默认选择之一。</p>
</div>
