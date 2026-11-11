---
title: 编译器与程序翻译
description: 从编译流水线和 IR，走向 JIT、AOT、binary lifting 与 shader 重编译。
order: 30
---

# 编译器与程序翻译

传统编译器把源语言降低到目标 ISA；模拟器和静态重编译器面对的输入却常常已经是机器码。它们仍需完成“恢复语义、转换表示、优化、生成目标代码”，只是信息更少，控制流和系统边界也更难还原。

```mermaid
flowchart TB
    S[源代码] --> FE[前端]
    FE --> IR[编译器 IR]
    G[Guest 机器码] --> D[解码与控制流恢复]
    D --> LIR[提升后的 IR / C]
    IR --> O[优化]
    LIR --> O
    O --> B[目标后端]
    B --> H[Host 机器码]
    SH[Guest Shader] --> SIR[Shader IR]
    SIR --> SPV[SPIR-V / Host Shader]
```

## 计划内容

| 稳定文件名 | 要建立的认识 | 对应案例 |
| --- | --- | --- |
| `compilation-pipeline.md` | 前端、优化器、后端、汇编器和链接器如何分工 | 先建立普通编译基线 |
| `intermediate-representation.md` | IR 为什么需要多层，SSA、控制流图和数据流分析做什么 | Dynarmic IR、提升到 C、shader IR |
| `jit-and-aot.md` | 翻译时机、缓存、启动成本、优化空间和代码失效如何权衡 | Lichii 的运行时 JIT 与 Hookshot 的构建期 AOT |
| `binary-lifting.md` | 怎样从机器码恢复指令语义、基本块、函数和重定位 | Hookshot 的 AArch64 到 C 路径 |
| `shader-recompilation.md` | Shader 指令与资源语义如何映射到 host 图形 API | 两个案例的 shader 翻译 |

## 三种容易混淆的路径

| 路径 | 输入 | 翻译发生时机 | 主要难点 |
| --- | --- | --- | --- |
| 普通 AOT 编译 | 源代码 | 构建期 | 保留语言语义并面向目标机优化 |
| JIT / 动态二进制翻译 | IR、字节码或 guest 机器码 | 运行期 | 启动成本、缓存、间接跳转、自修改代码与精确状态 |
| 静态二进制提升 | guest 可执行文件 | 构建期 | 函数边界、控制流、重定位、动态行为和系统接口 |

“先转成 C”并不会自动解决二进制提升问题：生成的 C 只是中间载体，guest 寄存器、内存和控制流的语义仍须显式保存。相反，JIT 也不天然比 AOT 更快；它用运行时信息换取额外编译和缓存成本。

AI Infra 中的 [模型导出、异构推理与性能测量](../../ai-infra/模型导出、异构推理与性能测量.md) 也会经过计算图、转换和 lowering，但输入语义、允许的变换与目标运行时不同。可以类比编译思想，不能把两者当成同一套编译器。
