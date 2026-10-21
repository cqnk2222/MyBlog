# Note topic directories implementation plan

**Goal:** Make every Notes series open a complete book-style topic directory.

**Architecture:** Extend space grouping with topic slugs/URLs; reuse existing note
tree construction with directory-only parent pairing. A shared Astro layout renders
category/topic pages, and a recursive contents component renders note hierarchies.

**Tech stack:** Astro, TypeScript, Node node:test, esbuild for pure TypeScript checks.

- [ ] Add failing checks for category-qualified topic URLs, safe/collision-resistant
  slugs, nested directory pairing and complete article membership.
- [ ] Extend space grouping and add directory tree transformation.
- [ ] Add a shared book layout and recursive article contents component, generate
  topic routes and point category entries to those directories.
- [ ] Connect article breadcrumbs and navigation to their category/topic.
- [ ] Run tests and build; verify every category/topic/article link and live RL page,
  then perform a read-only code review. Keep existing content and article URLs intact.
