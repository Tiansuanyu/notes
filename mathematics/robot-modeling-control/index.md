---
title: 机器人建模与控制
description: 从刚体与移动机器人运动学、动力学到反馈、LQR、MPC 和几何控制。
order: 45
---

# 机器人建模与控制

本组回答三个不同问题：**运动学**描述“不考虑力时，构型怎样产生运动”；**动力学**描述“力和力矩怎样改变运动”；**控制**根据目标与反馈计算输入。状态估计则从带噪观测推断状态，不能与控制器混为一谈。

## Kinematics：运动学

1. [刚体、机械臂与移动机器人运动学](./robot-kinematics.md)
2. [轨迹生成与运动约束](./trajectory-generation.md)

## Dynamics：动力学

3. [机器人动力学与模型线性化](./robot-dynamics-and-linearization.md)

## Control Theory：控制理论

4. [反馈、PID 与级联控制](./feedback-pid-and-cascade.md)
5. [状态空间、可控性与 LQR](./state-space-controllability-and-lqr.md)
6. [MPC、非线性控制与 SE(3) 几何控制](./mpc-and-geometric-control.md)

李群位姿与局部扰动见[几何与流形](../geometry/)，系统极点和频率响应见[信号与系统](../signals-and-systems/)，状态可观测性与估计不确定性见[概率状态估计](../probabilistic-estimation/)。
