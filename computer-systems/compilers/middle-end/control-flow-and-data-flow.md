---
title: 控制流图与数据流分析
description: 基本块、GEN/KILL、到达定义、活跃变量、可用表达式与不动点。
order: 20
---

# 控制流图与数据流分析

优化不能只看相邻两行。某个赋值是否会到达当前位置、一个值离开基本块后是否还会被使用，都取决于所有控制路径。数据流分析把这些问题写成有限集合上的方程，并迭代到不动点。

## 1. 从 TAC 到 CFG

基本块 leader 通常包括：第一条指令、任意跳转目标、任意跳转后的下一条。每个 leader 到下一个 leader 之前形成一段单入口、只从末尾退出的直线代码。块末条件跳转有 true/false 边，无条件跳转只有目标边，普通末尾有 fall-through 边，return 无后继。

CFG 是编译器的控制流模型，不是运行时真实执行轨迹。循环、不可达块和异常边是否出现，取决于 IR 语义是否显式建模。

## 2. 通用方程

对每个块 $B$ 定义 `IN[B]`、`OUT[B]` 和传递函数：

$$
OUT[B]=GEN[B]\cup(IN[B]-KILL[B]).
$$

前向分析从 predecessor 汇合到 `IN`；后向分析从 successor 汇合到 `OUT`。may 问题常用并集，must 问题常用交集，但初值还必须对应格的 top/bottom，不能机械套用。

## 3. 到达定义：完整迭代例子

CFG：`B1→B2`，`B2→B3` 或 `B4`，`B3→B2` 形成循环。

```text
B1: d1: x := 0
B2: d2: y := x
B3: d3: x := x + 1
B4: return y
```

定义全集为 `{d1,d2,d3}`：

| 块 | GEN | KILL |
| --- | --- | --- |
| B1 | `{d1}` | `{d3}` |
| B2 | `{d2}` | `∅` |
| B3 | `{d3}` | `{d1}` |
| B4 | `∅` | `∅` |

到达定义是前向 may 分析：入口 `IN[B1]=∅`，其他集合从空集开始，汇合为 predecessor `OUT` 的并集。

| 轮次 | OUT[B1] | OUT[B2] | OUT[B3] | OUT[B4] |
| --- | --- | --- | --- | --- |
| 初始 | `∅` | `∅` | `∅` | `∅` |
| 1 | `{d1}` | `{d1,d2}` | `{d2,d3}` | `{d1,d2}` |
| 2 | `{d1}` | `{d1,d2,d3}` | `{d2,d3}` | `{d1,d2,d3}` |
| 3 | 不变 | 不变 | 不变 | 不变 |

第二轮中 `B3` 的定义沿 back edge 到达 `B2`，所以 `B2` 中读取的 `x` 可能来自 `d1` 或 `d3`。这说明仅按源码顺序取“最近定义”在循环中是错的。

## 4. Worklist 为什么终止

每当一个块的 `OUT` 变化，就把受影响的后继（前向）或前驱（后向）加入 worklist。对有限定义集合和单调传递函数，集合沿格的单调方向变化，最终达到不动点。处理顺序影响收敛速度，不影响同一方程系统的最小/最大不动点结果。

循环深度、reverse postorder 等可加速，不应改变语义。若 transfer function 非单调，普通 worklist 的收敛保证不再成立。

## 5. 活跃变量

变量在某点 **live**，表示存在一条从该点出发的路径，在被重新定义前会读取它。活跃性是后向 may 分析：

$$
IN[B]=USE[B]\cup(OUT[B]-DEF[B]),\qquad
OUT[B]=\bigcup_{S\in succ(B)}IN[S].
$$

它驱动 dead store elimination 和寄存器分配：同时活跃的值可能干涉，不能分配同一寄存器。live 与“当前值非零/有用”无关，只问未来是否可能被读。

## 6. 可用表达式

表达式 `a+b` 在某点 available，表示从入口到该点的**每条**路径都已计算它，且之后没有重定义 operand。因此它是前向 must 分析，通常以交集汇合：

$$
OUT[B]=GEN[B]\cup(IN[B]-KILL[B]),\qquad
IN[B]=\bigcap_{P\in pred(B)}OUT[P].
$$

除 entry 外常从“全集”初始化，再向下收缩。若从空集开始，会得到过于保守且可能不符合最大 fixed point 的结果。别名写、函数调用和 volatile/atomic 操作也可能 kill 内存表达式；没有 alias analysis 时不能假设它们无关。

## 7. 分析结果不是优化本身

reaching definitions 能支持 use-def chain、常量传播；liveness 支持 DCE 与 register allocation；available expressions 支持 CSE/PRE。真正删除或替换指令前还要检查副作用、trap、精确异常、浮点规则和内存模型。

SSA 借助 dominance 与 $\phi$ 节点让每个 value 只有一个定义，许多稀疏分析更直接；SPL TAC 不是 SSA，因此需要按变量定义与控制流推理。两者的进一步对照见[中间表示](../intermediate-representation.md)。

## 资料

- CS323 [Chapter 8](https://github.com/sitefan-coursework/CS323_Compilers/blob/f8ae1184dd9bc182be14edd4562724a3f1a8a4db/Lecture_Notes/Chapter8.pdf)
- CS323 [Review Guide](https://github.com/sitefan-coursework/CS323_Compilers/blob/f8ae1184dd9bc182be14edd4562724a3f1a8a4db/Lecture_Notes/Review_Guide.pdf)
- [LLVM Loop Terminology](https://llvm.org/docs/LoopTerminology.html)

