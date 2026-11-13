---
title: Tensor Kernel 工程
description: 从算子语义到 tile、layout、流水、同步与性能验证。
order: 70
---

# Tensor Kernel 工程

Tensor kernel 工程把“数学上等价”进一步落实为“在目标硬件上正确且高效”。它处在模型算子、编译器与设备体系结构的交界处：既要维护数值语义，也要管理存储层次、并行粒度和异步依赖。

## 阅读路径

1. [Kernel 编程模型](./kernel-programming-model.md)：TileLang DSL 怎样表达 kernel、tensor、scope 与并行。
2. [Tiling 与 Layout](./tiling-and-layout.md)：逻辑 shape 怎样映射为局部 tile 和物理布局。
3. [GEMM Kernel](./gemm-kernels.md)：从矩阵乘法到 GM、L1、L0 与 Cube。
4. [数据搬运与软件流水](./memory-and-pipelining.md)：copy、双缓冲、所有权与 `T.Pipelined`。
5. [Attention Kernel](./attention-kernels.md)：分块在线 softmax 与 Cube/Vector 协作。
6. [Kernel 性能分析](./kernel-performance.md)：建立可证伪的瓶颈判断和计时边界。

硬件前置知识见 [异构计算](../../computer-systems/heterogeneous-computing/)，编译过程见 [张量编译器](../../computer-systems/compilers/tensor-compilers.md)，源码版本和实现边界集中记录在 [TileLang-Ascend](../../computer-systems/case-studies/tilelang-ascend/)。

```mermaid
flowchart LR
    A[算子语义] --> B[分块与布局]
    B --> C[局部存储规划]
    C --> D[计算与搬运流水]
    D --> E[同步与正确性]
    E --> F[测量与调优]
    F -. 新证据 .-> B
```

优化顺序很重要：先证明结果语义和边界 shape 正确，再分析生成代码与设备时间线。一个更短的 kernel 并不必然有更低的端到端延迟。

