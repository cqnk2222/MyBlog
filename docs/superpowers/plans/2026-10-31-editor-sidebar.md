# Editor sidebar implementation plan

**Goal:** Keep the writing area usable in Chrome split tabs with a collapsible desktop sidebar and a narrow-screen drawer.

**Approved design:** Keep a permanent directory button in the header. Above 960px the sidebar is docked and remembers its collapsed preference. At 960px and below it is closed by default and overlays, rather than resizes, the editor. Close it on Escape, backdrop click, or a successful article switch. Keep the existing tree, search, hierarchy, and scroll state.

**Architecture:** Add a small `src/editor/sidebar.mjs` controller for media-query changes, preference storage, visibility, and focus. Integrate it into the existing `EditorPage.astro`; preserve all existing uncommitted changes. No publishing, branch changes, or unrelated refactoring.

**Tech stack:** Astro, CSS media queries, browser DOM, Node test runner.

## Tasks

- [x] Add behavioral tests for desktop preference, independent drawer state, resize transitions, dismissal/focus, tree preservation, and unavailable local storage. Run `node --test src/editor/sidebar.test.mjs` and confirm the missing behavior fails.
- [x] Implement the sidebar controller and its header button, overlay, close button, and accessible hidden/focus state. Close the drawer only at the end of a successful `openFile`.
- [x] Add CSS for collapsed desktop columns, the 960px drawer, and narrow header spacing. Keep preview behavior and metadata unchanged.
- [x] Document the controls in `src/editor/README.md`.
- [x] Run the new behavioral tests, existing editor/navigation tests, and `npm run build`. Use the existing local service for browser checks of wide/narrow layout, toggling, Escape, search, successful article selection, and width changes. Do not edit article contents in browser verification.
- [x] Review the final changes against the approved scope and update this checklist with verification results.

## Verification results

- `node --test src/editor/*.test.mjs src/data/*.test.mjs`: 39 passed, including 7 new sidebar tests.
- `npm run build`: passed, 115 pages. Existing content contains an uppercase `C` fence that Shiki falls back to plaintext for.
- Chrome widths 320, 390, 700, 960, 961, and 1440px: document width matched viewport; sidebar changed modes at 960px; desktop collapse persisted across refresh.
- At the browser's original 712px width, the main pane measured 712px both before and after opening the drawer.
- Real directory scroll position 178.5px survived close/reopen. Search text and current article highlight survived as well.
- Escape, backdrop click, successful selection, and keyboard focus wrapping verified. Escape closed a nested new-article dialog first and left the drawer open; the next Escape closed the drawer.
- Browser viewport override reset after verification. Screenshot: `/private/tmp/editor-sidebar-drawer.png`.
- Independent code review: no blocking findings. Unrelated dirty changes preserved; no commit or publication performed.
