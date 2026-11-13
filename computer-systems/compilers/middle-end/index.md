---
title: 编译器中端
description: 从 AST 降低到 IR，以 CFG 和数据流事实驱动合法优化。
order: 20
---

# 编译器中端

中端把语言相关结构降低为较稳定的 IR，并在不改变可观察语义的前提下改写程序。IR、分析和变换必须成套设计：优化 pass 不能使用尚未证明的数据流事实，也不能越过副作用、异常或别名边界。

1. [中间代码生成](./intermediate-code-generation.md)
2. [控制流图与数据流分析](./control-flow-and-data-flow.md)
3. [经典编译优化](./compiler-optimizations.md)

