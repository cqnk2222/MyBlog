---
title: 'L2 Cache'
description: 'L2 Cache'
space: 'ai-infra'
pubDate: '2026-10-27'
series: 'Silicon & Photons'
order: 3
---

但实际上你完全可以把sram直接用于寄存器、计算单元，效果一样，还不用经过L2Cache，省去数据传输所以现在的NPU等加速器设计一般都是更大的寄存器堆，而不是更大的L2CacheLPU更是极致，做到了上百M的sram，权重直接都放sram中，没有cache，完全确定性读取数据，计算数据NV GPU实际上也是类似，SM中超大的寄存器堆，让数据直接存储在更靠近计算单元的寄存器堆中，而不是L2中此外TMA、DMA等模块允许提前把权重加载到临近Cache/regfile中，实现“边计算，边加载数据”，加载上来算完就丢
