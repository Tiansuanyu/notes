---
title: 安全的二进制解析
description: 用有界读取、checked arithmetic、语义校验和资源预算构造可审计的文件与协议解析器。
order: 60
---

# 安全的二进制解析

二进制解析器把攻击者可控的字节转换为长度、地址、类型、对象和后续操作。它的安全目标不是“能打开正常样本”，而是：**任意输入都只能产生有界结果、明确错误或受控拒绝。**

## 1. 解析分成四层

1. **字节安全**：读取不越界，整数运算不溢出，endian 和宽度明确。
2. **结构一致**：magic、version、count、offset、索引和区间关系合法。
3. **语义有效**：命令、类型、状态转换和对象引用符合协议。
4. **权限与资源**：操作被授权，分配、递归、CPU 和输出规模受限。

通过前一层不代表后一层成立。一个校验和正确、长度合法的“写变量”帧仍可能请求未授权地址。

## 2. 让 cursor 成为唯一读入口

解析器应把剩余 slice、当前位置和字节序封装起来，所有整数读取和切片都经过同一套 checked API。避免在各 handler 中复制 `base + offset` 指针运算。

```rust
fn range(input: &[u8], offset: usize, size: usize) -> Result<&[u8], Error> {
    let end = offset.checked_add(size).ok_or(Error::Overflow)?;
    input.get(offset..end).ok_or(Error::Truncated)
}
```

这段模式只解决区间安全；调用者仍需验证 `size` 的协议上限和该区间代表什么。

## 3. 长度、数量和放大因子

风险通常出现在多次换算：`count * entry_size`、解压后大小、递归节点、数组类型展开、字符串解码和序列化输出。每层都要有独立上限：

\[
\text{work} \le B_{\text{nodes}} + B_{\text{bytes}} + B_{\text{output}} + B_{\text{time}}.
\]

深度限制只约束最长路径，不约束树的宽度；输入大小限制也不总能限制解压或展开后的输出。资源预算要对应真正消耗的对象。

例如，DIE 类型图的递归深度上限是一条防线，但它不自动约束总 DIE、数组元素与序列化结果。解析器需要分别定义这些预算，并用超深与超宽输入验证失败路径。

## 4. 区间、索引和重叠

文件格式往往允许多个表相互引用。验证顺序应是：

- 先确定 table 自身区间；
- 再验证每个 index 小于对应 table count；
- 对相对偏移明确基准对象；
- 对区间重叠给出格式特定策略；
- 对 alignment 做数值检查，不通过未对齐 host pointer 强制解引用；
- 禁止解析结果引用临时 buffer 或已释放映射。

重复引用和环还要求 visited set 或显式 worklist，否则“格式合法”也可能让递归不终止。

## 5. 协议解析器要建模状态

流式协议通常以帧头、命令、长度、payload、校验字段和帧尾识别消息，并用状态机处理分片与噪声。解析器既要限制 payload，也要明确遇到非法长度或校验失败时丢弃多少字节、从哪里重新同步。

但协议状态还包括“当前是否允许监控”“变量是否已注册”“写命令是否被授权”。这些不能只靠语法状态机表达。更安全的资源模型是：

```text
wire variable_id -> registry lookup -> {address, type, read/write policy}
```

而不是 `wire address -> cast -> dereference`。前者把可表达能力限制在预注册集合中。

## 6. 错误处理也属于接口

- 错误要区分 truncated、overflow、unsupported、resource limit 和 unauthorized；
- 不在错误消息中泄漏敏感地址或密钥；
- 避免解析一半后留下部分副作用；
- 对流式协议明确丢弃多少字节、何时重新同步；
- 库 API 不应把任意输入错误升级为整个宿主进程终止，除非隔离层明确接受该策略。

## 7. 从源码审计到验证

审计时记录“输入字段 → 变换 → 检查 → 使用点”，再为边界值、截断、溢出、未知 tag、超宽/超深结构、重复区间和状态错误建立 corpus。使用 [Fuzzing 与 Sanitizer](./fuzzing-and-sanitizers.md) 检查实现；用独立 parser 做差分时，先确认两者目标版本和容错策略相同。

## 规范与验证入口

- [System V ABI：Object Files](https://refspecs.linuxfoundation.org/elf/gabi4%2B/ch4.intro.html)
- [DWARF Version 5 Standard](https://dwarfstd.org/dwarf5std.html)
- [LLVM libFuzzer](https://llvm.org/docs/LibFuzzer.html)
