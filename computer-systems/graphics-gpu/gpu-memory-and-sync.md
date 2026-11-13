---
title: GPU 内存与同步
description: 区分执行依赖、内存可用性与可见性，理解 barrier、semaphore、fence、layout 和 queue ownership。
order: 70
---

# GPU 内存与同步

Vulkan 中“命令 A 写完后命令 B 才执行”与“B 能看见 A 写出的数据”是两个相关但不同的问题。前者是 execution dependency，后者还需要 memory dependency 建立可用性和可见性。

## 1. 三类数据竞争

设资源先后被两个操作访问：

| Hazard | 第一次 | 第二次 | 是否需要处理 |
| --- | --- | --- | --- |
| RAW | Write | Read | 读必须等待正确数据可见 |
| WAR | Read | Write | 写不能破坏尚未完成的读 |
| WAW | Write | Write | 必须定义最终写入顺序 |

Read-after-read 通常不需要内存依赖，但资源 layout、queue ownership 或外部同步仍可能提出额外要求。

## 2. Availability 与 Visibility

可以把一次写入到后续读取的链分成：

```mermaid
flowchart LR
    W[Producer Write] --> A[写入 Available]
    A --> V[对 Consumer Visible]
    V --> R[Consumer Read]
```

Execution dependency 约束 producer 与 consumer 的执行先后；memory dependency 还指定哪些 source access 的写入变为 available，以及对哪些 destination access 可见。仅让 queue idle 可以粗暴地获得完成点，但会破坏并行，也不能替代资源状态和 layout 的正确描述。

## 3. Pipeline Stage 与 Access Scope

Barrier 的 source/destination stage mask 选择依赖覆盖哪些管线阶段，access mask 选择哪些内存访问。范围过窄会漏掉真实 producer/consumer；全部写成 all commands / memory read-write 虽可能掩盖问题，却会增加不必要等待。

正确做法是先回答：

1. 谁写入了资源，处于哪个 stage，使用什么 access？
2. 谁下一步读取/覆盖，处于哪个 stage，使用什么 access？
3. 两次访问是否在同一 queue、同一 submit 或不同 queues？
4. image 的 old/new layout 和 queue family 是否改变？

再据此设置 dependency，而不是从一份“常用 barrier 模板”复制。

## 4. Barrier、Semaphore 与 Fence

| 原语 | 主要边界 | 典型用途 |
| --- | --- | --- |
| Pipeline barrier | command buffer / queue 内 | 相邻 pass 的资源 hazard、layout transition |
| Semaphore | queue submit 或外部操作之间 | queue-to-queue、acquire/render/present |
| Timeline semaphore | 带单调计数的 semaphore | 多批次进度与资源退休点 |
| Fence | device 到 host | CPU 等待某次提交完成 |
| Event | 更细粒度的 device/host signal-wait | 单 queue 内拆分依赖；使用场景较专门 |

Fence 不是 GPU queue 之间的常规依赖；semaphore 也不是 CPU 直接读取资源完成状态的普通替代。每种原语的 signal/wait scope 不同。

## 5. Image Layout 是使用契约

Image layout 描述某个子资源接下来怎样被访问，例如 transfer source/destination、color attachment、depth/stencil、shader read 或 present。Layout transition 通常与 memory dependency 一起表达。

Layout 不是像素数据格式，也不保证物理内存真的按名字“重新排列”。它向实现提供用途和优化信息；使用与声明不一致会导致 validation error、未定义结果或设备相关问题。

Barrier 要精确选择 aspect、mip 和 layer 范围。只转换 base mip，随后采样整条 mip chain，仍然是错误。

## 6. Host 与 Device 的可见性

Host-visible memory 可以被 CPU 映射，但不一定 host coherent：

- host 写入非 coherent memory 后，通常要 flush 对齐范围；
- device 写入后，host 在等待完成之外还可能要 invalidate；
- coherent 省去显式 flush/invalidate，不省去 CPU/GPU 执行同步；
- device-local memory 往往通过 staging buffer 和 copy 上传。

统一内存架构可能共享物理 DRAM，但 API 的 domain、cache 和 dependency 规则仍然有效。

## 7. Queue Family Ownership

如果 image/buffer 以 exclusive sharing 在不同 queue families 间转移，需要 release/acquire ownership transfer。Semaphore 负责提交之间的执行关系，barrier 中的 family indices 和 access scopes 负责资源所有权及可见性。

Concurrent sharing 可以简化所有权，但可能放弃部分优化。是否使用独立 transfer queue 应结合传输量、硬件 family 和同步成本测量。

## 8. 多帧并行与资源生命周期

CPU 提交后，command buffer 中引用的 pipeline、descriptor、buffer、image view 和 memory 必须继续有效，直到 GPU 不再使用。常见做法是按 frame-in-flight slot 保存：

- command buffer 与临时 descriptor；
- uniform/staging ring 的不重叠区间；
- fence 或 timeline value；
- 延迟销毁队列。

资源从容器移除或 C++ 对象析构，不代表 GPU 已停止引用底层 handle。Use-after-free 可能只在 GPU 延迟变大或帧率变化时出现。

## 9. 兼容层为什么不能只“多加 Barrier”

Guest API 可能有不同 cache、fence、queue 和隐式同步规则。翻译层需要恢复实际 producer/consumer，再映射为 Vulkan dependency。过少会读到旧数据，过多会串行化 GPU；错误的资源别名和写回策略甚至无法靠 barrier 修复。

尤其要区分：

- guest CPU 写入与 host upload；
- guest GPU 对同一内存的 buffer/image 别名；
- render target 之后的 texture sampling；
- GPU 写回 guest 可见内存；
- presentation 和 readback 的完成点。

Hookshot 和 Lichii 都有资源 cache、submission/scheduler 与同步管理代码；具体保证只对固定 commit 的实现成立，不能从文件名推断所有 guest hazard 已被覆盖。

## 10. 调试方法

1. 为每个资源记录最后一次 writer、stage、access、layout 和 queue。
2. 使用 validation layer 的 synchronization validation，但不把“无报错”当证明。
3. 用 RenderDoc 等工具检查 pass 和资源历史。
4. 通过暂时收紧同步定位问题，再逐步缩小 scopes，而不是把全局 idle 留作修复。
5. 对随机闪烁保留提交序列、timeline value、资源版本和销毁点。

这样才能区分 shader 算错、资源绑定错、layout 错、可见性错和过早复用。

至此第三组形成“[图形管线](./graphics-pipeline.md) → [光栅化](./rasterization.md) → [纹理](./textures-and-sampling.md) → [Shader](./shaders.md) → [GPU 架构](./gpu-architecture.md) → [Vulkan](./vulkan-basics.md) → 同步”的完整主线。

## 参考入口

- [Vulkan Specification：Synchronization and Cache Control](https://docs.vulkan.org/spec/latest/chapters/synchronization.html)：execution dependency、memory dependency 与显式同步原语。
- [Vulkan Guide：Synchronization Examples](https://docs.vulkan.org/guide/latest/synchronization_examples.html)：按实际 producer/consumer 构造 barrier 的例子。
- Lichii [`vk_scheduler.cpp`](https://github.com/zortos293/Lichii/blob/9441129819edfee62e65ff6030749e80f420ba1e/src/video_core/renderer_vulkan/vk_scheduler.cpp) 与 [`vk_master_semaphore.cpp`](https://github.com/zortos293/Lichii/blob/9441129819edfee62e65ff6030749e80f420ba1e/src/video_core/renderer_vulkan/vk_master_semaphore.cpp)：固定 commit 的提交与进度跟踪案例。
- Hookshot [`rx_record.cpp`](https://github.com/NotRexed/Hookshot/blob/e9975d6c245275aaf89a34e8d17a6bbe8badab46/gpu/render/rx_record.cpp)：公开 renderer 的命令记录边界。
