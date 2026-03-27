---
title: 'Gradient Descent Intuition'
description: 'A compact note on why gradient descent works, what the update rule means, and what to watch for in practice.'
pubDate: '2026-03-27'
section: 'Machine Learning'
chapter: 'Optimization Basics'
order: 1
tags:
  - optimization
  - machine learning
  - math
---

Gradient descent is the default starting point for a lot of machine learning training loops, but the
most useful intuition is still geometric: you are repeatedly moving parameters in the direction that
most quickly reduces loss in the local neighborhood.

## Core idea

For parameters `theta` and loss `L(theta)`, the update rule is:

```text
theta <- theta - eta * grad(L(theta))
```

The gradient points toward the steepest increase, so subtracting it moves you toward local decrease.
The learning rate `eta` controls how far you step each iteration.

## Why it matters

Three implementation details usually matter more than the slogan:

1. The scale of your features changes how stable the updates are.
2. A bad learning rate can look like a model problem when it is really just optimization instability.
3. Stochasticity is not only noise; it can also help escape poor sharp regions.

## What I care about in practice

When I read a paper or reproduce a result, I usually track:

- the optimizer
- the learning-rate schedule
- batch size
- warmup usage
- gradient clipping

Those choices often explain training behavior better than architecture diagrams.
