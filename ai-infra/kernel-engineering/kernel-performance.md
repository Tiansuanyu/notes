---
title: Kernel 性能分析
description: 区分计算、带宽、延迟与同步瓶颈，并建立可复现测量边界。
order: 60
---

# Kernel 性能分析

性能优化应从可证伪的假设开始：“Cube 在等待 MTE2”比“NPU 利用率低”更有行动价值。一次测量只能支持其环境、输入和计时范围内的结论。

## 1. 先定义计时边界

至少区分：

- 单 kernel 设备执行；
- JIT/编译缓存命中后的调用；
- layout 转换与 workspace；
- host→device / device→host 搬运；
- 完整模型或服务端到端。

异步设备调用必须在计时边界同步；同时记录 warm-up、重复次数、输入 shape/dtype、设备 SKU、CANN/编译器、代码 commit 和 pass 配置。

## 2. 四类主要瓶颈

| 类别 | 可观察证据 | 常见干预 |
| --- | --- | --- |
| 计算受限 | Cube/Vector 目标流水持续忙，数据供应充分 | 更合适的 intrinsic、融合、减少无效计算 |
| 带宽受限 | GM/MTE 流量高，计算等待输入 | 增加复用、减少 materialization、改善连续性 |
| 延迟受限 | 流水有气泡，但带宽/算力均未饱和 | 增加独立工作、调整 tile 或 stage |
| 同步受限 | flag/barrier/跨核等待主导 | 消除冗余同步、重新平衡生产消费 |

这些状态可以混合出现。增大 tile 可能提升复用，却减少 block 并行；融合减少 GM 流量，却扩大 UB/L0 生命周期。

## 3. 从模型到测量

算术强度和 roofline 提供上界方向，但需要使用实际流量而非只计算逻辑张量字节。软件流水模型还应比较各阶段服务时间：若 Cube 一次耗时远长于 Vector，继续缩短 Vector 未必改变稳态吞吐；若同步使它们串行，则二者都可能空闲。

官方 `msprof` 可用于设备/仿真时间线，但工具显示的“忙”仍需与指令、数据依赖和端到端目标结合。TileLang 仓库优化指南中的流程图是调优方法，不是当前环境的实测证明。

## 4. 正确性是性能结论的前提

应覆盖参考输出、相对/绝对误差、NaN/Inf、边界 shape、不同随机输入和必要的梯度。减少同步、修改累加 dtype 或改变 softmax 顺序都可能影响结果；只有在约定容差内等价，时间才可比较。

## 5. 不应直接推出的结论

- 理论 FLOPs 高，不代表实际 compute-bound；
- GM 带宽未满，不代表不存在带宽问题，访问粒度或依赖可能先限制；
- stage 更多，不代表 overlap 更充分，可能先耗尽局部存储；
- 单 kernel 更快，不代表模型更快，图调度和转换可能占主导；
- 某个 A3 文档结果，不能外推到其他昇腾代际或 CANN 版本。

CPU/GPU 测量的共同边界见 [CPU、GPU 与 NPU](../../computer-systems/heterogeneous-computing/cpu-gpu-npu.md) 和 [GPU Kernel 优化](../../computer-systems/graphics-gpu/gpu-kernel-optimization.md)。
