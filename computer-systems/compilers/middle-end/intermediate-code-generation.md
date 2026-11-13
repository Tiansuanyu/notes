---
title: 中间代码生成：从 AST 到三地址码
description: TAC、临时变量、控制流、短路求值、回填与复合对象地址。
order: 10
---

# 中间代码生成：从 AST 到三地址码

AST 保留源语言结构，却不适合直接做所有机器无关分析；目标机器指令又过早绑定寄存器和 ABI。中间表示（IR）在二者之间提供稳定契约。三地址码（TAC）把复杂表达式拆成每条至多一个主要运算的线性指令。

## 1. TAC、四元式与三元式

表达式 `x = a + b * c` 可写为：

```text
t1 := b * c
t2 := a + t1
x  := t2
```

四元式把每条指令存为 `(op,arg1,arg2,result)`，引用结果靠名字；三元式用“产生它的指令位置”引用结果，移动指令时更麻烦；间接三元式再加一层指针表。SPL 文本 IR 使用 `t1/v1/label1` 等名字，语义接近四元式。

临时变量不是物理寄存器。它只是 IR value 的名字，后端可能把它放进寄存器、栈槽，或优化掉。

## 2. 一个完整的 Source → AST → TAC 例子

源程序：

```c
int main() {
  int x;
  x = 3 * 5 + 2;
  if (x < 20 && x != 0)
    x = x + 1;
  return x;
}
```

省略声明节点后的 AST：

```text
Function main
├─ Assign x, Add(Mul(3, 5), 2)
├─ If And(Lt(x, 20), Ne(x, 0))
│  └─ Assign x, Add(x, 1)
└─ Return x
```

一种未优化 TAC 为：

```text
FUNCTION main :
t1 := #3 * #5
t2 := t1 + #2
v1 := t2
IF v1 < #20 GOTO label_and_rhs
GOTO label_end
LABEL label_and_rhs :
IF v1 != #0 GOTO label_then
GOTO label_end
LABEL label_then :
t3 := v1 + #1
v1 := t3
LABEL label_end :
RETURN v1
```

这里 `&&` 没有先生成布尔临时量再相乘，而是用控制流保持短路语义：左侧为假时不得求右侧。优化器之后可以把 `t1/t2` 折叠为 `#17`，但生成阶段先保证语义清晰。

## 3. 表达式翻译的属性

经典写法让表达式返回 `place`（结果存在哪里）与 `code`。对 `E→E1+E2`：

```text
E.place = newtemp()
E.code  = E1.code || E2.code || emit(E.place := E1.place + E2.place)
```

真实编译器可以流式发射而不拼接字符串，但依赖关系相同。常量和变量无需新临时；函数调用还要先确定参数求值顺序、调用约定和副作用。

## 4. 布尔控制流与回填

对尚不知道目标 label 的跳转，可记录 `truelist/falselist/nextlist`。当外层结构创建目标 label 后，用 backpatch 一次填入。例如 `B1 && B2` 把 `B1.truelist` 回填到 `B2` 开始处，整体 false list 合并两侧失败出口。

这比先把每个布尔值物化成 `0/1` 更贴合 `if/while`，也保留短路求值。只有布尔值确实被赋值或传参时，才需要在 true/false 路径分别写入 `1/0` 并汇合。

## 5. 数组与结构体：先求地址

设数组 `a` 元素宽度为 $w$，一维下标地址为

$$
\operatorname{addr}(a[i])=\operatorname{base}(a)+i\,w.
$$

多维 row-major 数组需按各维 stride 累积偏移；结构体字段用布局给出的 field offset。TAC 常区分 `&x`、`*p` 与普通值：

```text
t1 := i * #4
t2 := &a + t1
*t2 := x
```

类型系统必须先提供元素大小和字段布局；目标 ABI 又可能加入 alignment/padding。不能仅按源码字段大小手算所有平台地址。

## 6. 函数与控制语句

常见 TAC 指令包括 `FUNCTION`、`PARAM`、`ARG`、`CALL`、`RETURN`、`LABEL`、`GOTO`、条件跳转和 `DEC`。这些仍未决定参数具体用 `$a0` 还是栈传递；它们表达的是抽象调用与存储需求，后端再落实 ABI。

循环还需管理 `break/continue` 目标；递归不需要 IR 特判，但运行时必须为每次调用建立独立 activation record。

## 7. SPL Phase 3 的实现边界

[`IRgen.c`](https://github.com/sitefan-coursework/SPL_Compiler/blob/8513ac9ecfb5fd13c7a846534e777806d67398b3/Phase_3/src/IRgen.c) 递归匹配语法树节点，分配 `t/v/label` 名字，为声明、赋值、语句、参数、调用、普通表达式、条件表达式和引用生成 IR tree，再线性输出。`IRortho.c` 维护源码名字到 IR 变量名的作用域映射。

它输出的 TAC 是教学语言与项目后端之间的具体协议，不是 LLVM IR，也不是 SSA。理解更广泛的 IR 设计可继续读[中间表示为何是翻译系统的核心](../intermediate-representation.md)。

生成 TAC 后，要先划分[基本块与 CFG](./control-flow-and-data-flow.md)，才能系统判断某个值在哪些路径上可用。

## 资料

- CS323 [Chapter 5](https://github.com/sitefan-coursework/CS323_Compilers/blob/f8ae1184dd9bc182be14edd4562724a3f1a8a4db/Lecture_Notes/Chapter5.pdf)
- CS323 [Lab 11](https://github.com/sitefan-coursework/CS323_Compilers/blob/f8ae1184dd9bc182be14edd4562724a3f1a8a4db/Lab_Notes/Lab11.pdf)
- SPL [Phase 3 report](https://github.com/sitefan-coursework/SPL_Compiler/blob/8513ac9ecfb5fd13c7a846534e777806d67398b3/Phase_3/report/Phase3.pdf)

