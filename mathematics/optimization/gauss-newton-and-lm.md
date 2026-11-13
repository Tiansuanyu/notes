---
title: Gauss–Newton 与 Levenberg–Marquardt
description: 推导 GN 局部二次模型、LM 阻尼与信赖域比率，并比较梯度下降和 Newton 法。
order: 20
---

# Gauss–Newton 与 Levenberg–Marquardt

Gauss–Newton（GN）利用最小二乘的特殊结构近似 Hessian；Levenberg–Marquardt（LM）在局部模型不可靠时加入阻尼。二者解决的是“当前线性化给出的步子该怎样算和信多少”，不是全局搜索。

## 1. GN 的局部模型

对白化残差 $e(x)$，在 $x_k$ 附近：

$$
e(x_k\boxplus\delta)\approx e_k+J_k\delta.
$$

代入 $F=\frac12\|e\|^2$：

$$
m_k(\delta)=F_k+g_k^\mathsf T\delta+
\frac12\delta^\mathsf TH_k\delta,
$$

其中

$$
g_k=J_k^\mathsf Te_k,
\qquad H_k=J_k^\mathsf TJ_k.
$$

若 $H_k$ 正定，最小点满足

$$
H_k\delta_{GN}=-g_k.
$$

更新 $x_{k+1}=x_k\boxplus\delta_{GN}$ 后必须重新计算残差和 Jacobian。只在第一次线性化后连续解同一个系统，不是在运行 GN。

## 2. 与 Newton 和梯度下降比较

Newton 法使用真实 Hessian

$$
\nabla^2F=J^\mathsf TJ+\sum_i e_i\nabla^2e_i,
$$

局部二次收敛条件更强，但计算二阶残差导数昂贵，而且 Hessian 可能不正定。GN 丢弃第二项，保留半正定结构；当残差小或模型近似线性时近似较好。

梯度下降取 $\delta=-\alpha g$，不解曲率系统，便宜但对尺度和病态方向敏感。GN 用 $J^\mathsf TJ$ 对梯度进行几何缩放，通常能更快处理不同参数方向。

## 3. LM 阻尼

LM 常解

$$
(J^\mathsf TJ+\lambda D)\delta=-J^\mathsf Te,
$$

$D$ 可取 $I$ 或 $\operatorname{diag}(J^\mathsf TJ)$ 等尺度矩阵。$\lambda\to0$ 时接近 GN；$\lambda$ 很大且 $D=I$ 时

$$
\delta\approx-\frac1\lambda g,
$$

方向接近小步长梯度下降。

LM 也可由信赖域理解：限制 $\|D^{1/2}\delta\|\le\Delta$，只在当前模型可信的邻域内搜索。$\lambda$ 是约束的拉格朗日乘子式表达，不应机械地每轮固定乘除而不检查实际下降。

## 4. 用下降比率调节信赖程度

模型预测下降

$$
\Delta m=m_k(0)-m_k(\delta),
$$

真实下降

$$
\Delta F=F(x_k)-F(x_k\boxplus\delta).
$$

定义

$$
\rho=\frac{\Delta F}{\Delta m}.
$$

$\rho$ 接近 1 表示局部模型预测可靠，可以接受步长并扩大信赖域；$\rho$ 小或为负表示模型差，应拒绝或缩小步长。具体阈值和 $\lambda$ 更新规则属于求解器策略，不是算法唯一公式。

## 5. 阻尼与正则化不是同一件事

LM 的阻尼主要服务于当前迭代的数值稳定和信赖域，通常会随迭代变化。MAP 先验或长期正则项表达问题本身的概率/偏好，即使收敛也仍存在。把 $\lambda I$ 当作传感器先验，会混淆算法稳定手段和真实信息。

## 6. 秩亏时会发生什么

若 $J$ 列不满秩，$J^\mathsf TJ$ 奇异。LM 加 $\lambda I$ 可让线性系统可解，却只是在弱方向选择了一个数值步，不表示这些方向被观测到。SLAM 的 gauge freedom 应通过固定规范、零空间方法或合适先验明确处理。

形成正规方程还会平方条件数。条件差时 QR 或 SVD 更稳健；大规模稀疏问题常在精度、内存和速度之间选择稀疏 Cholesky、Schur 或迭代求解器。

## 7. 流形状态上的 GN/LM

位姿参数的 $\delta$ 位于当前切空间。每次接受步长后，切空间基点改变：

$$
T_{k+1}=\operatorname{Exp}(\delta\xi)T_k
\quad\text{或}\quad
T_{k+1}=T_k\operatorname{Exp}(\delta\xi).
$$

残差 Jacobian、阻尼尺度和先验都必须使用同一左右扰动约定。直接把四元数四个分量当独立欧氏变量求 GN，会引入单位范数冗余，除非求解器显式提供 manifold parameterization。

## 8. 适用边界

- 初值落在错误几何候选时，LM 只会更稳地优化该局部候选。
- 增加迭代次数不能替代正确数据关联和粗初始化。
- cost 下降不保证物理正确，尤其在重复结构和错误标定下。
- 自动微分保证所写程序的导数一致，不保证残差模型正确。

## 参考资料

- [Ceres Solver：Non-linear Least Squares Solving](https://ceres-solver.readthedocs.io/latest/nnls_solving.html)：LM、Dogleg、线性求解器与信赖域实现边界。
- Nocedal 与 Wright，*Numerical Optimization*，关于 Newton、信赖域与收敛条件。
