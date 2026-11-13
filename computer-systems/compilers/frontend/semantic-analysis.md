---
title: 语义分析：名字、作用域与类型
description: 符号表、名称解析、类型等价、结构体与语义错误。
order: 40
---

# 语义分析：名字、作用域与类型

`x + 1` 可以通过 parser，但只有在 `x` 已声明且支持加法时才有意义。语义分析把标识符绑定到声明，检查运算、调用、返回和复合对象访问，并为后续 IR 生成提供已解析类型和存储信息。

## 1. 符号表不是一个全局字典

符号条目通常包含名字、类别、类型、作用域、存储位置和源码位置。块作用域允许内层名字遮蔽外层名字，却不允许同一作用域重复定义。常见操作是：

```text
enter_scope()
declare(name, symbol)
lookup(name)          // 从内到外
lookup_current(name)  // 只检查当前层
leave_scope()
```

可用符号表栈，也可用“每个名字指向当前定义 + 每个 scope 记录新条目”的结构，使退出作用域时恢复被遮蔽定义。名字相同不代表同一对象；binding identity 应在解析后取代原始字符串比较。

## 2. 类型表示

类型树可以统一表达：

```text
Primitive(int)
Array(length=10, element=Primitive(float))
Struct(fields=[...])
Function(params=[...], return=...)
ErrorType
```

`ErrorType` 是错误恢复工具：上游已经报告一次错误后，让后续运算继续传播 error，避免对同一根因生成十几个诊断。它不应被误认为“任何类型都合法”。

类型大小属于 target/data-layout 语义。教学项目中 `int/float=4` 字节、`char=1` 字节是具体选择；通用编译器不能脱离 ABI 假定结构体无 padding、指针恒定大小或所有平台一致。

## 3. 类型等价

**名义等价**要求来自同一声明，例如两个同字段 struct 仍是不同名义类型；**结构等价**递归比较形状。数组是否把长度计入类型、函数是否包含返回类型与调用约定，也属于语言定义。

SPL 固定版本的 `checkStructEqual()` 递归比较 field types，体现结构等价；`checkArrayEqual()` 同时比较长度和元素类型；`checkFunctionEqual()` 比较函数名和参数，并未检查返回类型。后两者是这个实现的事实，不能提升为一般类型系统规则。

## 4. 表达式与语句规则

类型检查至少回答：

- 算术、逻辑和关系运算是否接受当前 operand；
- 赋值左侧是否为 lvalue，左右类型是否兼容；
- 数组索引是否为整数，基对象是否为数组；
- 字段是否存在，基对象是否为 struct；
- 调用对象是否为函数，实参与形参数量/类型是否匹配；
- return 是否匹配当前函数返回类型；
- 条件表达式是否满足语言规定。

隐式转换不是“编译器帮忙”。它必须由语言规则定义，并在 IR 中显式插入转换。SPL `type.c` 默认未启用其 `IMPLICIT_CONVERT` 宏，因此不能把 C 的全部 usual arithmetic conversions 套到该项目。

## 5. 一个小例子

```c
struct Pair { int x; float y; };
int f(int a) {
  struct Pair p;
  p.x = a;
  return p.y;   // 若无 float→int 隐式转换，应报错
}
```

分析过程是：注册 `Pair` 类型；进入 `f` scope 并绑定参数 `a:int`；绑定 `p:Pair`；解析 `p.x` 得到可写 `int` lvalue，与 `a` 匹配；解析 `p.y` 得到 `float`，与函数返回 `int` 不匹配。这个错误不能由 parser 判断，因为语法形式完全合法。

## 6. SPL Phase 2 的真实实现

- [`type.h/type.c`](https://github.com/sitefan-coursework/SPL_Compiler/blob/8513ac9ecfb5fd13c7a846534e777806d67398b3/Phase_2/src/type.c) 定义 primitive、array、structure、function 与 error type，并计算类型大小与等价；
- [`ortho.c`](https://github.com/sitefan-coursework/SPL_Compiler/blob/8513ac9ecfb5fd13c7a846534e777806d67398b3/Phase_2/src/ortho.c) 组合 hash lookup 和 scope stack：同名条目形成遮蔽链，退出 scope 时恢复旧 head；
- [`type_op.c`](https://github.com/sitefan-coursework/SPL_Compiler/blob/8513ac9ecfb5fd13c7a846534e777806d67398b3/Phase_2/src/type_op.c) 检查赋值 lvalue、调用参数、数组索引、struct field、重定义和 return type，并输出分类错误。

这套代码把类型对象指针附在树节点上，再由递归 traversal 传播。它适合解释教学语言的基本规则，不具备 C/C++ 的模板、重载、限定符、完整转换序列或复杂布局，笔记不把这些能力补写进去。

类型检查完成后，AST 已足够明确，可以进入[中间代码生成](../middle-end/intermediate-code-generation.md)。符号最终怎样分配到栈和寄存器，则由[运行时环境](../backend/runtime-environments.md)与[目标代码生成](../backend/code-generation.md)决定。

## 资料

- CS323 [Chapter 5](https://github.com/sitefan-coursework/CS323_Compilers/blob/f8ae1184dd9bc182be14edd4562724a3f1a8a4db/Lecture_Notes/Chapter5.pdf)
- CS323 [Labs 08–10](https://github.com/sitefan-coursework/CS323_Compilers/tree/f8ae1184dd9bc182be14edd4562724a3f1a8a4db/Lab_Notes)
- SPL [Phase 2 report](https://github.com/sitefan-coursework/SPL_Compiler/blob/8513ac9ecfb5fd13c7a846534e777806d67398b3/Phase_2/report/Phase2.pdf)

