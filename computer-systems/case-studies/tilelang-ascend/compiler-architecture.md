---
title: TileLang-Ascend 编译架构
description: 沿真实源码追踪 DSL、TIR、codegen、共享库与 NPU stream。
order: 10
---

# TileLang-Ascend 编译架构

这篇沿 `ascendc_pto` commit `c3b324a` 的真实调用链追踪一次 kernel 实例化；概念推导由 [张量编译器](../../compilers/tensor-compilers.md) 主讲。

## 1. 端到端调用链

```mermaid
flowchart LR
    J[@tilelang.jit] --> P[T.prim_func]
    P --> T[TIR PrimFunc]
    T --> L[tilelang.engine.lower]
    L --> X[TIR pass pipeline]
    X --> C[AscendC / PTO C++]
    C --> B[Bisheng]
    B --> S[共享库]
    S --> W[Cython + ctypes]
    W --> R[torch_npu stream]
    R --> K[AI Core kernel]
```

1. `T.prim_func` 调用 TVM Script parser 生成 PrimFunc；
2. `@tilelang.jit` 的 builder 按 shape/tile 参数实例化并缓存；
3. `JITKernel` 在 PassContext 中调用 `tilelang.lower`；
4. lowering 运行合法化、布局、流水、存储与同步 passes；
5. target model 选择 AscendC 或 PTO codegen；
6. `LibraryGenerator` 调 Bisheng 生成 `.so`；
7. Cython wrapper 检查 tensor dtype/device/contiguity、分配输出/workspace、取得当前 NPU stream；
8. `.so` 中 `extern "C" call(...)` 在同一 stream 启动设备 kernel。

wrapper 没有自动做设备级同步，所以调用可保持异步；计时者必须定义同步边界。

## 2. 缓存单位

cache key 包含 PrimFunc script hash、TileLang 版本、target/platform、输出/workspace index、pass configs 与 compile flags。命中表示可复用该 specialization 的编译产物，不表示其他 shape、tile 或 pass 配置也兼容。

## 3. Runtime 的实际组成

当前 NPU runtime 不是一个单独的 `src/runtime/runtime.cc`：

- codegen 生成 host `call` 和 launch；
- Bisheng 链接 CANN runtime；
- Cython/ctypes 连接 Python tensor 与 raw pointer；
- `torch_npu` 提供当前 stream；
- CANN/driver 执行加载和设备调度。

`engine.lower` 在固定提交返回的 `host_mod`、`rt_mod` 为 `None`，默认可用的是 Cython adapter 路线。不能根据通用 TVM 文档声称这里已建立 TVM NPU runtime Module。

## 4. 两个 codegen 后端

AscendC 路线生成 GlobalTensor、TPipe/TBuf、`__aicore__` kernel 与 host tiling，使用 `bisheng -xasc`。PTO 路线生成 PTO Tile/operation 和地址绑定，使用 `bisheng -xcce`。二者共享部分 TIR passes，但源码模板和 host 逻辑不同。

编译命令里的 `dav-2201`、`dav-c220`、`dav-c310` 是当前仓库工具配置，不能据此自行建立完整产品代际表。

## 5. `npuir` 对照

`npuir` commit `bd7c60c` 的预期链为 TIR→MLIR/HIVM/HFusion→`bishengir-compile`→device object，再经 CANN runtime 注册/启动。它绕过本页的 AscendC/PTO C++ codegen 与共享库构建方式。

固定提交还有 target 传递耦合：公开 compile 的 target 会进入缓存键，但内部 `lower(self.mod)` 依赖 auto detection 发现 `bishengir-compile`。因此这里只记录“预期 NPU 环境中的路线”，不声称任意混合工具链主机都能由参数强制选择。

## 6. 可验证与未验证

已静态核对：函数调用、pass 顺序、codegen 选择、编译命令构造、wrapper 参数和 stream 获取。未验证：当前 commit 在具体 NPU/CANN 组合上的编译成功、数值正确性与性能；Bisheng/CANN 内部后续 passes 也不在公开仓库中。

## 源码入口

- [`tilelang/jit`](https://github.com/tile-ai/tilelang-ascend/tree/c3b324ac955271fd245346be465fbdd39fd4bd18/tilelang/jit)
- [`engine/lower.py`](https://github.com/tile-ai/tilelang-ascend/blob/c3b324ac955271fd245346be465fbdd39fd4bd18/tilelang/engine/lower.py)
- [`rt_mod_ascend.cc`](https://github.com/tile-ai/tilelang-ascend/blob/c3b324ac955271fd245346be465fbdd39fd4bd18/src/target/rt_mod_ascend.cc)、[`rt_mod_ascend_pto.cc`](https://github.com/tile-ai/tilelang-ascend/blob/c3b324ac955271fd245346be465fbdd39fd4bd18/src/target/rt_mod_ascend_pto.cc)
- [`cython_wrapper.pyx`](https://github.com/tile-ai/tilelang-ascend/blob/c3b324ac955271fd245346be465fbdd39fd4bd18/tilelang/jit/adapter/cython/cython_wrapper.pyx)
