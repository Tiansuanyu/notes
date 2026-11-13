---
title: 概率状态估计
description: 从非线性滤波、误差状态到 Fisher 信息、可观测性与一致性。
order: 30
---

# 概率状态估计

本组研究带噪动态系统如何递归融合预测与观测。重点不是背诵 Kalman 公式，而是理解线性化点、误差坐标、协方差传播和信息缺失之间的关系。

## 阅读顺序

1. [扩展卡尔曼滤波（EKF）](./extended-kalman-filter.md)
2. [误差状态卡尔曼滤波（ESKF）](./error-state-kalman-filter.md)
3. [迭代扩展卡尔曼滤波](./iterated-ekf.md)
4. [Fisher 信息、CRLB 与可观测性](./fisher-information-and-observability.md)

Iterated EKF 是同一次测量上的重复线性化；Invariant EKF 是利用群作用定义不变误差并改善误差动力学。两者名称相近，但不是同一种方法。
