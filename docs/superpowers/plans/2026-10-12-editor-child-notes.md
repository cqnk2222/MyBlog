# Editor child notes implementation plan

**Goal:** Create chapters from any note without manually rebuilding its directory and metadata.

**Architecture:** Extend the editor's pure note-navigation module with child creation
context and filename-stem parent grouping. Reuse the existing creation endpoint and
dialog, with explicit series/order fields and inherited section defaults.

**Tech stack:** Astro, native DOM JavaScript, Node middleware, node:test.

- [x] Add failing checks for parent metadata inheritance, numbering, index overviews,
  nested paths, and expandable parent entries.
- [x] Implement pure context and tree grouping helpers in `note-navigation.mjs`.
- [x] Add note-level creation buttons, parent-aware tree rendering, dialog defaults,
  series/order controls, and create-payload inheritance in `EditorPage.astro`.
- [x] Document the operation, run Node tests, and exercise the complete editor script
  against temporary copied content in a DOM environment.
- [x] Check duplicate creation and draft preservation, build the website, compile the
  live dev editor, and review the final changes. Do not edit user content or publish.

Validation: 11 Node tests pass. Full-page DOM integration using temporary copied
content verifies both entry points, inheritance, next order, nested children,
duplicate protection, unchanged parent files, draft preservation, manual directory
changes, and unclassified parents. The dev editor compiles and production builds.
Read-only code review found no remaining Critical or Important issues after fixes.
