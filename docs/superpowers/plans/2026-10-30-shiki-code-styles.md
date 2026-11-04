# Shared Shiki code styles implementation plan

> **For agentic workers:** Execute these steps inline in the current `codex/blog-updates` checkout. Preserve the existing editor image changes and article edits.

**Goal:** Keep Shiki and make article code blocks and editor draft previews use the same colors and typography.

**Architecture:** Both Markdown renderers use one shared configuration with Astro's `css-variables` Shiki theme. Both page surfaces load one shared prose-code stylesheet, backed by the site's design tokens. Keep the existing dark presentation, code size, whitespace and horizontal scrolling.

**Tech stack:** Astro 5, Shiki 3, CSS variables, Node test runner.

## Accepted scope

- Blue-black background (`--code-bg`), cyan keywords (`--code-keyword`), brighter body/comment colors and coordinated string, constant and function colors.
- Identical block and inline-code colors, fonts, font sizes, line heights, padding, borders, radii and margins in article pages and draft previews.
- A single horizontal scroll container, no wrapping of source code, and no added controls.
- Existing editor actions, content, and non-code typography remain outside this change.

## Steps

- [x] Add `src/editor/code-rendering.test.mjs`: render the same Python and plaintext snippets through the editor `/render` route and the Astro Markdown configuration. Assert identical HTML and CSS-variable colors; run once before implementation to confirm the old default theme fails.
- [x] Add `src/markdown/config.mjs` exporting `markdownConfig = { syntaxHighlight: 'shiki', shikiConfig: { theme: 'css-variables', wrap: false } }`. Import it as `markdown` in `astro.config.mjs`, and pass it into `createMarkdownProcessor` in `src/editor/api.mjs`.
- [x] Add `src/styles/code.css` defining the `.prose` code rules and Shiki variable mappings. Set block padding on `pre` and make `pre > code` inherit typography without scrolling. Update `src/styles/tokens.css` for the shared palette.
- [x] Import the shared CSS from `src/styles/global.css` and `src/editor/EditorPage.astro`. Remove their old independent code rules and share font loading through `src/styles/fonts.css` so JetBrains Mono is available in both.
- [x] Run `node --test src/editor/code-rendering.test.mjs` and `npm run build`. Check the resulting article HTML uses the shared Shiki theme.
- [x] Compare computed styles and highlighted text colors in the live article and editor draft. Check a narrow viewport for isolated horizontal scrolling and capture the result.

## Review

The shared config avoids divergence between the dev middleware and Astro's rendering pipeline. Scope CSS to `.prose` so editor logs and other UI are unaffected. No dependency changes or publishing are required.

Live verification found that the long-running dev process retained the old editor middleware even after Astro restarted its frontend. Restarting the process loaded the shared configuration; article and draft computed code styles then matched exactly. At a 390px viewport, the document stayed 390px wide and the 292px code block contained its 453px scrollable content.

An additional rendering check covers all emitted color variables for Python, Markdown, diff and ANSI output so the CSS-variables theme cannot silently lose colors for those samples.
