---
title: SLAM Overview
order: 0
---

# SLAM Overview

这里按“感知对应 → 几何 → 地图 → 回环与估计 → 标定 → 数据 → 参考 → 评估 → 离线建图与定位 → 在线系统”整理视觉定位与 SLAM 学习笔记。

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

SfM/COLMAP 在这里回答 Reference 稀疏地图怎样建立，HLoc 再回答 Query 怎样在固定地图中定位。这个归类服务于阅读主线，不把 SfM 限定为 HLoc 的附属算法。

### RTAB-Map

16. [地图与记忆管理](./rtabmap/地图与记忆管理)
17. [视觉前端、跟踪与深度来源](./rtabmap/视觉前端、跟踪与深度来源)
18. [建图过程与地图更新](./rtabmap/建图过程与地图更新)
19. [里程计与外部 VIO](./rtabmap/里程计与外部VIO)
20. [OpenVINS：状态传播与视觉更新](./rtabmap/OpenVINS状态传播与视觉更新)
21. [定位与重定位流程](./rtabmap/定位与重定位流程)
22. [RTAB-Map 与 HLoc 的定位链对比](./rtabmap/RTAB-Map与HLoc的定位链对比)

RTAB-Map 专题把前面的检索、几何、局部里程计、地图和图优化知识连接成在线定位链，并与 HLoc 的单图像定位流程作横向比较。OpenVINS 作为独立 VIO 框架放在这条主线中，是为了说明连续局部运动来源；它不是 RTAB-Map 的全局地图或共享状态估计器。
