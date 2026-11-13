---
title: 语法分析：从 CFG 到 LL 与 LR
description: 推导、歧义、FIRST/FOLLOW、预测分析和 LR 项目集。
order: 20
---

# 语法分析：从 CFG 到 LL 与 LR

词法分析只知道 token 类别；语法分析要判断 token 序列能否由语言的上下文无关文法（CFG）生成，并恢复表达式、语句和声明的层次结构。

## 1. CFG、推导、语法树与 AST

CFG $G=(V,T,P,S)$ 包含非终结符、终结符、产生式和开始符号。产生式 `E → E + T | T` 表示一个表达式可由更小表达式和项组成。

**左推导/右推导**规定每步替换最左/最右非终结符；**parse tree** 保留产生式的全部结构；**AST** 删掉括号、分号和只为文法服务的中间节点，只保留语义结构。例如 `a + b * c` 的 AST 根是 `+`，右子树是 `*`，这正是优先级的结构化结果。

若同一 token 串存在两棵不同 parse tree，文法有歧义。`E → E+E | E*E | id` 无法唯一表达优先级和结合性。可以分层改写文法，也可在 Bison 中声明 precedence；后者解决 parser 冲突，不会让抽象语言本身自动变得无歧义。

## 2. 左递归与左因子

递归下降 parser 遇到 `A → Aα | β` 会在读入任何 token 前再次调用自己。消除直接左递归：

```text
A  → β A'
A' → α A' | ε
```

若两条规则共享前缀，如 `S → if E then S else S | if E then S`，左因子提取把选择推迟到公共前缀之后。它改善预测分析，但 dangling-else 的语义关联仍需用规则或 precedence 明确。

## 3. FIRST、FOLLOW 与 LL(1)

`FIRST(α)` 是可由 $α$ 推导出的串的第一个终结符集合，并在 $α\Rightarrow^*\varepsilon$ 时包含 $\varepsilon$。`FOLLOW(A)` 是某个句型中紧跟非终结符 $A$ 的终结符集合；开始符号包含输入结束标记 `$`。

以经典表达式文法为例：

```text
E  → T E'
E' → + T E' | ε
T  → F T'
T' → * F T' | ε
F  → ( E ) | id
```

| 非终结符 | FIRST | FOLLOW |
| --- | --- | --- |
| E | `(`, `id` | `)`, `$` |
| E' | `+`, `ε` | `)`, `$` |
| T | `(`, `id` | `+`, `)`, `$` |
| T' | `*`, `ε` | `+`, `)`, `$` |
| F | `(`, `id` | `*`, `+`, `)`, `$` |

预测表对 `A→α` 的每个 `FIRST(α)` 终结符填入该产生式；若 $\varepsilon\in FIRST(α)$，还要在 `FOLLOW(A)` 各列填入。每格至多一条产生式时才是 LL(1)。parser 只需栈顶非终结符和一个 lookahead：匹配终结符，或用预测表展开非终结符。

`id + id * id` 会先把第一个 `id` 归入 `F/T/E`，再由 `E'` 接受 `+`；乘法留在第二个 `T'` 内，因此自然比加法结合得更深。

## 4. 自底向上分析的核心

LR parser 反向执行右推导：不断 shift 输入，识别句柄后 reduce。一个配置由状态栈、符号栈与未读输入组成。典型动作是：

- `shift j`：读一个 token，压入目标状态；
- `reduce A→β`：弹出 $|β|$ 个符号/状态，经 `GOTO[top,A]` 压回 $A$；
- `accept` 或 error。

对 `S→CC, C→cC|d` 和输入 `cdd`，概念上的规约次序为：先把第一个 `d` 归约为 `C`，再把前面的 `cC` 归约为第一个 `C`，随后把末尾 `d` 归约为第二个 `C`，最后归约 `CC→S`。具体何时规约由 LR 状态与 lookahead 决定，而不是靠“看上去像句柄”。

## 5. LR 项目、closure 与 goto

LR(0) item 在产生式中放一点，如 `C→c·C`，表示右部已有多少被识别。`closure(I)` 若含 `A→α·Bβ`，就加入所有 `B→·γ`；`goto(I,X)` 把所有点前是 $X$ 的项目移过 $X$ 后再 closure。由此构成可行前缀 DFA。

不同方法的差别集中在何时允许 reduce：

| 方法 | 归约依据 | 特点 |
| --- | --- | --- |
| LR(0) | 完成项目对所有 lookahead 归约 | 状态少，最容易冲突 |
| SLR(1) | 只在 `FOLLOW(A)` 上用 `A→β` 归约 | 用全局 FOLLOW，仍可能过宽 |
| Canonical LR(1) | item 自带精确 lookahead | 能力强，状态较多 |
| LALR(1) | 合并 LR(1) core 相同的状态 | 状态规模接近 SLR，常用于 Bison |

能力关系通常写作 `LR(0) ⊂ SLR(1) ⊂ LALR(1) ⊂ LR(1)`。合并 LR(1) core 可能引入 reduce/reduce 冲突；不会凭空引入 shift/reduce 冲突。实际工具还会用 precedence/associativity 解决部分冲突，但应先判断冲突是语言设计还是工具配置问题。

## 6. 错误恢复

遇到空表项时立即退出最简单，却会让一次编译只能看到一个错误。panic mode 丢弃栈符号或输入，直到分号、右花括号等同步 token；phrase-level recovery 在局部插入/删除 token。恢复动作必须保证前进，并避免用级联错误淹没真正根因。

Bison 的特殊 `error` token 可写进产生式，例如恢复到 `SEMI`。`yyerrok` 等控制恢复状态，但错误产生式过宽会吞掉合法结构。

## 7. SPL Phase 1 与 Bison

SPL 的 [`syntax.y`](https://github.com/sitefan-coursework/SPL_Compiler/blob/8513ac9ecfb5fd13c7a846534e777806d67398b3/Phase_1/src/syntax.y) 把 `YYSTYPE` 定为 `treeNode*`，用 Bison 动作为产生式建立树节点，并用 sibling 链保存多个孩子。文件声明赋值、逻辑、关系和算术运算符优先级，也用 precedence 处理 dangling else；若干 error productions 输出 Type B 错误。

这棵树保留了大量 grammar 节点，更接近 concrete syntax tree。后续 Phase 2/3 直接按节点名遍历它；这是一条可行实现链，但工业编译器常在解析后另建更紧凑且类型明确的 AST。

下一篇[语法制导翻译](./syntax-directed-translation.md)解释产生式动作和属性如何系统地构造值，而不是把 Bison action 当成任意回调。

## 资料

- CS323 [Chapter 3](https://github.com/sitefan-coursework/CS323_Compilers/blob/f8ae1184dd9bc182be14edd4562724a3f1a8a4db/Lecture_Notes/Chapter3.pdf)
- CS323 [Labs 04–06](https://github.com/sitefan-coursework/CS323_Compilers/tree/f8ae1184dd9bc182be14edd4562724a3f1a8a4db/Lab_Notes)
- [GNU Bison Manual](https://www.gnu.org/software/bison/manual/)

