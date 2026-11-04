---
title: 'Dynamic Prediction'
description: 'Dynamic Prediction'
space: 'course-notes'
pubDate: '2026-10-26'
series: '体系结构'
order: 2
---

BHT : branch history table

1-Bit BHT
用hash索引BHT

Challenge:如果循环退出再进入，此时出现连续两次预测错误
case study:退出时错一次，下次刚进循环又错一次


2-Bit BHT
引入Hysteresis bit(迟滞位)
连续错两次才改变预测方向
00 
01
10
11

Two-Level

Hybrid
多个predictor
