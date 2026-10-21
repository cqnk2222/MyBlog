---
title: 'Workgroup Cluster'
description: 'Workgroup Cluster'
space: 'ai-infra'
pubDate: '2026-10-21'
series: 'Silicon & Photons'
order: 6
---

| 名称 | 含义 |
|---|---|
| **Workgroup** | 软件中的线程组，由多个 Wave 组成 |
| **WGP** | 执行工作组的硬件单元 |
| **Workgroup Cluster** | 由多个 Workgroup 组成的协作组 |

执行层级：
`Grid → Cluster → Workgroup → Wave → Thread`。

基本特性:
- **与multicast的配合**:多个workgroup需要同一份input时，可以通过对应的multicast，让硬件合并重复请求、分发数据。
- 包含16个工作组，可以组织成一维、二维、三维。

Example in [GEMM](https://rocm.blogs.amd.com/software-tools-optimization/hipkittens-gemm-ladder/README.html)


假设计算 $$\(C=AB\)$$，四个工作组分别负责四个输出 tile，并组成一个逻辑上的 \(2\times2\) Cluster。在某一轮 K 维计算中：

| | 第 0 列输出 | 第 1 列输出 |
|---|---|---|
| **第 0 行输出** | WG₀₀：\(C_{00} \mathrel{+}= A_0B_0\) | WG₀₁：\(C_{01} \mathrel{+}= A_0B_1\) |
| **第 1 行输出** | WG₁₀：\(C_{10} \mathrel{+}= A_1B_0\) | WG₁₁：\(C_{11} \mathrel{+}= A_1B_1\) |

可以看到：

- 同一行的工作组需要相同的 **A tile**。
- 同一列的工作组需要相同的 **B tile**。

通过multicast，\(A_0\) 可以同时分发给 WG₀₀、WG₀₁，\(B_0\) 可以同时分发给 WG₀₀、WG₁₀。**每个工作组仍计算自己的输出，但输入数据可以共同获取。** AMD 的 GEMM 教程就采用了类似设计，用 \(4\times4\) Cluster 复用 A/B 输入，减少重复的 L2 数据传输。




Tradeoff
| Potential Benefits | Potential Cost |
|---|---|
| 减少重复输入传输 | 增加集群同步 |
| 扩大跨工作组的数据复用范围 | 调度时需要协调多个 WGP 的资源 |
| 提高数据供给效率 | 较慢的工作组可能让其他组等待 |
