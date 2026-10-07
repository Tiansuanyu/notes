---
title: 论文阅读
description: SLAM、HLoc、视觉重定位与评测的论文阅读路线、主题索引和问题索引。
order: 40
---

# SLAM 与 HLoc 论文总览

这一页负责“找论文、定顺序、记进度”；单篇阅读笔记负责分析论文的任务、机制、证据和边界；现有基础笔记继续主讲通用原理。三者通过链接连接，不重复维护同一份完整内容。

本清单整理于 2026-10-07，共 50 篇主清单论文。论文编号是稳定身份，不随当前阅读顺序改变。P0/P1/P2 只表示针对当前室内视觉重定位任务的阅读建议，不是论文质量等级：

- **P0：当前精读。** 直接帮助理解现有系统或解释实验，不要求同时复现。
- **P1：相关拓展。** 先读摘要、方法图、实验设置与局限，遇到对应问题再深入。
- **P2：路线储备。** 用于建立完整视野，当前无需投入大量复现时间。

阅读状态统一使用“未读 / 阅读中 / 已读 / 待重读”。目前没有经确认的阅读记录，因此全部初始为“未读”；工程中使用过某个模型，不等于已经读过对应论文。

## 当前阅读路线

| 顺序 | 编号 | 论文 | 读完应能回答 |
| --- | --- | --- | --- |
| 1 | [B01](#paper-b01) | HLoc / HF-Net | 为什么需要检索、局部匹配、几何估计的分层管线？ |
| 2 | [G04](#paper-g04) | On the Limits of Pseudo Ground Truth | 参考算法会怎样影响重定位方法的比较？ |
| 3 | [C01](#paper-c01) | NetVLAD | 局部特征如何变成用于检索的全局描述子？ |
| 4 | [D01](#paper-d01) | SuperPoint | 关键点与描述子怎样训练，重复性受什么影响？ |
| 5 | [D05](#paper-d05) | LightGlue | 如何利用上下文匹配，自适应计算如何影响时延？ |
| 6 | [A02](#paper-a02) | ORB-SLAM2 | 重定位、跟踪、回环和地图复用分别做什么？ |
| 7 | [C02](#paper-c02) | MixVPR | 另一种聚合机制为何可能改变检索效果和成本？ |
| 8 | [C07](#paper-c07) | SALAD | 最优传输聚合相较 NetVLAD 有什么变化？ |
| 9 | [D07](#paper-d07) | XFeat | 提取、稀疏匹配和半稠密匹配如何权衡效率？ |
| 10 | [G02](#paper-g02) | Trajectory Evaluation Tutorial | ATE/RPE、对齐和误差统计到底比较什么？ |
| 11 | [E03](#paper-e03) | Doppelgangers++ | 为什么重复结构能产生看似合理的错误匹配？ |
| 12 | [I04](#paper-i04) | SplatHLoc | 高斯特征地图与视图合成怎样帮助重定位？ |

前 6 篇建立任务、评测和模块基础；后 6 篇连接模型比较、效率、误接受与三维地图拓展。若正在查性能瓶颈，可提前读 [C11](#paper-c11)；若参考链未闭合，先完成 [G04](#paper-g04) / [G02](#paper-g02) 的理解和参考审计。

## 先分清任务

| 任务 | 输入与输出 | 常见评价 | 与当前工作的关系 |
| --- | --- | --- | --- |
| Visual Place Recognition / 图像检索 | Query → 相似地点候选图像 | Recall@K，检索耗时，描述子存储 | 候选选择；不直接保证精确位姿 |
| Local Feature Matching | 图像对 → 像素对应 | 对应准确性、姿态估计表现、耗时 | 为 2D–3D 对应或相对位姿提供基础 |
| Visual Localization / Relocalization | Query + 已知地图 → 地图坐标系中的绝对位姿 | 平移/旋转阈值成功率、误接受、时延 | 当前主要任务 |
| Visual Odometry / VIO | 连续传感器输入 → 相对运动或局部轨迹 | ATE/RPE，跟踪失败率 | 可以提供运动信息，但通常会漂移 |
| SLAM | 连续输入 → 轨迹 + 地图，并维护一致性 | 轨迹、地图质量、回环、鲁棒性、成本 | 重定位是其中的能力之一 |
| Loop Closure | 当前观测 + 历史地图 → 重访约束 | 检出与误检、约束质量、优化效果 | 地点识别只是候选步骤；还需验证并更新系统 |

HLoc 是可组合的软件工具箱，不对应唯一固定模型。原始层次化定位论文提出 HF-Net；今天在 HLoc 工具箱中使用 NetVLAD / SuperPoint / LightGlue 的组合，不等于复现原论文的全部配置。

## 按主题找论文

<span id="topic-slam-vio"></span>

### A：经典 SLAM、VIO 与参考轨迹基础（7 篇）

配套知识：[地图到底存了什么](../fundamentals/地图到底存了什么.md)、[状态估计与不确定性](../fundamentals/状态估计与不确定性.md)、[多传感器时空标定](../fundamentals/多传感器时空标定.md)和[从 LIO 轨迹到相机参考位姿](../data-evaluation/从LIO轨迹到相机参考位姿.md)。

| 编号 / 优先级 | 论文 | 年份 / 发表 | 核心阅读问题 | 入口 | 状态 | 我的笔记 |
| --- | --- | --- | --- | --- | --- | --- |
| <span id="paper-a01"></span>**A01 · P1** | *Past, Present, and Future of Simultaneous Localization And Mapping: Towards the Robust-Perception Age* | 2016 · T-RO | SLAM 的估计、数据关联、地图表示、鲁棒性与可扩展性如何组成整体？适合建立术语框架，不作为最新前沿综述。 | [论文](https://arxiv.org/abs/1606.05830) | 未读 | — |
| <span id="paper-a02"></span>**A02 · P0** | *ORB-SLAM2: An Open-Source SLAM System for Monocular, Stereo and RGB-D Cameras* | 2017 · T-RO | 跟踪、局部建图、重定位和回环如何协作？重点看地图点匹配、共视关系、候选验证和定位模式。 | [论文](https://arxiv.org/abs/1610.06475) · [代码](https://github.com/raulmur/ORB_SLAM2) | 未读 | — |
| <span id="paper-a03"></span>**A03 · P1** | *ORB-SLAM3: An Accurate Open-Source Library for Visual, Visual-Inertial and Multi-Map SLAM* | 2021 · T-RO | 多地图、地点识别、地图合并与惯性初始化怎样提高系统恢复能力？ | [论文](https://arxiv.org/abs/2007.11898) · [代码](https://github.com/UZ-SLAMLab/ORB_SLAM3) | 未读 | — |
| <span id="paper-a04"></span>**A04 · P1** | *Direct Sparse Odometry* | 2018 · TPAMI | 光度残差与特征重投影残差有什么区别？曝光、光度标定与边缘化如何影响直接法？它主要是 VO，不能视作完整回环 SLAM。 | [论文](https://arxiv.org/abs/1607.02565) · [代码](https://github.com/JakobEngel/dso) | 未读 | — |
| <span id="paper-a05"></span>**A05 · P1** | *VINS-Mono: A Robust and Versatile Monocular Visual-Inertial State Estimator* | 2018 · T-RO | 视觉与 IMU 如何联合估计，初始化和边缘化为何重要，回环与状态估计如何连接？ | [论文](https://arxiv.org/abs/1708.03852) · [代码](https://github.com/HKUST-Aerial-Robotics/VINS-Mono) | 未读 | — |
| <span id="paper-a06"></span>**A06 · P1** | *OpenVINS: A Research Platform for Visual-Inertial Estimation* | 2020 · ICRA | MSCKF 如何用多帧视觉约束更新状态？相机–IMU 外参、时间偏移与一致性怎样影响输出？不要默认基础 VIO 输出已有全局回环修正。 | [论文](https://pgeneva.com/downloads/papers/Geneva2020ICRA.pdf) · [代码](https://github.com/rpng/open_vins) | 未读 | — |
| <span id="paper-a07"></span>**A07 · P1** | *FAST-LIO2: Fast Direct LiDAR-Inertial Odometry* | 2022 · T-RO | LiDAR–IMU 如何估计轨迹、维护地图？用 LIO 作为 reference 时，要审计哪些漂移与传感器变换？读它理解原理，不把它等同于实际采用的所有 LIO 实现。 | [论文](https://arxiv.org/abs/2107.06829) · [代码](https://github.com/hku-mars/FAST_LIO) | 未读 | — |

<span id="topic-hloc"></span>

### B：HLoc 与结构式定位主线（4 篇）

配套知识：[地图到底存了什么](../fundamentals/地图到底存了什么.md)、[从图像对应到相机位姿](../fundamentals/从图像对应到相机位姿.md)和[如何选择视觉重定位 Pipeline](../hloc/如何选择视觉重定位Pipeline.md)。

| 编号 / 优先级 | 论文 | 年份 / 发表 | 核心阅读问题 | 入口 | 状态 | 我的笔记 |
| --- | --- | --- | --- | --- | --- | --- |
| <span id="paper-b01"></span>**B01 · P0** | *From Coarse to Fine: Robust Hierarchical Localization at Large Scale* | 2019 · CVPR | 全局检索如何缩小搜索范围？局部匹配如何连接地图？HF-Net 的联合输出与蒸馏解决什么问题？ | [论文](https://arxiv.org/abs/1812.03506) · [当前 HLoc 工具箱](https://github.com/cvg/Hierarchical-Localization) | 未读 | — |
| <span id="paper-b02"></span>**B02 · P0** | *Structure-from-Motion Revisited* | 2016 · CVPR | 图像匹配、注册、三角化和 BA 如何建立几何地图？已知相机位姿并不自动提供所有高质量 3D 地标。 | [论文](https://openaccess.thecvf.com/content_cvpr_2016/html/Schonberger_Structure-From-Motion_Revisited_CVPR_2016_paper.html) · [COLMAP](https://github.com/colmap/colmap) | 未读 | — |
| <span id="paper-b03"></span>**B03 · P1** | *InLoc: Indoor Visual Localization with Dense Matching and View Synthesis* | 2018 · CVPR | 室内弱纹理、大视角变化为何困难？稠密匹配和视图合成如何用于候选验证？ | [论文](https://arxiv.org/abs/1803.10368) | 未读 | — |
| <span id="paper-b04"></span>**B04 · P1** | *Back to the Feature: Learning Robust Camera Localization from Pixels to Pose* | 2021 · CVPR · PixLoc | 在初始位姿附近，能否通过学习特征上的直接优化细化定位？初始估计与优化收敛域有什么限制？ | [论文](https://arxiv.org/abs/2103.09213) · [代码](https://github.com/cvg/pixloc) | 未读 | — |

COLMAP 论文与项目分别作为方法和实现入口；引用时应以原论文与实际使用的项目版本为准。

<span id="topic-retrieval"></span>

### C：检索与视觉地点识别（11 篇）

配套知识：[视觉地点识别与图像匹配](../fundamentals/视觉地点识别与图像匹配.md)和[效果与性能权衡](../hloc/效果与性能权衡.md)。

| 编号 / 优先级 | 论文 | 年份 / 发表 | 核心阅读问题 | 入口 | 状态 | 我的笔记 |
| --- | --- | --- | --- | --- | --- | --- |
| <span id="paper-c01"></span>**C01 · P0** | *NetVLAD: CNN Architecture for Weakly Supervised Place Recognition* | 2016 · CVPR | 描述子残差、软分配、归一化与弱监督训练如何组成全局表示？ | [论文](https://arxiv.org/abs/1511.07247) | 未读 | — |
| <span id="paper-c02"></span>**C02 · P0** | *MixVPR: Feature Mixing for Visual Place Recognition* | 2023 · WACV | 特征 mixing 如何聚合空间信息？比较时如何拆分 backbone、聚合器、预处理和描述子维度？ | [论文](https://arxiv.org/abs/2303.02190) · [代码](https://github.com/amaralibey/MixVPR) | 未读 | — |
| <span id="paper-c03"></span>**C03 · P1** | *AnyLoc: Towards Universal Visual Place Recognition* | 2024 · RA-L；预印本 2023 | 通用自监督特征与无监督聚合为何可以跨域使用？实际室内跨光照表现是否与街景 benchmark 一致？ | [论文](https://arxiv.org/abs/2308.00688) · [代码](https://github.com/AnyLoc/AnyLoc) | 未读 | — |
| <span id="paper-c04"></span>**C04 · P1** | *Rethinking Visual Geo-localization for Large-Scale Applications* | 2022 · CVPR · CosPlace | 用分类训练检索表示有什么优势？地理分组标签与室内精细定位之间有哪些差异？ | [论文](https://arxiv.org/abs/2204.02287) · [代码](https://github.com/gmberton/CosPlace) | 未读 | — |
| <span id="paper-c05"></span>**C05 · P1** | *EigenPlaces: Training Viewpoint Robust Models for Visual Place Recognition* | 2023 · ICCV | 训练样本分组怎样影响视角鲁棒性？它改善的主要变化是否与当前 Query 条件一致？ | [论文](https://arxiv.org/abs/2308.10832) · [代码](https://github.com/gmberton/EigenPlaces) | 未读 | — |
| <span id="paper-c06"></span>**C06 · P2** | *Patch-NetVLAD: Multi-Scale Fusion of Locally-Global Descriptors for Place Recognition* | 2021 · CVPR | 局部–全局融合和重排序怎样改善检索？收益是否值得额外存储与匹配成本？ | [论文](https://arxiv.org/abs/2103.01486) | 未读 | — |
| <span id="paper-c07"></span>**C07 · P0** | *Optimal Transport Aggregation for Visual Place Recognition* | 2024 · CVPR · SALAD | Sinkhorn 分配、聚类聚合和 dustbin 各负责什么？DINOv2 backbone 与聚合器的贡献怎样区分？ | [论文](https://arxiv.org/abs/2311.15937) · [代码](https://github.com/serizba/salad) | 未读 | — |
| <span id="paper-c08"></span>**C08 · P1** | *BoQ: A Place is Worth a Bag of Learnable Queries* | 2024 · CVPR | 可学习全局 queries 如何通过 cross-attention 汇聚地点信息？与 NetVLAD/SALAD 的聚合机制如何比较？ | [论文](https://arxiv.org/abs/2405.07364) · [代码](https://github.com/amaralibey/Bag-of-Queries) | 未读 | — |
| <span id="paper-c09"></span>**C09 · P1** | *DINOv2: Learning Robust Visual Features without Supervision* | 2024 · TMLR；预印本 2023 | 自监督预训练提供了哪些可迁移视觉特征？了解表示来源即可，不必立即复现大规模预训练。 | [论文](https://arxiv.org/abs/2304.07193) · [代码](https://github.com/facebookresearch/dinov2) | 未读 | — |
| <span id="paper-c10"></span>**C10 · P1** | *A Hyperdimensional One Place Signature to Represent Them All: Stackable Descriptors For Visual Place Recognition* | 2025 · ICCV · HOPS | 多条件参考描述子如何融合？“同一地点”的对应如何建立？改变参考数据量后如何保证比较公平？ | [论文](https://arxiv.org/abs/2412.06153) · [PaperNotes](https://papernotes.org/ICCV2025/others/a_hyperdimensional_one_place_signature_to_represent_them_all_stackable_descripto/) | 未读 | — |
| <span id="paper-c11"></span>**C11 · P1** | *Towards Test-time Efficient Visual Place Recognition via Asymmetric Query Processing* | 2026 · AAAI · AsymVPR | 离线图库大模型与在线 Query 小模型怎样兼容？节省的是哪一段成本，端到端收益如何验证？ | [论文](https://arxiv.org/abs/2512.13055) · [代码](https://github.com/jaeyoon1603/AsymVPR) · [PaperNotes](https://papernotes.org/AAAI2026/model_compression/towards_test-time_efficient_visual_place_recognition_via_asymmetric_query_proces/) | 未读 | — |

Recall@K 的“正确候选”可能只是位置接近，不代表具备足够视觉重叠，更不代表 PnP 可解。检索实验要同时考虑位置、朝向和可见内容；增加 top-K 可能提高召回，也会增加匹配开销与错误候选。

<span id="topic-local-features"></span>

### D：局部特征与匹配（8 篇）

配套知识：[视觉地点识别与图像匹配](../fundamentals/视觉地点识别与图像匹配.md)、[从图像对应到相机位姿](../fundamentals/从图像对应到相机位姿.md)和[效果与性能权衡](../hloc/效果与性能权衡.md)。

| 编号 / 优先级 | 论文 | 年份 / 发表 | 核心阅读问题 | 入口 | 状态 | 我的笔记 |
| --- | --- | --- | --- | --- | --- | --- |
| <span id="paper-d01"></span>**D01 · P0** | *SuperPoint: Self-Supervised Interest Point Detection and Description* | 2018 · CVPR Workshops | 检测与描述子如何联合学习？Homographic Adaptation 提供什么监督，为什么不等同于覆盖所有真实三维视角变化？ | [论文](https://arxiv.org/abs/1712.07629) | 未读 | — |
| <span id="paper-d02"></span>**D02 · P2** | *D2-Net: A Trainable CNN for Joint Detection and Description of Local Features* | 2019 · CVPR | 先形成高层描述再检测，与 detect-then-describe 的区别是什么？困难外观变化为何可能受益？ | [论文](https://arxiv.org/abs/1905.03561) | 未读 | — |
| <span id="paper-d03"></span>**D03 · P2** | *R2D2: Repeatable and Reliable Detector and Descriptor* | 2019 · NeurIPS | 可重复性与可匹配可靠性为什么要分别预测？关键点数量与质量怎样取舍？ | [论文](https://arxiv.org/abs/1906.06195) | 未读 | — |
| <span id="paper-d04"></span>**D04 · P1** | *SuperGlue: Learning Feature Matching with Graph Neural Networks* | 2020 · CVPR | 上下文、注意力、最优传输与拒配机制如何共同决定匹配？作为理解 LightGlue 的前置。 | [论文](https://arxiv.org/abs/1911.11763) · [代码](https://github.com/magicleap/SuperGluePretrainedNetwork) | 未读 | — |
| <span id="paper-d05"></span>**D05 · P0** | *LightGlue: Local Feature Matching at Light Speed* | 2023 · ICCV | 自适应深度和点剪枝如何节省计算？困难图像对为什么可能造成尾延迟？匹配置信度不应直接当成位姿正确概率。 | [论文](https://arxiv.org/abs/2306.13643) · [代码](https://github.com/cvg/LightGlue) | 未读 | — |
| <span id="paper-d06"></span>**D06 · P1** | *LoFTR: Detector-Free Local Feature Matching with Transformers* | 2021 · CVPR | coarse-to-fine 的无检测器匹配怎样帮助弱纹理区域？分辨率和半稠密对应带来哪些成本？ | [论文](https://arxiv.org/abs/2104.00680) · [代码](https://github.com/zju3dv/LoFTR) | 未读 | — |
| <span id="paper-d07"></span>**D07 · P0** | *XFeat: Accelerated Features for Lightweight Image Matching* | 2024 · CVPR | 轻量特征提取和匹配如何设计？稀疏/半稠密输出与当前 MNN/PnP 接口怎样对应？ | [论文](https://arxiv.org/abs/2404.19174) · [代码](https://github.com/verlab/accelerated_features) | 未读 | — |
| <span id="paper-d08"></span>**D08 · P1** | *ALIKED: A Lighter Keypoint and Descriptor Extraction Network via Deformable Transformation* | 2023 · TIM | 可变形变换如何改善描述子采样与效率？模型变轻后哪些困难场景可能受影响？ | [论文](https://arxiv.org/abs/2304.03608) · [代码](https://github.com/Shiaoming/ALIKED) | 未读 | — |

比较方法时固定或明确报告：图像缩放、畸变处理、关键点上限、NMS、匹配阈值、精度模式和对应点后处理。特征提取与 matcher 是两类模块，不能把整套变化归因于单个模型名称。

<span id="topic-geometry"></span>

### E：几何估计与视觉消歧（3 篇）

配套知识：[从图像对应到相机位姿](../fundamentals/从图像对应到相机位姿.md)、[状态估计与不确定性](../fundamentals/状态估计与不确定性.md)和[定位评估方法](../data-evaluation/定位评估方法.md)。

| 编号 / 优先级 | 论文 | 年份 / 发表 | 核心阅读问题 | 入口 | 状态 | 我的笔记 |
| --- | --- | --- | --- | --- | --- | --- |
| <span id="paper-e01"></span>**E01 · P1** | *EPnP: An Accurate O(n) Solution to the PnP Problem* | 2009 · IJCV；作者页也列有早期版本 | 2D–3D 对应如何求相机位姿？几何分布、噪声、共面性与内参误差怎样影响解？不要默认实际 solver 使用 EPnP。 | [论文 / 作者入口](https://www.epfl.ch/labs/cvlab/software/multi-view-stereo/epnp/) | 未读 | — |
| <span id="paper-e02"></span>**E02 · P1** | *MAGSAC++, a Fast, Reliable and Accurate Robust Estimator* | 2020 · CVPR | 鲁棒模型估计怎样处理噪声尺度与模型评分？先区分一般鲁棒估计思想和具体库是否支持当前 PnP 路径。 | [论文](https://arxiv.org/abs/1912.05909) | 未读 | — |
| <span id="paper-e03"></span>**E03 · P0** | *Doppelgangers++: Improved Visual Disambiguation with Geometric 3D Features* | 2025 · CVPR | 重复结构为什么造成伪匹配？几何感知特征如何帮助消歧？论文主要针对 SfM，迁移到重定位门控需要单独验证。 | [论文](https://arxiv.org/abs/2412.05826) · [PaperNotes](https://papernotes.org/CVPR2025/3d_vision/doppelgangers_improved_visual_disambiguation_with_geometric_3d_features/) | 未读 | — |

这组重点建立“对应点—假设—内点—精化—接受判定”的理解。RANSAC 内点多、重投影误差小，不足以单独证明地图中的绝对位置正确；错误地图点关联、重复结构、参考误差与几何退化都应检查。

<span id="topic-scene-coordinate-regression"></span>

### F：场景坐标回归重定位（2 篇）

配套知识：[从图像对应到相机位姿](../fundamentals/从图像对应到相机位姿.md)、[地图到底存了什么](../fundamentals/地图到底存了什么.md)和[如何选择视觉重定位 Pipeline](../hloc/如何选择视觉重定位Pipeline.md)。

| 编号 / 优先级 | 论文 | 年份 / 发表 | 核心阅读问题 | 入口 | 状态 | 我的笔记 |
| --- | --- | --- | --- | --- | --- | --- |
| <span id="paper-f01"></span>**F01 · P2** | *DSAC — Differentiable RANSAC for Camera Localization* | 2017 · CVPR | 怎样将鲁棒位姿求解与学习过程结合？网络预测场景坐标，几何求解器仍在做什么？ | [论文](https://arxiv.org/abs/1611.05705) | 未读 | — |
| <span id="paper-f02"></span>**F02 · P1** | *Accelerated Coordinate Encoding: Learning to Relocalize in Minutes using RGB and Poses* | 2023 · CVPR · ACE | 场景无关 backbone 与场景专属 head 如何分工？特征缓存、训练批次组织与重投影损失为什么能加速建图？ | [论文](https://arxiv.org/abs/2305.14059) · [代码](https://github.com/nianticlabs/ace) | 未读 | — |

将 ACE 与 HLoc 比较时，至少区分每场景训练成本、地图存储、地图更新、Query 推理、泛化条件和 reference 来源，不能只比较在线推理时间。

<span id="topic-evaluation"></span>

### G：评测协议、数据与参考可信度（5 篇）

配套知识：[从 LIO 轨迹到相机参考位姿](../data-evaluation/从LIO轨迹到相机参考位姿.md)、[定位评估方法](../data-evaluation/定位评估方法.md)和[数据采集与交付](../data-evaluation/数据采集与交付.md)。

| 编号 / 优先级 | 论文 | 年份 / 发表 | 核心阅读问题 | 入口 | 状态 | 我的笔记 |
| --- | --- | --- | --- | --- | --- | --- |
| <span id="paper-g01"></span>**G01 · P1** | *A Benchmark for the Evaluation of RGB-D SLAM Systems* | 2012 · IROS · TUM RGB-D | 时间同步、轨迹对齐、ATE 与 RPE 如何用于系统评测？数据集真值的传感器和测量条件是什么？ | [论文](https://cvai.cit.tum.de/_media/spezial/bib/sturm12iros.pdf) · [Benchmark](https://cvg.cit.tum.de/data/datasets/rgbd-dataset) | 未读 | — |
| <span id="paper-g02"></span>**G02 · P0** | *A Tutorial on Quantitative Trajectory Evaluation for Visual(-Inertial) Odometry* | 2018 · IROS | SE(3)/Sim(3)/yaw 等对齐自由度怎样改变误差？怎样报告局部漂移、多次运行与失败？ | [论文](https://rpg.ifi.uzh.ch/docs/IROS18_Zhang.pdf) · [工具](https://github.com/uzh-rpg/rpg_trajectory_evaluation) | 未读 | — |
| <span id="paper-g03"></span>**G03 · P1** | *Benchmarking 6DOF Outdoor Visual Localization in Changing Conditions* | 2018 · CVPR | 条件变化如何评测？位姿阈值召回与轨迹 RMSE 有何区别？室外结论不能直接代替室内验证。 | [论文](https://arxiv.org/abs/1707.09092) | 未读 | — |
| <span id="paper-g04"></span>**G04 · P0** | *On the Limits of Pseudo Ground Truth in Visual Camera Re-localisation* | 2021 · ICCV | SfM 与 SLAM reference 是否偏向不同方法？参考误差如何影响算法排名与“精度提升”结论？ | [论文](https://arxiv.org/abs/2109.00524) · [代码](https://github.com/tsattler/visloc_pseudo_gt_limitations) | 未读 | — |
| <span id="paper-g05"></span>**G05 · P1** | *Evaluation of Visual Place Recognition Methods for Image Pair Retrieval in 3D Vision and Robotics* | 2026 · XXV ISPRS Congress / ISPRS Annals；arXiv v1 | 将 VPR 用作跨图像集注册前端时，检索指标与后续几何可用性怎样对应？有哪些域依赖差异？ | [论文](https://arxiv.org/abs/2603.13917) | 未读 | — |

对当前实验的直接提醒：

- **参考位姿与真值要区分。** LIO-derived camera reference 依赖外参、时间同步、LIO 轨迹和跨序列地图变换；用 LiDAR 不会自动使整条参考链无误差。
- **建图与评测边界要清楚。** Query 数据是否参与参考地图构建、阈值选择、对齐拟合或训练，需要显式说明。
- **统一地图变换与每方法独立拟合要区分。** 若对每条预测轨迹单独最佳对齐，可能掩盖绝对重定位偏差；具体允许的对齐由任务定义决定。
- **相机中心与其他传感器中心要统一。** 运动时存在杠杆臂效应，不能只平移轨迹文件就默认完成坐标转换。
- **分阶段与端到端指标都要报告。** 检索召回、匹配与几何成功、最终正确定位、错误接受分别回答不同问题。
- **失败也属于总体。** 仅统计 Accepted 帧上的 RMSE 可能遗漏拒绝或误接受代价；同时报告全体 Query 的成功率和错误接受。
- **Proxy v1.0 指标只是当前项目协议。** Recall F/S/C、Accepted Precision、FA_all、Sequence Success、TTFR 不能默认与论文指标同义；比较前明确分母、门控和阈值。
- **单帧定位与序列轨迹要区分。** 孤立 Query 未必适合用轨迹 RPE 衡量；连续序列的 RPE 也需要明确时间或距离间隔与缺帧处理。

<span id="topic-learning-geometry"></span>

### H：学习式几何、VO 与 SLAM（6 篇）

配套知识：[状态估计与不确定性](../fundamentals/状态估计与不确定性.md)、[从图像对应到相机位姿](../fundamentals/从图像对应到相机位姿.md)和[地图到底存了什么](../fundamentals/地图到底存了什么.md)。

| 编号 / 优先级 | 论文 | 年份 / 发表 | 核心阅读问题 | 入口 | 状态 | 我的笔记 |
| --- | --- | --- | --- | --- | --- | --- |
| <span id="paper-h01"></span>**H01 · P1** | *DROID-SLAM: Deep Visual SLAM for Monocular, Stereo, and RGB-D Cameras* | 2021 · NeurIPS | 学习更新模块与 Dense BA 怎样结合？网络负责什么，几何优化又保证什么？ | [论文](https://arxiv.org/abs/2108.10869) · [代码](https://github.com/princeton-vl/DROID-SLAM) | 未读 | — |
| <span id="paper-h02"></span>**H02 · P1** | *Deep Patch Visual Odometry* | 2023 · NeurIPS · DPVO | patch 表示怎样降低稠密计算成本？论文主体是 VO，不应把有轨迹输出等同于完整 SLAM。 | [论文](https://arxiv.org/abs/2208.04726) · [代码](https://github.com/princeton-vl/DPVO) | 未读 | — |
| <span id="paper-h03"></span>**H03 · P1** | *DUSt3R: Geometric 3D Vision Made Easy* | 2024 · CVPR | pointmap 如何统一三维预测？不同图像对输出怎样对齐？学习先验与观测几何分别提供什么？ | [论文](https://arxiv.org/abs/2312.14132) · [代码](https://github.com/naver/dust3r) | 未读 | — |
| <span id="paper-h04"></span>**H04 · P1** | *Grounding Image Matching in 3D with MASt3R* | 2024 · ECCV | 几何预测与匹配描述子怎样联合学习？与 SuperPoint/LightGlue 的任务分解有什么差异？ | [论文](https://arxiv.org/abs/2406.09756) · [代码](https://github.com/naver/mast3r) | 未读 | — |
| <span id="paper-h05"></span>**H05 · P2** | *VGGT: Visual Geometry Grounded Transformer* | 2025 · CVPR | 多视图网络如何预测相机、深度、点图与轨迹？几何预测能力不等于长期 SLAM 系统能力。 | [论文](https://arxiv.org/abs/2503.11651) · [代码](https://github.com/facebookresearch/vggt) | 未读 | — |
| <span id="paper-h06"></span>**H06 · P1** | *MASt3R-SLAM: Real-Time Dense SLAM with 3D Reconstruction Priors* | 2025 · CVPR | 重建先验如何进入跟踪、融合、回环与全局优化？尺度不一致、恢复和计算调度如何处理？ | [论文](https://arxiv.org/abs/2412.12392) · [代码](https://github.com/rmurai0610/MASt3R-SLAM) · [PaperNotes](https://papernotes.org/CVPR2025/3d_vision/mast3r-slam_real-time_dense_slam_with_3d_reconstruction_priors/) | 未读 | — |

建议次序：DUSt3R → MASt3R → MASt3R-SLAM；DROID-SLAM 与 DPVO 构成另一条理解“学习更新 + 几何优化”的路线。暂时不需要每个系统都跑一遍。

<span id="topic-gaussian-maps"></span>

### I：高斯地图与定位交叉（4 篇）

配套知识：[地图到底存了什么](../fundamentals/地图到底存了什么.md)、[如何选择视觉重定位 Pipeline](../hloc/如何选择视觉重定位Pipeline.md)和[效果与性能权衡](../hloc/效果与性能权衡.md)。

| 编号 / 优先级 | 论文 | 年份 / 发表 | 核心阅读问题 | 入口 | 状态 | 我的笔记 |
| --- | --- | --- | --- | --- | --- | --- |
| <span id="paper-i01"></span>**I01 · P1** | *3D Gaussian Splatting for Real-Time Radiance Field Rendering* | 2023 · SIGGRAPH / TOG | 高斯形状、投影、可见性、密度控制与光度优化如何组成地图？好看的渲染不自动保证定位所需几何准确。 | [论文](https://repo-sam.inria.fr/fungraph/3d-gaussian-splatting/) · [代码](https://github.com/graphdeco-inria/gaussian-splatting) | 未读 | — |
| <span id="paper-i02"></span>**I02 · P2** | *Gaussian Splatting SLAM* | 2024 · CVPR · MonoGS | 如何用高斯地图做相机跟踪与增量建图？光度优化的收敛、可观性和运行成本有什么限制？ | [论文](https://arxiv.org/abs/2312.06741) · [代码](https://github.com/muskie82/MonoGS) | 未读 | — |
| <span id="paper-i03"></span>**I03 · P2** | *SplaTAM: Splat, Track & Map 3D Gaussians for Dense RGB-D SLAM* | 2024 · CVPR | RGB-D 几何信息如何服务跟踪和地图扩展？与单目 Gaussian SLAM 的输入与约束有何差别？ | [论文](https://arxiv.org/abs/2312.02126) · [代码](https://github.com/spla-tam/SplaTAM) | 未读 | — |
| <span id="paper-i04"></span>**I04 · P0（拓展）** | *Hierarchical Visual Relocalization with Nearest View Synthesis from Feature Gaussian Splatting* | 2026 · CVPR · SplatHLoc | 特征高斯地图怎样合成接近 Query 的视图？初始检索、视点选择、匹配、位姿求解与成本怎样连接？ | [论文](https://arxiv.org/abs/2603.29185) · [代码](https://github.com/HqiTao/SplatHLoc) · [PaperNotes](https://papernotes.org/CVPR2026/3d_vision/hierarchical_visual_relocalization_with_nearest_view_synthesis_from_feature_gaus/) | 未读 | — |

[gsplat](https://github.com/nerfstudio-project/gsplat) 是通用计算库；读其 CUDA 实现与读一个 SLAM/重定位系统论文是不同层次的工作。

## 按问题找论文

<span id="problem-index"></span>

| 现象 / 问题 | 先读 | 想得到的判断 |
| --- | --- | --- |
| 光照变化后检索不到，但局部 matcher 本身未必有问题 | [C01](#paper-c01) / [C02](#paper-c02) / [C03](#paper-c03) / [C07](#paper-c07) / [C08](#paper-c08) | 问题来自 backbone、聚合、训练域、预处理还是数据库覆盖？ |
| 位置接近的图像却无法匹配 | [C05](#paper-c05)、[D01](#paper-d01) / [D05](#paper-d05) / [D06](#paper-d06)、[B03](#paper-b03) | 视角、重叠、弱纹理还是局部特征问题？ |
| 匹配很多，PnP 仍失败 | [B02](#paper-b02)、[E01](#paper-e01) / [E02](#paper-e02) | 3D 地标质量、对应索引、几何分布、内参或外参是否有问题？ |
| 低重投影误差却定位到错误房间 | [E03](#paper-e03)、[A02](#paper-a02)、[G04](#paper-g04) | 视觉混淆、地图关联或参考误差是否被单一门控掩盖？ |
| ATE 异常，或不同方法排名不稳定 | [G02](#paper-g02) / [G04](#paper-g04)、[A06](#paper-a06) / [A07](#paper-a07) | 时间同步、对齐自由度、传感器中心、跨序列变换是否一致？ |
| Recall 提高但整体时延变差 | [B01](#paper-b01)、[C11](#paper-c11)、[D05](#paper-d05) / [D07](#paper-d07) | top-K、提取、匹配、PnP 与数据搬运分别占多少成本？ |
| 想超越只选 Reference 图像的定位方式 | [B03](#paper-b03) / [B04](#paper-b04)、[F02](#paper-f02)、[I04](#paper-i04) | 视图合成、特征优化或场景坐标回归提供什么替代路线？ |
| 想看学习模块怎样进入完整 SLAM | [A02](#paper-a02) / [A03](#paper-a03)、[H01](#paper-h01) / [H06](#paper-h06) | 系统状态、数据关联、回环、优化和恢复分别如何实现？ |

## 辅助解读与背景资料

PaperNotes 只是辅助筛选和理解的入口，不能替代原论文。已确认的对应页面已放入 [C10](#paper-c10)、[C11](#paper-c11)、[E03](#paper-e03)、[H06](#paper-h06) 和 [I04](#paper-i04) 的“入口”列。网站分类有时不能准确反映任务，检索时可用 `visual localization`、`camera relocalization`、`visual place recognition`、`local feature matching`、`scene coordinate regression`、`loop closure`、`visual-inertial` 和 `Gaussian SLAM` 等关键词。

有价值的实现与背景入口（不计入 50 篇）：

- [DBoW2](https://github.com/dorian3d/DBoW2)：官方仓库列出 *Bags of Binary Words for Fast Place Recognition in Image Sequences* 与 *Real-Time Loop Detection with Bags of Binary Words*。用于理解 ORB 系统中的词袋检索、时间一致性和几何验证；地点检索与完整回环不是同一件事。
- [OpenVINS 文档](https://docs.openvins.com/)：补 MSCKF、外参、时间偏移与状态一致性；文档是实现资料，不替代论文引用。
- [COLMAP 文档](https://colmap.github.io/)：补相机模型、数据库、三角化、模型格式和坐标约定。
- [HLoc 官方 README](https://github.com/cvg/Hierarchical-Localization)：核对当前工具箱组件、配置和接口；原论文描述与软件当前实现需要分别记录。
- [gsplat 文档](https://docs.gsplat.studio/main/)：在 [I01](#paper-i01) / [I04](#paper-i04) 引出计算问题后，查看光栅化、特征通道、反向传播和性能测量。

## 新增一篇阅读笔记

1. 从 [`templates/paper-note.md`](https://github.com/Tiansuanyu/notes/blob/main/templates/paper-note.md) 复制模板，在 `slam/papers/` 下用稳定英文短名建文件，例如 `netvlad.md`。
2. 填写论文身份、阅读版本和实际阅读记录；不要为了填满模板而猜测结论或复现结果。
3. 在本页对应稳定编号中更新“状态”和“我的笔记”链接；论文元信息仍以本页为主清单。
4. 自动 sidebar 会显示 `slam/papers/` 下真实存在的 Markdown 笔记；可用 frontmatter `order` 调整顺序，无需手写导航。

不需要按顺序读完全部 50 篇，也不需要为每个模型重新搭建环境。先用核心 12 篇建立可解释当前实验的知识链，其他条目在对应问题出现时查阅。
