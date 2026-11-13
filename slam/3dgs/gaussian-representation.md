---
title: 三维高斯场景表示
order: 10
---

# 三维高斯场景表示

3DGS 的核心不是“把点画大一点”，而是把场景写成一组可优化的各向异性三维高斯。每个 primitive 同时承担局部空间支撑、透明度和视角相关外观；所有 primitive 一起近似场景的可见辐射。

## 1. 与其他三维表示的差别

| 表示 | 基本元素 | 几何/外观查询 | 典型优势 | 主要限制 |
| --- | --- | --- | --- | --- |
| Point Cloud | 离散点及属性 | 查附近点 | 直接、易由传感器产生 | 无连续表面，直接渲染易有孔洞 |
| Mesh | 顶点、边、三角面 | 求射线与三角形交点 | 表面拓扑明确，图形硬件支持成熟 | 建拓扑困难，细碎或半透明结构难表达 |
| Voxel | 规则/稀疏网格单元 | 查体素 | 邻接与占据定义清楚 | 分辨率和存储成本强耦合 |
| NeRF | 神经网络隐式辐射场 | 沿射线多点查询网络 | 连续表示、视图合成质量高 | 每像素多次网络求值，显式编辑不直接 |
| 3DGS | 显式各向异性 Gaussian | 投影为 2D 椭圆并合成 | 可微、实时渲染、参数可直接编辑 | primitive 数量可很大，透明合成依赖顺序 |

这些表示不是按质量排成的替代关系。例如 SLAM 稀疏 landmark 适合几何匹配，mesh 适合碰撞和表面拓扑，3DGS 更偏向可微的新视角合成。将 3DGS 用作机器人地图时，还需另行定义可通行性、长期一致性和定位观测模型。

## 2. 一个 Gaussian 存什么

第 $i$ 个 Gaussian 可写成

$$
\mathcal G_i=\{\boldsymbol\mu_i,\mathbf q_i,\mathbf s_i,o_i,
\mathbf c_i\},
$$

其中：

- $\boldsymbol\mu_i\in\mathbb R^3$ 是世界坐标中的中心；
- $\mathbf q_i$ 是旋转四元数，归一化后得到 $\mathbf R_i\in SO(3)$；
- $\mathbf s_i\in\mathbb R_+^3$ 是三个主轴尺度；
- $o_i\in(0,1)$ 是激活后的 opacity；
- $\mathbf c_i$ 是 RGB 各通道的球谐（SH）系数。

空间核通常写为

$$
G_i(\mathbf x)=\exp\left[-\frac12
(\mathbf x-\boldsymbol\mu_i)^\mathsf T
\boldsymbol\Sigma_i^{-1}
(\mathbf x-\boldsymbol\mu_i)\right].
$$

这里没有把 $G_i$ 归一化为概率密度；它是计算屏幕空间贡献的形状函数，opacity 另行控制最大不透明度。因而不能把 $\boldsymbol\Sigma$ 直接解释为通过统计采样得到的测量协方差。

## 3. 为什么用尺度和旋转表示协方差

直接优化对称矩阵不能自动保证正定。3DGS 改为

$$
\boldsymbol\Sigma_i
=\mathbf R_i\operatorname{diag}(s_{ix}^2,s_{iy}^2,s_{iz}^2)\mathbf R_i^\mathsf T.
$$

只要尺度为正，$\boldsymbol\Sigma_i$ 就是半正定的椭球。实现中常优化未约束的 log-scale $\hat{\mathbf s}$，用 $\mathbf s=\exp(\hat{\mathbf s})$ 激活；旋转则优化四元数并归一化。课程项目的 [`GaussianModel.setup_functions()`](https://github.com/Tiansuanyu/gaussian-grouping-project/blob/23feeef7ded25b2374fbb027d667e91500efd1d0/scene/gaussian_model.py) 正是这样构造 $\mathbf L=\mathbf R\operatorname{diag}(\mathbf s)$，再取 $\boldsymbol\Sigma=\mathbf L\mathbf L^\mathsf T$。

各向异性很重要：墙面附近的 Gaussian 可以沿表面铺开而在法向方向变薄，比同数量的球形 blob 更有效地覆盖局部表面。但它仍是辐射场 primitive，不保证其某个等值面就是物理表面。

## 4. 从三维协方差到屏幕椭圆

设 world-to-camera 旋转为 $\mathbf R_{CW}$，相机坐标中心

$$
\boldsymbol\mu_C=\mathbf R_{CW}\boldsymbol\mu_W+\mathbf t_{CW},
$$

针孔投影为

$$
\pi([x,y,z]^\mathsf T)=
\begin{bmatrix}f_xx/z+c_x\\ f_yy/z+c_y\end{bmatrix}.
$$

在 $\boldsymbol\mu_C$ 附近一阶线性化，Jacobian 为

$$
\mathbf J=
\begin{bmatrix}
f_x/z & 0 & -f_xx/z^2\\
0 & f_y/z & -f_yy/z^2
\end{bmatrix}.
$$

于是屏幕空间协方差近似为

$$
\boldsymbol\Sigma_{2D}
\approx \mathbf J\mathbf R_{CW}
\boldsymbol\Sigma_W
\mathbf R_{CW}^\mathsf T\mathbf J^\mathsf T.
$$

这是局部仿射近似：Gaussian 很大、离相机过近或跨越强透视区域时，一阶模型会变差。实现还会给对角线加低通项，避免 footprint 小于像素后出现数值奇异和采样混叠。光栅器保存的 conic 是 $\boldsymbol\Sigma_{2D}^{-1}$ 的紧凑形式，方便每个像素计算二维 Mahalanobis 距离。

注意这里的 $\mathbf J$ 是**透视投影 Jacobian**。它不同于机器人运动学 Jacobian，也不同于李群扰动到残差的优化 Jacobian；共同点只是都描述局部一阶变化率。

## 5. 外观为何用球谐函数

同一位置在不同观察方向可能有高光和视角相关颜色。对观察方向 $\mathbf d$，每个颜色通道可写为

$$
c(\mathbf d)=\sum_{\ell=0}^{L}\sum_{m=-\ell}^{\ell}
c_{\ell m}Y_{\ell m}(\mathbf d).
$$

$L=0$ 只有常量颜色；更高阶提供更强的方向变化能力，也增加参数和优化难度。SH 不是材质、光源和几何的物理解耦模型，而是低阶方向函数近似。因此编辑光照或迁移到很远的新视角时，不能默认它具备物理一致性。

## 6. 初始化与参数身份

典型 3DGS 先由 SfM 得到相机 Pose 和稀疏点：点坐标初始化 $\boldsymbol\mu$，点颜色初始化 SH 的 DC 项，邻点距离给尺度初值；opacity、旋转和更高阶 SH 再由训练优化。课程项目的 [`create_from_pcd()`](https://github.com/Tiansuanyu/gaussian-grouping-project/blob/23feeef7ded25b2374fbb027d667e91500efd1d0/scene/gaussian_model.py) 延续了这条路径，并额外创建 16 维 identity encoding。

“由 SfM 初始化”不等于 Gaussian 就是 SfM landmark：训练会移动、复制、分裂和删除 Gaussian，且它们没有传统 track/observation 语义。下一篇从投影后的 2D ellipse 继续解释[Gaussian Splatting 渲染](./gaussian-splatting-rendering.md)。

