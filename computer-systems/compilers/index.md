---
title: 编译器与程序翻译
description: 从词法、语法和语义分析，到 IR、优化、运行时与目标代码生成。
order: 30
---

# 编译器与程序翻译

编译器不是一条“源码直接变机器码”的黑盒。前端回答程序写了什么，中端把语言细节降低为便于分析的表示，后端把表示放进具体机器的寄存器、栈帧和指令约束中。JIT、binary lifting、shader recompiler 和张量编译器都在复用这套分层思想，但输入语义和正确性边界并不相同。

```mermaid
flowchart LR
    S[源程序] --> L[词法分析]
    L --> P[语法分析]
    P --> A[AST]
    A --> M[语义分析]
    M --> I[中间表示]
    I --> D[数据流与优化]
    D --> C[目标代码生成]
    C --> O[对象文件 / 可执行程序]
```

## 推荐阅读路径

### 传统编译器基础

1. [词法分析](./frontend/lexical-analysis.md)：字符流怎样变成 token 流。
2. [语法分析](./frontend/syntax-analysis.md)：CFG、LL 与 LR 怎样恢复程序结构。
3. [语法制导翻译](./frontend/syntax-directed-translation.md)：属性和动作怎样把语法树连接到后续阶段。
4. [语义分析与类型系统](./frontend/semantic-analysis.md)：名字、作用域和类型规则怎样排除“语法正确但没有意义”的程序。
5. [中间代码生成](./middle-end/intermediate-code-generation.md)：AST 怎样降低成三地址码。
6. [控制流图与数据流分析](./middle-end/control-flow-and-data-flow.md)：优化所需的程序事实怎样通过不动点求解。
7. [经典编译优化](./middle-end/compiler-optimizations.md)：哪些等价变换能安全减少工作。
8. [运行时环境](./backend/runtime-environments.md)：调用、栈帧、堆和存储期怎样支撑生成代码。
9. [目标代码生成](./backend/code-generation.md)：指令选择、寄存器分配与 spill 怎样落到 MIPS32。
10. [SPL 编译器连续案例](../case-studies/cs323-spl-compiler/)：沿一个递归程序贯穿 Flex、Bison、类型、TAC 与 MIPS。

### 从基础走向现代系统

11. [中间表示为何是翻译系统的核心](./intermediate-representation.md)：比较 TAC、LLVM IR、Dynarmic IR 与 shader IR。
12. [从 Clang 到链接器：编译流水线](./compilation-pipeline.md)：对象文件、汇编器和链接器如何闭合程序。
13. [JIT 与 AOT](./jit-and-aot.md)：翻译时机与代码缓存的系统取舍。
14. [Binary Lifting](./binary-lifting.md)：输入已经是机器码时，怎样恢复控制流和语义。
15. [Shader Recompiler](./shader-recompilation.md)：从 GPU ISA、Shader IR 到 SPIR-V。

这个顺序特意先建立传统编译器的语义链，再进入 Lichii、Hookshot 和 GPU 翻译案例。这样不会把“都有 IR”误解成“可以使用同一种 IR 或同一组优化”。

## 课程与实现覆盖矩阵

本组传统基础以 SUSTech CS323 课程仓库固定版本 [`f8ae118`](https://github.com/sitefan-coursework/CS323_Compilers/tree/f8ae1184dd9bc182be14edd4562724a3f1a8a4db) 和 SPL Compiler 固定版本 [`8513ac9`](https://github.com/sitefan-coursework/SPL_Compiler/tree/8513ac9ecfb5fd13c7a846534e777806d67398b3) 为主线。课程讲“为什么”，SPL 代码说明一个教学编译器“具体做了什么”；二者不能相互替代。

| 阶段 | 课程材料 | SPL 对应实现 | 笔记入口 |
| --- | --- | --- | --- |
| 扫描 | Chapter 2-1/2、Labs 2–3 | Phase 1 `lex.l` | [词法分析](./frontend/lexical-analysis.md) |
| 解析 | Chapter 3、Labs 4–6 | Phase 1 `syntax.y`、`treeNode` | [语法分析](./frontend/syntax-analysis.md) |
| 属性与树 | Chapter 4 | Bison 动作与后续树遍历 | [语法制导翻译](./frontend/syntax-directed-translation.md) |
| 名字与类型 | Chapter 5、Labs 8–10 | Phase 2 `ortho.c`、`type.c`、`type_op.c` | [语义分析](./frontend/semantic-analysis.md) |
| TAC | Chapter 5、Lab 11 | Phase 3 `IRgen.c` | [中间代码生成](./middle-end/intermediate-code-generation.md) |
| 优化基础 | Chapters 7–8 | Phase 3 `optimizer.c` 的有限实现 | [数据流](./middle-end/control-flow-and-data-flow.md)、[优化](./middle-end/compiler-optimizations.md) |
| 运行时与后端 | Chapters 6–7、Labs 13–14 | Phase 4 `tac.c`、`mips32.c` | [运行时](./backend/runtime-environments.md)、[代码生成](./backend/code-generation.md) |

所有课程 Lecture、Lab、Assignment、Review 与四阶段项目报告均已纳入资料核对。作业解答只用于检查概念边界，这里不复制作业答案。

## 与 AI / GPU 编译的衔接

传统编译器的 CFG、支配关系、活跃性和寄存器压力仍是 LLVM、MLIR、TVM、Triton 与 TileLang 的底层语言；现代张量编译器又增加了 shape、layout、并行层级、存储空间和硬件映射。可以类比：

- AST 到 TAC，对应逐步 lowering，而不是“一步翻译”；
- 循环变换会影响缓存局部性，也会改变 GPU occupancy 与寄存器压力；
- 一个 pass 合法，不代表在所有 target 上有收益；
- 3D Gaussian rasterizer 的 Native19 融合是一个具体 kernel 变换，必须结合[寄存器压力与实测](../graphics-gpu/gpu-kernel-optimization.md)，不能只用“少一个算子”证明更快。

AI Infra 的[模型导出、异构推理与性能测量](../../ai-infra/模型导出、异构推理与性能测量.md)面对的是计算图与算子语义；这里面对的是语言与机器语义。两条链共享编译思想，但输入契约不同。

## 主要资料入口

- [CS323 Compilers 课程仓库（固定 commit）](https://github.com/sitefan-coursework/CS323_Compilers/tree/f8ae1184dd9bc182be14edd4562724a3f1a8a4db)
- [SPL Compiler（固定 commit）](https://github.com/sitefan-coursework/SPL_Compiler/tree/8513ac9ecfb5fd13c7a846534e777806d67398b3)
- [GNU Bison Manual](https://www.gnu.org/software/bison/manual/)
- [Flex Manual](https://westes.github.io/flex/manual/)
- [LLVM Language Reference](https://llvm.org/docs/LangRef.html)
- [LLVM Code Generator](https://llvm.org/docs/CodeGenerator.html)
