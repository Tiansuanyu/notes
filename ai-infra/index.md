---
title: AI Infra Overview
order: 0
---

# AI Infra Overview

这里整理模型从张量计算、训练适配到导出部署的通用机制；具体视觉几何任务留在 [SLAM](../slam/)，机器人运行与板级部署留在 [Robotics Systems](../robotics-systems/)。

## 基础计算

- [张量、算子与神经网络计算](./张量、算子与神经网络计算.md)：从图像张量、布局和计算图建立计算直觉。
- [Transformer 与 Vision Transformer（ViT）](./Transformer与VisionTransformer（ViT）.md)：沿 patch、嵌入、位置编码和 Encoder 理解 CLS/patch 特征。
- [Attention、KV Cache 与高效计算](./Attention、KVCache与高效计算.md)：分清注意力语义、缓存复用和内核优化。

## 训练与适配

- [训练、推理与知识迁移](./训练、推理与知识迁移.md)：区分前向、反向、运行模式、冻结与蒸馏。
- [参数高效微调：LoRA 与 QLoRA](./参数高效微调LoRA与QLoRA.md)：理解低秩增量、量化基座和 adapter 生命周期。
- [并行训练与显存组成](./并行训练与显存组成.md)：从 DDP 到分片并行，并按组成估算显存。

## 推理与部署

- [数值精度、量化与结果验证](./数值精度、量化与结果验证.md)：连接数值误差、任务指标和定位决策。
- [模型导出、异构推理与性能测量](./模型导出、异构推理与性能测量.md)：串起导出图、运行时、硬件映射和端到端计时。

## 推荐顺序

先读张量与 Transformer，再读训练、LoRA 和并行训练，最后进入精度量化、缓存优化与模型导出。
