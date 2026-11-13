---
title: 状态空间、可控性与 LQR
description: 推导状态反馈、可控性、LQR 与 Riccati 方程，并区分控制与估计可观测性。
order: 50
---

# 状态空间、可控性与 LQR

考虑线性时不变系统

$$
\dot x=Ax+Bu,
\qquad y=Cx+Du.
$$

$x\in\mathbb R^n$、$u\in\mathbb R^m$、$y\in\mathbb R^p$。状态空间保留内部动态，适合多输入多输出系统；同一输入输出传递函数可以对应不同坐标下的状态实现。

## 1. 可控性

连续系统的可控性矩阵为

$$
\mathcal C=[B\ AB\ A^2B\ \cdots\ A^{n-1}B].
$$

若 $\operatorname{rank}(\mathcal C)=n$，任意初态可在有限时间由合适输入移到任意终态。不可控模态若本身不稳定，则任何状态反馈都无法稳定它；这比“某个控制器没有调好”更根本。

数值上直接计算高次幂可能病态，工程实现常使用分解或系统库的稳定算法。满秩也不代表控制代价合理：极弱可控方向可能需要过大输入。

## 2. 状态反馈与极点

取

$$
u=-Kx+Nr,
$$

闭环动力学为 $\dot x=(A-BK)x+BNr$。极点配置直接选择 $A-BK$ 的特征值；LQR 则通过代价权衡自动产生 $K$。

## 3. 连续时间 LQR

无限时域代价

$$
J=\int_0^\infty
(x^\mathsf TQx+u^\mathsf TRu)\,dt,
\qquad Q\succeq0,\ R\succ0.
$$

Hamilton–Jacobi–Bellman 方程假设值函数 $V=x^\mathsf TPx$，得到连续代数 Riccati 方程

$$
A^\mathsf TP+PA-PBR^{-1}B^\mathsf TP+Q=0,
$$

最优反馈为

$$
u^*=-Kx,
\qquad K=R^{-1}B^\mathsf TP.
$$

在 $(A,B)$ stabilizable 且 $(Q^{1/2},A)$ detectable 等条件下，可得到稳定化解。$Q,R$ 是代价权重，不是状态/控制的概率协方差；量纲缩放会直接影响权衡。

## 4. 离散时间 LQR

对 $x_{k+1}=A_dx_k+B_du_k$，Riccati 递推为

$$
P_k=Q+A_d^\mathsf TP_{k+1}A_d
-A_d^\mathsf TP_{k+1}B_d
(R+B_d^\mathsf TP_{k+1}B_d)^{-1}
B_d^\mathsf TP_{k+1}A_d,
$$

控制增益

$$
K_k=(R+B_d^\mathsf TP_{k+1}B_d)^{-1}
B_d^\mathsf TP_{k+1}A_d.
$$

有限时域得到时变 $K_k$；无限时域在适当条件下收敛到离散代数 Riccati 解。连续和离散 Riccati 方程不能混用。

## 5. 跟踪、积分与前馈

LQR 原式调节到零点。跟踪非零参考可在线性化误差坐标中设计，或加入稳态前馈。若要消除常值扰动造成的稳态误差，可把积分状态

$$
\dot x_I=r-y
$$

并入增广系统，再对增广系统设计 LQR。必须先检查增广系统可控性，不能只添加积分器而忽略饱和。

## 6. 两种“可观测性”

控制理论中，线性系统可观测矩阵

$$
\mathcal O=
\begin{bmatrix}C\\CA\\\vdots\\CA^{n-1}\end{bmatrix}
$$

满列秩表示可从有限时域输出恢复初始状态。SLAM/VIO 中的非线性局部可观测性也研究“观测是否足以区分状态”，但会受轨迹、线性化点、gauge freedom 和传感器模型影响；详见[Fisher 信息、CRLB 与可观测性](../probabilistic-estimation/fisher-information-and-observability.md)。可控性讨论输入能否驱动状态，可观测性讨论输出能否区分状态，两者不要互换。

LQR 假定可获得状态；实际常由 observer/Kalman filter 提供估计。线性 Gaussian 条件下 LQG 有分离原理，但非线性、饱和、约束和模型误差下不能无条件照搬。
