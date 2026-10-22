---
title: SLAM Overview
order: 0
---

# SLAM Overview

这里按“感知对应 → 几何 → 地图与估计 → 数据评估 → 离线定位 → 学习式几何 → 在线系统”整理视觉定位与 SLAM 学习笔记。

## 推荐阅读路径

### 基础原理

1. [视觉地点识别与图像匹配](./fundamentals/视觉地点识别与图像匹配)
2. [MixVPR 与 XFeat：从图像到全局、局部描述子](./fundamentals/MixVPR与XFeat：从图像到全局、局部描述子)
3. [从 MNN 到 LightGlue 与 LighterGlue](./fundamentals/从MNN到LightGlue与LighterGlue)
4. [从图像对应到相机位姿](./fundamentals/从图像对应到相机位姿)
5. [点云配准](./fundamentals/点云配准)
6. [地图到底存了什么](./fundamentals/地图到底存了什么)
7. [状态估计与不确定性](./fundamentals/状态估计与不确定性)
8. [回环检测与位姿图优化](./fundamentals/回环检测与位姿图优化)
9. [多传感器时空标定](./fundamentals/多传感器时空标定)

### 数据与评估

10. [数据采集与交付](./data-evaluation/数据采集与交付)
11. [数据清洗与实验输入构建](./data-evaluation/数据清洗与实验输入构建)
12. [从 LIO 轨迹到相机参考位姿](./data-evaluation/从LIO轨迹到相机参考位姿)
13. [参考误差如何影响算法评估](./data-evaluation/参考误差如何影响算法评估)
14. [定位评估方法](./data-evaluation/定位评估方法)

### HLoc 实践

15. [增量式 SfM 与稀疏地图](./hloc/增量式SfM与稀疏地图)
16. [如何选择视觉重定位 Pipeline](./hloc/如何选择视觉重定位Pipeline)
17. [效果与性能权衡](./hloc/效果与性能权衡)

### 学习式视觉几何

18. [DINOv2 与视觉基础特征](./learning-based/DINOv2与视觉基础特征)
19. [从匹配到前馈三维重建：以 VGGT 为主](./learning-based/从匹配到前馈三维重建)
20. [LingBot-Map 与流式几何记忆](./learning-based/LingBot-Map与流式几何记忆)
21. [从几何地图到语义地图](./learning-based/从几何地图到语义地图)

### RTAB-Map

22. [地图与记忆管理](./rtabmap/地图与记忆管理)
23. [视觉前端、跟踪与深度来源](./rtabmap/视觉前端、跟踪与深度来源)
24. [建图过程与地图更新](./rtabmap/建图过程与地图更新)
25. [里程计与外部 VIO](./rtabmap/里程计与外部VIO)
26. [OpenVINS：状态传播与视觉更新](./rtabmap/OpenVINS状态传播与视觉更新)
27. [定位与重定位流程](./rtabmap/定位与重定位流程)
28. [危险误接受防护与恢复](./rtabmap/危险误接受防护与恢复)
29. [RTAB-Map 与 HLoc 的定位链对比](./rtabmap/RTAB-Map与HLoc的定位链对比)
