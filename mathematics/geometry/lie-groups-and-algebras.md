---
title: SO(3)、SE(3) 与李群李代数
description: 从旋转和刚体变换的群结构，推导指数映射、对数映射、伴随与局部坐标。
order: 10
---

# SO(3)、SE(3) 与李群李代数

三维旋转矩阵有九个元素，却只有三个自由度；刚体位姿也不是可任意相加的六维向量。李群保留旋转和刚体变换的组合结构，李代数则在单位元附近提供可微的局部向量空间，使优化器能够求一个小增量而不破坏几何约束。

本文使用列向量，$T_{A\leftarrow B}$ 把 B 系点变到 A 系；$\xi=(\rho,\phi)$ 的平移分量在前。

## 1. $SO(3)$ 与 $SE(3)$

特殊正交群

$$
SO(3)=\{R\in\mathbb R^{3\times3}\mid R^\mathsf TR=I,\ \det R=1\}.
$$

矩阵乘法给出旋转复合，$R^{-1}=R^\mathsf T$，单位元是 $I$。约束使它是嵌在九维矩阵空间中的三维流形，而不是三维向量空间：一般有 $R_1+R_2\notin SO(3)$。

刚体变换群

$$
SE(3)=\left\{
T=\begin{bmatrix}R&t\\0&1\end{bmatrix}
\mid R\in SO(3),\ t\in\mathbb R^3
\right\}.
$$

其乘法和逆为

$$
T_1T_2=
\begin{bmatrix}R_1R_2&R_1t_2+t_1\\0&1\end{bmatrix},
\qquad
T^{-1}=\begin{bmatrix}R^\mathsf T&-R^\mathsf Tt\\0&1\end{bmatrix}.
$$

平移会被前一个旋转作用，因此 $SE(3)$ 不是旋转和平移的简单直积，而是半直积结构。

## 2. 切空间与 hat/vee

令一条旋转曲线满足 $R(0)=I$。对 $R^\mathsf TR=I$ 求导：

$$
\dot R(0)^\mathsf T+\dot R(0)=0.
$$

所以单位元处的切向量是反对称矩阵，构成李代数 $\mathfrak{so}(3)$。向量与反对称矩阵通过

$$
\phi^\wedge=[\phi]_\times=
\begin{bmatrix}
0&-\phi_3&\phi_2\\
\phi_3&0&-\phi_1\\
-\phi_2&\phi_1&0
\end{bmatrix},
\qquad [\phi]_\times a=\phi\times a
$$

对应；$\vee$ 是其逆操作。$\mathfrak{se}(3)$ 写为

$$
\xi^\wedge=
\begin{bmatrix}[\phi]_\times&\rho\\0&0\end{bmatrix},
\qquad \xi=\begin{bmatrix}\rho\\\phi\end{bmatrix}\in\mathbb R^6.
$$

切向量只在指定基点和约定下有意义。把两个有限位姿的矩阵元素直接相减，不是坐标无关的位姿误差。

## 3. $SO(3)$ 指数映射

指数映射把单位元切空间中的 $\phi$ 映到旋转：

$$
R=\operatorname{Exp}(\phi)=\exp([\phi]_\times).
$$

令 $\theta=\|\phi\|$。利用

$$
[\phi]_\times^3=-\theta^2[\phi]_\times
$$

把矩阵指数级数中高次项归并，可得 Rodrigues 公式：

$$
\operatorname{Exp}(\phi)
=I+\frac{\sin\theta}{\theta}[\phi]_\times
+\frac{1-\cos\theta}{\theta^2}[\phi]_\times^2.
$$

$\theta\to0$ 时不能直接做两个小量相除，应使用级数

$$
\frac{\sin\theta}{\theta}\approx1-\frac{\theta^2}{6},
\qquad
\frac{1-\cos\theta}{\theta^2}\approx\frac12-\frac{\theta^2}{24}.
$$

因此小角度下一阶近似为 $\operatorname{Exp}(\phi)\approx I+[\phi]_\times$，但有限更新仍应使用完整指数映射。

## 4. 对数映射及其分支

由 $\operatorname{tr}(R)=1+2\cos\theta$，主值角度为

$$
\theta=\arccos\frac{\operatorname{tr}(R)-1}{2}.
$$

在 $0<\theta<\pi$ 时，

$$
\operatorname{Log}(R)^\vee
=\frac{\theta}{2\sin\theta}(R-R^\mathsf T)^\vee.
$$

接近零角需要级数，接近 $\pi$ 时 $\sin\theta$ 很小且旋转轴符号存在分支问题。对数映射不是全局一一对应；优化中的局部残差通常假设相邻估计落在同一有效分支。

## 5. $SE(3)$ 指数映射

对 $\xi=(\rho,\phi)$：

$$
\operatorname{Exp}(\xi)=
\begin{bmatrix}
\operatorname{Exp}(\phi)&J_l(\phi)\rho\\
0&1
\end{bmatrix},
$$

其中 $SO(3)$ 左雅可比

$$
J_l(\phi)=I+
\frac{1-\cos\theta}{\theta^2}[\phi]_\times+
\frac{\theta-\sin\theta}{\theta^3}[\phi]_\times^2.
$$

这说明 $\rho$ 是李代数中的平移坐标，有限旋转时矩阵平移列为 $t=J_l(\phi)\rho$，二者一般不相等。对数映射先求 $\phi=\operatorname{Log}(R)^\vee$，再由 $\rho=J_l(\phi)^{-1}t$ 得到切向量。

## 6. BCH：为什么增量不能简单相加

两个小增量复合满足 Baker–Campbell–Hausdorff 展开：

$$
\log(\exp(a^\wedge)\exp(b^\wedge))^\vee
=a+b+\frac12[a,b]+O(\|a,b\|^3),
$$

其中李括号是矩阵交换子 $[a^\wedge,b^\wedge]=a^\wedge b^\wedge-b^\wedge a^\wedge$。一阶时可近似相加，二阶开始出现非交换项。这是“旋转顺序重要”的局部代数表达。

## 7. Adjoint：同一微小运动的坐标变换

由

$$
T\operatorname{Exp}(\xi)T^{-1}
=\operatorname{Exp}(\operatorname{Ad}_T\xi)
$$

定义伴随。按 $(\rho,\phi)$ 排列：

$$
\operatorname{Ad}_T=
\begin{bmatrix}
R&[t]_\times R\\
0&R
\end{bmatrix}.
$$

它把不同切空间坐标下的同一扰动联系起来，也用于变换位姿协方差。只旋转平移协方差而忽略旋转—平移交叉项，通常不等价于完整的 Adjoint 传播。

## 8. 在估计问题中的位置

优化器不直接改变 $R$ 的九个元素，而是求 $\delta\phi\in\mathbb R^3$ 并用指数映射更新；滤波器也可让名义旋转留在群上，让三维小角误差进入协方差。这既保持约束，又给线性化提供最小局部坐标。

下一篇[左右扰动与李群雅可比](./lie-perturbations-and-jacobians.md)进一步说明扰动放在位姿哪一侧、雅可比在哪个坐标系表达，以及为什么公式必须与约定配套。

## 参考资料

- Solà、Deray、Atchuthan，[A Micro Lie Theory for State Estimation in Robotics](https://arxiv.org/abs/1812.01537)，2018。
- Barfoot，*State Estimation for Robotics*，关于矩阵李群、运动学与估计的系统推导。
- [GTSAM Lie Groups 文档入口](https://gtsam.org/docs/)：实现采用的 manifold 与 retract/local coordinates 约定需以对应版本为准。
