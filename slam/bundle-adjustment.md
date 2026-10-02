---
title: Bundle Adjustment
order: 30
---

# Bundle Adjustment

Bundle Adjustment（BA）通过联合优化相机位姿与三维路标，使重投影误差最小。

## 目标函数

对相机位姿 $T_i$、路标 $P_j$ 和观测 $z_{ij}$，常见目标函数为：

$$
\min_{\{T_i\},\{P_j\}}
\sum_{(i,j) \in \mathcal{O}}
\left\|z_{ij} - \pi(T_i P_j)\right\|_{\Sigma_{ij}}^2
$$

其中 $\pi(\cdot)$ 表示相机投影模型。
