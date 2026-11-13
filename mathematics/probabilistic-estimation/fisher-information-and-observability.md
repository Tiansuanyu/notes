---
title: Fisher 信息、CRLB 与可观测性
description: 连接似然曲率、局部信息矩阵、Cramér–Rao 下界、动态可观测性和估计一致性。
order: 40
---

# Fisher 信息、CRLB 与可观测性

Hessian 小特征值、Fisher Information Matrix（FIM）和可观测性都在讨论“数据对哪些参数方向提供信息”，但它们的定义、条件和结论不同。把一次优化的 $J^\mathsf TJ$ 直接称为绝对精度证明，会跨越这些边界。

## 1. Fisher 信息的定义

参数 $\theta\in\mathbb R^n$、观测 $z\sim p(z;\theta)$，score 为

$$
s(z;\theta)=\frac{\partial}{\partial\theta}\log p(z;\theta).
$$

在正则条件下 $\mathbb E[s]=0$，FIM 为

$$
\mathcal I(\theta)
=\mathbb E\left[ss^\mathsf T\right]
=-\mathbb E\left[\frac{\partial^2}{\partial\theta\partial\theta^\mathsf T}
\log p(z;\theta)\right].
$$

它是对可能观测取期望的 likelihood 曲率。一次实际数据的负对数 likelihood Hessian 是 observed information，二者不能无条件互换。

## 2. Gaussian 测量的局部信息

若

$$
z=h(\theta)+v,
\qquad v\sim\mathcal N(0,R),
$$

且 $R$ 不随 $\theta$ 变化，则在真值附近

$$
\mathcal I(\theta)=H^\mathsf TR^{-1}H,
\qquad H=\frac{\partial h}{\partial\theta}.
$$

多条条件独立测量的信息可相加。相关观测需要联合协方差；把同源地图点或相邻点云点当独立，会夸大信息。

Gaussian 先验 $P_0$ 在 MAP 局部加入信息 $P_0^{-1}$。这说明强先验可以让 Hessian 满秩，但新增的是先验信息，不是传感器突然观测到了该方向。

## 3. Cramér–Rao 下界的条件

对满足正则条件的无偏估计器 $\hat\theta$，若 FIM 可逆：

$$
\operatorname{Cov}(\hat\theta)\succeq\mathcal I(\theta)^{-1}.
$$

这是在给定概率模型下可达到协方差的下界，不是某次算法误差的上界。有限样本、有偏估计、约束参数、奇异 FIM、多峰关联和模型失配都需要更谨慎的版本。

达到 CRLB 还要求估计器有效率；优化收敛或局部协方差等于 Hessian 逆，并不证明实际误差达到该界。

## 4. 动态系统的可观测性

线性时变误差系统

$$
\delta x_{k+1}=\Phi_k\delta x_k,
\qquad
r_k=H_k\delta x_k
$$

对初始误差的观测可堆叠为

$$
\begin{bmatrix}r_0\\r_1\\\vdots\\r_N\end{bmatrix}
=
\underbrace{
\begin{bmatrix}
H_0\\
H_1\Phi_0\\
\vdots\\
H_N\Phi_{N-1}\cdots\Phi_0
\end{bmatrix}}_{\mathcal O}
\delta x_0.
$$

$\mathcal O$ 的零空间是该轨迹和线性化下不可区分的误差方向。非线性系统常讨论局部弱可观测性，结论依赖状态、输入轨迹和测量类型；“系统总体可观”不代表当前短窗口的每个参数都被充分激励。

## 5. 信息矩阵与可观测矩阵的联系

若各时刻噪声协方差为 $R_k$，把观测搬回初始状态后，局部信息近似

$$
\Lambda=\mathcal O^\mathsf T
\operatorname{blkdiag}(R_0^{-1},\ldots,R_N^{-1})\mathcal O.
$$

因此 $\mathcal O$ 的零空间也落在 $\Lambda$ 的零空间；小特征值表示在选定单位和尺度下的弱方向。但特征值大小会受参数单位和 scaling 影响，跨系统直接比较前应先统一参数化。

## 6. Gauge freedom、退化和弱约束

- **Gauge freedom**：整体平移、全局 yaw 等变换不改变所有观测，是问题本身的对称性。
- **运动退化**：传感器模型理论上可估某参数，但当前运动没有激励，例如静止时难以分离某些 bias。
- **场景退化**：点都落在单平面或走廊方向，使某些位姿方向弱约束。
- **数值病态**：理论信息存在，但尺度或离散计算使求解不稳定。

固定首帧或加入先验可以选择 gauge，却不等于获得该方向的绝对世界信息。走出走廊或增加非共面结构则可能真正改善几何可观测性。

## 7. EKF 一致性

一致性要求实际误差统计与滤波器报告的协方差相容。EKF 在不断变化的估计点线性化，可能使理论不可观方向在离散线性系统中被错误地变成可观，从而协方差过小。

First-Estimate Jacobian（FEJ）和 observability-constrained 方法试图保持正确的零空间结构。它们解决的是线性化一致性，不会修复错误数据关联、错误外参或未建模噪声。

## 8. LIO 中的例子

点到面残差对位姿的 Jacobian沿法向提供信息。若局部地图几乎只有一面墙，沿墙切向平移和绕法向旋转可能弱约束；若 IMU 在短时间提供姿态/运动预测，它能耦合这些状态，但 bias、重力、外参与时间偏移仍取决于运动激励。

OctVox、k-d tree 或 HKNN 改变地图存储和对应搜索效率，也会通过被选中的点/法向间接影响观测矩阵；它们本身不改变 FIM 和可观测性的定义。

## 9. 应如何报告结论

更准确的表述是：“在给定噪声、线性化点、轨迹和参数尺度下，局部信息矩阵显示某方向较弱。”不要写成“最小特征值大，所以系统绝对准确”。独立真值仍是验证准确性的另一层证据。

## 参考资料

- Huang、Mourikis、Roumeliotis，[Observability-based Rules for Designing Consistent EKF SLAM Estimators](https://doi.org/10.1177/0278364909353640)，IJRR 2010。
- Yang 与 Huang，[Observability Analysis of Aided INS with Heterogeneous Features of Points, Lines and Planes](https://arxiv.org/abs/1805.05876)，2018。
- [OpenVINS First-Estimate Jacobian 文档入口](https://docs.openvins.com/pages)。
