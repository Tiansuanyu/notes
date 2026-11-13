---
title: 最优化
description: 面向 SLAM 稀疏结构的非线性最小二乘、局部求解与变量消元。
order: 20
---

# 最优化

优化篇从残差模型开始，区分目标函数、局部二次模型和线性求解器，再利用变量连接关系解释 SLAM 为什么可以稀疏求解。

## 阅读顺序

1. [非线性最小二乘](./nonlinear-least-squares.md)
2. [Gauss–Newton 与 Levenberg–Marquardt](./gauss-newton-and-lm.md)
3. [Schur Complement 与变量消元](./schur-complement.md)

因子图、BA、滑窗边缘化和 gauge freedom 已在 [SLAM 状态估计综述](../../slam/fundamentals/状态估计与不确定性.md)中给出场景入口；本组逐步承接其数学细节。
