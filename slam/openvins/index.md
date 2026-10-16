---
title: OpenVINS
description: 从公开实现理解 MSCKF 视觉惯性里程计的状态、传播、视觉更新与系统边界。
order: 25
---

# OpenVINS

OpenVINS 是面向视觉惯性估计研究的开源平台。它的核心是一套 on-manifold EKF：IMU 在相机帧之间传播状态，稀疏视觉轨迹通过 MSCKF 滑窗约束修正位姿、速度和偏置；系统还支持可选的在线标定、in-state SLAM landmarks、零速更新与仿真评测工具。

本专题先阅读：

1. [状态传播与视觉更新](./状态传播与视觉更新.md)：状态里存什么，一帧图像如何触发传播、克隆、MSCKF 更新和边缘化。

通用的概率模型、EKF、可观测性和协方差由[状态估计与不确定性](../fundamentals/状态估计与不确定性.md)主讲；相机–IMU 外参、时间偏移和运动激励见[多传感器时空标定](../fundamentals/多传感器时空标定.md)。本专题重点回答这些原理在 OpenVINS 公开实现中怎样落地。

## 它解决哪一层问题

```mermaid
flowchart LR
    I["IMU<br/>高频角速度与加速度"] --> V["OpenVINS<br/>局部 VIO 状态"]
    C["相机<br/>稀疏特征轨迹"] --> V
    V --> O["局部连续运动<br/>Pose、速度、偏置、协方差"]
    O --> G["可选的全局系统<br/>回环、地图定位或导航融合"]
```

基础 OpenVINS 输出的是连续局部视觉惯性里程计，不应默认具有长期地图、地点识别或全局回环修正。README 提到的 `ov_secondary` 是独立的松耦合回环示例，且明确不把信息反馈给底层 OpenVINS 估计器；`ov_maplab` 则是把运行数据导出到另一套建图系统。这些扩展不能反向解释为核心 VIO 已经等价于完整全局 SLAM。

## 与其他章节的关系

| 专题 | 主要回答 | 与 OpenVINS 的接口边界 |
| --- | --- | --- |
| [状态估计与不确定性](../fundamentals/状态估计与不确定性.md) | EKF、线性化、协方差和不可观方向是什么 | OpenVINS 给出具体滤波器状态与更新实现 |
| [多传感器时空标定](../fundamentals/多传感器时空标定.md) | 外参、时差、噪声和激励为何重要 | OpenVINS 可把部分标定量纳入状态，但不替代独立验证 |
| [SfM 与 COLMAP](../colmap/) | 多张图像如何离线建立相机 Pose、Point3D 与 track | COLMAP 维护可持久化稀疏重建；OpenVINS 维护有界滤波状态 |
| [HLoc 实践](../hloc/) | 已知视觉地图中的绝对重定位 | HLoc 可提供离散全局 Pose，OpenVINS 提供连续局部运动 |
| [RTAB-Map](../rtabmap/) | 在线地图、回环、记忆与 `map → odom` | RTAB-Map 可消费外部 odometry；两者的地图和状态语义不同 |
| [定位评估方法](../data-evaluation/定位评估方法.md) | 指标、分母、失败和参考资格 | VIO 应同时评价漂移、初始化、覆盖率与失效，而非只看一条 ATE |

## 公开资料边界

本文只核对 OpenVINS 官方仓库、官方文档和公开论文。源码入口固定到 2026-10-16 核对的 `master` commit [`6948812`](https://github.com/rpng/open_vins/tree/69488123ed9362dd44b6f28e7f4680abbff1442b)，避免以后 `master` 更新改变实现语义：

- [OpenVINS 官方文档](https://docs.openvins.com/)
- [OpenVINS: A Research Platform for Visual-Inertial Estimation](https://pgeneva.com/downloads/papers/Geneva2020ICRA.pdf)
- [rpng/open_vins](https://github.com/rpng/open_vins)

正文中的默认值和执行顺序均以该 commit 为边界；实际运行仍应保存所用 commit、配置、标定和输入数据版本。
