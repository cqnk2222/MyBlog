# Notes Four Spaces Design

## Goal

Create a compact Notes landing page with four clear areas and independent URLs so readers can browse Course Notes, PreTrain, PostTrain, and AI Infra without seeing every series flattened into one long page.

## User-facing structure

- `/notes/` presents four entry cards: Course Notes, PreTrain, PostTrain, and AI Infra.
- `/notes/course-notes/`, `/notes/pretrain/`, `/notes/posttrain/`, and `/notes/ai-infra/` are independent static pages.
- Each area page shows its description, note/series counts, and the existing series cards for content explicitly assigned to it.
- PostTrain may initially be empty; it should show a clear empty state rather than disappear.
- Existing note article URLs remain unchanged.

## Classification and behavior

Classification is explicit and centralized rather than inferred from directory names. Initial series mapping:

- Course Notes: `计算机组成原理`, `操作系统`, `编译原理`, `计算机网络`, `机器学习基础`.
- PreTrain: `Transformer 笔记`, `RL Algorithm`.
- PostTrain: no series initially.
- AI Infra: the `CCL` series plus the legacy entries `vllm/1` and `kernel/flashattention/1`, which currently have no `series` frontmatter.

Series with no mapping remain visible in an `Unsorted` group on `/notes/` so existing content is not hidden. The category pages only show their mapped series. The `buildNoteSeries` behavior continues to determine each series' article order and first-article link.

## Visual direction

Replace the current all-series grid on `/notes/` with four compact, responsive area cards. Each card contains a short descriptor, series/article counts, a few representative series names, and one clear link. Keep the existing series-card visual treatment on area pages to minimize redesign scope. Use the existing site typography, tokens, header, and footer.

## Implementation boundary

Use centralized area metadata and explicit series membership. Generate the four static category URLs from one dynamic Astro route or equivalent static routes. Do not move or rename Markdown files, change note frontmatter, redesign article pages, or add search/filter interactions in this test version.

## Acceptance checks

- The landing page links to all four category URLs and has a visibly simpler hierarchy than the current all-series grid.
- All four URLs build as static pages.
- Mapped series appear only under their assigned area; unmapped series remain discoverable under Unsorted.
- Existing note article routes continue to build.
- Empty PostTrain renders an explanatory empty state.
- `npm run build` succeeds.
