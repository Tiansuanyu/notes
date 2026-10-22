---
title: 端侧部署
order: 60
---

# 端侧部署

这里记录模型与机器人软件落到具体硬件、BSP 和运行时后的验证边界。系列“学习式视觉模块部署实践”按下面顺序阅读：

1. [学习模块怎样接入机器人系统](./学习模块怎样接入机器人系统.md)：从数据、时效、资源、故障和回退理解“最小侵入”。
2. [Python 插件、进程内推理与独立 worker](./Python插件、进程内推理与独立worker.md)：分清扩展点、语言、进程、runtime 与计算设备。
3. [视觉定位的 CPU、GPU 与 NPU 分工](./视觉定位的CPU、GPU与NPU分工.md)：按计算形态和整链成本分配硬件。
4. [从 PyTorch 到 ONNX 与 RKNN](./从PyTorch到ONNX与RKNN.md)：验证导出图、编译产物和目标 runtime。
5. [端侧效果与性能怎样测才可信](./端侧效果与性能怎样测才可信.md)：从模块探针走到连续输入和系统共载。
6. [嵌入式 Python 线程崩溃诊断](./嵌入式Python线程崩溃诊断.md)：用 core、最小复现和受控干预定位生命周期错误。
7. [LighterGlue 端侧优化实践](./LighterGlue端侧优化实践.md)：以正确性为前提建立效果—延迟—资源的 Pareto 前沿。

算法背景见 [MixVPR 与 XFeat](../../slam/fundamentals/MixVPR与XFeat：从图像到全局、局部描述子.md)和[从 MNN 到 LightGlue 与 LighterGlue](../../slam/fundamentals/从MNN到LightGlue与LighterGlue.md)；张量与导出基础见 [AI Infra](../../ai-infra/)。具体硬件边界见 [Firefly CAM-3576Q38](./CAM-3576Q38硬件与部署.md)。
