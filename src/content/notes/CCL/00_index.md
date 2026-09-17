---
title: 'CCL Notes 总览'
description: '从 primitive、algorithm、topology、system architecture 四个坐标系组织 CCL 学习笔记。'
pubDate: '2026-07-01'
section: 'CCL'
chapter: '00 · Index'
series: 'CCL'
order: 0
readingTime: '5 min read'
tags:
  - CCL
  - collective-communication
---

这组笔记用四个坐标系来整理 CCL：primitive space、algorithm space、topology space 和 system architecture space。

## 1. 坐标系

- Primitive space：定义 collective primitives 的语义和可组合性质。
- Algorithm space：比较 ring、tree、butterfly / recursive doubling 等算法族。
- Topology space：分析 NVLink、PCIe、IB、NUMA 等真实拓扑约束。
- System architecture space：拆开控制面和数据面的职责边界。

## 2. 阅读路径

- [Primitive Space](/notes/ccl/01_primitive_space/primitives/)
- [Algorithm Space Overview](/notes/ccl/02_algorithm_space/overview/)
- [Topology Space](/notes/ccl/03_topology_space/topology/)
- [Control Plane](/notes/ccl/04_system_architecture_space/control_plane/)
- [Data Plane](/notes/ccl/04_system_architecture_space/data_plane/)
