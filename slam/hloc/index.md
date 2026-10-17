---
title: HLoc 实践
order: 30
---

# HLoc 实践

这里整理分层视觉定位（Hierarchical Localization）的模块组合、实验诊断与性能权衡。算法原理、数据处理和评价方法分别放在前两组主讲文章中。

HLoc 使用的相机、已注册 Reference 图像、Point3D 和 track 通常来自 COLMAP/pycolmap 稀疏模型；该模型的建立过程与 Pose 方向见[增量式 SfM 与稀疏地图](./增量式SfM与稀疏地图.md)。这里把 SfM/COLMAP 放在 HLoc 阅读路径的起点，是为了先回答 Reference 地图从哪里来；不表示 SfM 只服务于 HLoc。SfM 生成的位姿也不天然等于评估真值。

## 内容

1. [增量式 SfM 与稀疏地图](./增量式SfM与稀疏地图.md)：从图像配对、增量注册、三角化和 BA 建立 Reference 稀疏模型。
2. [如何选择视觉重定位 Pipeline](./如何选择视觉重定位Pipeline)：在固定地图上组织检索、局部匹配、2D–3D 关联与 PnP。
3. [效果与性能权衡](./效果与性能权衡)：拆分候选预算、在线/离线成本、显存和尾延迟。

HLoc 也可以从已知 Reference 相机位姿出发固定 Pose 做三角化。它与 SfM 联合优化相机 Pose 和结构的任务不同：固定 Pose 路径仍会由视觉对应决定 track 与 Point3D，但不会把相机位姿作为同一 BA 问题中的自由变量。地图兼容性与两种路径的系统取舍见[如何选择视觉重定位 Pipeline](./如何选择视觉重定位Pipeline.md)。

若要理解 HLoc 与带时序状态、记忆管理和位姿图的在线系统有什么差异，继续阅读 [RTAB-Map 与 HLoc 的定位链对比](../rtabmap/RTAB-Map与HLoc的定位链对比.md)。
