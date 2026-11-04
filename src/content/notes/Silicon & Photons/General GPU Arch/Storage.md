---
title: 'Storage'
description: 'Storage'
space: 'ai-infra'
pubDate: '2026-10-27'
series: 'Silicon & Photons'
order: 2
---

| Storage | 典型范围 | 管理方式与用途 |
|---|---|---|
| 寄存器 | 位于 SM 内，逻辑上供各线程使用 | 保存线程正在计算的变量 |
| Shared Memory | 位于 SM 内，通常供同一线程块协作使用 | 程序显式安排数据存放与复用 |
| L1 Cache | 服务本 SM | 硬件自动缓存数据 |
| L2 Cache | 由多个 SM 共享 | 缓存显存访问，支持跨 SM 的数据复用 |
| 显存(HBM、GDDR等) | GPU 计算芯片外 | 容纳模型参数、激活等大规模数据 |
