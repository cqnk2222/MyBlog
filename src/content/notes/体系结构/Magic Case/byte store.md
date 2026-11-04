---
title: 'byte store'
description: 'byte store'
space: 'course-notes'
pubDate: '2026-10-30'
series: '体系结构'
order: 1
---

```C++
constexpr int N  = 1000000;
constexpr int NG = 262144;

auto* buf = new uint64_t[NG];
std::memset(buf, 0xfe, NG * 8);

for (int i = 0; i < N; ++i) {
  int g       = (i >> 7) & (NG - 1);     // 前 128 次 g=0，接下来 128 次 g=1
  uint64_t w  = buf[g];                  // 读 64 位 word

  uint64_t fb = w & 0x8080808080808080ULL;
  int pos = fb ? (std::countr_zero(fb) / 8) : 0;

  ((uint8_t*)buf)[g * 8 + pos] = (i & 0x7f);  // 写入 1 byte
}
```

https://zhuanlan.zhihu.com/p/2048571053698502907
