---
title: 'Attention Shape Checklist'
description: 'A note for keeping tensor shapes straight when implementing self-attention from scratch.'
pubDate: '2026-03-27'
section: 'Natural Language Processing'
chapter: 'Transformers'
order: 1
tags:
  - nlp
  - transformer
  - implementation
---

When implementing attention by hand, I mostly fail on shape bookkeeping before I fail on theory.

## Minimal checklist

Given input `x` with shape `[batch, tokens, dim]`:

- `W_q`, `W_k`, `W_v` map the last dimension
- after projection, split into heads
- transpose so attention is computed over tokens
- confirm score matrix shape is `[batch, heads, tokens, tokens]`

## Common mistakes

1. Forgetting the transpose between key and query dimensions.
2. Applying softmax over the wrong axis.
3. Reshaping before confirming contiguous memory layout.

## Rule of thumb

If a transformer implementation feels confusing, write down the tensor shape after every line before
debugging the math.
