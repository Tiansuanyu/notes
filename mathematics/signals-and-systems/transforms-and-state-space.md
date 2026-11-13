---
title: 连续/离散系统、变换与状态空间
description: 用 Laplace、Z Transform、传递函数与状态空间连接时域动态和离散实现。
order: 30
---

# 连续/离散系统、变换与状态空间

信号描述随时间变化的量；系统把输入映射为输出。对线性时不变（LTI）系统，卷积、变换域和状态空间是同一动态的不同观察方式。

## 1. Laplace Transform 与传递函数

单边 Laplace Transform

$$
X(s)=\int_{0^-}^{\infty}x(t)e^{-st}\,dt,
\qquad s=\sigma+j\omega
$$

把微分方程转为代数关系，同时保留初值项。例如

$$
a_2\ddot y+a_1\dot y+a_0y=b_0u.
$$

在零初值下传递函数为

$$
G(s)=\frac{Y(s)}{U(s)}
=\frac{b_0}{a_2s^2+a_1s+a_0}.
$$

“零初值”是传递函数定义的关键；非零初态是系统内部能量，不能塞进 $G(s)$。

## 2. Z Transform

离散序列的双边 Z Transform 为

$$
X(z)=\sum_{n=-\infty}^{\infty}x[n]z^{-n}.
$$

单位延迟对应 $z^{-1}$。线性差分方程

$$
y[n]+a_1y[n-1]=b_0x[n]+b_1x[n-1]
$$

在零初值下给出

$$
H(z)=\frac{b_0+b_1z^{-1}}{1+a_1z^{-1}}.
$$

Z Transform 的收敛域参与因果性与稳定性判断；只看同一个代数式的极零位置，不能区分所有可能序列。

## 3. 状态空间

连续系统写为

$$
\dot x=Ax+Bu,
\qquad y=Cx+Du.
$$

零初值传递矩阵为

$$
G(s)=C(sI-A)^{-1}B+D.
$$

状态坐标不是唯一的。若 $x'=Sx$，则

$$
A'=SAS^{-1},\quad B'=SB,\quad C'=CS^{-1},
$$

输入输出行为不变。SLAM 的误差状态、飞控状态和电机内部状态可属于不同模型层级；命名相同不代表状态定义相同。

## 4. 连续到离散

零阶保持假设采样间隔内 $u(t)=u_k$，得到

$$
x_{k+1}=A_dx_k+B_du_k,
$$

$$
A_d=e^{A\Delta t},qquad
B_d=\int_0^{\Delta t}e^{A\tau}B\,d\tau.
$$

可用块矩阵指数同时计算：

$$
\exp\!\left(
\begin{bmatrix}A&B\\0&0\end{bmatrix}\Delta t
\right)
=
\begin{bmatrix}A_d&B_d\\0&I\end{bmatrix}.
$$

过程噪声协方差还需积分 $Q_d=\int e^{A\tau}LQ_cL^\mathsf Te^{A^\mathsf T\tau}d\tau$，不能把连续噪声密度直接当离散协方差；对应推导见[ESKF](../probabilistic-estimation/error-state-kalman-filter.md)。

## 5. 非线性系统的局部模型

机器人常为

$$
\dot x=f(x,u),\qquad y=h(x,u).
$$

在工作点或参考轨迹附近一阶线性化得到 $A=\partial f/\partial x$、$B=\partial f/\partial u$。这个 Jacobian 表示动力学的局部敏感度；它与机械臂速度 Jacobian、残差 Jacobian 名称相同但映射不同。

线性模型只在所选邻域有效。四旋翼悬停线性化不能无条件描述翻滚机动，Ackermann 低侧滑模型也不能覆盖高速漂移。
