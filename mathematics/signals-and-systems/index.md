---
title: 信号与系统
description: 面向机器人传感器与闭环系统的采样、频谱、稳定性、数字滤波和时间延迟。
order: 35
---

# 信号与系统

本组不按课程章节复述变换表，而是沿机器人数据链回答：连续物理量如何被采样，系统怎样改变频率成分，滤波器为何带来相位与延迟，IMU 噪声怎样被识别，以及这些因素如何进入估计和控制。

## Signal Analysis：信号分析

1. [采样、卷积与频谱](./sampling-convolution-and-spectrum.md)
2. [IMU 噪声、功率谱与 Allan 方差](./imu-noise-psd-and-allan-variance.md)

## System Analysis：系统分析

3. [连续/离散系统、变换与状态空间](./transforms-and-state-space.md)
4. [极点、频率响应与稳定性](./poles-frequency-response-and-stability.md)

## Filtering：滤波理论

5. [数字滤波与互补滤波](./digital-and-complementary-filtering.md)
6. [传感器同步、延迟与多速率系统](./timing-delay-and-multirate-systems.md)

IMU 测量方程和状态传播见[惯性导航与里程计](../inertial-odometry/)，协方差与 Bayesian 更新见[概率状态估计](../probabilistic-estimation/)，闭环反馈见[机器人建模与控制](../robot-modeling-control/)。
