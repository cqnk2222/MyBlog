# Following Categories Implementation Plan

> Execute inline using the writing-plans and verification-before-completion workflows. The user has authorized implementation of the selected three-category design.

**Goal:** Make Following a three-category directory with dedicated source lists and matching editor support.

**Architecture:** Share category metadata in `src/data/following-config.mjs`; store each entry's explicit `category` in frontmatter. Statically generate the category pages from the shared configuration and use those routes for editor previews.

**Tech Stack:** Astro 5, Markdown, existing CSS tokens, Node test runner.

## Task 1: Content and editor integration

- [x] Add `src/editor/following.test.mjs` with real temporary-file API tests: create/read/list in all categories, reclassify, move, reject missing or invalid category before writing.
- [x] Run `node --test src/editor/following.test.mjs`; verify failure because category selection and category preview routes are absent.
- [x] Create `src/data/following-config.mjs` with the three categories and existing source-kind labels. Import categories into `src/content.config.ts` and `src/editor/schema.mjs`; add required `category` before `kind`.
- [x] Update `entryUrl` in `src/editor/api.mjs` to accept frontmatter and return `/following/<category>/#<entry-id>`. Pass frontmatter from list/read/write/move; reject unknown Following categories before writing. Share file-path-based anchors with the rendered category pages, including index filenames, spaces and explicit slug overrides.
- [x] Add `category: research` to six research entries and `category: engineering` to Chip Huyen, Eugene Yan and Simon Willison. Preserve all bodies and existing metadata.
- [x] Re-run the Following integration tests and confirm they pass.

- [x] Apply saved preview URLs in `EditorPage.astro` to the current file, open-page link and iframe. Execute the actual save/preview functions in regression tests for both draft and page modes; retain Notes save coverage.

## Task 2: Category entrance and lists

- [x] Replace `src/pages/following/index.astro` with a three-entry directory matching the Notes entrance layout. Show only the title, CONTENTS and numbered category links; link empty categories too. Omit introductions, counts, topics and source previews.
- [x] Add `src/pages/following/[category].astro`, generated for every configured category. Add category navigation, source cards with kind labels and Markdown reasons, accessible tag buttons, counts and a Design empty state.
- [x] Add `src/styles/following.css` shared layout styles; use existing tokens, responsive grids, visible focus styles and reduced-motion support. Keep page-specific styles with each page.

## Task 3: Validation

- [x] Run `node --test src/editor/*.test.mjs src/data/*.test.mjs` and `npm run build`; read final results.
- [x] Inspect generated HTML for all four routes, exactly-once source membership, correct counts, category navigation, external links and empty-state behavior.
- [x] Exercise the built filtering script against rendered markup, including reset and tags containing punctuation.
- [x] Confirm live HTTP success for `/`, `/editor`, `/following/`, and each category. If the existing server has stale middleware, restart the owned project service and repeat.
- [x] Run `git diff --check`, review scope, and report usable local links plus any browser limitation.

## Verification results

- `node --test src/editor/*.test.mjs src/data/*.test.mjs`: 59 passed, 0 failed.
- `npm run build`: 125 pages generated, including the entrance and all three categories. The existing unrelated Shiki warning for language `C` remains.
- Rendered-page checks: all nine original sources retained exactly once; only the explicit category line was added to each Markdown source. Category source counts, preview anchors, navigation and RSS links matched the content.
- Compiled filter-script checks against rendered markup: every tag, reset, zero matches, comma-containing tags and a literal `all` tag passed. This used a lightweight DOM adapter and does not establish browser layout behavior.
- Live HTTP checks after restarting cached editor middleware: homepage, editor, Following entrance and three category routes all returned 200. The editor returned `/following/engineering/#chip-huyen` and the rendered editor included the new category selector.
- Browser visual QA unavailable: computer-use tool returned `The browser access host is unavailable`. Responsive and focus styles are implemented; rendered layout has not been visually inspected.
- `git diff --check` passed.
- Independent read-only review completed; both identified preview issues were fixed and re-reviewed with no remaining substantive findings.

## Entrance simplification

User requested the Notes-style minimal entrance: matched its page background, width, title sizing, separators and numbered rows. Removed all introduction, topic, source-preview and count markup from the entrance. Rebuilt 125 pages successfully; live entrance returned HTTP 200. Parsed the production and live HTML and verified that the main content contains exactly Following, CONTENTS and the three numbered category links.

## Local layout-style delivery fix

The user screenshot showed the shared header/background styles but an unstyled, left-aligned Following directory with inline links. The current server HTML and scoped CSS matched, so the exact browser-side trigger was not confirmed. The small entrance layout stylesheet now renders directly in the document head with `is:inline`, with every child selector namespaced under `.following-index`; it no longer depends on the page-style HMR module or Astro scope attributes. Reloaded the dev configuration. Production build passed (125 pages), both localhost entrance and Notes returned 200, and parsed production/live HTML confirmed head inline CSS for centered width, padding and grid rows with no page-style module dependency. Browser visual confirmation remains unavailable.
