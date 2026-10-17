---
title: 参数高效微调：LoRA 与 QLoRA
order: 30
---

# 参数高效微调：LoRA 与 QLoRA

LoRA 改变的是任务适配时的参数化方式：冻结原权重，在旁路学习低秩增量。它不是蒸馏、剪枝或部署量化，也不是把原模型本身近似成低秩矩阵。

## 1. 低秩增量放在哪里

对线性层 $W_0\in\mathbb{R}^{d_{out}\times d_{in}}$，LoRA 写成

$$
y=W_0x+\frac{\alpha}{r}BAx,
$$

其中 $W_0$ 冻结，$A\in\mathbb{R}^{r\times d_{in}}$、$B\in\mathbb{R}^{d_{out}\times r}$ 可训练，$r$ 是 rank，$\alpha/r$ 是缩放。低秩约束施加在增量 $\Delta W=BA$ 上，不要求 $W_0$ 低秩。

假设 $d_{in}=d_{out}=4096,r=8$：完整权重有 $4096^2=16,777,216$ 个参数；LoRA 增量有 $8\times4096+4096\times8=65,536$ 个，为前者约 $0.39\%$。这显著减少可训练参数与其优化器状态，却不等于总显存或耗时同比例下降：冻结的 $W_0$ 仍要存储和计算，激活也仍然存在。

## 2. 初始化、梯度与目标层

常见初始化令一个因子随机、另一个为零，使初始 $\Delta W=0$，加载 adapter 时模型先保持基座输出。随后梯度进入 A/B。冻结 $W_0$ 只表示不累计它的参数梯度；若 A/B 需要由上游激活计算梯度，不能把整个含 LoRA 的骨干放进 `no_grad()`。

rank 控制增量表达容量，$\alpha$ 控制幅度；目标层决定适配发生在 Q/K/V、输出投影还是 FFN。更大的 rank 或更多注入层并非总是更好，必须由任务与验证集决定。

## 3. 一个可运行的最小层

```python
import torch

torch.manual_seed(0)
W0 = torch.randn(3, 4, requires_grad=False)
A = torch.randn(2, 4, requires_grad=True) * 0.01
A.retain_grad()
B = torch.zeros(3, 2, requires_grad=True)
x = torch.randn(5, 4)
scale = 4 / 2

y0 = x @ W0.T
y = y0 + scale * (x @ A.T @ B.T)
assert torch.allclose(y, y0, atol=1e-7)
y.square().mean().backward()
assert B.grad is not None and W0.grad is None

W_merged = W0 + scale * (B.detach() @ A.detach())
assert torch.allclose(x @ W_merged.T, y.detach(), atol=1e-6)
```

零初始化使第一次反向时 B 有梯度，而 A 可能要在 B 更新后才得到非零梯度，这是结构结果，不是实现失败。合并前后只承诺在所用 dtype 和容差内数值等价。

## 4. adapter 的保存、加载与合并

单独保存 adapter 时还应保存基座模型身份、目标层、rank、$\alpha$、预处理和任务头。合并可减少推理时旁路算子，但会得到一套新的完整权重；若需在多个 adapter 间切换，保留未合并基座更灵活。

视觉检索或地图定位还要把 adapter 版本纳入地图契约。新 adapter 可能改变描述子分布；即使维度相同，也要验证“旧地图特征—新 Query 特征”的匹配与定位质量，必要时重提地图特征。

## 5. QLoRA 量化什么

QLoRA 在训练时以 4-bit 形式存储冻结基座，并通过反量化计算把梯度传到 LoRA adapter；A/B 通常不是“全部 4-bit 可训练参数”。论文引入 NF4 表示近似正态分布权重、double quantization 压缩量化常数、paged optimizer 缓解优化器内存峰值。

它的目标是降低微调显存，不等于部署时 INT8 PTQ。部署量化还要选择权重/激活表示、校准集和目标运行时，见[数值精度、量化与结果验证](./数值精度、量化与结果验证.md)。DINOv2、VGGT、LingBot-Map 或 DiffWAM 能否用 LoRA 适配是独立工程问题；除非原论文明确采用，不能反推它们的结果来自 LoRA。

## 参考

- [LoRA 原论文](https://arxiv.org/abs/2106.09685)
- [QLoRA 原论文](https://arxiv.org/abs/2305.14314)
- [Hugging Face PEFT](https://github.com/huggingface/peft)
