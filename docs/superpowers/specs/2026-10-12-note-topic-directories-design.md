# Note topic directories

Every series listed on a Notes category page should open a standalone book-style
directory instead of its first article. Generate `/notes/<space>/series/<topic>/`
for every nonempty category series. Topic names produce readable slugs; colliding
names receive deterministic hash suffixes. Existing article paths stay unchanged.

Reuse the category directory typography and page structure without description
sentences below CONTENTS. List every article, show nested folders/child notes, pair
filename-stem parent notes with their child groups, and keep the original parent
article reachable. Provide a back link to the category. Article breadcrumbs link
back to their category and topic; series navigation uses the same membership rules.

Centralize the shared category/topic document layout. Validate topic route identity,
slug collisions, nested parent grouping, complete article coverage, article back
links, all static routes and live development pages. Do not alter Markdown content,
editor behavior, or publish the changes.
