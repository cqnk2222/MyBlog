---
title: 'Target Predictor'
description: 'Target Predictor'
space: 'course-notes'
pubDate: '2026-10-26'
series: '体系结构'
order: 3
---

BTB 与 RAS

RAS: Return Address Stack
针对函数返回的问题:
1.因为一个函数可能被多处调用->BTB无法区分返回到哪里
2.RAS的方案:call是RA压栈，Return时弹栈
