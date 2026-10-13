---
title: RTAB-Map 与 HLoc 的定位链对比
description: 对齐两套定位链的地图、候选、几何、状态和输出契约，避免按模块名称误类比。
order: 30
---

# RTAB-Map 与 HLoc 的定位链对比

RTAB-Map 与 HLoc 都会出现“检索、局部匹配、几何估计”这些词，但系统边界不同。RTAB-Map 是带记忆管理、时序状态和位姿图的在线 SLAM/定位系统；HLoc 是围绕图像检索、局部特征和已知 SfM 模型组织的分层视觉定位工具箱。相似的模块名不意味着相同的数据结构、概率含义或失败契约。

## 1. 先看端到端职责

| 维度 | RTAB-Map | HLoc `localize_sfm.py` |
| --- | --- | --- |
| 核心地图 | Signature、局部观测、视觉词、传感器负载和位姿图约束 | COLMAP/pycolmap Reconstruction：相机、图像、2D observation、track 与 Point3D |
| 候选来源 | WM 外观 likelihood + Bayes posterior，也可有空间/时间邻近 | 外部 retrieval pairs 文件；定位脚本不负责训练或生成全局描述子 |
| 2D–3D 形成 | 节点间视觉注册按配置使用局部 3D/2D 信息 | Query–Reference 匹配经 Reference observation 映射到 Point3D |
| 时序状态 | odometry cache、`map → odom`、历史后验、活动记忆 | 主脚本按 Query 独立求绝对 Pose；没有连续滤波状态 |
| 最终约束 | 可进入位姿图并接受图一致性检查 | pycolmap 绝对 Pose 估计与精化，不修改 Reference SfM 图 |
| 持久化 | SQLite 数据库与 STM/WM/LTM 迁移 | SfM model、features、matches、pairs、pose 文本和 pickle logs |
| 典型输出 | 连续 map-frame Pose、TF、图与统计 | 每张 Query 的 `cam_from_world` 文本结果和日志 |

## 2. “检索”不是同一个接口

RTAB-Map 在主循环中对 WM 节点计算 BoW 式外观 likelihood，经调整和 Bayes filter 得到 posterior；命中旧区域时还会从 LTM 召回邻域。这是一条带记忆状态的地点假设链。

所核对的公开 HLoc commit 中，`localize_sfm.py` 只读取已经生成的 retrieval 文件。NetVLAD、MixVPR 或其他方法怎样产生 pairs，是上游任务。把 HLoc 的 top-K 和 RTAB-Map 的 `Rtabmap/MaxRetrieved` 都叫“检索数量”会混淆：前者通常是 Query 的候选 Reference 图像数，后者限制一轮从长期记忆重新载入的节点数。

## 3. 视觉词与 Point3D 不是同一种身份

RTAB-Map 的 visual word 是局部描述子量化身份，可用于外观比较；节点的 `_words3` 是局部 `base_link` 坐标中的三维点。相同 word ID 不能证明是同一个物理点。

HLoc 则沿 Reference 图像的 2D observation 找到 Reconstruction 中显式的 Point3D ID。所核对公开 commit 的 [`pose_from_cluster()`](https://github.com/cvg/Hierarchical-Localization/blob/c13273bd0ecc2917a35910fd843712a1c6243193/hloc/localize_sfm.py) 对同一 Query keypoint：

- 会去掉重复出现的同一个 Point3D；
- 若它从不同 Reference 匹配到不同 Point3D，会把这些冲突候选都保留给 PnP。

因此原始 pairwise matches、2D–3D correspondences、唯一 Point3D 数和 PnP inliers 是不同计数。它们不应互相替代。

## 4. 共视聚类也不等于 RTAB-Map 的局部图

HLoc 可把检索到的 Reference 图像按共享 Point3D 的连通分量聚类，对每簇独立定位，然后选择 PnP 内点数最高的成功簇。它利用的是固定 SfM 模型中的共视关系。

RTAB-Map 的局部图则包含节点 Pose 和多类相对约束，还与 odometry cache、地图先验和当前 `map → odom` 状态相连。二者都使用“邻域”，但变量和边的语义不同。

### 4.1 一个对应汇集示意

假设 Query 关键点 $q_7$ 分别匹配到 Reference A 的观测 $a_3$ 和 Reference B 的观测 $b_9$：

- 若 $a_3$、$b_9$ 都属于 Point3D `42`，汇集后只是同一条 2D–3D 对应，不能计成两份独立几何支持；
- 若二者分别属于 Point3D `42` 和 `108`，则同一个 $q_7$ 对应两个互相冲突的地图点。所核对的 HLoc 入口会保留这两个候选，交给鲁棒估计筛选；
- 若逐 Reference 各做一次 PnP，A、B 会产生两个独立位姿假设，不能获得跨图共享的 2D–3D 支持；
- 若先按共视连通分簇再汇集，同一簇内能共享地图点，彼此不连通的地点仍分别求解。

所以“Top-K=20”既不表示做 20 次 PnP，也不保证所有 20 张图被无条件汇进一个 PnP；行为由定位入口和聚类配置决定。

## 5. PnP 后的精化与图优化

所核对的 HLoc commit 调用 `pycolmap.estimate_and_refine_absolute_pose()`，即先鲁棒估计再精化单个 Query Pose；Reference 模型保持不变。RTAB-Map 的视觉注册也可走 3D→2D PnP，但接受约束后还可能优化包含 odometry 和地图节点的局部位姿图。

所以两者都出现“refine”时，要问优化变量：

- 只优化一个 Query 相机 Pose；
- 联合优化若干相机/点的局部 BA；
- 还是优化节点 Pose 的图。

三者的残差、协方差与故障模式不同。

## 6. 失败输出是最容易踩坑的差异

所核对的 HLoc `1.5` commit 的脚本行为是：

- 开启 covisibility clustering 时，所有簇都定位失败，结果文件不写该 Query；
- 不开启 clustering 时，若 PnP 返回 `None`，脚本会把第一个检索图的 Pose 写入结果；
- pose 文本本身不携带“这是 PnP 成功还是 fallback”、拒绝原因或可供系统直接消费的协方差；详细信息留在 pickle log。

这是所核对脚本的接口行为，不代表所有封装。由此只能确定“结果文件有一行”并不等价于 PnP 成功；判断求解状态还需要同时查看返回值和 logs。

RTAB-Map 则会在同一主循环中保留候选、注册和图验收统计，并在未定位时继续依赖 odometry 传播；ROS 包装层还可能按参数决定是否只在发生定位事件时发布 `localization_pose`。topic 是否有消息同样不等于绝对正确。

## 7. 协方差与置信度不能直接互换

RTAB-Map 的注册协方差、边信息矩阵、图优化误差 ratio 和最终 localization covariance 各自属于不同层。HLoc 的检索分数、matcher score、PnP inlier count 和重投影残差也属于不同层。

HLoc 的固定 pose 文本没有稳定的 covariance 输出契约；即使底层求解器能返回局部协方差，它也只描述选定假设附近的局部不确定性，不能覆盖“定位到另一个重复房间”的多峰歧义。更不能把 RTAB-Map 的 Bayes posterior 与 HLoc matcher score 当作同标度概率融合。

## 8. 适用范围的横向理解

| 需求 | 更接近的起点 |
| --- | --- |
| 单张图像对固定 SfM 地图求绝对 Pose | HLoc |
| 连续传感器流、odometry、回环与图优化 | RTAB-Map |
| 大地图在线记忆预算与数据库召回 | RTAB-Map |
| 快速替换检索器、局部特征和 matcher 做离线对照 | HLoc |

这张表描述的是两套公开项目原本解决的问题，不构成组合或接入方案。HLoc 的实验选型细节仍见[如何选择视觉重定位 Pipeline](../hloc/如何选择视觉重定位Pipeline.md)。
