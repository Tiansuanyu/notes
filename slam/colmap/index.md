---
title: SfM 与 COLMAP
order: 27
---

# SfM 与 COLMAP

Structure-from-Motion（SfM）从多张有重叠的图像中联合恢复相机参数、图像位姿和稀疏三维结构。COLMAP 将特征提取、图像配对、两视图几何、增量式重建、Bundle Adjustment（BA）与模型导出组织成一套完整工具链。

## 内容

- [增量式 SfM 与稀疏地图](./增量式SfM与稀疏地图.md)

## 与其他专题的边界

| 专题 | 主要问题 | 与 COLMAP 的关系 |
| --- | --- | --- |
| [几何基础](../fundamentals/从图像对应到相机位姿.md) | E/F/H、三角化、PnP 和 BA 为什么成立 | 本专题观察这些模块怎样组成增量式 SfM |
| [地图表示](../fundamentals/地图到底存了什么.md) | observation、track、landmark 分别是什么 | COLMAP `Reconstruction` 是一套具体的稀疏视觉地图表示 |
| [OpenVINS](../openvins/) | IMU 与相机如何递推估计连续局部运动 | COLMAP 主要处理离线多视图重建，不是 VIO |
| [HLoc](../hloc/) | Query 如何在既有视觉地图中恢复绝对 Pose | HLoc 可以读取 COLMAP/pycolmap 稀疏模型，但不会在每次查询时重新运行 SfM |
| [RTAB-Map](../rtabmap/) | 在线地图、记忆、回环和位姿图如何维护 | COLMAP 的批量稀疏重建与在线地图生命周期不同 |

## 资料边界

本文只依据 COLMAP 官方仓库、官方文档和公开论文。源码入口固定到 2026-10-16 核对的 `main` commit [`b16ff73`](https://github.com/colmap/colmap/tree/b16ff739eb5753cf61966f22089975f7e5a57a9b)，该版本在源码中标记为 `4.3.0.dev0`：

- [COLMAP 官方文档](https://colmap.github.io/)
- [Structure-from-Motion Revisited](https://demuc.de/papers/schoenberger2016sfm.pdf)
- [COLMAP 官方仓库](https://github.com/colmap/colmap)
