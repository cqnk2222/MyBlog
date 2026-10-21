# Editor note categories implementation plan

**Goal:** Match editor navigation and authoring controls to the four Notes categories.

**Architecture:** Share category metadata and inference between Astro pages and the
editor API. Persist selected categories in optional `space` frontmatter. Keep real
paths in editor tree nodes so virtual category groups never become filesystem paths.

**Tech stack:** Astro, native DOM JavaScript, Node middleware, node:test.

- [x] Add API integration tests using temporary content for legacy mappings, explicit
  assignment, category creation, and invalid category rejection; run them to observe
  current missing category behavior.
- [x] Extract `NOTE_SPACES` and membership helpers into `src/data/note-space-config.mjs`.
  Delegate `src/data/note-spaces.ts` classification to these shared helpers. Add optional
  `space` to the Astro notes schema and the editor notes form definition.
- [x] Enrich API file/read/save results with inferred category and validate explicit
  category values before writing. Run `node --test src/editor/note-spaces.test.mjs`.
- [x] Add a pure editor tree builder retaining physical folder creation context;
  expose four virtual note categories, including empty categories and unclassified
  notes. Add focused navigation assertions to the integration tests.
- [x] Update `EditorPage.astro` with category trees, a category selector for creation
  and metadata, contextual directory suggestions, and preservation of inferred
  categories on unchanged saves. Update the editor README.
- [x] Run the Node tests and `npm run build`, restart the existing dev server, and
  verify category counts, folder creation defaults, existing note metadata, search,
  and the new category selector through the browser when available, or a DOM integration check.

Validation completed: seven Node integration tests, a full-page DOM smoke check using
temporary copied content, matching website/editor classification for all 35 current
notes, production build, and live development client compilation. Native browser
verification was unavailable because computer-control permissions were not granted.
