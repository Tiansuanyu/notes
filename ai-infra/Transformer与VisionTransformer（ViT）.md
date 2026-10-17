---
title: Transformer 与 Vision Transformer（ViT）
order: 40
---

# Transformer 与 Vision Transformer（ViT）

Vision Transformer（ViT）把图像变成一串 token，再用 Transformer Encoder 让不同图像区域交换信息。理解它时，最重要的是沿着一条完整数据流追踪张量：

```text
图像 → patch 切分 → 线性嵌入 → 加入位置编码
     → Transformer Encoder → CLS / patch 特征
```

这也是继续学习 DINOv2、VGGT 和 LingBot-Map 的架构基础。通用的 shape、dtype、layout 与自动微分见[张量、算子与神经网络计算](./张量、算子与神经网络计算.md)。

## 1. 图像怎样变成 patch

设输入图像为

$$
X_{img}\in\mathbb{R}^{B\times C\times H\times W},
$$

其中 $B$ 是 batch，$C$ 是通道数。ViT 用边长为 $P$ 的不重叠 patch 划分图像；若 $H,W$ 都能被 $P$ 整除，patch 数为

$$
N=\frac{H}{P}\frac{W}{P}.
$$

每个 patch 的形状为 $[C,P,P]$，展平后长度是 $CP^2$。把所有 patch 排成序列，得到

$$
X_{patch}\in\mathbb{R}^{B\times N\times(CP^2)}.
$$

patch 是规则图像区域，不是传统特征检测器找到的关键点。它覆盖整张图，边界由网格和 $P$ 决定。

## 2. 线性嵌入把每个 patch 投影为 token

共享线性层将每个展平 patch 投影到隐藏维度 $D$：

$$
Z_0=X_{patch}E+b,
\qquad E\in\mathbb{R}^{(CP^2)\times D},
$$

因此 $Z_0\in\mathbb{R}^{B\times N\times D}$。工程实现常用 `Conv2d(C, D, kernel_size=P, stride=P)` 一次完成切块和投影，输出先是 $[B,D,H/P,W/P]$，再展平、转置成 $[B,N,D]$。

“线性嵌入”不是把整张图压成一个向量；它对每个 patch 使用同一组投影参数，仍保留 token 在网格中的位置身份。

## 3. CLS token 与位置编码

原始 ViT 在 patch 序列前拼接一个可学习的 `[CLS]` token：

$$
Z_{cls}\in\mathbb{R}^{B\times1\times D},\qquad
Z=[Z_{cls};Z_0]\in\mathbb{R}^{B\times(N+1)\times D}.
$$

随后加入位置编码 $P_{pos}$：

$$
Z\leftarrow Z+P_{pos},
\qquad P_{pos}\in\mathbb{R}^{1\times(N+1)\times D}.
$$

self-attention 单看 token 内容并不知道左上角和右下角的区别；位置编码提供排列/空间位置线索。它可以是学习参数，也可以由二维位置生成。输入分辨率改变时，学习式位置编码通常需要插值或其他适配；插值成功不表示几何精度天然不变。

CLS token 是聚合整幅图像信息的一种设计，不是所有视觉 Transformer 都必须使用。DINOv2 还可能包含 register token；多视图模型也可以加入 camera token 或轨迹 query，这些特殊 token 的任务语义由训练目标决定。

## 4. Transformer Encoder 内部发生什么

ViT 通常堆叠 $L$ 个 Encoder block。以常见的 pre-norm 形式表示，第 $\ell$ 层为

$$
U_\ell=Z_{\ell-1}+\operatorname{MSA}(\operatorname{LN}(Z_{\ell-1})),
$$

$$
Z_\ell=U_\ell+\operatorname{MLP}(\operatorname{LN}(U_\ell)).
$$

LayerNorm 稳定特征尺度；多头 self-attention（MSA）让 token 读取其他位置；MLP/FFN 对每个 token 独立做通道变换；残差连接保留输入并改善深层优化。

对某个注意力头，输入投影为

$$
Q=ZW_Q,\qquad K=ZW_K,\qquad V=ZW_V,
$$

再计算

$$
\operatorname{Attention}(Q,K,V)
=\operatorname{softmax}\!\left(\frac{QK^\top}{\sqrt{d_h}}+M\right)V.
$$

$d_h=D/h$ 是每个头的宽度，$h$ 是头数，$M$ 是可选 mask。注意力权重表示本层的信息混合比例，不自动等于像素对应、几何内点概率或校准后的置信度。

一个极小例子：令 $Q=K=\begin{bmatrix}1&0\\0&1\end{bmatrix}$、$V=\begin{bmatrix}2&0\\0&4\end{bmatrix}$。忽略缩放时，第一个 query 的 logits 是 $[1,0]$，softmax 后约为 $[0.731,0.269]$，输出约为 $[1.462,1.076]$。它混合两个 value，而不是硬选择一个 patch。

## 5. 完整张量形状示例：ViT-B/16

假设：

- batch $B=2$；
- RGB 输入 $[2,3,224,224]$；
- patch 大小 $P=16$；
- 隐藏维度 $D=768$；
- 注意力头数 $h=12$，因此 $d_h=64$。

张量沿主链变化如下：

| 阶段 | 张量形状 | 含义 |
| --- | --- | --- |
| 输入图像 | `[2, 3, 224, 224]` | 两张 RGB 图像 |
| patch 网格 | `14 × 14` | 每张图得到 196 个 patch |
| patch 展平 | `[2, 196, 768]` | $3\times16\times16=768$；这里只是恰好等于 $D$ |
| 线性嵌入 | `[2, 196, 768]` | 每个 patch 投影为一个 768 维 token |
| 拼接 CLS | `[2, 197, 768]` | 196 个 patch token 加 1 个 CLS token |
| 加位置编码 | `[2, 197, 768]` | shape 不变，加入位置信息 |
| 每头 Q/K/V | `[2, 12, 197, 64]` | 12 个注意力头 |
| 注意力矩阵 | `[2, 12, 197, 197]` | 每个 query 对全部 token 的权重 |
| Encoder 输出 | `[2, 197, 768]` | 堆叠多层后序列长度和隐藏宽度不变 |
| CLS 特征 | `[2, 768]` | 常用于图像级分类或全局表示 |
| patch 特征 | `[2, 196, 768]` | 可恢复为 `[2, 768, 14, 14]` 的空间网格 |

这里 patch 展平维度恰好也是 768，只是 ViT-B/16 与 RGB 224 输入下的数值巧合；一般情况下 $CP^2$ 和 $D$ 可以不同。

## 6. CLS 特征与 patch 特征分别能做什么

CLS 特征汇总整幅图像上下文，适合图像分类、检索或作为全局任务头输入；patch 特征保留粗空间网格，更适合分割、深度、密集匹配或多视图几何。实际模型也可能使用 patch 平均池化代替 CLS，或从多个中间层读取特征。

两类输出都只是表示：

- CLS 向量不自动成为经过定位任务训练的全局描述子；
- patch 相似度不自动成为亚像素几何对应；
- patch 特征不直接给出度量深度、相机 Pose 或三维地图。

这些能力需要下游聚合器、预测头、对应策略、几何求解或额外监督。

## 7. 从单图 ViT 到多视图和流式模型

单图 ViT 通常在一张图的 patch 序列内做 self-attention。视频或多视图模型还要定义帧/视图维怎样交互：可以把所有 token 合成全局序列，也可以交替帧内与跨帧注意力，或只保留窗口、锚点和压缩记忆。

- [DINOv2](../slam/learning-based/DINOv2与视觉基础特征.md)使用 ViT 学习可迁移的图像级和 patch 级特征；
- [VGGT](../slam/learning-based/从匹配到前馈三维重建.md)以 DINOv2 图像编码为起点，再交替帧内/全局注意力并增加几何预测头；
- [LingBot-Map](../slam/learning-based/LingBot-Map与流式几何记忆.md)面向因果图像流，用锚点、参考窗口和轨迹记忆控制长序列上下文。

三者都建立在 token 和 attention 上，但训练目标、跨帧状态、坐标语义与输出不同。先理解 ViT 不表示后续模型只是“多放几张图”，仍要单独阅读它们怎样引入几何和时间约束。

## 8. 计算量与后续阅读

全局 self-attention 的分数矩阵随序列长度按 $O(N^2)$ 增长。图像长宽各扩大两倍时，patch 数约变为四倍，注意力矩阵元素数约变为十六倍。窗口/稀疏注意力改变可访问关系；FlashAttention 主要优化精确注意力的计算与访存，见 [Attention、KV Cache 与高效计算](./Attention、KVCache与高效计算.md)。

## 参考

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
- [An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale](https://arxiv.org/abs/2010.11929)

