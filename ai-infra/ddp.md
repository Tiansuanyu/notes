---
title: Distributed Data Parallel
order: 10
---

# Distributed Data Parallel

Distributed Data Parallel（DDP）让多个进程各自持有一份模型副本，并在反向传播时同步梯度。

## 基本关系

若有 $N$ 个数据并行进程，全局 batch size 为：

$$
B_{global} = N \times B_{local}
$$

## 示例

```python
model = DistributedDataParallel(model, device_ids=[local_rank])
loss = model(batch).sum()
loss.backward()
optimizer.step()
```
