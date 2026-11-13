---
title: 机器人动力学与模型线性化
description: 从 Newton–Euler 和 Lagrange 方程到标准机器人动力学、四旋翼模型与工作点线性化。
order: 30
---

# 机器人动力学与模型线性化

动力学连接状态变化与力/力矩。运动学给出“怎样运动”，动力学进一步回答“什么输入会产生这种运动”。广义坐标 $q\in\mathbb R^n$ 不一定是笛卡尔坐标；其共轭广义力记为 $\tau$。

## 1. Newton–Euler 与 Lagrange 两条路径

Newton–Euler 对每个刚体写平动与转动平衡：

$$
m\dot v=\sum F,
\qquad
I\dot\omega+\omega\times(I\omega)=\sum\tau.
$$

它直接体现力的传递，适合递归计算串联机器人。Lagrange 方法从动能 $K(q,\dot q)$ 与势能 $V(q)$ 出发，令 $L=K-V$：

$$
\frac d{dt}\frac{\partial L}{\partial\dot q_i}
-\frac{\partial L}{\partial q_i}=\tau_i+Q_i^{nc}.
$$

$Q^{nc}$ 表示阻尼、接触等非保守广义力。两种方法描述同一物理系统，只是组织计算的方式不同。

## 2. 机器人标准动力学方程

多刚体系统通常整理为

$$
M(q)\ddot q+C(q,\dot q)\dot q+g(q)+f(\dot q)=\tau+J_c(q)^\mathsf T\lambda.
$$

- $M(q)$ 是对称正定惯性矩阵；
- $C\dot q$ 汇总 Coriolis 与离心项，$C$ 的矩阵表示并不唯一；
- $g(q)$ 是重力广义力；
- $f$ 可表示摩擦；
- $J_c^\mathsf T\lambda$ 把接触力映射到广义力。

由动能结构可选取 $C$ 使 $\dot M-2C$ 反对称，这一性质常用于能量和稳定性证明。它不是说每个软件输出的 $C$ 元素必须唯一。

前向动力学求

$$
\ddot q=M^{-1}(\tau-C\dot q-g-f+J_c^\mathsf T\lambda),
$$

逆动力学则由期望 $(q,\dot q,\ddot q)$ 求所需 $\tau$。实现时应解线性系统，不显式计算 $M^{-1}$。

## 3. 四旋翼刚体模型

令 $R_{W\leftarrow B}$ 把机体系向量转到世界系，位置 $p$、速度 $v$，总推力大小 $f\ge0$ 沿机体 $+e_3$ 方向；若具体飞控把推力定义为 $-e_3$，所有符号要相应改变。一种约定下

$$
\dot p=v,
\qquad
m\dot v=mg_W+Rfe_3+F_{ext},
$$

$$
\dot R=R[\omega]_\times,
\qquad
J\dot\omega=\tau-\omega\times J\omega.
$$

总推力和三轴力矩由各电机转速平方组合而来，并受电机动态、饱和与死区限制。把转速命令直接等同于瞬时推力，会遗漏执行器动态。

## 4. 状态空间与工作点

把二阶方程写成一阶非线性系统

$$
\dot x=f(x,u),\qquad y=h(x,u).
$$

在工作点 $(x_0,u_0)$ 附近，若 $f(x_0,u_0)=0$，令 $\delta x=x-x_0$、$\delta u=u-u_0$，一阶线性化为

$$
\delta\dot x=A\delta x+B\delta u,
\quad
A=\left.\frac{\partial f}{\partial x}\right|_0,
\quad
B=\left.\frac{\partial f}{\partial u}\right|_0.
$$

输出同理有 $\delta y=C\delta x+D\delta u$。沿时变参考轨迹线性化时 $A(t),B(t)$ 也随时间变化，不能套用固定平衡点结论。

## 5. 离散化

零阶保持下，连续线性系统的精确离散形式为

$$
A_d=e^{A\Delta t},
\qquad
B_d=\int_0^{\Delta t}e^{A\tau}B\,d\tau.
$$

前向 Euler 的 $A_d\approx I+A\Delta t$、$B_d\approx B\Delta t$ 只在步长足够小时可靠。离散化会改变极点位置；连续稳定性不能通过粗糙 Euler 自动保留。

## 6. 模型、估计与控制边界

动力学参数错误会形成模型偏差；状态估计器通过测量推断 $x$，控制器再据此计算 $u$。OpenVINS 或 FAST-LIO 的 IMU 模型主要服务于状态传播，并不等于包含电机与接触力的完整控制动力学。估计用 Jacobian 与控制线性化可来自同一 $f$，但噪声模型、输入定义和线性化点可能不同。

下一步见[状态空间与 LQR](./state-space-controllability-and-lqr.md)。
