---
title: IMU 预积分
description: 推导关键帧之间的旋转、速度、位置增量，说明 bias 修正、残差和协方差传播。
order: 20
---

# IMU 预积分

优化式 VIO/LIO 如果每次状态变化都从头积分关键帧之间的所有 IMU，会反复做大量相同计算。预积分把高频测量压缩成只依赖关键帧 $i$ 局部坐标和某个 bias 线性化点的相对增量。

## 1. 从状态传播中分离初始状态

采用 $R_{W\leftarrow I}$，忽略噪声时

$$
R_j=R_i\Delta R_{ij},
$$

$$
v_j=v_i+g\Delta t_{ij}+R_i\Delta v_{ij},
$$

$$
p_j=p_i+v_i\Delta t_{ij}
+\frac12g\Delta t_{ij}^2+R_i\Delta p_{ij}.
$$

$\Delta R,\Delta v,\Delta p$ 都表达在时刻 $i$ 的 IMU 局部参考中，不依赖 $R_i,p_i,v_i$ 的世界数值。这样优化改变关键帧状态时，可以复用同一预积分量。

## 2. 离散递推

在 bias 线性化点 $\bar b_g,\bar b_a$，令

$$
\tilde\omega_k=\omega_{m,k}-\bar b_g,
\qquad
\tilde a_k=a_{m,k}-\bar b_a.
$$

从 $\Delta R_{ii}=I,\Delta v_{ii}=0,\Delta p_{ii}=0$ 开始，一种零阶保持递推为

$$
\Delta R_{i,k+1}=\Delta R_{ik}
\operatorname{Exp}(\tilde\omega_k\Delta t_k),
$$

$$
\Delta v_{i,k+1}=\Delta v_{ik}
+\Delta R_{ik}\tilde a_k\Delta t_k,
$$

$$
\Delta p_{i,k+1}=\Delta p_{ik}+\Delta v_{ik}\Delta t_k
+\frac12\Delta R_{ik}\tilde a_k\Delta t_k^2.
$$

中点或流形预积分会修改步内近似。关键不是背某一离散式，而是记录实现采用的积分规则、旋转扰动和噪声离散化。

## 3. 为什么预积分对 bias 仍有依赖

去 bias 测量使用了 $\bar b$。优化后若 bias 变为 $\bar b+\delta b$，无需立即重积分，可用一阶修正：

$$
\Delta R(b_g)\approx
\Delta\bar R\operatorname{Exp}(J_{R,b_g}\delta b_g),
$$

$$
\Delta v(b_g,b_a)\approx
\Delta\bar v+J_{v,b_g}\delta b_g+J_{v,b_a}\delta b_a,
$$

$$
\Delta p(b_g,b_a)\approx
\Delta\bar p+J_{p,b_g}\delta b_g+J_{p,b_a}\delta b_a.
$$

这些 Jacobian 在逐个 IMU 样本积分时同步递推。若 bias 修正远离线性化点，一阶近似不再可靠，应重新预积分。

## 4. IMU 因子残差

一种右乘旋转残差为

$$
r_R=\operatorname{Log}\left(
\Delta R(b_g)^{-1}R_i^\mathsf TR_j
\right)^\vee,
$$

$$
r_v=R_i^\mathsf T(v_j-v_i-g\Delta t)-\Delta v(b_g,b_a),
$$

$$
r_p=R_i^\mathsf T
\left(p_j-p_i-v_i\Delta t-\frac12g\Delta t^2\right)
-\Delta p(b_g,b_a).
$$

再加入 bias random-walk 残差，例如

$$
r_{bg}=b_{g,j}-b_{g,i},
\qquad
r_{ba}=b_{a,j}-b_{a,i}.
$$

残差整体维度和 bias 是否放在同一 factor 取决于实现。GTSAM 的不同 IMU factor/preintegration backend 也有不同状态组织，使用时要核对版本和 ordering。

## 5. 预积分噪声怎样传播

把预积分误差记为

$$
\delta y=(\delta\theta,\delta p,\delta v)
$$

或实现采用的其他顺序。每个 IMU 步可写

$$
\delta y_{k+1}=A_k\delta y_k+B_kn_k,
$$

于是

$$
P_{k+1}=A_kP_kA_k^\mathsf T+B_kQ_kB_k^\mathsf T.
$$

最终 $P_{ij}$ 用于白化 $r_R,r_p,r_v$。旋转、速度和位置误差在积分中相关，不能只给三个独立标量方差。连续噪声密度转换成每步 $Q_k$ 时必须包含采样时间和单位。

## 6. 预积分与直接传播不同在哪里

直接传播从当前绝对状态得到下一时刻状态，适合高频滤波预测。预积分构造关键帧之间的相对测量，适合平滑/因子图中反复优化端点状态。二者使用同一 IMU 物理模型，但计算组织和误差坐标不同。

预积分不是把一段 IMU “平均成一个样本”，也不会消除 bias、时间偏移或积分漂移。它只是避免端点状态变化时重复处理全部原始样本。

## 7. 重力、外参和时间偏移

上式假设 IMU 时间和关键帧边界已确定。若估计 camera/LiDAR–IMU 时间偏移，区间内包含哪些样本、边界插值和 deskew 时刻都可能变化；仅在最终残差上加一个时间变量不一定充分。

预积分在 IMU frame 间建立约束。相机或 LiDAR 观测还要通过外参连接到 IMU 状态；把外参锁错会由位姿、bias 或地图结构吸收一部分误差。

## 8. 适用边界

- 长时间间隔会放大积分误差和 bias 一阶修正误差；
- 丢包、时间戳倒序和可变采样间隔必须显式处理；
- 预积分 covariance 是模型内部不确定性，不是绝对轨迹精度证明；
- 不同论文的 $\Delta p,\Delta v$ 顺序、左右误差和重力符号可能不同。

## 参考资料

- Forster、Carlone、Dellaert、Scaramuzza，[IMU Preintegration on Manifold for Efficient Visual-Inertial Maximum-a-Posteriori Estimation](https://www.roboticsproceedings.org/rss11/p06.html)，RSS 2015。
- [GTSAM Navigation / IMU Preintegration 文档](https://borglab.github.io/gtsam/navigation/)：当前版本包含 manifold、tangent 等多种 backend，不能假定默认实现永远不变。
- [OpenVINS IMU Propagation Derivations](https://docs.openvins.com/propagation)。
