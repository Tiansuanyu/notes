---
title: 源码案例
description: 用 SPL、Lichii 与 Hookshot 连接传统编译、模拟器、静态重编译、HLE 和图形翻译。
order: 60
---

# 源码案例

案例笔记负责回答“一个公开工程怎样组合通用原理”，不会替代 [基础原理](../foundations/)、[操作系统](../operating-systems/)、[编译器](../compilers/) 和 [图形与 GPU](../graphics-gpu/) 中的完整解释。

先读 [CS323 SPL 编译器](./cs323-spl-compiler/) 建立源码、AST、TAC 与 MIPS 的传统编译闭环，再比较输入已经是机器码时的 Lichii 与 Hookshot。SPL 案例使用仓库自带 factorial artifact，明确区分真实输出和手工压缩示意。

## 为什么并排阅读

| 维度 | [Lichii](./lichii/) | [Hookshot](./hookshot/) |
| --- | --- | --- |
| 工程定位 | 运行时模拟器 | 面向特定程序的静态重编译系统 |
| CPU 路径 | guest ARM 代码运行时 JIT | guest AArch64 代码构建期提升到 C，再由 host 工具链编译 |
| 系统边界 | kernel/service HLE | host runtime 重实现所需系统与 SDK 接口 |
| GPU 路径 | GPU 模拟与 shader recompiler | 记录/重放 NVN2 操作并映射到 Vulkan，转换 shader |
| 适用范围 | 尝试承载多种 guest 软件行为 | 针对选定程序和已覆盖行为生成 native 可执行程序 |

二者都要处理 guest CPU 语义、OS 接口和 GPU API，但把工作放在了不同阶段。这个对照能避免把“模拟器”“兼容层”“静态重编译”和“源码移植”混成一个概念。

## 统一的源码阅读问题

1. 输入是什么，哪些内容由仓库提供，哪些必须由使用者合法提供？
2. guest 状态保存在哪里，何时从一种表示转换到另一种表示？
3. 系统接口是逐条模拟、HLE，还是由 host runtime 替代？
4. CPU、GPU 和异步 worker 的所有权与同步点在哪里？
5. 文档中的设计、源码中的实现和当前兼容状态是否属于同一个 commit？
6. 哪些结论是通用原理，哪些只是当前工程的实现选择？

具体页面固定公开 commit，并链接文件或函数所在路径。时间相关的兼容状态只作为对应版本的观察，不写成永久能力声明。
