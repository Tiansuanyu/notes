---
title: IMU 噪声、功率谱与 Allan 方差
description: 从噪声密度、PSD 到 Allan deviation，解释 IMU 白噪声、bias 漂移与参数识别边界。
order: 20
---

# IMU 噪声、功率谱与 Allan 方差

IMU 数据同时包含确定性误差、随机噪声和真实运动。静置数据能分析部分随机过程，却不能识别所有 scale factor、axis misalignment、温度效应和动态 vibration。

## 1. 连续噪声密度与离散样本方差

测量模型见[IMU 测量模型与状态传播](../inertial-odometry/imu-measurement-and-propagation.md)。若连续 white-noise density 为 $n_d$，单位例如 $(\mathrm{rad/s})/\sqrt{\mathrm{Hz}}$，在理想带宽和采样模型下，离散每样本标准差与采样率相关，常见单边 PSD 约定下量级为

$$
\sigma_{sample}\propto n_d\sqrt{f_s}.
$$

比例因子取决于单边/双边 PSD、anti-alias bandwidth 和离散化约定。因此配置参数前必须核对软件文档，不应只按单位猜公式。

状态中的 bias random walk 常写

$$
\dot b(t)=n_b(t),
$$

若连续谱密度为 $Q_b$，离散增量协方差近似 $Q_b\Delta t$。这与测量白噪声在采样平均中的缩放方向不同。

## 2. PSD 能看到什么

PSD 展示噪声能量随频率分布。平坦 PSD 支持某频段内近似白噪声；窄峰可能来自机械 vibration、电源或采样时钟；低频抬升可能来自温漂和 bias 漂移。有限窗口、去趋势和 Welch 参数都会改变估计。

PSD 不能单独证明噪声 Gaussian，也不能区分所有产生相同二阶谱的过程。真实 IMU 噪声还可能时变、温度相关并在轴间相关。

## 3. Allan variance

对等间隔标量序列，取平均时间 $\tau=mT_s$，第 $k$ 个不重叠 cluster 的均值为

$$
\bar y_k(\tau)=\frac1m\sum_{i=0}^{m-1}y_{km+i}.
$$

Allan variance 定义为相邻 cluster 均值差的方差：

$$
\sigma_A^2(\tau)=\frac12
\mathbb E\left[(\bar y_{k+1}-\bar y_k)^2\right].
$$

实际常绘制 Allan deviation $\sigma_A(\tau)$ 的 log–log 曲线。典型幂律过程会呈现特定斜率：white rate noise 约为 $-1/2$，bias instability 附近近似平坦，rate random walk 约为 $+1/2$。这些名称和系数转换依赖 IEEE/厂商采用的具体定义，读数时应说明 convention。

## 4. 数据时长与置信度

大 $\tau$ 处可用 cluster 数很少，估计方差很大。为了识别慢漂移，需要远长于目标 $\tau$ 的稳定记录，同时保存温度、采样率、量程和设备配置。把曲线尾部一个偶然斜率拟合成长期随机游走，会产生虚假精度。

重叠 Allan variance 使用更多相邻窗口，通常降低估计方差，但窗口高度相关；它不创造额外独立数据。去趋势也会移除一部分低频过程，必须记录。

## 5. 从识别到滤波参数

Allan/PSD 提供噪声模型候选和参数量级，进入 ESKF 前还要确认：

- estimator 使用 noise density 还是 discrete covariance；
- bias 模型是 random walk、Gauss–Markov 还是固定量；
- 轴间是否假设独立；
- 单位是 rad 还是 degree、second 还是 hour；
- 数据是否经过设备内部滤波和降采样。

调大噪声可让滤波器“更不信某传感器”，但不能替代正确时间戳、外参和运动模型。OpenVINS/FAST-LIO/Super-LIO 的具体参数名和离散方式应以所用版本文档与源码为准。

## 参考资料

- IEEE Std 952：惯性传感器术语与测试方法的经典来源，使用时需核对所采用版本。
- NIST，[Handbook of Frequency Stability Analysis](https://www.nist.gov/publications/handbook-frequency-stability-analysis)：Allan 类方差、置信度与噪声类型的系统说明。
