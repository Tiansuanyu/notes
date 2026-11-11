---
title: 基础原理
description: 从程序生命周期、数据表示、ISA、ABI 到内存层次的计算机系统起点。
order: 10
---

# 基础原理

这一组先把“源码、二进制、进程、CPU”串成同一条因果链。只有这条链稳固，后面的 JIT、HLE、binary lifting 和 GPU 同步才不会变成名词堆积。

## 已有入口

- [程序如何真正运行](./how-programs-run.md)：从源码走到可执行文件、进程、指令和系统调用。

## 后续文章规划

| 稳定文件名 | 主要回答的问题 | 与相邻主题的衔接 |
| --- | --- | --- |
| `binary-representation.md` | 整数、浮点、字节序、对齐和位操作如何映射到存储？ | 为数值精度、量化和二进制格式建立基础 |
| `isa-and-assembly.md` | ISA 定义了什么，x86-64/AArch64/RISC-V 的差异应如何观察？ | 为 JIT、binary lifting 与向量指令建立基础 |
| `abi-and-calling-conventions.md` | 参数、返回值、寄存器、栈和符号如何让模块互操作？ | 为 Hookshot 的 lifted C 与 host runtime 打基础 |
| `memory-hierarchy.md` | 寄存器、cache、DRAM、页与存储对性能有何不同影响？ | 连接数据布局、虚拟内存与 GPU 内存 |

## 学习方法

每篇都应有一个可重复的小实验：保留源码、编译命令、编译器版本、二进制和观测结果。先用 `readelf`/`objdump`/`gdb`/`perf` 回答局部问题，再去对照大型仓库；不由一次反汇编就推断所有架构和编译器。

神经网络中的张量布局与精度问题已在 [AI Infra](../../ai-infra/) 主讲；本组只补它们依赖的通用计算机表示和执行模型。
