---
title: 异构计算
description: 从 CPU、GPU 到昇腾 NPU，理解执行模型、存储层次与算子映射。
order: 45
---

# 异构计算

异构计算的核心不是“把同一段代码换一块更快的芯片执行”，而是把工作映射到不同的执行、存储和同步模型。本组以 CPU、GPU 和昇腾 AI Core 为主线，回答一个 AI 算子为什么需要分块、搬运、同步，以及这些决策怎样进入编译器。

```mermaid
flowchart LR
    M[算子数学语义] --> E[选择并行粒度]
    E --> T[按片上资源分块]
    T --> D[安排数据搬运]
    D --> C[Cube 或 Vector 计算]
    C --> S[同步与结果写回]
    S --> R[Runtime 启动与管理]
```

## 阅读路径

1. [CPU、GPU 与 NPU](./cpu-gpu-npu.md)：比较并行粒度、资源约束和性能瓶颈，不建立错误的一一对应。
2. [昇腾 AI Core](./ascend-ai-core.md)：理解 Scalar、Cube、Vector 与搬运流水的分工。
3. [NPU 存储层次](./npu-memory-hierarchy.md)：沿 GM、L1、L0A/L0B/L0C 和 UB 追踪数据。
4. [NPU 执行、流水与同步](./npu-execution-and-sync.md)：理解异步队列、双缓冲和 buffer ownership。
5. [Tensor Kernel 工程](../../ai-infra/kernel-engineering/)：把硬件约束落实到 GEMM 与 Attention。
6. [张量编译器](../compilers/tensor-compilers.md)：解释 DSL、TIR、lowering、代码生成与 runtime。
7. [TileLang-Ascend 源码案例](../case-studies/tilelang-ascend/)：核对上述抽象在公开源码中的实现。

## 知识覆盖矩阵

| 问题 | 通用知识主讲 | TileLang-Ascend 案例 |
| --- | --- | --- |
| 为什么 CPU/GPU/NPU 的最佳分块不同 | 本组 | `T.Kernel`、scope 与布局选择 |
| 数据为何要分级搬运 | NPU 存储层次 | `T.copy`、`alloc_L1`、`alloc_L0C` |
| 计算与搬运怎样重叠 | 执行与同步 | `T.Pipelined`、flag 与 memory planning |
| 矩阵与向量阶段怎样配合 | AI Core、Kernel 工程 | Cube GEMM 与 Vector softmax |
| DSL 怎样成为设备程序 | 张量编译器 | `ascendc_pto` lowering 与 codegen |
| 另一后端路线有什么边界 | 张量编译器 | `npuir` 分支的单独编译路径 |

这组文章不记录某款芯片的未经确认容量。昇腾产品代际、AI Core 型号和 CANN 版本会改变可用指令、存储容量与编译选项；具体部署必须以目标产品文档和编译器查询结果为准。

