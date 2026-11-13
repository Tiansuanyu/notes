---
title: TileLang-Ascend
description: 用固定公开提交连接 Tensor DSL、TIR、AscendC/PTO、CANN runtime 与 NPU kernel。
order: 40
---

# TileLang-Ascend

本案例研究固定在公开仓库 [tile-ai/tilelang-ascend](https://github.com/tile-ai/tilelang-ascend) 的两个独立分支：

| 路线 | 固定提交 | 本文用途 |
| --- | --- | --- |
| `ascendc_pto` | [`c3b324a`](https://github.com/tile-ai/tilelang-ascend/tree/c3b324ac955271fd245346be465fbdd39fd4bd18) | 主线：DSL、TIR passes、AscendC/PTO codegen、JIT wrapper |
| `npuir` | [`bd7c60c`](https://github.com/tile-ai/tilelang-ascend/tree/bd7c60c312b0721885c78d1ce03c62be9225314c) | 对照：MLIR/HIVM/HFusion 与 device object/runtime 路线 |

两个分支不是一个版本中的两个相邻阶段，也不能把 `npuir` 的 runtime 能力拼接到 `ascendc_pto` 的 codegen 上。

## 知识边界

- [昇腾 AI Core](../../heterogeneous-computing/ascend-ai-core.md) 讲官方硬件抽象；
- [Kernel 编程模型](../../../ai-infra/kernel-engineering/kernel-programming-model.md) 讲 DSL 的硬件动机；
- [张量编译器](../../compilers/tensor-compilers.md) 讲通用 DSL/TIR/pass 原理；
- [编译架构](./compiler-architecture.md) 只回答这个固定提交具体怎样连接它们；
- GEMM 与 Attention 的算法映射分别见 [GEMM Kernel](../../../ai-infra/kernel-engineering/gemm-kernels.md) 和 [Attention Kernel](../../../ai-infra/kernel-engineering/attention-kernels.md)。

## 事实、解释与限制

源码可以确认函数调用、pass 顺序、生成代码与构建命令；官方文档可以确认硬件和 CANN 接口。没有 NPU/CANN/Bisheng 的当前环境不能验证实机编译、数值结果或性能。仓库历史 benchmark 也不自动代表固定提交和其他产品。

这套边界使案例保持可复核：通用硬件知识不由仓库注释代替，仓库当前实现也不被扩写成 CANN 全部能力。

