---
title: '强化学习基本框架'
description: '智能体在环境中通过试错最大化累积回报。MDP、状态、动作、奖励、策略是基本词汇。'
pubDate: '2026-04-20'
section: 'RL Algorithm'
chapter: '01 · RL 基本框架'
series: 'RL Algorithm'
order: 1
readingTime: '7 min read'
tags:
  - reinforcement-learning
  - mdp
---

智能体在环境中通过试错最大化累积回报。MDP、状态、动作、奖励、策略是基本词汇。

## 1. 马尔可夫决策过程（MDP）

由五元组 `(S, A, P, R, γ)` 定义：状态、动作、转移概率、奖励、折扣因子。

## 2. 目标

学习策略 `π(a|s)`，最大化期望累积折扣回报：

```text
G_t = R_{t+1} + γ R_{t+2} + γ² R_{t+3} + ...
```

<div class="callout">
<span style="font-size:18px;">💡</span>
<p><strong>核心张力：</strong>探索（exploration）与利用（exploitation）的平衡，贯穿几乎所有 RL 算法。</p>
</div>
