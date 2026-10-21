# Notes Four Spaces Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a compact Notes landing page and four independent static area pages for Course Notes, PreTrain, PostTrain, and AI Infra without changing existing article URLs.

**Architecture:** Keep area metadata and explicit series/path classification in `src/data/note-spaces.ts`. Add a reusable `NoteSeriesGrid` presentation component. Make `/notes/[space]/` a static Astro route generated from the metadata, while `/notes/` renders four area cards and an Unsorted section for content not assigned to an area.

**Tech Stack:** Astro 5, TypeScript, Astro content collections, existing CSS design tokens.

---

### Task 1: Define area metadata and classification helpers

**Files:**
- Create: `src/data/note-spaces.ts`
- Modify: `src/data/notes.ts:65-84`
- Test: `npm run build`

- [ ] **Step 1: Add area metadata with explicit series and path-prefix assignments**

Create `NOTE_SPACES` with these slugs, labels, descriptions, and assignments:

```ts
course-notes: series ['计算机组成原理', '操作系统', '编译原理', '计算机网络', '机器学习基础'], path prefixes ['体系结构/']
pretrain: series ['Transformer 笔记', 'RL Algorithm']
posttrain: no initial assignments
ai-infra: series ['CCL'], path prefixes ['vLLM/', 'Kernel/FlashAttention/', 'Silicon & Photons/', 'AI Communication/']
```

Each path prefix gets a display series name (`vLLM`, `FlashAttention`, `Silicon & Photons`, `AI Communication`) so legacy notes without `series` frontmatter do not collapse into one generic group.

- [ ] **Step 2: Make `buildNoteSeries` accept an optional resolver without changing its default behavior**

Change the signature to `buildNoteSeries(notes, resolveSeries = defaultSeriesName)` and use the resolver for grouping. Keep the existing fallback order `note.data.series ?? note.data.section ?? 'Notes'` in `defaultSeriesName`, so article navigation and existing consumers behave exactly as before.

- [ ] **Step 3: Add helpers for assigned and unassigned series**

Export `getSpaceBySlug`, `buildSpaceSeries(notes, space)`, and `buildUnsortedSeries(notes)`. `buildSpaceSeries` filters notes by explicit series membership or a configured path prefix, then calls `buildNoteSeries` with the space resolver. `buildUnsortedSeries` subtracts all notes assigned to any space from the complete series groups and returns the remaining groups.

- [ ] **Step 4: Run the production build**

Run `npm run build`. Expected: existing build remains green; no page changes yet.

### Task 2: Extract reusable series-card presentation

**Files:**
- Create: `src/components/NoteSeriesGrid.astro`
- Modify: `src/pages/notes/index.astro`

- [ ] **Step 1: Create `NoteSeriesGrid.astro`**

Accept a `series` prop typed as `NoteSeriesGroup[]` and render the existing series-card markup. Add an optional `emptyMessage` prop; when `series.length === 0`, render a bordered empty-state panel instead of an empty grid. Move the existing series-card CSS and responsive grid CSS into this component.

- [ ] **Step 2: Replace the duplicated series markup on the Notes landing page**

Update `/notes/index.astro` to import `NoteSeriesGrid`, pass the assigned/unassigned series groups as needed, and remove the old inline series-card styles. Keep the existing Header/Footer and page-level typography styles.

- [ ] **Step 3: Run the production build**

Run `npm run build`. Expected: all current routes still build and the Notes page renders the same series data through the extracted component.

### Task 3: Build the compact landing page

**Files:**
- Modify: `src/pages/notes/index.astro`
- Modify: `src/data/note-spaces.ts`

- [ ] **Step 1: Render four area cards from centralized metadata**

Each card links to `/notes/${space.slug}/`, displays the English title, a one-sentence description, the number of assigned series/articles, and up to four assigned series names. Use a responsive two-column grid that becomes one column below 768px.

- [ ] **Step 2: Add the Unsorted section**

Render `Unsorted` below the four cards only when `buildUnsortedSeries(allNotes)` is non-empty, using `NoteSeriesGrid`. Explain that these are notes not yet assigned to one of the four areas so nothing silently disappears.

- [ ] **Step 3: Run the production build**

Run `npm run build`. Expected: `/notes/` is generated and includes four links plus any Unsorted groups.

### Task 4: Add independent static area pages

**Files:**
- Create: `src/pages/notes/[space].astro`

- [ ] **Step 1: Generate one static path per `NOTE_SPACES` entry**

Implement `getStaticPaths()` returning `{ params: { space: area.slug }, props: { area } }` for all four areas. Use `getCollection('notes')` once per build and call `buildSpaceSeries` for the current area.

- [ ] **Step 2: Render the area page**

Use the existing Header/Footer, a breadcrumb link back to `/notes/`, the area title/description, counts, and `NoteSeriesGrid`. For PostTrain pass `emptyMessage="还没有归档到这个分区的笔记。"` so the page remains a useful visible destination.

- [ ] **Step 3: Run the production build and verify route output**

Run `npm run build`. Expected output includes:

```text
/notes/course-notes/index.html
/notes/pretrain/index.html
/notes/posttrain/index.html
/notes/ai-infra/index.html
```

Also confirm existing `/notes/<article>/` routes remain in the generated route list.

### Task 5: Final verification

**Files:**
- Verify: `src/data/note-spaces.ts`
- Verify: `src/components/NoteSeriesGrid.astro`
- Verify: `src/pages/notes/index.astro`
- Verify: `src/pages/notes/[space].astro`

- [ ] **Step 1: Check formatting and repository diff**

Run `git diff --check` and inspect `git status --short`. Expected: only the planned Notes files and design/plan docs are changed.

- [ ] **Step 2: Run the final build**

Run `npm run build`. Expected: `46+` static pages build successfully, including four new area pages.

- [ ] **Step 3: Verify the generated HTML contains the four links**

Run:

```bash
rg -n '/notes/(course-notes|pretrain|posttrain|ai-infra)/' dist/notes/index.html
```

Expected: all four paths are present.
