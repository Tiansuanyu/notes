---
title: 编译器后端
description: 运行时存储、调用约定、指令选择和寄存器分配。
order: 30
---

# 编译器后端

后端把 IR 的抽象操作落实到 target ISA 与 ABI。目标指令不是孤立映射：参数传递、栈帧、寄存器保存责任、地址模式和 spill 必须共同满足调用与运行时契约。

1. [运行时环境](./runtime-environments.md)
2. [目标代码生成](./code-generation.md)

