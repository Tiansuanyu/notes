---
title: SLAM Overview
order: 0
---

# SLAM Overview

这里按“感知对应 → 几何 → 地图与估计 → 数据评估 → 离线定位 → 学习式几何 → 在线系统”整理视觉定位与 SLAM 学习笔记。

## 推荐阅读路径

### 基础原理

1. [视觉地点识别与图像匹配](./fundamentals/视觉地点识别与图像匹配)
2. [从图像对应到相机位姿](./fundamentals/从图像对应到相机位姿)
3. [点云配准](./fundamentals/点云配准)
4. [地图到底存了什么](./fundamentals/地图到底存了什么)
5. [状态估计与不确定性](./fundamentals/状态估计与不确定性)
6. [回环检测与位姿图优化](./fundamentals/回环检测与位姿图优化)
7. [多传感器时空标定](./fundamentals/多传感器时空标定)

### 数据与评估

8. [数据采集与交付](./data-evaluation/数据采集与交付)
9. [数据清洗与实验输入构建](./data-evaluation/数据清洗与实验输入构建)
10. [从 LIO 轨迹到相机参考位姿](./data-evaluation/从LIO轨迹到相机参考位姿)
11. [参考误差如何影响算法评估](./data-evaluation/参考误差如何影响算法评估)
12. [定位评估方法](./data-evaluation/定位评估方法)

### HLoc 实践

13. [增量式 SfM 与稀疏地图](./hloc/增量式SfM与稀疏地图)
14. [如何选择视觉重定位 Pipeline](./hloc/如何选择视觉重定位Pipeline)
15. [效果与性能权衡](./hloc/效果与性能权衡)

### 学习式视觉几何

16. [DINOv2 与视觉基础特征](./learning-based/DINOv2与视觉基础特征)
17. [从匹配到前馈三维重建：以 VGGT 为主](./learning-based/从匹配到前馈三维重建)
18. [LingBot-Map 与流式几何记忆](./learning-based/LingBot-Map与流式几何记忆)
19. [从几何地图到语义地图](./learning-based/从几何地图到语义地图)

### RTAB-Map

20. [地图与记忆管理](./rtabmap/地图与记忆管理)
21. [视觉前端、跟踪与深度来源](./rtabmap/视觉前端、跟踪与深度来源)
22. [建图过程与地图更新](./rtabmap/建图过程与地图更新)
23. [里程计与外部 VIO](./rtabmap/里程计与外部VIO)
24. [OpenVINS：状态传播与视觉更新](./rtabmap/OpenVINS状态传播与视觉更新)
25. [定位与重定位流程](./rtabmap/定位与重定位流程)
26. [危险误接受防护与恢复](./rtabmap/危险误接受防护与恢复)
27. [RTAB-Map 与 HLoc 的定位链对比](./rtabmap/RTAB-Map与HLoc的定位链对比)
