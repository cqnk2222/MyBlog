# 写作台（本地编辑器）

在浏览器里写笔记、实时预览、一键提交发布。只在本机的 `astro dev` 下可用。

```sh
npm run dev
# 打开 http://localhost:4321/editor
```

## 它做什么

- 左栏默认展示 Notes 的五个分类：Course Notes / PreTraining / PostTraining / AI Infra / AI Product。分类内保留真实文件夹，可搜索、折叠，文件夹和分类旁的 `+` 可就地新建。其它 collection 仍按真实目录展示。
- 新建笔记先选分类；已有笔记的「笔记分类」支持调整归属。分类规则与网站共用，新建或手动改分类时写入 `space` 字段，不需要移动文件。老笔记继续按系列和路径自动识别，未调整分类时保存不会额外添加这个字段。
- 每篇笔记旁的 `+` 或打开笔记后的「新建子笔记 / 章节」，会自动建立以原文件名命名的子目录，继承分类、系列和 Section，并接续章节顺序。父笔记保留原文件与 URL，在编辑器中作为可展开的上级条目显示；点击标题仍可编辑原文。子笔记也能继续添加下级笔记。
- 新建窗口可以直接填写系列和章节顺序。`index.md` / `index.mdx` 作为目录概览时，新章节与概览保存在同一目录。
- 中间是 frontmatter 表单（字段跟 `src/content.config.ts` 的 zod schema 一一对应）+ Markdown 正文，带工具栏和 `⌘S` 保存。
- 右栏两个预览：**草稿预览**用 Astro 自己的 markdown 处理器渲染当前未保存的内容（含 Shiki 高亮）；**真实页面**直接 iframe 打开这篇笔记的 dev 地址，保存后 Astro 的内容热更新会自动刷新。
- 「发布」按钮跑 `git add` / `git commit` /（可选）`git push`，**只提交 `src/content/` 下的改动**，其它文件不受影响。

保存就是直接写 Markdown 文件，所以用不用这个编辑器、跟直接用 VS Code 改文件，完全可以混着来。

## 为什么线上访问不到 `/editor`

`integration.mjs` 里第一行判断就是 `if (command !== 'dev') return;`。构建时这个 integration 什么都不注入：没有 `/editor` 路由，没有文件读写接口，`dist/` 里也搜不到任何编辑器代码。它不需要鉴权，因为它根本不会被部署。

接口只挂在 Vite dev server 的中间件上（`/__note-editor/*`），路径参数被限制在 `src/content/<已知 collection>/` 之内，且只接受 `.md` / `.mdx`。

## 文件

| 文件 | 作用 |
| --- | --- |
| `integration.mjs` | Astro integration，dev 下注入路由 + 中间件 |
| `api.mjs` | 文件读写、frontmatter 解析/序列化、markdown 渲染、git 操作 |
| `schema.mjs` | 表单字段定义（改 `content.config.ts` 时记得同步） |
| `../data/note-space-config.mjs` | 网站、内容校验与编辑器共用的分类定义及归属规则 |
| `note-navigation.mjs` | 分类导航树，保留真实目录及新建上下文 |
| `EditorPage.astro` | 界面，无框架，原生 DOM |

## 几个使用上的点

- **frontmatter 往返是无损的**：打开再保存一篇没改过的笔记，`git diff` 是空的。schema 之外的字段（`heroImage` 等）也会原样保留。
- **新建时的目录**决定了 URL。`notes/CCL/02_algorithm_space/ring.md` → `/notes/ccl/02_algorithm_space/ring/`（Astro 会把路径小写化）。
- **自动保存**默认关闭，开启后停止输入 2 秒写盘。关着的时候记得 `⌘S`。
- `/editor#notes/CCL/ring.md` 这样带 hash 可以直接打开某一篇，刷新也停在原处。
- 改了 `api.mjs` / `schema.mjs` 之后 dev server 不会自动重启，要手动重启才生效。

### 合并并发布到 main

在「发布…」弹窗点击「合并并发布到 main」。仅在 `codex/` 分支启用：先保存当前笔记，填写提交说明；若有 `src/content/` 改动会先提交，然后将整个当前分支的已提交历史合并到最新 `origin/main`，直接推送 main。其他未提交代码不会自动提交。无需先把 codex 分支推送到远端。

合并在临时克隆中执行，保留当前工作区及分支。冲突、远端分支保护或权限问题会停止并显示日志；不强制推送。发布失败时已经创建的笔记提交会保留，可处理问题后重试。此按钮不更新本地 main；成功推送不代表线上构建已完成。
