---
title: 'Scoreboard'
description: 'Scoreboard'
space: 'course-notes'
pubDate: '2026-10-27'
series: '体系结构'
order: 5
---

Classic Model Of One Issue
| 阶段 | 允许继续的条件 | 主要检查 |
|---|---|---|
| Issue | 有空闲的对应功能单元，而且没有尚未写回的指令要写同一个目的寄存器 | 结构冲突、WAW |
| Read operands | 所有源操作数都已准备好，然后一起读取 | RAW |
| Execute | 读到操作数后开始计算，完成时通知记分牌 | 运算是否完成 |
| Write result | 没有更早的指令还需要读取目的寄存器的旧值 | WAR |

经典模型中，指令按程序顺序发射，但可以乱序读取操作数、执行和写回。如果一条指令卡在 Issue，后面的指令也不能越过它发射；已经发射的指令仍然可以继续推进。


Case Study:
I1:
I2:
I3:
