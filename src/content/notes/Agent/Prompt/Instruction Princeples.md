---
title: 'Instruction Princeples'
description: 'The First Princeples I used for AI instructions.'
pubDate: '2026-09-03'
order: 1
readingTime: '10 min read'
---

*This is only for the Frontier Model in time the paper wrote.*


## 0. Why?

我苦于AI给我回复的detail太多，很多简单任务反而绕来绕去，对于现在的我来说，我认为人类需要对整体任务的Mental Model相当熟悉 & AI不能给出超过人工作记忆长度的回答。

Things I Thought ：

1. 有实证支撑的只有一条主线——**指令密度是敌人**。其他所有建议都是这条的推论，或者是没有证据的经验谈。
2. 社区流传最广的一个解释（"规则互相矛盾所以模型忽略你"）被一次受控实验直接证伪。
3. 所有可引用的实证工作测的都是 coding agent 在 SWE-bench 式任务上的 correctness。**没有一项测的是行为/风格偏好在多轮对话里的保持率**——而那才是 preference prompt 的目标函数。这个 gap 是我这次查下来最意外的发现。

---

## 1. 地基：可引用的实证结果

### 1.1 指令密度 → compliance 下降，且偏向靠前的指令

**IFScale**（Jaroslawicz et al., 2025）是目前唯一直接测这件事的 benchmark。任务是写一份商业报告，同时满足 10 到 500 条 keyword-inclusion 指令；评了 7 家提供商的 20 个 SOTA 模型。

硬数字只有这些：

- 最好的 frontier model 在 500 条密度下准确率 **68%**
- 三种不同的退化形状，与模型规模和 reasoning 能力相关
- **bias towards earlier instructions**——对靠前指令有偏置

第三条是这篇论文对 prompt 写作最直接的指导：**在同一个 instruction block 内部，靠前的位置有优势。**

这里有个必须说清的坑。社区转述这篇论文时（比如 HumanLayer 那篇）常写成「LLM 偏向 prompt 的两端，开头和最近的用户消息」，并推出「退化是均匀的，模型开始一起忽略所有指令」。这两条转述和原文的关系是：

- 「两端」= 把 IFScale 的 earlier-bias 和另一条独立的 long-context recency 文献混在了一起。论文本身只有前端偏置。
- 「均匀退化」和「前端偏置」不矛盾，但也不是一回事：前者说的是整体准确率随密度下降（全局降质），后者说的是剩余的 compliance 在位置上的分布不均。两个都对，但推出的操作不同——如果只有全局降质，位置就无所谓；如果有前端偏置，顺序就是杠杆。

还有一个数字要单独拎出来：**「frontier model 能稳定跟随 150-200 条指令」这个数不在论文里**，是二次转述时的外推。我见过好几处把它归给 IFScale，引用前注意。

> 边界：IFScale 的任务是 keyword inclusion——一个二值的、可自动判定的约束。把它外推到「风格约束」「优先级规则」这类不可自动判定的指令上，是我的推测，不是论文结论。有理由怀疑后者更脆弱，但没数据。

### 1.2 无关指令会污染有关指令

这是我认为最重要的一条，可惜只有二手来源（Chakrabarti 的实验，via *wondering about ai*）。

做法：在 WildIFEval（从真实人类请求构建的 benchmark）的 prompt 里，塞进 16 条来自其它任务的无关指令。结果是**仅这些垃圾本身，就让模型对已存在的正确规则的遵守率掉了 24 个百分点**。

关键在于失效的形状：不是「新加的规则没被跟随」，而是**旧规则一起崩**。这条如果成立，它把「less is more」从美学偏好变成了工程约束——你往常驻文件里加的每一条不普遍适用的规则，都在按比例侵蚀所有其它规则。

> Caveat 很重，作者自己标了：受控实验用的是极小 prompt（2-3 条理想规则，而真实文件通常 39 条量级），单个小模型，真实场景的 compliance 判定依赖 LLM judge。我没找到原始 paper，只有转述。**这条我给 [二手 · 未验证]**，但它是唯一给出量级的。

### 1.3 位置与长度的两条背景文献

- **Lost in the Middle**（Liu et al., TACL 2024）：模型在长 prompt 上信息利用不均，中段材料常被系统性低估使用。
- **Context Rot**（Chroma, 2025）：token 数上升，从 context 中准确 recall 的能力下降。

这两条和 1.1 是同一族现象的不同切面。对常驻 prompt 的含义：一份长文件的中段约等于不存在。

---

## 2. 反面证据：context file 对 correctness 没有可测效应

有两项独立研究得到了 null result，这部分在社区里被大规模误读，值得单列。

### 2.1 数字

**Khatri, arXiv:2607.27250** — Claude Code 与 Codex 双 agent、3 个 repo、17 个真实任务、288 次评测运行的受控 ablation。自变量是三种 context 注入策略（none / always_on / selective），因变量是 gold test 的通过与否，以及 tool calls、wall-clock、output tokens 等效率指标。

- correctness：**注入策略没有可测影响**，通过等价检验界定在 10-15pp 以内
- 效率：runtime 约 **-29%**，output tokens 约 **-17%**
- 最刺眼的细节：repo 维护者亲手写的真实指令文件，**从未把一次 near-miss 转成 pass，一次都没有**

**Gloaguen et al.（ETH Zurich / LogicStar.ai, 2026-02）** — 更大规模的自然设定研究，Claude 系 agent，同样报告 correctness 无显著效应。

> 二手来源给出的编号是 arXiv:2602.11988，**我没有直接核对**。引用前自己 verify。

### 2.2 正确的读法

ETH 那篇有一个关键的 sub-finding，几乎所有转述都跳过了：**agent 确实在跟随 context file 里的指令。**

- 文件里提到 `uv`：每任务使用 1.6 次；未提到：0.01 次 —— **160×**
- repository tools：2.5 vs 0.05 —— **50×**
- pytest：使用率 **+27%**

也就是说，问题根本不在 instruction-following。问题在于**跟随这些指令并不改善结果**。

所以 null result 的正确读法是：**convention prose 补不上 capability gap。** 而不是「context file 没用」，更不是「你的 preference prompt 没用」。

这个区分对我这个用例是决定性的。preference prompt 的目标函数从头到尾就是 **compliance**，不是 correctness——我要的是它按我要的方式说话，不是它把题做对。而 compliance 侧的效应被测出来是**大的**（160×）。两项 null study 完全不覆盖我关心的量。

### 2.3 顺带被证伪的一条 folklore

Khatri 还做了一个对照：故意往文件里写一条与另一条**互相矛盾**的指令。

这是你能读到的关于「为什么 Claude 忽略我的规则」的最常见解释。结果：**没有可测差异。**

如果你的规则没被遵守，别再去找矛盾条款了。按 1.1 和 1.2，更可能的原因是条数。

---

## 3. Folklore 层：哪些站得住

把社区反复出现的建议对着上面的地基过一遍：

| 建议 | 证据状态 | 备注 |
|---|---|---|
| Less is more；文件 < 300 行，越短越好 | **站得住** | 1.1 + 1.2 直接支撑。300 行是共识不是实验结论；HumanLayer 自己的根文件 < 60 行 |
| Progressive disclosure：常驻只放普遍适用的，其余按需加载 | **站得住** | 1.2 的直接推论。Anthropic 的 Skill 设计（启动只预加载 metadata）是同一思路的产品化 |
| 别让 LLM 干 linter 的活 | **站得住（预算论证）** | 不是因为 LLM 做不到，是因为它占指令预算。可判定的约束交给确定性工具 |
| 每条禁令必须配一个方向 | 无实证，机制可信 | `Never use --legacy-peer-deps` 会让 agent 撞上依赖冲突时无路可走。裸禁令在触发时没有落点 |
| 写 identity 和 reasoning，而不是 rule list | 无实证 | 论点是：规则会在遇到让它们失效的 context 时用尽，那之后模型用「它对你意图的最佳猜测」填空，而那个空缺正是大部分糟糕输出的来源 |
| 三层边界（Always / Ask First / Never） | 无实证 | 比扁平的优先级排序更可判定——后者要模型自己判断冲突是否发生 |
| 每加一条规则同时写下 rationale | 弱支撑 | Chakrabarti 那篇的建议。机制上和「模型能判断某条规则是否适用当前任务」相关，但没有独立验证 |
| 别用 `/init` 自动生成 | 无实证 | 论点是杠杆：一行坏代码只是一行坏代码，但常驻文件影响每一个 session 的每一个阶段 |
| 加强调（IMPORTANT/ALWAYS）来救不被遵守的规则 | **反对** | 累积是首要失效模式，加强调解决不了，只有剪枝能 |

值得注意的是 Claude Code 的实现细节：注入 CLAUDE.md 时会附一条 system-reminder，明确告诉模型这段 context 未必相关、除非高度相关否则不要响应。这意味着**文件里不普遍适用的内容越多，整份文件被整体忽略的概率越高**——这是 1.2 的机制在 harness 层面的对应物，而且是 Anthropic 自己下的判断。

---

## 4. 由此得到的写作原则

按可操作性排：

**① 条数是预算，不是风格偏好。**
每加一条要能回答「它换掉了哪条」。把 prompt 里可独立违反的断言数出来——那才是真实的指令数，不是 bullet 数。

**② 内容规则前置，格式规则后置。**
1.1 的 earlier-bias。这条我一开始写对了，中间被二手转述带偏成「格式放末尾更安全」，又改了回来。教训是：**引用位置效应之前先看 primary。**

**③ 可 verify 的规则会挤掉不可 verify 的规则。**
这是 [估]，不是文献结论。但机制清楚：`≤300 字` 能被自检，`给 mechanism 而不是结论清单` 不能。压力下先保前者。对策是把不可 verify 的规则改造成可 verify 的形状——比如把「区分知道/推测/不知道」改成「每个数字必须带 `[spec]/[实测]/[估]` 前缀」。

**④ 每条禁令配一个出路。**
裸禁令的失效是静默的：模型在需要违反它的场景下没有落点，于是用猜测填空。

**⑤ 常驻 / 按需切分。**
不普遍适用的东西不进常驻层。chat 场景下的对应物是 preferences（常驻）vs Styles / Projects（按需）。

**⑥ 每条规则带 rationale。**
成本是几个 token，收益是模型有依据判断这条规则在当前任务下是否适用。也是给未来的自己看的——不然三个月后你不知道那条为什么在那儿。

**⑦ 自维护条款。**
在文件里写一条常驻指令：遇到错误假设时顺带提出一条修正建议。让文件在正常使用中自我改进，对抗首要失效模式（累积）。

---

## 5. 我不知道的

这一节是这篇 notes 里我最想留下的东西。

上面所有实证工作，测的都是：**coding agent，SWE-bench 式任务，correctness 或 keyword-level compliance，single-turn 或短 session。**

没有任何一项测的是：

- **风格/行为偏好在多轮对话里的保持率。**一份 preference prompt 在第 3 轮和第 30 轮的执行差异是多少？
- **用户认同导致的 hedge 撤回。**用户说「有道理」之后，模型之前标注的不确定性是否被静默丢弃？这是 sycophancy 文献和 instruction-following 文献的交叉地带，两边都没测。
- **compaction 对常驻规则的影响。**有人观察到 compliance 随 session 推进下降，并推测 compaction 触发时嵌套/路径作用域的规则会掉出去且不再回来；但该观察引用的研究测的是 single-turn，无法解释这个现象。multi-turn 无人测过。

如果要设计一个实验来填这个 gap，最小可行版本大概是：固定一份含 N 条可判定风格约束的 preference prompt，跑长度递增的多轮对话，每轮用固定 probe 测每条约束的遵守情况，画 compliance vs turn index；再加一个 arm，在中途插入用户的认同性回复，看曲线是否有拐点。

我不知道有没有人做过。**这可能是这篇 notes 最有价值的一句话。**

---

## 附：来源

**Primary**

- Jaroslawicz, D., Whiting, B., Shah, P., & Maamari, K. (2025). *How Many Instructions Can LLMs Follow at Once?* arXiv:2507.11538 — https://arxiv.org/abs/2507.11538
- Khatri, P. (2026). *Do Context Files Help Coding Agents? A Two-Agent Ablation Study on Real Repositories.* arXiv:2607.27250 — https://arxiv.org/abs/2607.27250
- Gloaguen, T., Mündler, N., Müller, M., Raychev, V., & Vechev, M. (2026). *Evaluating AGENTS.md: Are Repository-Level Context Files Helpful for Coding Agents?* — 二手给出 arXiv:2602.11988，**编号未核对**
- Liu, N. F., et al. (2024). *Lost in the Middle: How Language Models Use Long Contexts.* TACL 12, 157–173 — https://aclanthology.org/2024.tacl-1.9/
- Hong, K., Troynikov, A., & Huber, J. (2025). *Context Rot: How Increasing Input Tokens Impacts LLM Performance.* Chroma — https://trychroma.com/research/context-rot

**Vendor**

- Anthropic, *Effective Context Engineering for AI Agents* — https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
- Anthropic, *Claude Code Best Practices* — https://www.anthropic.com/engineering/claude-code-best-practices
- Anthropic, *Skill Authoring Best Practices* — https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices

**社区**

- HumanLayer, *Writing a good CLAUDE.md* — https://www.humanlayer.dev/blog/writing-a-good-claude-md
- DataCamp, *Writing the Best CLAUDE.md* — https://www.datacamp.com/tutorial/writing-the-best-claude-md
- Towards AI, *CLAUDE.md Best Practices* — https://pub.towardsai.net/claude-md-best-practices-13cfe020050d
- *How to stop your CLAUDE.md file from getting too big*（Chakrabarti 实验的转述来源）— https://wonderingaboutai.substack.com/p/how-to-stop-your-claudemd-file-from
- Developers Digest, *AGENTS.md Files Don't Move Coding Agent Correctness: A 288-Run Ablation* — https://www.developersdigest.tech/blog/context-files-coding-agents-ablation-2026
- Generative Labs, *CLAUDE.md Files Make Coding Agents Cheaper, Not More Correct* — https://www.generativelabs.com/insights/claude-md-agents-md-context-files
- Alex Dunlop, *CLAUDE.md Best Practices: What the Evidence Supports* — https://www.alexdunlop.com/writing/claude-md-best-practices
