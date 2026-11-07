# Following 分类入口

用户已选定 Research、Engineering、Design 三类，并要求新版 Following 作为分类入口。

## 页面

- `/following/`：参照 Notes 主界面的背景、宽度、排版和分隔线，只显示 Following 标题、CONTENTS 和三个编号分类入口；不显示介绍、统计、话题、来源预览或额外说明。
- `/following/research/`：研究、论文、综述与研究团队。
- `/following/engineering/`：系统实现、工具与工程实践。
- `/following/design/`：设计与体验；没有条目时显示可正常访问的空状态。
- 分类页提供返回入口、三类切换、标签筛选，保留来源名称、自定义标签、机构、关注理由、RSS 与停更状态，不显示来源类型。
- 使用本站现有字体、青绿色与细分隔线；手机布局收为单列，支持键盘焦点和减少动态效果。

## 内容与编辑器

- 每个条目必填 `category`；不再使用来源类型 `kind`。标签为可选的自定义文字列表，不提供预设或建议。
- Research：Ahead of AI、Andrej Karpathy、Anthropic Research、BAIR Blog、Google DeepMind、Lilian Weng。
- Engineering：Chip Huyen、Eugene Yan、Simon Willison。
- Design 保留现有的 Inspora；空分类也正常提供入口。
- 分类元数据共享给页面、Astro schema 和编辑器，避免选项不一致。
- 编辑器可选择分类，新建、读取、保存、移动后的预览均直达所属分类及条目锚点；非法分类在写入前拒绝。

## 验证

编辑器分类/预览集成测试、现有回归测试、Astro 生产构建、输出页面与过滤脚本检查。本地服务检查入口、三个分类、首页和编辑器。浏览器不可用时明确记录视觉验证限制。
