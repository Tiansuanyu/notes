---
title: 扩展卡尔曼滤波（EKF）
description: 从非线性状态空间模型推导 EKF 预测、更新、Kalman Gain 与协方差一致性。
order: 10
---

# 扩展卡尔曼滤波（EKF）

Kalman Filter 对线性 Gaussian 系统给出递归后验的闭式解。机器人运动和相机/LiDAR 观测通常非线性，Extended Kalman Filter（EKF）用当前估计附近的一阶线性化传播均值和协方差。

## 1. 非线性状态空间模型

离散模型写为

$$
x_k=f(x_{k-1},u_k,w_k),
\qquad
z_k=h(x_k)+v_k,
$$

其中 $x_k\in\mathbb R^n$，$z_k\in\mathbb R^m$，$w_k\sim\mathcal N(0,Q_k)$，$v_k\sim\mathcal N(0,R_k)$。通常还假设两类噪声彼此独立并与过去状态误差独立；若存在相关性，标准公式需加入交叉项。

非线性变换后的 Gaussian 一般不再是 Gaussian。EKF 保留一个 Gaussian 近似 $\mathcal N(\hat x,P)$，并在局部用 Jacobian 描述扰动传播。

## 2. 预测为什么需要线性化

令 $x_{k-1}=\hat x_{k-1}^++\delta x$，在 $w=0$ 附近展开：

$$
f(x_{k-1},u_k,w_k)
\approx f(\hat x_{k-1}^+,u_k,0)
+F_k\delta x+G_kw_k,
$$

$$
F_k=\left.\frac{\partial f}{\partial x}\right|_{\hat x^+,0},
\qquad
G_k=\left.\frac{\partial f}{\partial w}\right|_{\hat x^+,0}.
$$

因此

$$
\hat x_k^-=f(\hat x_{k-1}^+,u_k,0),
$$

$$
P_k^-=F_kP_{k-1}^+F_k^\mathsf T+G_kQ_kG_k^\mathsf T.
$$

协方差形式来自线性误差 $\delta x_k\approx F_k\delta x_{k-1}+G_kw_k$。漏掉 $G$ 或单位转换错误，会把传感器噪声注入到错误状态方向。

## 3. 观测更新

在预测均值处线性化：

$$
h(x_k)\approx h(\hat x_k^-)+H_k(x_k-\hat x_k^-),
\qquad
H_k=\left.\frac{\partial h}{\partial x}\right|_{\hat x_k^-}.
$$

创新

$$
r_k=z_k-h(\hat x_k^-)
$$

近似满足

$$
r_k\approx H_k\delta x_k^-+v_k,
$$

其协方差为

$$
S_k=H_kP_k^-H_k^\mathsf T+R_k.
$$

Kalman Gain 与均值更新：

$$
K_k=P_k^-H_k^\mathsf TS_k^{-1},
\qquad
\hat x_k^+=\hat x_k^-+K_kr_k.
$$

实现应解关于 $S_k$ 的线性系统，不显式求逆。

## 4. Kalman Gain 的数学意义

考虑线性更新 $\hat x^+=\hat x^-+Kr$，误差为

$$
\delta x^+=(I-KH)\delta x^- - Kv.
$$

所以

$$
P^+(K)=(I-KH)P^-(I-KH)^\mathsf T+KRK^\mathsf T.
$$

对 $\operatorname{tr}P^+$ 关于 $K$ 求极值可得

$$
K=P^-H^\mathsf T(HP^-H^\mathsf T+R)^{-1}.
$$

它不是主观“预测/测量各占百分之多少”，而是在当前线性 Gaussian 模型下，以协方差和观测方向决定的最小均方误差权重。只有 $H=I$ 的标量情形才退化成直观的方差加权平均。

## 5. 协方差更新为何推荐 Joseph 形式

代入最优 $K$ 后可简写

$$
P^+=(I-KH)P^-.
$$

但有限精度下该式可能破坏对称或半正定。Joseph 形式

$$
P^+=(I-KH)P^-(I-KH)^\mathsf T+KRK^\mathsf T
$$

更直接保留两个误差来源。更新后仍常做对称化 $P\leftarrow(P+P^\mathsf T)/2$，但这不能修复错误模型或严重负特征值的根因。

## 6. Innovation 与统计门限

若模型、线性化和噪声假设成立，Normalized Innovation Squared

$$
\epsilon=r^\mathsf TS^{-1}r
$$

近似服从自由度为 $m$ 的 $\chi^2$ 分布，可用于门控。门限必须对应残差维度和期望显著性水平。

数据关联经过“选择最小残差”、RANSAC 或重复候选筛选后，残差分布可能不再满足简单 Gaussian 假设。卡方门控是模型一致性检查，不是地点身份正确概率。

## 7. EKF 的局限

- 一阶线性化在强非线性或大不确定性下可能偏差明显；
- 每次在变化估计处线性化可能改变理论不可观方向，使协方差过度自信；
- 单个 Gaussian 无法表达多个相离候选；
- 错误数据关联会作为高置信测量污染整个相关状态；
- 欧氏加法不适合直接更新受约束的旋转。

误差状态方法把名义姿态留在流形上，只让局部小误差进入 Gaussian，见下一篇[误差状态卡尔曼滤波](./error-state-kalman-filter.md)。

## 参考资料

- Barfoot，*State Estimation for Robotics*，Kalman filtering 与非线性估计章节。
- [OpenVINS IMU Propagation Derivations](https://docs.openvins.com/propagation)：具体惯性状态与协方差传播约定。
