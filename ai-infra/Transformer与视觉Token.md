---
title: Transformer 与视觉 Token
order: 40
---

# Transformer 与视觉 Token

Transformer 的核心不是“注意力能理解一切”，而是让一组 token 按明确的可见关系交换信息。视觉模型的首要问题是 token 如何从图像、视图和时间中产生。

## 1. 从 embedding 到 Q/K/V

设输入 $X\in\mathbb{R}^{N\times D}$，三个线性投影得到

$$
Q=XW_Q,\qquad K=XW_K,\qquad V=XW_V.
$$

单头缩放点积注意力为

$$
\operatorname{Attention}(Q,K,V)=\operatorname{softmax}\!\left(\frac{QK^\top}{\sqrt{d_k}}+M\right)V,
$$

其中 $M$ 是可选 mask。softmax 权重只是当前模型中的信息混合系数，不自动成为几何对应概率或校准置信度。

## 2. 一个两 token 例子

令 $Q=K=\begin{bmatrix}1&0\\0&1\end{bmatrix}$、$V=\begin{bmatrix}2&0\\0&4\end{bmatrix}$。忽略缩放时，第一个 query 的 logits 是 $[1,0]$，softmax 后约为 $[0.731,0.269]$，输出约为 $[1.462,1.076]$。输出不是“选择一个 token”，而是混合 value。

多头注意力把通道分成若干子空间分别计算，再拼接投影。残差连接保留原表示，LayerNorm 稳定尺度，FFN 对每个 token 做通道变换。位置编码或位置偏置让模型区分排列；没有位置线索，self-attention 本身缺少空间含义。

## 3. self attention 与 cross attention

self attention 的 Q/K/V 来自同一组 token；cross attention 的 query 来自一组状态，key/value 来自另一组上下文。前者适合组内交互，后者适合“轨迹查询读取图像特征”这类接口。具体架构仍可能用拼接后的 self attention 达到跨视图交互，不能仅按任务名称推断。

## 4. 图像、视频与多视图怎样组织

图像通常切成 $N=HW/P^2$ 个 patch token。视频或多视图常将帧维折叠进序列、交替帧内与跨帧注意力、限制窗口，或用 camera/register/轨迹 query 承载任务状态。

VGGT 在帧内和所有帧的全局 self-attention 之间交替；LingBot-Map 为流式重建设计锚点、参考窗口和轨迹记忆。它们都使用 Transformer，但跨帧状态和坐标约束并不相同。

## 5. mask 与计算量

因果 mask 限制未来信息，窗口 mask 限制局部邻域，padding mask 排除无效位置。mask 改变可访问关系，而 FlashAttention 主要改变精确注意力的分块计算和访存方式，二者不是同一层优化。

全局注意力分数矩阵规模为 $O(N^2)$。图像长宽各翻倍，token 数约变为四倍，分数矩阵元素数约变为十六倍。真实耗时还受通道宽度、kernel、dtype 和硬件利用率影响。

继续阅读 [Attention、KV Cache 与高效计算](./Attention、KVCache与高效计算.md)；视觉几何案例见 [VGGT](../slam/learning-based/从匹配到前馈三维重建.md)和 [LingBot-Map](../slam/learning-based/LingBot-Map与流式几何记忆.md)。

## 参考

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
- [An Image is Worth 16x16 Words](https://arxiv.org/abs/2010.11929)
