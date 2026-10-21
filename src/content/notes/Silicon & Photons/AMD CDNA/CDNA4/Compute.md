---
title: 'Compute'
description: 'Compute'
space: 'ai-infra'
pubDate: '2026-10-21'
series: 'Silicon & Photons'
order: 2
---

计算特性:

- 每个wave每4个周期发一条指令，一些特殊指令，比如超越函数计算，fp32->fp8/fp4转换则更久，是8个周期
- 对于一个CU partition (一个SIMD)，fp32 add/mul/fma, add_u32, mov, AGPR读写可以做到每个wave 2周期发射，其他的一般是4周期一条
- MFMA指令，16x16x128 fp8是32周期，fp4/fp6是16周期
