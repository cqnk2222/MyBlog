---
title: 'NCCL'
description: 'Nvidia Collective Communication Library'
space: 'ai-infra'
pubDate: '2026-10-13'
---

版本:NCCL 2.32.3


```

┌───────────────────────────────────────────────────────────────────────────────┐
│                         应用与框架层 (PyTorch / JAX / Megatron)                │
│                      ProcessGroupNCCL / TorchCompile / 通信计算重叠            │
├───────────────────────────────────────────────────────────────────────────────┤
│                         NCCL Public API & 内存管理层               │
│  • 集合通信与点对点: AllReduce / ReduceScatter / AllGather / Send / Recv        │
│  • 组管理与非阻塞:   ncclGroupStart/End / 非阻塞 Communicator (ncclCommInitRankConfig)│
│  • 零拷贝内存管理:   ncclMemAlloc / ncclCommRegister (User Buffer Reg, UBR)    │
├───────────────────────────┬───────────────────────────┬───────────────────────┤
│   拓扑发现与图搜索 (Topo)  │   调优与代价模型 (Tuner)   │  可观测性与监控 │
│  • XML 硬件拓扑构建        │  • 算法: Ring / Tree /     │  • Profiler Plugin    │
│  • 跨机 Rail-Optimized 感知│    CollNet / NVLS  │    (v1/v2 接口)       │
│  • MNNVL (多机NVLink域)    │  • 协议: Simple/LL/LL128  │  • RAS 健康检查与诊断  │
│  • NVLink 4/5 & PCIe Gen5 │  • 外部 Tuner Plugin [★]  │  • 慢节点/网络拥塞追踪│
├───────────────────────────┴───────────────────────────┴───────────────────────┤
│                      协同执行层 (Execution Engine) [★ 架构核心分化]            │
│  ┌─────────────────────────────────────┐ ┌─────────────────────────────────┐  │
│  │       GPU Device Kernels            │ │      CPU Proxy Threads          │  │
│  │ • Prims (原语): Copy/Reduce/Multimem│ │ • 异步轮询 FIFO 队列             │  │
│  │ • TMA 引擎卸载 / 减少 SM 占用       │ │ • 驱动 IB Verbs / RoCE / Socket │  │
│  │ • MSCCL / MSCCL++ 自定义解释器可选   │ │ • GDRDMA 内存句柄握手与管理      │  │
│  └─────────────────────────────────────┘ └─────────────────────────────────┘  │
├───────────────────────────────────────────────────────────────────────────────┤
│                           Transport Layer (传输抽象层)                         │
│     P2P (IPC/Fabric)   │   NVLS (NVLink SHARP)  │   NET (IB/RoCE/GDR)  │ SHM  │
├────────────────────────┴────────────────────────┴──────────────────────┴──────┤
│                        Plugin & 硬件卸载接口层 [★ 生态核心]                    │
│  • ncclNet Plugin (对接 AWS EFA / GCP GPUDirect-TCPX / 定制 RoCE NIC)         │
│  • CollNet Plugin (对接 Mellanox SHARP 交换机网内计算)                         │
│  • CUDA VMM (虚拟内存管理 API) & Multicast Object (支撑 NVLS 与跨机 NVLink)    │
└───────────────────────────────────────────────────────────────────────────────┘

```

![image](/images/notes/f637048f77e3e0076f57e22938a6b3520f8191f7d095cb8ffc32b2289776e03b.png)
