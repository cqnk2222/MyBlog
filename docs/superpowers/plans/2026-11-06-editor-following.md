# Following Editor Implementation Plan

**Goal:** Let the user add a Following source directly under Research, Engineering or Design, with its real link and an optional reason, without having to invent a Markdown filename.

**Architecture:** Extend the existing editor tree with virtual Following category folders while preserving physical paths. Use a small shared Following input module for filename generation and source-field validation, and extend the existing new-content dialog with Following fields. Keep the current Notes creation workflow and existing source files.

## Tasks

- [x] Test category-aware API listing and editor trees, including empty Design, unknown categories, nested directories, search and category-specific sibling ordering.
- [x] Add `category` to Following list metadata; group Following under the configured categories with `following@<category>` keys and category-aware creation contexts.
- [x] Test source creation inputs: real HTTP/HTTPS URLs, RSS, category/kind, optional Markdown reason, automatic Unicode filenames, collision suffixes and explicit filename preservation.
- [x] Implement `src/editor/following-input.mjs` and validate Following metadata before API writes.
- [x] Extend the new-content dialog with category, name, homepage, source type, reason and optional RSS. Keep filename optional for Following, generate it from the name and avoid existing files. Preselect a clicked folder's category, reset new-source inputs each time, and keep generic Notes fields working.
- [x] Add category creation buttons and source-specific labels/placeholders to the existing editor. Use the same category preview URLs as the public pages.
- [x] Execute the real dialog and creation functions in regression tests, with the real temporary-file API. Verify that Design creation persists the chosen category/link/body, duplicate names keep existing content and invalid inputs leave no file.
- [x] Run targeted tests, all editor/data regression tests, the production build, `git diff --check`, and live editor/API checks after reloading the dev configuration. Confirm the rendered editor includes the new fields; record the browser visual verification limit.

## Scope

No source collection is added or reorganized on disk. Empty categories remain available for creation. Public Following pages keep the previously approved minimal entrance. No commit, push or publication is part of this task.

## Verification results

- `node --test src/editor/*.test.mjs src/data/*.test.mjs`: 73 passed, 0 failed. Covers actual dialog/create/save handlers with the real temporary-file API, including Notes creation, empty Design, unknown categories, filename collisions and rejected invalid writes.
- `npm run build`: 125 pages generated successfully; the pre-existing Shiki `C` language warning remains unrelated.
- A separate real Astro build using the same content config retained all nine deliberately colliding Markdown/MDX names and identical frontmatter slug overrides. Following uses the complete collection-relative filename as its content ID. API and card anchors also retain extensions to target `.md` and `.mdx` separately.
- All nine real public sources remain present with unique preview anchors, split Research 6 / Engineering 3 / Design 0.
- Independent read-only code review completed; source kind coercion and filename ID/anchor collisions were corrected and re-reviewed.
- Dev API modules require a full process restart; touching the Astro configuration alone left the old API module cached. Restarted the process to load the final version.
- Browser visual verification remains unavailable; runtime checks use served HTML/modules and API responses.
- Final live checks after full restart: `/editor`, files API, file-read API, compiled editor script and Engineering page all returned 200. Parsed editor fields were unique and present; live API categories were 6/3/0; all nine preview URLs resolved to matching rendered card anchors.

## User revision: no source types, custom tags only

The user requests only name, URL and category as manual required inputs, removal of source type, and optional free-text tags without preset values or suggestions.

- [x] Test creation and editing without kind, free-text custom tag persistence, blank tag defaults and old kind removal.
- [x] Remove kind from the editor, input validation, Astro schema, source cards and existing Following frontmatter; preserve all other source metadata and body text.
- [x] Add a blank optional tags input to the creation form; accept comma-separated custom tags without a datalist or fixed options.
- [x] Run regression tests, production build and live editor/API checks after a full dev-process restart.

Revision verification: 74 editor/data tests passed, production build generated 125 pages. A byte-for-byte comparison of all ten Following sources confirmed that only the legacy kind line was removed, including Inspora; all body text and existing tags are preserved. Production pages retain Research 6 / Engineering 3 / Design 1 and no longer render source-type labels.
