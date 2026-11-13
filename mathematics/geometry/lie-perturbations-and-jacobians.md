---
title: 左右扰动与李群雅可比
description: 推导 SE(3) 左右扰动、点变换雅可比、左/右 Jacobian 和协方差坐标转换。
order: 20
---

# 左右扰动与李群雅可比

李代数给出了六维局部坐标，但还必须回答“增量乘在位姿左边还是右边”。这个选择决定扰动在哪个坐标系表达，也会改变残差雅可比、先验和协方差的形式。

本文令 $T=[R,t]$ 把 source 点 $p$ 变为 target 点 $y=Rp+t$，切向量按 $(\rho,\phi)$ 排列。

## 1. 两种局部更新

左扰动与右扰动分别定义为

$$
T'(\delta\xi_l)=\operatorname{Exp}(\delta\xi_l)T,
\qquad
T'(\delta\xi_r)=T\operatorname{Exp}(\delta\xi_r).
$$

左扰动在输出/target 坐标中施加，右扰动在输入/source 局部坐标中施加。由

$$
\operatorname{Exp}(\delta\xi_l)T
=T\operatorname{Exp}(\delta\xi_r)
$$

右乘 $T^{-1}$ 并使用 Adjoint，可得一阶乃至指数映射邻域内的关系

$$
\delta\xi_l=\operatorname{Ad}_T\delta\xi_r.
$$

因此两种约定描述同一个局部运动，但六维数值和协方差所在基不同。

## 2. 点变换的左右雅可比

对左扰动，使用 $\operatorname{Exp}(\delta\xi)\approx[I+[\delta\phi]_\times,\delta\rho]$：

$$
y'=\operatorname{Exp}(\delta\xi_l)y
\approx y+\delta\rho+[\delta\phi]_\times y
=y+\delta\rho-[y]_\times\delta\phi.
$$

所以

$$
\frac{\partial y'}{\partial\delta\xi_l}
=\begin{bmatrix}I&-[y]_\times\end{bmatrix}.
$$

对右扰动：

$$
y'=T\operatorname{Exp}(\delta\xi_r)p
\approx R(p+\delta\rho-[p]_\times\delta\phi)+t,
$$

因此

$$
\frac{\partial y'}{\partial\delta\xi_r}
=\begin{bmatrix}R&-R[p]_\times\end{bmatrix}.
$$

两式都正确，却不能混用。若残差定义为 $r=z-y$，还要整体加负号；若位姿方向改为 target-to-source，链式关系也随之改变。

## 3. 与投影雅可比连接

针孔投影 $\pi(X,Y,Z)=(f_xX/Z+c_x,f_yY/Z+c_y)$ 的导数为

$$
J_\pi=
\begin{bmatrix}
f_x/Z&0&-f_xX/Z^2\\
0&f_y/Z&-f_yY/Z^2
\end{bmatrix}.
$$

若 $y=T_{C\leftarrow W}p_W$ 且使用左扰动，则预测像素对位姿增量的导数为

$$
\frac{\partial\pi(y)}{\partial\delta\xi_l}
=J_\pi\begin{bmatrix}I&-[y]_\times\end{bmatrix}.
$$

观测减预测残差的 Jacobian 是上式的负值。这里的 $Z>0$ 且不能过小；靠近成像平面的点会使 $1/Z$ 和 $1/Z^2$ 项造成强非线性。

## 4. $SO(3)$ 左右 Jacobian 从何而来

我们希望把群上两个小量分开。例如

$$
\operatorname{Exp}(\phi+\delta\phi)
\approx\operatorname{Exp}(J_l(\phi)\delta\phi)\operatorname{Exp}(\phi),
$$

或

$$
\operatorname{Exp}(\phi+\delta\phi)
\approx\operatorname{Exp}(\phi)\operatorname{Exp}(J_r(\phi)\delta\phi).
$$

由 BCH 的一阶项可得到

$$
J_l(\phi)=I+
\frac{1-\cos\theta}{\theta^2}[\phi]_\times+
\frac{\theta-\sin\theta}{\theta^3}[\phi]_\times^2,
\qquad
J_r(\phi)=J_l(-\phi).
$$

小角度下

$$
J_l(\phi)\approx I+\frac12[\phi]_\times,
\qquad
J_r(\phi)\approx I-\frac12[\phi]_\times.
$$

这些 Jacobian 不是普通函数 $R(\phi)$ 对九个矩阵元素的导数，而是把“参数空间的小改动”与“群上一侧的小扰动”联系起来。

## 5. Log 残差的线性化

位姿先验或图优化常用

$$
r(T)=\operatorname{Log}(T_m^{-1}T)^\vee.
$$

对右扰动 $T'=T\operatorname{Exp}(\delta\xi)$，令 $E=T_m^{-1}T=\operatorname{Exp}(r)$，则

$$
E'=E\operatorname{Exp}(\delta\xi),
$$

所以一阶近似

$$
r(T')\approx r(T)+J_r(r)^{-1}\delta\xi.
$$

若改用左扰动或把残差写成 $\operatorname{Log}(T^{-1}T_m)$，Jacobian 会变。实践中应从残差定义重新推导，或用数值微分检验解析式，而不是按函数名复制公式。

## 6. 协方差如何换坐标

若 $\delta\xi_l=\operatorname{Ad}_T\delta\xi_r$，则一阶协方差满足

$$
\Sigma_l=\operatorname{Ad}_T\Sigma_r\operatorname{Ad}_T^\mathsf T.
$$

这条式子还假设两种误差都在同一名义位姿附近，并使用相同的 $(\rho,\phi)$ 排列和单位。若名义状态本身变化，还需考虑 retraction/reset 的 Jacobian。

## 7. 与 ESKF 的关系

惯性 ESKF 常令真实姿态满足

$$
R=\hat R\operatorname{Exp}(\delta\theta),
$$

即右乘误差，$\delta\theta$ 表达在名义 IMU 局部坐标。测量更新后把估计误差注入名义姿态，再把误差均值重置为零。重置前后切空间基发生微小变化，因此协方差也需要 reset Jacobian；详见[误差状态卡尔曼滤波](../probabilistic-estimation/error-state-kalman-filter.md)。

## 8. 常见误区

- “左乘”不自动等于 world frame；要结合变换方向和作用对象判断。
- $SE(3)$ 的 $\rho$ 在有限旋转下不等于齐次矩阵平移列。
- 改变扰动约定后，仅给 Jacobian 换符号通常不够。
- 数值 Jacobian 能发现实现不一致，但步长过大破坏局部近似，过小又受浮点舍入影响。

## 参考资料

- Solà、Deray、Atchuthan，[A Micro Lie Theory for State Estimation in Robotics](https://arxiv.org/abs/1812.01537)，2018。
- Solà，[Quaternion Kinematics for the Error-State Kalman Filter](https://arxiv.org/abs/1711.02508)，2017。
