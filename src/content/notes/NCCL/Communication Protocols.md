---
title: 'Communication Protocols'
description: 'Communication Protocols'
space: 'ai-infra'
pubDate: '2026-10-21'
series: 'Notes'
order: 2
---

Simple: 大块的数据被分到多个channel中，但是需要memory fence保证memory consistency，延迟不够友好，但是带宽利用极佳，且支持P2P，不经过CPU path。
LL：传输的数据layout为：[4B data | 4B flag]，因此带宽最高也就只能达到50%。在论文撰写的时候，也就是2.19.1版本中，GPU将8B line写入到CPU buffer memory中，然后CPU poll flag，之后通过NIC发送。显然这样的实现不支持send侧的GDRDMA。因单条数据很小，因此latency最低。
LL128：传输的数据layout为：[120B data | 8B flag]，一般通过NVLink传输。在send GPU侧积攒了一个chunk之后可通过NVL传输，是Simple与LL的结合版。但是因为flag需与data保持在一个packet里，所以需要支持atomic 128B writes，这是其使用NVLink的主要原因。
