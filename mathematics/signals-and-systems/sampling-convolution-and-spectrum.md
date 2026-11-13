---
title: 采样、卷积与频谱
description: 从连续采样到 DFT/FFT、卷积、互相关和功率谱，建立传感器信号分析基础。
order: 10
---

# 采样、卷积与频谱

机器人处理的是连续物理过程的离散样本。采样率决定可区分的时间变化，窗口和滤波决定频谱解释，时间戳则决定样本属于哪个时刻。

## 1. 采样与混叠

连续信号 $x(t)$ 以周期 $T_s$ 采样：

$$
x[n]=x(nT_s),\qquad f_s=\frac1{T_s}.
$$

若 $x(t)$ 严格带限到 $|f|<B$，理想均匀采样在 $f_s>2B$ 时可唯一重建。$f_s/2$ 是 Nyquist frequency。真实传感器并非严格带限，因此 ADC 前需模拟 anti-alias filter，把高于可表示频带的能量先压低。

采样使连续频谱以 $f_s$ 周期复制。若副本重叠，高频会折叠为低频：频率 $f$ 的样本与 $f+kf_s$ 在采样点上不可区分。采样后再做数字低通无法恢复已经混叠的身份。

## 2. Fourier Transform、DTFT 与 DFT

采用频率 $f$ 的连续 Fourier Transform：

$$
X(f)=\int_{-\infty}^{\infty}x(t)e^{-j2\pi ft}\,dt.
$$

离散时间序列的 DTFT 为

$$
X(e^{j\omega})=\sum_{n=-\infty}^{\infty}x[n]e^{-j\omega n},
$$

对 $\omega$ 具有 $2\pi$ 周期。有限长度 $N$ 的 DFT 只在 $N$ 个频点取样：

$$
X[k]=\sum_{n=0}^{N-1}x[n]e^{-j2\pi kn/N}.
$$

FFT 是高效计算 DFT 的算法，不是另一种变换。频率分辨率 $\Delta f=f_s/N$ 来自观测时长 $NT_s$；补零只插值频谱显示，不增加真实观测信息。

## 3. 窗函数与 spectral leakage

截取有限窗口相当于把无限信号乘 $w[n]$，频域中变成真实频谱与窗频谱的卷积。若信号周期不正好落在 DFT bin 上，能量泄漏到邻近频点。Hann 等窗降低旁瓣，却扩大主瓣；“峰更宽”是分辨率与泄漏之间的权衡。

比较 PSD 时必须记录采样率、窗、段长、overlap、去均值方式与归一化，否则幅值不可直接比较。

## 4. 卷积是 LTI 系统的输入输出

连续线性时不变系统的冲激响应为 $h(t)$，输出

$$
y(t)=(h*x)(t)=\int_{-\infty}^{\infty}h(\tau)x(t-\tau)\,d\tau.
$$

离散形式为

$$
y[n]=\sum_kh[k]x[n-k].
$$

Fourier 域中 $Y=HX$，所以滤波既可看作时域加权，也可看作频率分量乘以传递响应。有限卷积与 DFT 相乘时要补足长度，否则得到 circular convolution。

## 5. 互相关与时延

实信号互相关可定义为

$$
r_{xy}[\ell]=\sum_nx[n]y[n+\ell].
$$

峰值 lag 可提供相对时延候选，但周期信号、动态变化、滤波相位和不同采样率会制造多峰或偏差。相关峰不是硬件时钟真值；传感器外参、运动模型和时间插值仍需联合验证。

## 6. 功率谱密度

对宽平稳随机过程，autocorrelation

$$
R_x(\tau)=\mathbb E[x(t)x(t+\tau)]
$$

的 Fourier Transform 是功率谱密度 $S_x(f)$（Wiener–Khinchin）：

$$
S_x(f)=\int_{-\infty}^{\infty}R_x(\tau)e^{-j2\pi f\tau}\,d\tau.
$$

PSD 描述单位带宽内的平均功率，不保留单次实现的相位。有限数据的 periodogram 有较高方差，Welch 方法通过分段平均降方差，但牺牲频率分辨率。

IMU 噪声如何从 PSD 延伸到 Allan 方差见[IMU 噪声、功率谱与 Allan 方差](./imu-noise-psd-and-allan-variance.md)。
