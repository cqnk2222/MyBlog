# Gradient Descent Intuition

Gradient descent is the default starting point for many machine learning training loops, but the most
useful intuition is geometric: you repeatedly move parameters in the direction that most quickly reduces
loss in the local neighborhood.

## Core idea

For parameters `theta` and loss `L(theta)`, the update rule is:

```text
theta <- theta - eta * grad(L(theta))
```

The gradient points toward the steepest increase, so subtracting it moves toward local decrease.

## Why it matters

Three implementation details usually matter more than the slogan:

1. Feature scale changes optimization stability.
2. A poor learning rate can look like a model problem.
3. Stochasticity can help training escape bad regions.

## Practical checklist

- optimizer choice
- learning-rate schedule
- batch size
- warmup
- gradient clipping
