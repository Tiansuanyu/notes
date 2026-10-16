---
title: HLoc 实践
order: 30
---

# HLoc 实践

这里整理分层视觉定位（Hierarchical Localization）的模块组合、实验诊断与性能权衡。算法原理、数据处理和评价方法分别放在前两组主讲文章中。

HLoc 使用的相机、已注册 Reference 图像、Point3D 和 track 通常来自 COLMAP/pycolmap 稀疏模型；该模型的建立过程与 Pose 方向见[增量式 SfM 与稀疏地图](../colmap/增量式SfM与稀疏地图.md)。HLoc 的重点则是让新 Query 在这份固定地图中定位。

## 内容

- [如何选择视觉重定位 Pipeline](./如何选择视觉重定位Pipeline)
- [效果与性能权衡](./效果与性能权衡)

若要理解 HLoc 与带时序状态、记忆管理和位姿图的在线系统有什么差异，继续阅读 [RTAB-Map 与 HLoc 的定位链对比](../rtabmap/RTAB-Map与HLoc的定位链对比.md)。
