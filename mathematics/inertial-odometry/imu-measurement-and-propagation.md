---
title: IMU 测量模型与状态传播
description: 从角速度与比力测量推导姿态、速度、位置传播，解释 bias、重力、噪声和离散化。
order: 10
---

# IMU 测量模型与状态传播

IMU 高频输出局部角速度和比力。积分这些量可以在外部观测之间连续预测运动，但 bias 和噪声会经一次、二次积分累积，因此 IMU 提供的是高频相对运动约束，不是长期无漂移位姿。

## 1. 坐标和状态约定

令 $R=R_{W\leftarrow I}$ 把 IMU 系向量旋转到世界系，$p_W,v_W$ 是 IMU 原点在世界系的位置和速度。状态为

$$
x=(R,p,v,b_g,b_a).
$$

陀螺仪和加速度计 bias 均表达在 IMU 测量轴坐标中。重力 $g_W$ 表达在世界系；其符号必须与世界轴方向一致。

## 2. 陀螺仪测量

$$
\omega_m=\omega_{I}+b_g+n_g.
$$

$\omega_I$ 是 IMU 相对世界的真实角速度、表达在 I 系，$b_g$ 是缓慢变化 bias，$n_g$ 是白噪声。姿态运动学为

$$
\dot R=R[\omega_I]_\times
=R[\omega_m-b_g-n_g]_\times.
$$

若一步内去 bias 角速度常值，忽略噪声的名义积分为

$$
R_{k+1}=R_k\operatorname{Exp}((\omega_{m,k}-b_{g,k})\Delta t).
$$

矩阵指数保持 $R\in SO(3)$。对旋转矩阵做逐元素 Euler 加法后再随意归一化，会破坏明确的积分模型。

## 3. 加速度计测量的是比力

加速度计不是直接测 $a_W=\dot v_W$，而是测除去重力后的 proper acceleration 在 I 系的表达：

$$
a_m=R^\mathsf T(a_W-g_W)+b_a+n_a.
$$

移项得到

$$
a_W=R(a_m-b_a-n_a)+g_W.
$$

静止时 $a_W=0$，所以理想读数为 $a_m=-R^\mathsf Tg_W$，其大小约为重力加速度，而不是零。若世界 z 轴和重力符号约定相反，静止读数方向也相应变化。

## 4. 连续状态动力学

忽略地球自转、曲率和传感器杆臂等高阶模型时：

$$
\dot p=v,
\qquad
\dot v=R(a_m-b_a-n_a)+g,
$$

$$
\dot b_g=n_{bg},
\qquad
\dot b_a=n_{ba}.
$$

$n_{bg},n_{ba}$ 是 bias random walk 的驱动白噪声。把 bias 设为常数名义传播，不表示真实 bias 不变；其变化进入误差协方差。

## 5. 一种离散传播

在 $[t_k,t_{k+1}]$ 内假设去 bias 测量和 $R_k$ 近似常值：

$$
R_{k+1}=R_k\operatorname{Exp}(\hat\omega_k\Delta t),
$$

$$
v_{k+1}=v_k+(R_k\hat a_k+g)\Delta t,
$$

$$
p_{k+1}=p_k+v_k\Delta t+
\frac12(R_k\hat a_k+g)\Delta t^2.
$$

这是一种教学用零阶保持近似。真实系统可用中点积分，让旋转和加速度在步内变化；预积分也会选择特定离散模型。均值积分和协方差离散化必须匹配，否则报告的 $P$ 不再描述实际传播器。

## 6. 误差为何随时间积累

考虑常值小加速度 bias $\delta b_a$，姿态暂时准确：

$$
\delta v(t)\approx-R\delta b_a t,
\qquad
\delta p(t)\approx-\frac12R\delta b_a t^2.
$$

陀螺 bias 先造成姿态误差，进而把重力投影到错误方向。小角 $\delta\theta$ 下，重力引起的加速度误差量级约

$$
\delta a\approx-R[g_I]_\times\delta\theta,
$$

再积分到速度和位置。因而很小的姿态偏差也可能快速转化为位置漂移。

## 7. 高频预测的价值和边界

IMU 不依赖环境纹理或点云结构，采样频率高、延迟低，能在相机/LiDAR 两帧之间给出连续预测、deskew 所需时刻位姿和配准初值。外部几何观测再校正低频漂移和 bias。

但 correction 只能作用于观测真正约束的方向。长走廊、纯平面或低激励运动中，一些状态仍会弱可观；更高 IMU 频率不会自动提供缺失的绝对信息。

## 8. 初始姿态、重力和 bias

静止或低动态阶段，可由一段平均加速度估计重力方向，从而确定 roll/pitch；只靠重力不能确定绕重力的 yaw。静止陀螺平均值可近似初始化 gyro bias，但运动中的平均值混合了真实角速度。

加速度 bias 与重力方向、姿态和真实加速度耦合。缺少足够运动激励时，不能从短窗口唯一分离它们。初始化协方差应反映这种不确定性，而不是为了让滤波器“稳定”人为设得极小。

## 9. 时间同步和外参

LiDAR 点时刻 $t_p$ 的 deskew 要使用对应时刻的 IMU/状态。时间偏移 $\Delta t$ 使所用姿态误差一阶约为 $\|\omega\|\Delta t$，高速旋转时会把同一扫描扭曲成错误几何。

若 LiDAR 与 IMU 不共点，还需 $T_{I\leftarrow L}$。旋转时杆臂产生平移速度和加速度效应；PCD 世界对齐不能替代该传感器外参。

误差状态与协方差的完整推导见[ESKF](../probabilistic-estimation/error-state-kalman-filter.md)，跨关键帧压缩 IMU 的方法见[IMU 预积分](./imu-preintegration.md)。

## 参考资料

- [OpenVINS IMU Propagation Derivations](https://docs.openvins.com/propagation)。
- Solà，[Quaternion Kinematics for the Error-State Kalman Filter](https://arxiv.org/abs/1711.02508)。
- Barfoot，*State Estimation for Robotics*。
