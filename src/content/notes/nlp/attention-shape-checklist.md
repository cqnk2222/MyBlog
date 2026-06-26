---
title: '多头注意力 · 形状自查表'
description: '每次手写 multi-head attention 都要在脑子里追一遍张量形状。把它写下来，下次直接查表。'
pubDate: '2026-03-27'
section: 'Natural Language Processing'
chapter: '02 · 多头注意力'
series: 'Transformer 笔记'
order: 2
readingTime: '8 min read'
tags:
  - transformer
  - pytorch
  - shapes
---

每次手写 multi-head attention 都要在脑子里追一遍张量形状。把它写下来，下次直接查表。

## 1. 投影与拆头

输入 `x` 的形状是 `(B, T, D)`。经过三个线性层得到 Q/K/V，再 reshape 成多头。关键是**把 D 拆成 (H, d_head)**，并把头维度换到 batch 后面。

```python
# x: (B, T, D)
q = self.wq(x)                  # (B, T, D)
q = q.view(B, T, H, d_head)     # 拆头
q = q.transpose(1, 2)           # (B, H, T, d_head)
```

## 2. 打分与 softmax

- `scores = q @ k.transpose(-2,-1)` → `(B, H, T, T)`
- 除以 `√d_head` 再做 softmax（最后一维）
- 加权 V：结果回到 `(B, H, T, d_head)`

<div class="callout">
<span style="font-size:18px;">💡</span>
<p><strong>易错点：</strong>合并多头时一定要先 <code>transpose(1,2)</code> 再 <code>.contiguous()</code>，否则 reshape 会拿到错位的内存。</p>
</div>
