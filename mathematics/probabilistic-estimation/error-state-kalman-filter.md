---
title: 误差状态卡尔曼滤波（ESKF）
description: 从名义状态、连续误差动力学到离散协方差、误差注入和重置，完整建立惯性 ESKF。
order: 20
---

# 误差状态卡尔曼滤波（ESKF）

Error-State Kalman Filter（ESKF）让高频非线性名义状态按 IMU 积分，同时用零均值的小误差状态及其协方差描述局部不确定性。测量更新先估计误差，再把它注入名义状态。

## 1. 名义状态与误差状态

采用

$$
x=(R_{W\leftarrow I},p_W,v_W,b_g,b_a),
$$

名义状态为 $\hat x$。真实状态与名义状态的关系定义为

$$
R=\hat R\operatorname{Exp}(\delta\theta),
\quad p=\hat p+\delta p,
\quad v=\hat v+\delta v,
$$

$$
b_g=\hat b_g+\delta b_g,
\qquad b_a=\hat b_a+\delta b_a.
$$

误差向量固定排列为

$$
\delta x=
\begin{bmatrix}
\delta\theta&\delta p&\delta v&\delta b_g&\delta b_a
\end{bmatrix}^\mathsf T\in\mathbb R^{15}.
$$

右乘姿态误差 $\delta\theta$ 表达在名义 IMU 局部坐标。采用左误差会得到不同的 $F,G,H$；不能只交换乘法方向。

## 2. IMU 模型和名义传播

$$
\omega_m=\omega+b_g+n_g,
\qquad
a_m=R^\mathsf T(a_W-g_W)+b_a+n_a.
$$

令 $\hat\omega=\omega_m-\hat b_g$、$\hat a=a_m-\hat b_a$，连续名义动力学为

$$
\dot{\hat R}=\hat R[\hat\omega]_\times,
\quad
\dot{\hat p}=\hat v,
\quad
\dot{\hat v}=\hat R\hat a+g,
\quad
\dot{\hat b}_g=0,
\quad
\dot{\hat b}_a=0.
$$

零阶保持 IMU 的一种离散近似为

$$
\hat R_{k+1}=\hat R_k\operatorname{Exp}(\hat\omega_k\Delta t),
$$

$$
\hat p_{k+1}=\hat p_k+\hat v_k\Delta t+
\frac12(\hat R_k\hat a_k+g)\Delta t^2,
$$

$$
\hat v_{k+1}=\hat v_k+(\hat R_k\hat a_k+g)\Delta t.
$$

中点积分等更高质量方法会改变离散公式，但不改变必须同时传播名义状态与误差协方差这一结构。

## 3. 连续时间误差动力学

将真实状态代入动力学，对 $\delta\theta$ 一阶化。利用

$$
\operatorname{Exp}(\delta\theta)\hat a
\approx\hat a-[\hat a]_\times\delta\theta
$$

可得

$$
\dot{\delta\theta}
=-[\hat\omega]_\times\delta\theta-\delta b_g-n_g,
$$

$$
\dot{\delta p}=\delta v,
$$

$$
\dot{\delta v}
=-\hat R[\hat a]_\times\delta\theta
-\hat R\delta b_a-\hat Rn_a,
$$

$$
\dot{\delta b_g}=n_{bg},
\qquad
\dot{\delta b_a}=n_{ba}.
$$

写成

$$
\dot{\delta x}=F\delta x+Gn,
$$

其中噪声排列 $n=(n_g,n_a,n_{bg},n_{ba})$，

$$
F=
\begin{bmatrix}
-[\hat\omega]_\times&0&0&-I&0\\
0&0&I&0&0\\
-\hat R[\hat a]_\times&0&0&0&-\hat R\\
0&0&0&0&0\\
0&0&0&0&0
\end{bmatrix},
$$

$$
G=
\begin{bmatrix}
-I&0&0&0\\
0&0&0&0\\
0&-\hat R&0&0\\
0&0&I&0\\
0&0&0&I
\end{bmatrix}.
$$

这些块的符号依赖旋转方向、误差定义和 bias 模型。公式复制到另一个项目之前必须重新核对约定。

## 4. 连续模型怎样离散化

在一步内近似 $F,G$ 常值：

$$
\Phi=\exp(F\Delta t),
$$

$$
Q_d=\int_0^{\Delta t}
\exp(F\tau)GQ_cG^\mathsf T\exp(F\tau)^\mathsf T\,d\tau.
$$

于是

$$
P_{k+1}^-=\Phi P_k^+\Phi^\mathsf T+Q_d.
$$

一阶近似 $\Phi\approx I+F\Delta t$、$Q_d\approx GQ_cG^\mathsf T\Delta t$ 只在采样足够快且模型变化有限时合理。噪声密度的单位通常含 $1/\sqrt{\mathrm{Hz}}$，不能把连续谱密度数值直接当离散方差。

## 5. 测量如何更新误差状态

对测量 $z=h(x)+v$，在名义状态附近：

$$
r=z-h(\hat x)\approx H\delta x+v,
$$

$$
K=PH^\mathsf T(HPH^\mathsf T+R)^{-1},
\qquad
\widehat{\delta x}=Kr.
$$

例如位置观测 $z=p+v$ 有

$$
H=\begin{bmatrix}0&I&0&0&0\end{bmatrix}.
$$

LiDAR 点到面残差则通过点的位姿 Jacobian 同时约束姿态和位置，并经外参链连接到 IMU 状态。

## 6. 注入与重置

将误差均值注入名义状态：

$$
\hat R^+=\hat R^-\operatorname{Exp}(\widehat{\delta\theta}),
\quad
\hat p^+=\hat p^-+\widehat{\delta p},
\quad
\hat v^+=\hat v^-+\widehat{\delta v},
$$

$$
\hat b_g^+=\hat b_g^-+\widehat{\delta b_g},
\qquad
\hat b_a^+=\hat b_a^-+\widehat{\delta b_a}.
$$

随后把误差均值重新定义为零。姿态的旧、新误差切空间并非完全相同；右误差下小角 reset Jacobian 的旋转块常写为

$$
J_{reset,\theta}\approx I-\frac12[\widehat{\delta\theta}]_\times,
$$

并传播

$$
P^+\leftarrow J_{reset}P^+J_{reset}^\mathsf T.
$$

精确符号必须由当前注入定义推导。忽略 reset 在极小修正时影响可能不显著，但不能因此把它从数学模型中删除。

## 7. 为什么不用直接状态加法

名义状态可用完整非线性方程和单位四元数/旋转矩阵传播；误差状态保持小量，更适合一阶 Gaussian 近似。旋转只需三维误差，不把四元数单位范数约束塞入协方差。

这不意味着 ESKF 比 EKF 使用了“更多信息”。它主要改变误差参数化和数值组织；在一致线性化、同一模型下，两者局部结果可以等价。

## 8. 一致性与适用边界

- 误差必须在局部足够小；初始化错误过大时线性化会失效。
- bias、重力、外参和时间偏移是否可观取决于运动与观测。
- 协方差小只表示模型内部确信，不证明模型无偏或数据关联正确。
- 预测、更新后和最终平滑状态属于不同时间/算法语义，不能未经审计互换。

同一次非线性测量如何重复线性化见[迭代扩展卡尔曼滤波](./iterated-ekf.md)；完整 IMU 物理模型见[IMU 测量模型与状态传播](../inertial-odometry/imu-measurement-and-propagation.md)。

## 参考资料

- Solà，[Quaternion Kinematics for the Error-State Kalman Filter](https://arxiv.org/abs/1711.02508)，2017。
- [OpenVINS IMU Propagation Derivations](https://docs.openvins.com/propagation)。
