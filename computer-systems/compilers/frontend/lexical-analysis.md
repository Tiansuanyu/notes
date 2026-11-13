---
title: 词法分析：从字符流到 Token
description: 正则表达式、Thompson 构造、子集构造、DFA 最小化与 Flex。
order: 10
---

# 词法分析：从字符流到 Token

词法分析器（lexer/scanner）读取字符流，输出 parser 能消费的 token 流。它既要识别合法单词，又要决定相邻规则发生竞争时切到哪里。

## 1. Lexeme、token 与 pattern

在 `count = count + 1` 中，两个 `count` 是具体 **lexeme**；它们都属于 `ID` 这个 **token 类别**；`[A-Za-z_][A-Za-z0-9_]*` 是描述该类别的 **pattern**。token 通常还携带属性，例如标识符文本、整数值和源码位置：

```text
ID("count")  ASSIGN  ID("count")  PLUS  INT(1)
```

关键字看起来也匹配 `ID`。实现可以先识别 ID 再查关键字表，也可以像 SPL 的 `lex.l` 一样把 `int`、`if`、`return` 等规则放在 ID 规则前面。

## 2. 正则语言为什么适合 token

标识符、数字和运算符通常只需有限历史即可识别，因此可用正则表达式描述并编译成有限自动机。有限自动机不适合任意嵌套括号；嵌套结构交给 CFG 和 parser。

常用构造为并 `r|s`、连接 `rs`、闭包 `r*`，其余 `+`、`?`、字符类可以改写为这些基本形式。

## 3. 一个完整转换：`a(b|c)*`

Thompson 构造为每个字符建立一条边，再用 $\varepsilon$ 边组合连接、并和闭包。下面给 NFA 状态编号；`7` 为接受态：

```text
0 -a-> 1
1 -ε-> 2, 7
2 -ε-> 3, 5
3 -b-> 4       4 -ε-> 2, 7
5 -c-> 6       6 -ε-> 2, 7
```

子集构造把“一组 NFA 状态”变成一个 DFA 状态。先求 $\varepsilon$-closure，再对输入字符移动：

| DFA 状态 | NFA 状态集合 | `a` | `b` | `c` | 接受 |
| --- | --- | --- | --- | --- | --- |
| A | `{0}` | B | dead | dead | 否 |
| B | `{1,2,3,5,7}` | dead | C | D | 是 |
| C | `{2,3,4,5,7}` | dead | C | D | 是 |
| D | `{2,3,5,6,7}` | dead | C | D | 是 |

`B/C/D` 对后续所有字符串的接受行为相同，最小化可把它们合并。最终 DFA 只有开始态、接受态和 dead state：先读一个 `a` 进入接受态，之后任意多个 `b/c` 自环。

最小化的本质不是“状态长得像”，而是合并无法被任何后缀区分的等价状态。常见算法先分接受/非接受，再按转移目标反复细分分区。

## 4. 多条规则怎样组合

实际 scanner 会给每条 token 正则建 NFA，再从一个新开始态以 $\varepsilon$ 边连到各规则。DFA 接受态需要记录“接受了哪条规则”。扫描时遵守：

1. **最长匹配**：不断前进并记住最后一次接受的位置；下一字符无路可走时回退到该位置。
2. **规则优先级**：若同样长的 lexeme 命中多条规则，选择定义顺序更靠前的规则。

因此 `==` 应整体优先于两个 `=`；`ifx` 应是 ID 而不是 `IF` 加 `ID(x)`，因为最长匹配更长。只有 `if` 同时匹配关键字和 ID 时，规则顺序才打破平局。

## 5. 词法错误的边界

scanner 能报告非法字符、畸形数值或未终止字符串，并携带行列位置。但 `x + * y` 中两个运算符各自都合法，结构错误属于 parser；`1 + true` 是否允许则属于类型检查。

错误规则也要服从最长匹配。若只写一个兜底字符规则，`12.3.4` 可能被拆成多个看似合法 token；专门的 invalid-number pattern 能给出更接近根因的诊断，但规则不能误吞后续合法输入。

## 6. Flex 如何落地

Flex 文件由定义、规则、用户代码三段组成。规则动作可以返回 Bison token，并通过 `yylval` 传值：

```text
digit   [0-9]
id      [A-Za-z_][A-Za-z0-9_]*
%%
"if"            return IF;
{id}             { yylval.text = copy(yytext); return ID; }
{digit}+         { yylval.ival = atoi(yytext); return INT; }
[ \t\r\n]+       /* skip whitespace */
.                report_lexical_error(yytext, yylineno);
%%
```

Flex 生成的 scanner 仍然实现有限自动机、最长匹配和规则优先级；正则文件只是更易维护的声明形式。

## 7. SPL Phase 1 的真实路径

固定版本的 [`lex.l`](https://github.com/sitefan-coursework/SPL_Compiler/blob/8513ac9ecfb5fd13c7a846534e777806d67398b3/Phase_1/src/lex.l) 为 token 创建 `treeNode`，把节点放入 `yylval` 后返回 Bison token；关键字规则位于 ID 之前，并为非法数值、字符、字符串等打印 Type A 错误。它展示了 Flex 与 Bison 的数据接口，但“每个 token 都先建树节点”是该教学项目选择，不是所有编译器的要求。

继续阅读[语法分析](./syntax-analysis.md)，观察 token 流怎样被 CFG 组织成树。

## 资料

- CS323 [Chapter 2-1](https://github.com/sitefan-coursework/CS323_Compilers/blob/f8ae1184dd9bc182be14edd4562724a3f1a8a4db/Lecture_Notes/Chapter2-1.pdf)、[Chapter 2-2](https://github.com/sitefan-coursework/CS323_Compilers/blob/f8ae1184dd9bc182be14edd4562724a3f1a8a4db/Lecture_Notes/Chapter2-2.pdf)
- CS323 [Lab 03: Flex](https://github.com/sitefan-coursework/CS323_Compilers/blob/f8ae1184dd9bc182be14edd4562724a3f1a8a4db/Lab_Notes/Lab03.pdf)
- [Flex Manual](https://westes.github.io/flex/manual/)
