---
title: 刚体、机械臂与移动机器人运动学
description: 用位姿、twist 和 Jacobian 统一正逆运动学、差速与 Ackermann 模型。
order: 10
---

# 刚体、机械臂与移动机器人运动学

运动学只描述构型、速度和加速度之间的几何关系，不回答产生这些运动需要多大力。本文采用列向量，$T_{A\leftarrow B}$ 把 B 系坐标变到 A 系；$q\in\mathbb R^n$ 是广义坐标。

## 1. 刚体速度与 twist

刚体位姿 $T(t)=[R(t),p(t)]\in SE(3)$。若用 body twist $\xi^B=(v^B,\omega^B)$，则

$$
\dot T=T(\xi^B)^\wedge,
\qquad
(\xi^B)^\wedge=
\begin{bmatrix}[\omega^B]_\times&v^B\\0&0\end{bmatrix}.
$$

用 spatial twist 时则是 $\dot T=(\xi^A)^\wedge T$，且

$$
\xi^A=\operatorname{Ad}_T\xi^B.
$$

左右形式表达同一物理速度，但坐标系不同。它们与[李群局部扰动](../geometry/lie-perturbations-and-jacobians.md)直接对应，不能在一条推导中混用。

## 2. 正运动学

串联机械臂的末端位姿是关节变换的复合：

$$
T_{0\leftarrow e}(q)=
T_{0\leftarrow1}(q_1)\cdots T_{n\leftarrow e}(q_n).
$$

Product of Exponentials 形式把每个关节轴写成 twist $\mathcal S_i$：

$$
T(q)=e^{\mathcal S_1^\wedge q_1}
e^{\mathcal S_2^\wedge q_2}\cdots
e^{\mathcal S_n^\wedge q_n}M,
$$

其中 $M$ 是零位构型。旋转关节的 $q_i$ 是角度，移动关节的 $q_i$ 是位移；单位必须与 twist 一致。

## 3. 运动学 Jacobian

末端速度与关节速度满足

$$
\xi_e=J(q)\dot q,
\qquad J\in\mathbb R^{6\times n}.
$$

spatial Jacobian 的第 $i$ 列可由前序关节对轴的 Adjoint 搬运得到：

$$
J_{s,i}(q)=\operatorname{Ad}_{
e^{\mathcal S_1^\wedge q_1}\cdots
e^{\mathcal S_{i-1}^\wedge q_{i-1}}}\mathcal S_i.
$$

这里的运动学 Jacobian 映射“关节速度到末端 twist”。它不同于优化中的残差 Jacobian $\partial r/\partial x$，也不同于 EKF 的观测 Jacobian。三者都是局部一阶映射，但定义域、值域和用途不同。

当 $J$ 降秩时，某些末端方向无法瞬时产生运动，称为运动学奇异。最小范数速度解为

$$
\dot q=J^\dagger\xi_d,
$$

冗余机械臂还可利用 null space：

$$
\dot q=J^\dagger\xi_d+(I-J^\dagger J)z.
$$

$z$ 可服务于避限位或次级目标，但只有落在零空间的分量才不改变一阶末端速度。

## 4. 逆运动学

逆运动学求 $q$ 使 $T(q)$ 达到目标 $T_d$。位置和姿态通常需在统一局部坐标中构造误差，例如

$$
e(q)=\operatorname{Log}\!\left(T(q)^{-1}T_d\right)^\vee.
$$

局部线性化后可迭代

$$
\Delta q=(J^\mathsf TJ+\lambda I)^{-1}J^\mathsf Te,
\qquad q\leftarrow q+\Delta q.
$$

这只是局部求解：多解、不可达目标、关节限位和奇异构型都需要额外处理。LM 阻尼改善数值稳定性，不会使不可达目标变得可达。

## 5. 差速移动机器人

平面状态 $x=(X,Y,\theta)$，车体前向速度 $v$、角速度 $\omega$，理想无侧滑模型为

$$
\dot X=v\cos\theta,
\qquad
\dot Y=v\sin\theta,
\qquad
\dot\theta=\omega.
$$

轮半径 $r$、轮距 $b$、左右轮角速度 $\omega_R,\omega_L$ 时

$$
v=\frac r2(\omega_R+\omega_L),
\qquad
\omega=\frac r b(\omega_R-\omega_L).
$$

约束 $-\sin\theta\,\dot X+\cos\theta\,\dot Y=0$ 表示车体不能瞬时侧移，是非完整约束。轮滑会破坏该模型，不能仅靠减小积分步长消除。

## 6. Ackermann 模型

轴距 $L$、前轮等效转角 $\delta$ 的运动学自行车模型为

$$
\dot X=v\cos\theta,
\quad
\dot Y=v\sin\theta,
\quad
\dot\theta=\frac vL\tan\delta.
$$

它假设低侧滑、刚性平面和等效单轨。高速、低附着或激烈转向时需引入横向速度、轮胎侧偏角和力学模型；那已进入动力学而非单纯运动学。

## 7. 离散化边界

前向 Euler 给出 $x_{k+1}\approx x_k+f(x_k,u_k)\Delta t$，只是一阶近似。对恒定 $(v,\omega)$ 可用 $SE(2)$ 指数得到更准确的弧线积分。离散化方法改变数值误差，却不改变模型忽略的侧滑、柔性和执行器动态。

下一步阅读[轨迹生成与运动约束](./trajectory-generation.md)和[机器人动力学与模型线性化](./robot-dynamics-and-linearization.md)。
