---
title: 目标代码生成：指令、寄存器与 MIPS32
description: 指令选择、地址模式、活跃区间、干涉图、着色与 spill。
order: 20
---

# 目标代码生成：指令、寄存器与 MIPS32

代码生成把 TAC/低层 IR 映射到 target 指令，同时满足寄存器数量、地址模式、calling convention 和栈帧布局。逐条“查表替换”只能覆盖最简单情形；一个 IR 操作可能对应多个 target pattern，多个 IR 操作也可能合成一条指令。

## 1. 目标机模型

后端至少要知道：可用寄存器类别、指令与 immediate 范围、load/store 约束、分支形式、对齐、数据布局和 ABI。MIPS 是典型 load/store 架构：算术通常作用于寄存器，内存值先 load，结果再 store。

地址模式决定 `base + offset` 是否能直接编码。offset 超范围时需先构造地址；全局符号还涉及 relocation。对象文件与链接阶段见[编译流水线](../compilation-pipeline.md)。

## 2. 指令选择

TAC `x := y + #1` 可选择 immediate add；`x := y * #2` 可能用 shift，但只有整数语义允许时才合法。树覆盖/模式匹配会给候选 pattern 成本，选择能覆盖 IR DAG 的组合。现代后端还在 legalized IR、machine IR 等多层逐步降低。

选择“指令更少”不必然最优：latency、throughput、port pressure、代码体积和寄存器需求都可能改变成本。

## 3. Register descriptor 与 address descriptor

简单块内生成器可维护：

- register descriptor：每个寄存器当前包含哪些 value；
- address descriptor：每个 value 的最新副本位于哪些寄存器/内存。

处理 `x := y op z` 时，`getReg` 尽量复用不会再使用的 operand 寄存器；否则找空闲寄存器；仍无空间时选择 victim spill。块出口只需把后继可能读取且内存中不新鲜的值写回。

这个算法依赖 next-use/liveness。盲目每条指令 load/store 正确但低效；盲目不写回则会跨控制流丢值。

## 4. 全局寄存器分配

活跃区间重叠的 value 互相 **interfere**。干涉图节点是 value，边表示不能共享寄存器；$K$ 个可分配寄存器对应图的 $K$-coloring 近似问题。

典型迭代：simplify 低度节点、选择潜在 spill、着色回填；若失败则插入 load/store，重建 liveness 和 interference 再分配。coalescing 可消除 move，但过度合并可能让图不可着色。

线性扫描按 live interval 处理，编译快，常用于 JIT；图着色有更强全局视角但成本较高。两者都是算法族，不保证单一实现总优。

## 5. Spill 不只是“放回栈”

spill 要为 value 分配栈槽，在定义/使用周围插入 store/load，并可能产生新的短生命周期临时值。选择 victim 时可考虑 use frequency、loop depth、重新计算成本和 rematerialization。插入代码后寄存器压力会重新变化，因此分配通常要迭代。

GPU 中每线程寄存器过多会降低同时驻留的 warp/block；CPU spill 则增加 load/store。二者都源于有限寄存器，但 GPU occupancy、SIMT latency hiding 与 thread-local spill 空间使成本模型不同，见[GPU 执行架构](../../graphics-gpu/gpu-architecture.md)。

## 6. 栈帧与调用边界

后端需要统一安排 local、spill slots、outgoing args、saved registers、return address 和 alignment。调用会 clobber caller-saved 寄存器，所以 live-across-call value 要转到 callee-saved 寄存器或内存。tail call、leaf function 与 frame-pointer elimination 都需要满足 ABI 前提。

## 7. SPL Phase 4 的真实实现

[`tac.c`](https://github.com/sitefan-coursework/SPL_Compiler/blob/8513ac9ecfb5fd13c7a846534e777806d67398b3/Phase_4/src/backend/tac.c) 把文本 IR 解析为带 operand kind 的链表，区分 label、variable、constant、pointer 与 reference。[`mips32.c`](https://github.com/sitefan-coursework/SPL_Compiler/blob/8513ac9ecfb5fd13c7a846534e777806d67398b3/Phase_4/src/backend/mips32.c) 为 TAC kind 分派 emitter，生成算术、分支、load/store、call 与运行时 `read/write`。

当前源码的寄存器选择遍历 `$t0` 到 `$s7`，优先空闲项，否则选 `recent` 最小的 LRU victim；它维护 `RegDesc/VarDesc` 和栈 offset。需要注意：`spill_register()` 中实际写回逻辑被注释，dirty victim 会被清空描述而不是完整 store。这说明它不是可以泛化为正确工业 allocator 的范例；仓库样例能工作不证明所有压力场景都正确。

课程 Chapter 7 讲 register/address descriptor、basic-block codegen 和全局分配原理；Phase 4 只实现其中一个简化后端。完整 factorial 的实际 IR/MIPS 对照见[案例](../../case-studies/cs323-spl-compiler/)。

## 8. 与 JIT、lifting 和 shader backend 的关系

- Dynarmic JIT 需要更低编译延迟和可回到 guest context 的精确状态，见[JIT 与 AOT](../jit-and-aot.md)；
- Hookshot lifted C 把 target codegen 交给 Clang/LLVM，lifter 仍需正确表达 guest 语义，见[Binary Lifting](../binary-lifting.md)；
- shader backend 面对向量/SIMT、descriptor 与 GPU memory model，见[Shader Recompiler](../shader-recompilation.md)。

共同骨架是 instruction selection、register allocation 和 emission；具体合法性与成本模型由 target 决定。

## 资料

- CS323 [Chapter 7](https://github.com/sitefan-coursework/CS323_Compilers/blob/f8ae1184dd9bc182be14edd4562724a3f1a8a4db/Lecture_Notes/Chapter7.pdf)
- CS323 [Labs 13–14](https://github.com/sitefan-coursework/CS323_Compilers/tree/f8ae1184dd9bc182be14edd4562724a3f1a8a4db/Lab_Notes)
- [LLVM Code Generator](https://llvm.org/docs/CodeGenerator.html)

