---
title: 编译器前端
description: 从字符流到 AST，再完成名字解析和类型检查。
order: 10
---

# 编译器前端

前端把具体语言的表面形式转换成带语义约束的程序表示：scanner 切分 token，parser 恢复层次结构，语义分析再绑定名字、检查类型。这里的“前端”与 CPU decoder 或 shader frontend 在分层上相似，但处理的输入分别是源码、机器码和 GPU 指令，不能混用规则。

1. [词法分析](./lexical-analysis.md)
2. [语法分析](./syntax-analysis.md)
3. [语法制导翻译](./syntax-directed-translation.md)
4. [语义分析与类型系统](./semantic-analysis.md)

