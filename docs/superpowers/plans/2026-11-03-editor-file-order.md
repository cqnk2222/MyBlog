# Editor file ordering implementation plan

**Goal:** Adjust the order of sibling files directly in the editor directory and persist it across refreshes.

**Design:** Add a compact sorting mode with up/down controls. Treat a note with children as one file row so it can move alongside other sibling articles. Persist the sibling sequence in frontmatter `order`; Notes directories on the website use that explicit parent order. Category order and filesystem hierarchy stay intact. Ordinary folders retain their existing positions before their file rows. Essays, Thoughts, and Following can use the same editor controls; their website indexes keep their established date/group sorting.

**Interaction:** Enter sorting mode from the directory header, use labeled arrows, and click Done. Show disabled end controls. Clear search before sorting so invisible siblings are never renumbered unexpectedly. Require saving a dirty article first. While saving a sequence, keep controls disabled and keep a narrow drawer open. Update the open article's order field after a successful reorder so a later save preserves the new position.

**Architecture:** A shared ordering helper produces sibling file sequences (including parent articles); a dedicated API endpoint validates the complete original sequence and writes only order metadata. Preserve raw Markdown bodies and unrelated YAML wherever possible, validate all inputs before writing, serialize editor mutations, and reject stale directory sequences. Add focused integration tests with temporary files and website-tree regressions.

## Steps

- [ ] Add failing tests for sibling ordering, parent articles, persisted metadata, raw body preservation, stale/invalid requests, and website parent ordering.
- [ ] Implement shared sibling helpers and the validated reorder endpoint.
- [ ] Add the sorting controls, save guards, and current-document order synchronization.
- [ ] Document the feature and verify focused/full tests, build, and wide/narrow browser behavior.
- [ ] Review the scoped changes and record verification; leave changes local without publishing or changing the user's chosen article sequence.
