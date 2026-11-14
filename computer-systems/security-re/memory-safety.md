---
title: 内存安全：对象、边界与生命周期
description: 区分空间、时间、类型和并发安全，理解 C/C++、Rust、Wasm 与系统边界的真实保证。
order: 50
---

# 内存安全：对象、边界与生命周期

内存安全要求程序只能以允许的类型和生命周期访问属于它的对象。它不是“程序不崩溃”：越界读可能安静返回秘密，悬空写可能晚些时候破坏另一个对象，数据竞争可能只在特定调度下出现。

## 1. 四类常见问题

| 类别 | 典型表现 | 核心不变量 |
| --- | --- | --- |
| 空间安全 | 越界读写、整数溢出后的小分配、大 copy | 访问区间必须完整落在对象内 |
| 时间安全 | use-after-free、double free、悬空 view | 引用不能活得比对象更久 |
| 类型与初始化 | 错误 cast、未初始化值、对齐错误 | 字节的解释必须满足类型规则 |
| 并发安全 | data race、释放与使用交错 | 访问和生命周期要有同步关系 |

逻辑错误和拒绝服务不一定违反内存安全。例如解析器安全地分配了攻击者声明的十亿个节点，可能没有越界，却仍耗尽内存。

## 2. 为什么长度检查经常仍然失败

设输入总长为 \(N\)，要读取从 \(o\) 开始的 \(l\) 字节。数学条件是

\[
0 \le o \le N,\qquad 0 \le l \le N-o.
\]

直接检查 `o + l <= N` 可能先在固定宽度整数中溢出。更稳妥的实现用 checked addition 或先验证 `o <= N` 再比较 `l <= N - o`。同一长度还要在 allocation、copy 和 element count 换算中保持一致，避免“按字节验证、按元素使用”的单位错误。

## 3. C/C++ 的能力与责任

C/C++ 可以精确控制布局、MMIO、ABI 和零拷贝，但裸指针本身通常不携带长度、所有权和生命周期。安全性依赖接口契约、容器、RAII、span、严格转换和测试工具。编译器会假定程序没有未定义行为；一处 signed overflow、越界或 invalid lifetime 可能使优化后的表现偏离源码直觉。

Sanitizer 能在已执行路径上暴露部分问题，却不会检查未运行分支，也不能证明外部指针具有业务授权。

## 4. Rust 保证了什么，又没有保证什么

Rust 的所有权、借用和类型系统使 safe Rust 排除大量越界、悬空引用和无数据竞争的共享可变访问。slice 边界访问会返回 `Option` 或 panic，而不会静默读相邻对象。

边界仍然存在：

- `unsafe` 和 FFI 需要人工维护编译器无法检查的不变量；
- safe Rust 仍可能 panic、死锁、耗尽内存或产生错误解析结果；
- 整数、单位、协议状态和授权属于逻辑正确性；
- 第三方解析库与应用层的资源预算是两层责任。

因此“用 Rust 编写”是重要风险降低，不是漏洞不存在的证明。

## 5. Wasm 沙箱的作用

Wasm module 通常在受控线性内存中运行，越界线性内存访问会 trap；宿主通过 import/export 显式连接能力。这能减小原生内存破坏面，但不能阻止无限计算、过量分配、panic、语义错误或危险宿主接口。

以通用文件分析器为例，边界可分为：宿主提供文件字节 → module 解析结构 → 应用展开对象 → 序列化返回宿主。每一步都要限制输入、工作量与输出。Wasm 隔离主要约束“解析器出错后能触及什么”，不替代“解析是否正确和有界”。

## 6. Guest/Host 指针不是普通 cast

在模拟器或兼容层中，guest 地址属于 guest 的映射、权限和进程上下文。把数值转成 host pointer 之前，至少要验证范围、访问方向、跨页、映射状态和生命周期。详见 [Guest 虚拟内存](../operating-systems/virtual-memory.md)。

同理，设备调试协议中的地址字段位于外部输入和 MCU 内存之间；类型码与 payload 长度正确，只说明解释格式一致，不说明该地址允许读取或写入。更稳健的接口使用受限对象 ID 和设备侧权限表，而不是直接接受裸地址。

## 7. 防御不是单一工具

设计阶段用受限对象 ID、slice 和所有权表达不变量；实现阶段做 checked arithmetic、范围和状态验证；运行时用 ASan/UBSan/MSan 等工具；测试阶段用 corpus、property、fuzz 和差分；部署时再用进程/Wasm/权限隔离与资源预算。每层覆盖不同失效模式。

下一篇 [安全的二进制解析](./safe-binary-parsing.md) 把这些原则落到 header、长度、递归结构和协议状态机。

## 参考资料

- [Rust：Understanding Ownership](https://doc.rust-lang.org/book/ch04-00-understanding-ownership.html)
- [Rust Reference：Behavior considered undefined](https://doc.rust-lang.org/reference/behavior-considered-undefined.html)
- [Clang AddressSanitizer](https://clang.llvm.org/docs/AddressSanitizer.html)
