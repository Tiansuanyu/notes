---
title: Schur Complement 与变量消元
description: 从块线性系统推导 Schur 补，解释 BA、边缘化、稀疏性和协方差之间的关系。
order: 30
---

# Schur Complement 与变量消元

SLAM 和 Bundle Adjustment（BA）的状态可能很大，但每个地图点只被少量相机观测。Schur Complement 利用这种块结构先消去一组变量，得到规模更小的约化系统。

## 1. 从块方程直接推导

线性化后的正规方程按保留变量 $c$ 和待消元变量 $p$ 分块：

$$
\begin{bmatrix}
B&E\\E^\mathsf T&C
\end{bmatrix}
\begin{bmatrix}\delta c\\\delta p\end{bmatrix}
=-
\begin{bmatrix}g_c\\g_p\end{bmatrix}.
$$

第二行给出

$$
E^\mathsf T\delta c+C\delta p=-g_p,
$$

若 $C$ 在所处理子空间可逆，则

$$
\delta p=-C^{-1}(g_p+E^\mathsf T\delta c).
$$

代回第一行：

$$
(B-EC^{-1}E^\mathsf T)\delta c
=-g_c+EC^{-1}g_p.
$$

定义 Schur 补

$$
S=B-EC^{-1}E^\mathsf T.
$$

先解 $S\delta c$，再回代求 $\delta p$。公式中的 $C^{-1}$ 是数学记号，实现应对每个块做求解，避免显式求逆。

## 2. 为什么 BA 特别适合

标准 BA 中，一个重投影残差连接一台相机和一个三维点；不同点之间通常没有直接残差。因此把所有点排在 $p$ 中时，$C$ 是由小型点块组成的块对角矩阵，消元可并行完成。

消去点后，共同看见某点的相机之间产生连接。$S$ 的稀疏模式近似相机共视图；观测越密，消元产生的 fill-in 越多。Schur 并没有“消除计算”，而是把点变量影响压缩到相机系统中。

## 3. 概率解释

对联合 Gaussian 信息矩阵

$$
\Lambda=\begin{bmatrix}B&E\\E^\mathsf T&C\end{bmatrix},
$$

消去 $p$ 后，$c$ 的边缘信息矩阵正是 $S$。这解释为什么被消元变量虽然不再显式出现，其信息仍通过新先验保留。

但“消元”和“把变量固定在当前值”不同：固定会丢掉其不确定性并让系统过度自信；正确边缘化会把不确定性传播给保留变量。

## 4. Schur 与协方差块

块矩阵求逆表明，在适当可逆条件下，$c$ 的边缘协方差为

$$
\Sigma_{cc}=S^{-1}.
$$

这不是说优化 Hessian 的任意对角块倒数就是边缘方差。必须处理所有耦合、噪声尺度、gauge freedom 和线性化条件；奇异信息矩阵下还需约束规范或使用广义逆并明确子空间。

## 5. 滑窗边缘化

滑窗把旧状态记为 $m$，保留状态记为 $r$，同样可用 Schur 补生成关于 $r$ 的先验。难点在于原问题非线性：先验是在某个线性化点形成的。之后若保留变量移动很远，却把旧先验当作可任意重线性化的新因子，会改变历史信息的语义。

因此工程中需要记录边缘化点、误差参数化和 Jacobian 约定。FEJ 等方法的动机之一，就是避免每次在不一致的新点上线性化而凭空改变不可观方向。

## 6. 消元顺序决定计算量

一般稀疏图中，消去一个变量会把它的邻居连接起来。不同顺序产生不同 fill-in。BA 先消点是一种利用问题结构的顺序；因子图求解器还会用 AMD、nested dissection 等策略减少填充。

Ceres 的 Schur 求解器包括 dense、sparse 和 iterative 变体。迭代 Schur 可只计算矩阵—向量积而不显式构造完整 $S$，但收敛依赖预条件器和条件数。

## 7. 与 Kalman 更新的联系

线性 Gaussian 条件化、Kalman 更新和最小二乘消元可以导出等价结果：它们都是对联合 Gaussian 的不同计算组织。区别在于在线滤波通常按时间顺序压缩历史，平滑/BA 保留一组状态并允许重线性化。数学等价需要相同线性模型、先验和噪声，不能无条件外推到非线性实现。

## 8. 常见误区

- Schur 补不只用于 BA；任何合适的块系统都可使用。
- $C$ 病态或含 gauge 时，不能未经处理直接声称可逆。
- 边缘化保留局部 Gaussian 信息，不保留所有非线性、多峰历史。
- 变量数量更少不必然更快；$S$ 可能因 fill-in 变稠密。

## 参考资料

- [Ceres Solver：Schur 求解与 Bundle Adjustment](https://ceres-solver.readthedocs.io/latest/nnls_solving.html)。
- [GTSAM 文档](https://gtsam.org/docs/)：因子图、变量消元和 Bayes tree 的实现入口。
- Dellaert 与 Kaess，*Factor Graphs for Robot Perception*。
