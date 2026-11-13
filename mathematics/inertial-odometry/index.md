---
title: 惯性导航与里程计
description: 从 IMU 连续运动模型到点云残差和 LiDAR–Inertial 状态更新。
order: 40
---

# 惯性导航与里程计

本组把前面的流形、优化和概率估计落到惯性导航与 LiDAR 里程计。统一采用 $R_{W\leftarrow I}$：把 IMU 系向量旋转到世界系；名义状态为 $(R,p,v,b_g,b_a)$，误差旋转采用右乘定义 $R=\hat R\operatorname{Exp}(\delta\theta)$。

## 阅读顺序

1. [IMU 测量模型与状态传播](./imu-measurement-and-propagation.md)
2. [IMU 预积分](./imu-preintegration.md)
3. [点云配准残差与雅可比](./point-cloud-registration-residuals.md)
4. [LiDAR–Inertial Odometry 数学模型](./lidar-inertial-odometry-model.md)

SLAM 中的[点云配准](../../slam/fundamentals/点云配准.md)继续主讲初始化、粗精配准和结果验收；本组集中推导局部残差及其如何进入滤波或优化。
