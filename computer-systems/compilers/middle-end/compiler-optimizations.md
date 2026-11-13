---
title: 经典编译优化与正确性边界
description: 常量、复制、DCE、CSE、PRE、循环优化与实际项目边界。
order: 30
---

# 经典编译优化与正确性边界

优化的目标不是“让代码看起来更短”，而是在保持规定可观察行为的前提下改善某个成本模型。是否合法与是否盈利是两个问题：合法变换在某台机器上也可能因代码体积、寄存器压力或缓存行为而变慢。

## 1. 局部简化

- **constant folding**：`3*5` 在编译期变成 `15`；
- **constant propagation**：已知 `x=15` 时用常量替换后续合法 use；
- **algebraic simplification**：`x+0→x`、`x*1→x`；
- **copy propagation**：`x=y` 后把安全区域内的 `x` use 改为 `y`；
- **dead code/store elimination**：结果不可观察时删除定义。

这些规则也有边界。整数 overflow 语义、浮点 NaN/signed-zero/rounding、除零 trap、volatile 与 atomic 都可能让看似显然的代数恒等式不合法。DCE 不能删掉有 I/O、异常或同步副作用的调用。

## 2. 公共子表达式与 PRE

CSE 复用已经计算且 operand 未变化的表达式：

```text
t1 := a + b
...
t2 := a + b   // 若中间没有 kill，可改用 t1
```

若表达式只在部分路径 available，partial redundancy elimination（PRE）可能在另一些路径插入计算，使汇合点的重复表达式完全冗余。PRE 在减少动态重复与增加静态/路径工作之间权衡，依赖 available/anticipatable 等数据流事实。

对 load 的 CSE 必须证明内存位置和中间 store/call 不冲突；语法上地址不同不等于不别名。

## 3. 循环优化

循环体执行多次，常见变换包括：

- loop-invariant code motion（LICM）：把循环不变量提到 preheader；
- strength reduction：用较便宜的递推替代重复乘法等；
- induction-variable simplification；
- unrolling、fusion/fission、interchange、tiling。

LICM 不只检查 operand 是否在循环外定义，还要保证把指令提前不会引入原本不会发生的 trap/side effect，并考虑 memory alias。unroll/tiling 可能改善流水与 locality，也会增加 code size、活跃值和 register pressure。

这与 CPU GEMM 的 cache blocking、Triton/TileLang 的 tile mapping 以及 GPU kernel fusion 一脉相承：循环空间和存储层级被重排，但合法性依赖索引、依赖和同步；性能依赖目标硬件。

## 4. Pass 顺序为何重要

一个 pass 会为另一个创造机会：fold 产生 copy，copy propagation 产生 dead definition，DCE 又简化 CFG。优化器常迭代 pass pipeline，但不能无限循环；每个 pass 需要声明 preservation，修改 CFG 后旧 dominance/liveness 可能失效。

LLVM 的 pass pipeline 是具体版本与优化级别的工程选择。不能把“LLVM 支持 LICM”写成“任意 `-O2` 程序必然执行某次特定变换”。

## 5. SPL Phase 3 实际实现了什么

固定版本 [`optimizer.c`](https://github.com/sitefan-coursework/SPL_Compiler/blob/8513ac9ecfb5fd13c7a846534e777806d67398b3/Phase_3/src/optimizer.c) 解析文本 TAC 后反复执行几类局部/线性处理：

- 跟踪 `v*`、`t*` 与常量，进行常量折叠、传播和部分代数化简；
- 传播部分临时值/地址关系；
- 反向标记有用 operand，删除部分未使用临时赋值；
- 删除跳到紧邻 label 的冗余 `IF/GOTO`；
- 合并连续 label 或 `LABEL` 后立即 `GOTO` 的链；
- 合并 `READ/CALL` 后仅复制一次结果的模式。

代码中 common-subexpression 搜索段处于注释状态；它也没有建立通用 CFG、dominance、loop forest、SSA 或完整 alias analysis。因此不能声称该版本实现了全局 CSE、PRE、LICM 或一般数据流优化。课程 Chapters 7–8 提供这些原理，项目只覆盖其中有限子集。

## 6. 与现代张量/GPU 编译的连接

TVM、Triton、TileLang/MLIR 仍需做 lowering、canonicalization、CSE、DCE 和循环变换，但还要表达：

- tensor shape、stride、layout 与 vectorization；
- thread/block/warp 映射和 shared/local/global memory；
- barrier、异步 copy 和 memory scope；
- register/shared-memory 占用与 launch 数之间的成本。

[Gaussian Rasterizer GPU 实现](../../graphics-gpu/gaussian-rasterizer.md)中把 RGB 与 identity payload 合成 Native19 的案例减少了一次候选遍历，却增加每线程状态与模板通道数；只有固定版本和协议下的 profiling 才能证明收益。它是成本模型的案例，不是“fusion 恒快”的证明。

## 7. 如何验证优化

至少分三层：

1. 证明/审查变换前提与 IR 语义；
2. differential test 比较优化前后可观察结果与异常；
3. 在固定输入、硬件和计时边界下 benchmark，报告代码体积、内存与尾延迟。

性能变好不能替代正确性；测试通过也不能覆盖所有输入。binary lifting 和 shader recompilation 还需保持 guest flags、内存顺序、浮点和资源访问等额外语义，见[Binary Lifting](../binary-lifting.md)与[Shader Recompiler](../shader-recompilation.md)。

## 资料

- CS323 [Chapters 7–8](https://github.com/sitefan-coursework/CS323_Compilers/tree/f8ae1184dd9bc182be14edd4562724a3f1a8a4db/Lecture_Notes)
- [LLVM Passes](https://llvm.org/docs/Passes.html)
- [LLVM Alias Analysis](https://llvm.org/docs/AliasAnalysis.html)
