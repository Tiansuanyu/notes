---
title: 运行时环境：存储、调用与栈帧
description: 静态区、栈、堆、activation record、调用约定与动态内存。
order: 10
---

# 运行时环境：存储、调用与栈帧

编译器生成的不只是算术指令，还要让变量在正确时刻存在、递归调用互不覆盖、参数与返回值跨函数传递。运行时环境是语言语义、ABI 与操作系统资源之间的契约。

## 1. 三类典型存储区

| 区域 | 典型对象 | 生命周期与特点 |
| --- | --- | --- |
| 静态区 | 全局变量、静态常量 | 程序装载到退出，地址通常可由 linker/loader 安排 |
| 栈 | activation record、局部量、保存寄存器 | 随调用严格嵌套增长/回收，分配快 |
| 堆 | 动态对象、逃逸对象 | 生命周期不服从调用嵌套，由 allocator/GC 管理 |

真实进程还有代码、只读数据、TLS、映射文件等区域。上表是语言实现模型，不是固定虚拟地址布局；具体地址见[虚拟内存](../../operating-systems/virtual-memory.md)。

## 2. Activation tree 与调用栈

一次函数调用对应一次 activation。同一函数递归调用多次，会有多个独立 activation。若调用严格嵌套，当前活跃 activation 构成从根到当前节点的路径，因此适合压栈。

activation record（栈帧）可能包含：

- 返回地址、旧 frame pointer；
- 传入参数与返回值空间；
- local variables 与 compiler temporaries；
- caller/callee-saved registers；
- variable-length object、alignment 与异常展开信息；
- static/dynamic link。

并非每项都必须实际占一个栈槽。优化后局部量可能只在寄存器中，frame pointer 可省略，小函数可 inline，leaf function 可能无需保存返回地址。

## 3. 调用约定

calling convention 规定参数/返回值放在哪些寄存器或栈位置，哪些寄存器由 caller/callee 保存，栈对齐与可变参数如何处理。它使分别编译的函数能够互调，也是 ABI 的一部分。

概念流程：caller 放置参数并保存必要 caller-saved 值；call 写入返回地址并转移；callee 建帧并保存必要 callee-saved 值；return 恢复现场并把结果放到约定位置。

“前四个整数参数用某四个寄存器”只是某个 ABI/项目约定，不能当作所有 MIPS、ARM64 或 x86-64 的通则。ABI 还约束对象格式、数据布局、符号和链接边界；当前基础入口见[程序如何运行](../../foundations/how-programs-run.md)，本篇只展开调用所需部分。

## 4. Dynamic link 与 static link

dynamic link 指向调用者 activation，帮助恢复上一栈帧；lexically nested language 还可用 static link 指向词法外层 activation，以访问 non-local variable。两者服务不同关系：调用结构与词法嵌套不一定相同。

display 是另一种快速访问各词法层的方法。C 风格 SPL 没有嵌套函数，因此其教学后端无需实现一般 static chain。

## 5. 堆分配与回收

allocator 从空闲块中选择空间，并处理 splitting、coalescing、alignment 与 metadata。外部碎片是空闲空间分散，内部碎片是已分配块中未被请求使用的空间。分配策略会影响 locality 和延迟。

GC 还需决定 reachability、root、移动对象时的引用更新，以及 stop-the-world/并发边界。CS323 Chapter 6 主要建立栈/堆和分配基础；本笔记不从有限课程内容推断 SPL 实现了 tracing GC。SPL 的 C 实现本身使用 host `malloc` 管理编译器对象，和“被编译 SPL 程序具有 GC”是两回事。

## 6. 逃逸与闭包

若局部对象的引用在函数返回后仍可访问，它不能简单留在即将弹出的栈帧。编译器可把对象提升到堆，或用 closure environment 保存捕获变量。逃逸分析是优化与正确性共同约束，不是“堆一定慢所以尽量不用”的口号。

## 7. SPL Phase 4 的实际调用链

SPL 的 Phase 4 后端读取 TAC，把 `PARAM/ARG/CALL/RETURN` 映射到 MIPS32 风格代码。仓库自带 factorial 输出显示：参数 `n` 进入 `$a0`，结果经 `$v0` 返回；递归调用前在栈上保存 `$a0/$ra`，返回后恢复。

这是该样例与实现的具体行为。源码中的 [`mips32.c`](https://github.com/sitefan-coursework/SPL_Compiler/blob/8513ac9ecfb5fd13c7a846534e777806d67398b3/Phase_4/src/backend/mips32.c) 还为超过寄存器参数容量的 operand 准备栈路径。它是教学后端，不应据此宣称完整遵循某一正式 MIPS ABI 的全部细节。

沿真实 factorial 追踪调用帧见[SPL 编译器连续案例](../../case-studies/cs323-spl-compiler/)，寄存器与指令选择进入下一篇[目标代码生成](./code-generation.md)。

## 资料

- CS323 [Chapter 6](https://github.com/sitefan-coursework/CS323_Compilers/blob/f8ae1184dd9bc182be14edd4562724a3f1a8a4db/Lecture_Notes/Chapter6.pdf)
- SPL [Phase 4 report](https://github.com/sitefan-coursework/SPL_Compiler/blob/8513ac9ecfb5fd13c7a846534e777806d67398b3/Phase_4/report/Phase4.pdf)
