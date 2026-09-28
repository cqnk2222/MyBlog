# 写作台（本地编辑器）

在浏览器里写笔记、实时预览、一键提交发布。只在本机的 `astro dev` 下可用。

```sh
npm run dev
# 打开 http://localhost:4321/editor
```

## 它做什么

- 左栏按 `src/content/` 的真实目录结构列出 notes / essays / thoughts，可搜索、可折叠。
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
| `EditorPage.astro` | 界面，无框架，原生 DOM |

## 几个使用上的点

- **frontmatter 往返是无损的**：打开再保存一篇没改过的笔记，`git diff` 是空的。schema 之外的字段（`heroImage` 等）也会原样保留。
- **新建时的目录**决定了 URL。`notes/CCL/02_algorithm_space/ring.md` → `/notes/ccl/02_algorithm_space/ring/`（Astro 会把路径小写化）。
- **自动保存**默认关闭，开启后停止输入 2 秒写盘。关着的时候记得 `⌘S`。
- `/editor#notes/CCL/ring.md` 这样带 hash 可以直接打开某一篇，刷新也停在原处。
- 改了 `api.mjs` / `schema.mjs` 之后 dev server 不会自动重启，要手动重启才生效。
