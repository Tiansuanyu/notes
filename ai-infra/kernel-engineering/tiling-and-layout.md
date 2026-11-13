---
title: Tiling 与 Layout
description: 从逻辑张量到局部 tile、物理索引与矩阵单元契约。
order: 20
---

# Tiling 与 Layout

Tiling 决定一次处理哪个子域，layout 决定该子域中的逻辑索引怎样落到物理存储。两者共同影响局部容量、搬运效率和计算指令是否合法。

## 1. 为什么要分块

对 $C=A B$，输出块 $C_{m:n}$ 可以在 $K$ 维分段累加：

$$
C_{tile}=\sum_{q} A_{tile,q}B_{q,tile}.
$$

只要累加顺序和精度符合契约，这与完整矩阵乘法语义一致。分块让输入在 L1/L0 中复用，并让 C 留在 L0C 跨多个 $K$ tile 累加。

选择 $(M_t,N_t,K_t)$ 时至少权衡：输出 block 数、L1/L0 容量、Cube 支持的形状与对齐、尾块、双缓冲副本、GM 访问连续性，以及 Cube/Vector 工作比例。

## 2. Shape 不等于 Layout

同样的 `(128, 128)` 逻辑矩阵可以行主序、列主序或按 fractal tile 排列。矩阵单元需要的布局可能不是普通二维连续数组，因此 transpose 有时是索引变换，有时会触发真实搬运/重排。

TileLang 的 `Layout` 用 forward function 把逻辑索引映射为物理索引；`Fragment` 还表达逻辑元素到线程/局部索引的映射，但不能因此直接把它等同于昇腾 L0 fragment。Ascend 示例使用 `make_zn_layout`、`make_nz_layout` 与 `T.annotate_layout` 表达 L1 的 zN/nZ 排布，其意义是满足 Cube 搬运和计算契约，而非仅写一个矩阵转置标志。

## 3. 边界 tile

整除示例常用

$$
N_M=M/M_t,\qquad N_N=N/N_t,
$$

但真实 shape 可能需要 `ceildiv`、有效长度、padding 或 predicate。TileLang 基础 GEMM 的 M/N tile 数使用整数除法，未覆盖尾块；仓库另有 tail-block 示例。K 循环即使用 `ceildiv`，也不能在固定大小 copy 没有 padding/有效长度时自动断言安全。

正确性检查应覆盖：非整除 M/N/K、最小 tile、dtype 累加、transpose、padding 值以及输出区域是否越界。性能快的整除路径可以单独存在，但接口必须明确限制。

## 4. Layout transformation 的成本

layout transform 可改善后续连续搬运和 Cube 取数，却会产生额外指令、临时空间或一次重排。判断是否值得要看重排能被复用多少次。若一个权重在多个 query tile 间复用，预排布可能摊薄；若数据只使用一次，转换成本可能盖过收益。

编译器可以根据 scope 和 intrinsic 推断布局，也可以接受显式 annotation。自动选择便于移植，显式布局便于精调；两者都必须在生成代码中验证，不能仅凭 DSL shape 推断物理访问。

## 5. 与 CPU/GPU 的联系

CPU GEMM 的 packing 把 A/B panel 重排为 SIMD 微内核方便消费的连续布局；GPU 常把 global tile 协作搬入 shared memory，再按 warp/matrix intrinsic 需要组织。NPU 的 zN/nZ 与多级 L1/L0 路径体现同一原则：**让消费者以自然粒度取数**。差异在于硬件 scope、搬运指令和同步机制，不应把术语一一替换。

## 源码入口

- [TileLang `Layout`](https://github.com/tile-ai/tilelang-ascend/blob/c3b324ac955271fd245346be465fbdd39fd4bd18/tilelang/layout/layout.py)
- [Ascend zN/nZ layout](https://github.com/tile-ai/tilelang-ascend/blob/c3b324ac955271fd245346be465fbdd39fd4bd18/tilelang/intrinsics/ascend_layout.py)
- [基础 GEMM](https://github.com/tile-ai/tilelang-ascend/blob/c3b324ac955271fd245346be465fbdd39fd4bd18/examples/gemm/example_gemm.py)

