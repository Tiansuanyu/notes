---
title: 极点、频率响应与稳定性
description: 从极点位置、BIBO 稳定到 Bode 图、裕度和时间延迟的闭环影响。
order: 40
---

# 极点、频率响应与稳定性

极点描述系统自然模态，频率响应描述稳态正弦输入怎样被放大和移相。两者连接时域瞬态、滤波效果与闭环稳定性。

## 1. 极点与零点

有理传递函数

$$
G(s)=K\frac{\prod_i(s-z_i)}{\prod_j(s-p_j)}
$$

的 $p_j$ 是极点，$z_i$ 是零点。连续因果有限维 LTI 系统在所有极点实部严格小于零时 BIBO 稳定；离散系统则要求极点位于单位圆内。

状态矩阵 $A$ 的特征值包含内部模态，但传递函数中不可控或不可观模态可能发生 pole-zero cancellation。输入输出看似稳定不代表被消去的内部不稳定状态安全，因此控制设计还需检查 stabilizability/detectability。

## 2. 一阶与二阶直觉

一阶低通

$$
G(s)=\frac{1}{\tau s+1}
$$

极点为 $-1/\tau$；$\tau$ 越大，响应越慢。标准二阶系统

$$
G(s)=\frac{\omega_n^2}
{s^2+2\zeta\omega_ns+\omega_n^2}
$$

由自然频率 $\omega_n$ 和阻尼比 $\zeta$ 控制上升、振荡与超调。该参数化适用于理想二阶主导模型；高阶未建模模态可能破坏直觉。

## 3. 频率响应与 Bode 图

对稳定连续 LTI 系统令 $s=j\omega$：

$$
G(j\omega)=|G(j\omega)|e^{j\angle G(j\omega)}.
$$

Bode 图绘制 $20\log_{10}|G|$ 与相位随对数频率变化。幅值说明各频段增益，相位说明输出相对输入的偏移。采样系统在单位圆 $z=e^{j\omega T_s}$ 上评价频率响应，最高无混叠频率是 Nyquist frequency。

## 4. 闭环裕度

开环环路 $L(s)=C(s)P(s)$。gain crossover $\omega_{gc}$ 满足 $|L|=1$，phase margin 是此处距 $-180^\circ$ 的余量；phase crossover 处距单位增益的余量给 gain margin。裕度是围绕特定开环模型的相对鲁棒性指标，不是对任意非线性、饱和和时变延迟的保证。

纯延迟

$$
G_d(s)=e^{-s\tau}
$$

幅值为 1，相位为 $-\omega\tau$。所以延迟不改变 Bode 幅值，却会持续消耗高频相位裕度。这解释了为什么视觉定位延迟即使数值准确，也可能使快速控制环不稳定。

## 5. BIBO、渐近与数值稳定不是一回事

- BIBO 稳定：有界输入产生有界输出；
- 内部渐近稳定：零输入时状态趋向平衡点；
- Lyapunov 稳定：小初始扰动保持小；
- 数值稳定：离散算法不会因舍入或步长人为发散。

连续稳定系统若用过大的前向 Euler 步长，离散极点 $1+\lambda\Delta t$ 可能跑出单位圆，这是数值离散造成的失稳，不代表原连续系统物理不稳定。

滤波器的幅相权衡见[数字滤波与互补滤波](./digital-and-complementary-filtering.md)，闭环应用见[反馈、PID 与级联控制](../robot-modeling-control/feedback-pid-and-cascade.md)。
