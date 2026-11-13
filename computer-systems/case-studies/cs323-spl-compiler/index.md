---
title: CS323 SPL 编译器
description: 以仓库自带 factorial 样例贯穿 Flex、Bison、语义、TAC、优化与 MIPS32。
order: 30
---

# CS323 SPL 编译器：一条连续翻译链

这个案例使用 SPL Compiler 固定版本 [`8513ac9`](https://github.com/sitefan-coursework/SPL_Compiler/tree/8513ac9ecfb5fd13c7a846534e777806d67398b3) 的仓库自带 [`test_4_fact.spl`](https://github.com/sitefan-coursework/SPL_Compiler/blob/8513ac9ecfb5fd13c7a846534e777806d67398b3/Phase_4/sample/test_4_fact.spl)、[IR](https://github.com/sitefan-coursework/SPL_Compiler/blob/8513ac9ecfb5fd13c7a846534e777806d67398b3/Phase_4/sample/test_4_fact.ir) 与 [MIPS 输出](https://github.com/sitefan-coursework/SPL_Compiler/blob/8513ac9ecfb5fd13c7a846534e777806d67398b3/Phase_4/sample/test_4_fact.s)。源、IR 和汇编是仓库真实 artifact；为压缩展示而写的 token/AST 片段会明确标成**手工抽象**，不冒充工具原样输出。

## 1. 输入：递归阶乘

```c
int fact(int n)
{
  if (n == 1)
    return n;
  else
    return (n * fact(n-1));
}

int main()
{
  int m, result;
  m = read();
  if (m > 1)
    result = fact(m);
  else
    result = 1;
  write(result);
  return 0;
}
```

它覆盖函数/参数、递归调用、条件分支、局部变量和 I/O，足以观察完整 pipeline，又没有数组与结构体掩盖主线。

## 2. Flex：字符变 token

以下是按 [`lex.l`](https://github.com/sitefan-coursework/SPL_Compiler/blob/8513ac9ecfb5fd13c7a846534e777806d67398b3/Phase_4/src/frontend/lex.l) 规则写出的**手工抽象 token 前缀**：

```text
TYPE("int") ID("fact") LP TYPE("int") ID("n") RP LC
IF LP ID("n") RELOP("==") INT(1) RP RETURN ID("n") SEMI ...
```

Flex 最长匹配标识符/整数/运算符，关键字规则先于 ID。每个 token action 创建 `treeNode` 并经 `yylval` 交给 Bison；非法词素在 scanner 阶段报告 Type A 错误。

## 3. Bison：token 变语法树

[`syntax.y`](https://github.com/sitefan-coursework/SPL_Compiler/blob/8513ac9ecfb5fd13c7a846534e777806d67398b3/Phase_4/src/frontend/syntax.y) 按 `FunDec/CompSt/Stmt/Exp/Args` 等产生式规约，并用 action 连接节点。下面是为了说明语义而压缩的**手工 AST 抽象**，不是项目打印的 concrete tree：

```text
Function fact(n:int) -> int
└─ If Eq(Name(n), Int(1))
   ├─ Return Name(n)
   └─ Return Mul(Name(n), Call(fact, Sub(Name(n), Int(1))))
```

真实 `treeNode` 使用 `child` 指向首个孩子、`next` 串联兄弟，并保留许多 grammar 节点。运算符 precedence 与 dangling-else 在 Bison 声明中处理，syntax error productions 输出 Type B 错误。

## 4. 语义：名字和类型闭合

Phase 2 风格的 traversal 建立全局 `fact/main` 函数条目；进入 `fact` scope 后绑定参数 `n:int`。检查点包括：

- `n == 1` 两侧都是 `int`；
- `n-1` 与乘法 operand 匹配；
- `fact(n-1)` 的参数与返回值都是 `int`；
- 两条 `return` 与 `fact:int` 一致；
- `read/write` 按项目预置接口参与检查。

作用域表和类型对象的真实实现见 `ortho.c/type.c/type_op.c`，详解在[语义分析](../../compilers/frontend/semantic-analysis.md)。这里没有额外推断项目支持隐式转换、重载或完整 C 类型系统。

## 5. IR：真实仓库输出

仓库自带 IR 的 `fact` 部分为：

```text
FUNCTION fact :
PARAM v1
IF v1 == #1 GOTO label1
GOTO label2
LABEL label1 :
RETURN v1
LABEL label2 :
t1 := v1 - #1
ARG t1
t2 := CALL fact
t3 := v1 * t2
RETURN t3
```

`v1` 是参数的抽象变量，`t1–t3` 是临时值，label 把 `if/else` 变成显式控制流。递归本身没有特殊 IR opcode：普通 `ARG/CALL/RETURN` 已足够表达，独立 activation 由后端调用链保障。

`main` 的真实 IR 还包括 `READ t4`、条件分支、`ARG v2`、`CALL fact`、`WRITE v3`。源码到 IR 的完整机制见[中间代码生成](../../compilers/middle-end/intermediate-code-generation.md)。

## 6. 优化：事实和边界

Phase 3/4 pipeline 的 optimizer 可以折叠常量与部分临时 copy、删除部分无用临时赋值和冗余跳转/label。这个 factorial IR 已经相当紧凑，但不能据此声称项目执行了全局 CSE、PRE、LICM 或 SSA 优化；固定版本源码没有实现这样的通用分析框架。

优化前后若 label 编号变化，不是语义变化。真正要比较的是控制流、返回值、I/O 和异常等可观察行为。详见[经典编译优化](../../compilers/middle-end/compiler-optimizations.md)。

## 7. MIPS32：真实仓库输出怎样对应 IR

仓库输出中，递归分支的核心为：

```asm
fact:
    li $t4, 1
    beq $a0, $t4, label1
    j label2
label1:
    move $v0, $a0
    jr $ra
label2:
    addi $sp, $sp, -8
    sw $a0, ($sp)
    sw $ra, 4($sp)
    sub $a0, $a0, 1
    jal fact
    lw $a0, ($sp)
    lw $ra, 4($sp)
    addi $sp, $sp, 8
    mul $v0, $v0, $a0
    jr $ra
```

对应关系：

| TAC 语义 | MIPS 输出中的责任 |
| --- | --- |
| `PARAM v1` | 以 `$a0` 接收 `n` |
| `IF v1 == #1` | `li` 加 `beq` |
| `ARG t1; CALL fact` | 把 `n-1` 放入 `$a0`，`jal fact` |
| 递归调用仍需旧 `n` | 调用前保存 `$a0`，返回后恢复 |
| 调用后仍要 return 给 caller | 保存/恢复 `$ra` |
| `RETURN` | 结果放 `$v0`，`jr $ra` |

这段清楚展示了 IR value、调用约定与 activation record 的连接。它不证明后端的通用寄存器 allocator 在所有压力场景都正确；[代码生成](../../compilers/backend/code-generation.md)已记录当前 `spill_register()` 的实现限制。

## 8. 四阶段职责闭环

```mermaid
flowchart LR
    S[SPL 源码] --> F[Flex / lex.l]
    F --> T[Token + treeNode]
    T --> B[Bison / syntax.y]
    B --> C[Syntax tree]
    C --> Y[Scope + type checking]
    Y --> I[IRgen / TAC]
    I --> O[有限 TAC 优化]
    O --> M[TAC parser + MIPS emitter]
    M --> A[MIPS32 汇编]
```

每一层只承诺自己的契约：scanner 不检查函数参数，parser 不决定栈槽，类型检查不选择寄存器，MIPS emitter 不应重新猜源码优先级。这种边界比具体工具名称更值得迁移到 LLVM、JIT、张量编译与 shader recompiler。

## 9. 继续阅读

- 从理论顺序复习：[编译器与程序翻译](../../compilers/)
- 同样面对 target ISA、但在运行时生成代码：[Lichii](../lichii/)
- 输入已经是 guest AArch64，并先提升到 C：[Hookshot](../hookshot/)
- GPU ISA 到 Shader IR/SPIR-V：[Shader Recompiler](../../compilers/shader-recompilation.md)

## 资料边界

课程材料固定在 CS323 commit [`f8ae118`](https://github.com/sitefan-coursework/CS323_Compilers/tree/f8ae1184dd9bc182be14edd4562724a3f1a8a4db)，实现固定在 SPL commit [`8513ac9`](https://github.com/sitefan-coursework/SPL_Compiler/tree/8513ac9ecfb5fd13c7a846534e777806d67398b3)。本文没有把课程作业解答复制为笔记，也没有把未在源码中确认的能力补写为项目事实。

