---
title: 点云配准残差与雅可比
description: 推导点到点、点到面、GICP 与 NDT 的局部目标和 SE(3) Jacobian。
order: 30
---

# 点云配准残差与雅可比

点云配准的完整问题还包含对应搜索、初始化和候选验证；本文只研究“给定当前对应或局部分布后，位姿增量怎样进入残差”。全局流程和验收边界见 SLAM 篇[点云配准](../../slam/fundamentals/点云配准.md)。

设 $T_{M\leftarrow L}=[R,t]$ 把 LiDAR 点 $p_i$ 变到地图系，$y_i=Rp_i+t$。采用左扰动

$$
T'=\operatorname{Exp}(\delta\xi)T,
\qquad
\delta\xi=(\delta\rho,\delta\phi).
$$

于是

$$
y_i'\approx y_i+\delta\rho-[y_i]_\times\delta\phi,
\qquad
J_{y_i}=\begin{bmatrix}I&-[y_i]_\times\end{bmatrix}.
$$

## 1. 点到点残差

给定地图对应点 $q_i$：

$$
r_i^{p2p}=y_i-q_i\in\mathbb R^3.
$$

因此

$$
J_i^{p2p}=\frac{\partial r_i}{\partial\delta\xi}
=\begin{bmatrix}I&-[y_i]_\times\end{bmatrix}.
$$

加权目标

$$
\min_{\delta\xi}\frac12\sum_i
\|r_i+J_i\delta\xi\|_{\Omega_i}^2
$$

产生 $6\times6$ 局部正规方程。若使用右扰动，Jacobian 变为 $[R,-R[p_i]_\times]$。

## 2. 点到面残差

令 $n_i$ 是地图对应处单位法向：

$$
r_i^{p2l}=n_i^\mathsf T(y_i-q_i)\in\mathbb R.
$$

一阶展开：

$$
r_i'\approx r_i+n_i^\mathsf T
(\delta\rho-[y_i]_\times\delta\phi),
$$

所以

$$
J_i^{p2l}=
\begin{bmatrix}
n_i^\mathsf T&-n_i^\mathsf T[y_i]_\times
\end{bmatrix}
=\begin{bmatrix}
n_i^\mathsf T&(y_i\times n_i)^\mathsf T
\end{bmatrix}.
$$

它只惩罚法向距离。单个无限平面不能约束沿平面的两维平移和绕法向旋转；多个法向与空间分布共同决定六维可观性。

## 3. 法向和对应不是常量真值

上述求导在一次局部迭代中把 $q_i,n_i$ 视为常量。ICP 外循环更新位姿后会重新找对应，法向也来自有限邻域估计。因而整体目标分段变化，不保证从任意初值平滑收敛。

下采样、最大对应距离、法向夹角和 robust kernel 改变参与线性系统的样本或权重。它们可以改善局部估计，却不能证明对应属于同一物理结构。

## 4. GICP 的概率形式

Generalized ICP 为 source 和 target 局部邻域分别估计协方差 $C_i^L,C_i^M$。变换后差值

$$
d_i=Rp_i+t-q_i
$$

的协方差近似

$$
C_i=C_i^M+RC_i^LR^\mathsf T.
$$

目标为

$$
E_{GICP}=\sum_i d_i^\mathsf TC_i^{-1}d_i.
$$

各向异性协方差使平面法向方向惩罚更强、切向更弱，从概率形式统一点到点和点到面思想。严格求导时 $C_i$ 也依赖 $R$；有的实现每轮固定权重近似，有的包含更多导数，必须以实现为准。

协方差来自局部几何模型，不等同于真实传感器/配准误差协方差；近平面协方差若直接奇异，还需要受控正则化。

## 5. NDT 的目标

Normal Distributions Transform（NDT）把地图空间划分为 cell，并用其中点估计 Gaussian $(\mu_c,\Sigma_c)$。变换点 $y_i$ 落入 cell $c(i)$ 后，可最小化负 log-likelihood 的二次部分：

$$
E_{NDT}=\frac12\sum_i
(y_i-\mu_{c(i)})^\mathsf T
\Sigma_{c(i)}^{-1}(y_i-\mu_{c(i)}).
$$

固定 cell assignment 时，残差对位姿的 Jacobian仍由 $J_{y_i}$ 链式得到。跨 cell 时目标结构会变化；分辨率影响局部平滑程度、几何细节和协方差估计稳定性。

NDT 不需要显式点对点最近邻，但仍依赖初值、覆盖和栅格中的有效分布，不能因此称为无条件全局方法。

## 6. 信息矩阵与退化

局部 Hessian 近似

$$
H=\sum_iJ_i^\mathsf TW_iJ_i.
$$

其小特征值对应当前参数化和尺度下的弱方向。点到面 ICP 在长走廊中可能缺少沿走廊平移约束；单地面主要提供高度、roll/pitch 相关信息。

给 $H$ 加阻尼能让线性系统可解，但不能把弱方向变成真实观测。应结合 IMU 预测、更多几何、时间窗口或显式降级策略处理。

## 7. Deskew 与配准残差的关系

旋转式 LiDAR 一帧中的点有不同时间。若用扫描结束位姿把所有原始点视为同时采集，运动畸变会进入残差，优化器可能把它解释成位姿或地图几何。

Deskew 用每点时刻的预测状态把点转换到共同参考时刻。时间偏移和 IMU bias 会同时影响 deskew 后点坐标与最终配准残差，所以二者不是独立前处理误差。

## 参考资料

- Besl 与 McKay，[A Method for Registration of 3-D Shapes](https://doi.org/10.1109/34.121791)，TPAMI 1992。
- Segal、Haehnel、Thrun，[Generalized-ICP](https://www.roboticsproceedings.org/rss05/p21.pdf)，RSS 2009。
- Low，[Linear Least-Squares Optimization for Point-to-Plane ICP Surface Registration](https://www.cs.princeton.edu/~smr/papers/icpstability.pdf)，2004。
- [Open3D ICP 文档](https://www.open3d.org/docs/release/tutorial/pipelines/icp_registration.html)。
