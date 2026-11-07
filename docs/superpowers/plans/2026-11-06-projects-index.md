# Projects index implementation plan

**Goal:** Give only `/projects/` a wide, lightweight project index inspired by https://antfu.me/projects, including a full-viewport drifting dot field and reference typography.

**Architecture:** Keep the existing Header, Footer, BaseHead and `projects` data. Use uniform short entries in three columns above 1100px, two above 700px and one on phones. Keep layout and typography scoped to `src/pages/projects/index.astro`. `ProjectBackdrop.astro` loads a small canvas renderer from `project-backdrop.mjs` on this route only; introduce no dependencies.

**Design:** Keep a centered 36px/800 Inter title, an 18px italic subtitle and a GitHub profile link, then expand the project area to the viewport width minus responsive outer gutters. Use a large outlined Selected projects label and 18px/400 Inter project titles with 14px descriptions. Each entry retains its outline icon, summary, plain-text stack/status and optional demo link. The full-screen dot field uses 15px spacing, one-pixel muted gray dots, smooth local drift and varying opacity, matching the reference's visual character. It uses an independent sine-field implementation rather than the reference's Pixi/simplex dependencies. Keep the layer behind content and noninteractive. Cap resolution at 2x and updates at 30fps, pause while hidden, and use a still field for reduced motion. Keep decoration out of the accessibility tree and retain visible keyboard focus.

**Scope:** Modify the Projects page, add its backdrop component/renderer and focused lifecycle tests, and update this plan. Preserve existing project data, destinations, shared component source and unrelated dirty files. No commit, push or deployment is requested.

## Implementation

- [x] Inspect the reference, current Projects page, shared styles and dirty worktree.
- [x] Replace card markup with a semantic list, centered introduction and decorative dots.
- [x] Add page-scoped desktop/mobile styles and focus/reduced-motion states.
- [x] Run `npm run build` and `git diff --check`.
- [x] Inspect built HTML/CSS for all three projects, their existing destinations, scoped styles and responsive rules; check the local `/projects/` response.
- [x] Revisit the reference in Chrome and inspect its deployed CSS plus `ArtDots.vue` and `ListProjects.vue` source.
- [x] Expand the layout, match Inter weights/sizes, add the outlined section heading and full-viewport dot animation.
- [x] Verify canvas resize, resolution cap, hidden-page pause, reduced-motion behavior, cleanup and fallback using `node --test src/components/project-backdrop.test.mjs` (3 passed).
- [x] Confirm the updated desktop layout visually after clearing the stale development CSS module by restarting the local Astro service.

## Verification boundary

Markup/style verification uses the build, rendered output and native Chrome screenshots. Animation lifecycle behavior has focused Node tests. The in-app browser host was unavailable, but native Chrome access worked. Phone breakpoints are present in the compiled output; a phone browser screenshot has not been inspected.

**Results:** Astro built 125 pages successfully. The generated HTML and local dev response both contain the three original project destinations and the existing demo link, without nested anchors. Compiled CSS includes scoped selectors, the centered introduction, the mobile breakpoint, reduced-motion rules and visible keyboard focus. The Projects scope is absent from the other main page outputs. `git diff --check` passed.

**Browser follow-up:** Inspected both the reference and local Projects tabs using Chrome's native accessibility tree and screenshots. Confirmed the expanded three-column project grid, outlined section title, italic introduction, lighter project headings and full-screen dot field. The three titles, descriptions and existing demo link fit without overlap in the inspected desktop view. The development server initially returned current inline CSS but a stale Vite CSS module containing `720px`; restarting the verified local Astro process resolved the mismatch.
