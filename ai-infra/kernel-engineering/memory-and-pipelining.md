---
title: 数据搬运与软件流水
description: 解释 copy 路径、双缓冲、T.Pipelined 与跨队列所有权。
order: 40
---

# 数据搬运与软件流水

软件流水的目标是让不同 tile 的搬运、矩阵计算与向量计算并发，而不是改变算子数学结果。它的前提是资源独立、数据依赖正确且有足够工作量填满流水。

## 1. 从串行循环到阶段

一个 $K$ 循环可以拆成：

1. GM→L1；
2. L1→L0A/B；
3. Cube 计算；
4. L0C 写回或交给 Vector。

双缓冲让 tile $q+1$ 的阶段 1 与 tile $q$ 的阶段 2/3 重叠。每多一个 stage 都会增加 live buffer 和同步状态，因此 `num_stages` 不是越大越好。

## 2. `T.Pipelined` 表达了什么

当前 `T.Pipelined(start, stop, num_stages, order, stage, sync, group, cross_interval)` 前端仍构造带注解的 serial loop；后续 planning/injection pass 才安排阶段、prologue/epilogue 和 ring buffer。`num_stages=0` 表示不启用流水。

```mermaid
flowchart LR
    L[带阶段注解的循环] --> P[Pipeline planning]
    P --> R[Ring buffer 版本化]
    R --> Y[插入跨阶段同步]
    Y --> C[生成设备代码]
```

因此“用了 `T.Pipelined`”不等于已证明 overlap。若 pass 无法分析依赖、阶段不平衡、循环太短或局部存储溢出，收益会消失，甚至无法运行。

## 3. 自动化的现实边界

仓库 `fa_opt/auto_pipeline/h16_d128.py` 文件头明确标为已知损坏：可编译，但当前 pipeline pass 对 UB scratch 做 ring buffering 后导致目标配置 UB 越界。它是很有价值的反例——IR 变换在依赖上合法，不代表资源上可行。

Expert kernel 则显式维护 slot：producer 写 workspace 前等待 consumer 归还，写完发 ready；consumer 读完再发 free。同步 token 保护的是某个具体 buffer 版本，不是笼统地“让 C/V 等一下”。

## 4. `cross_interval`

自动 C/V 合并 pass 可让 writer 每隔若干迭代或在末尾发信号，reader 在区间起点等待。这可能减少同步开销，但会扩大同时在途的数据范围，并改变 buffer 生命周期。必须把 interval 与 ring depth、尾迭代和消费者访问范围一起验证。

## 5. 调优时看什么

- MTE、Cube、Vector、FIX 是否真正重叠；
- 哪条流水出现长空洞，等待的是数据、flag 还是资源；
- stage 增加后 L1/L0/UB 占用是否迫使 tile 变小；
- barrier 是否过度串行化，删去后是否仍有完整依赖证明；
- 尾块和短序列是否仍覆盖 prologue/epilogue。

硬件同步原理见 [NPU 执行、流水与同步](../../computer-systems/heterogeneous-computing/npu-execution-and-sync.md)，pass 位置见 [Lowering 与代码生成](../../computer-systems/compilers/lowering-and-codegen.md)。

