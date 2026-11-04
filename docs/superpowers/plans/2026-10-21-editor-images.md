# Editor image paste implementation

Approved design: paste/drop image files into Markdown body, save repository assets by SHA256 under public/images/notes, insert standard Markdown and refresh preview. A provider interface returns stable asset metadata; a versioned manifest maps asset IDs to local paths and future remote URLs. Existing references remain ordinary Markdown for bulk migration. No automatic deletion or production push.

- [x] Test image validation, hash deduplication, concurrent manifest writes, upload API, clipboard insertion and publication scope.
- [x] Implement repository storage provider and bounded binary upload endpoint (10 MiB; PNG/JPEG/WebP/GIF).
- [x] Implement paste/drop/file selection with insertion at captured selection; prevent concurrent document edits during upload to preserve the insertion position.
- [x] Include image directory and manifest in publish status/add/commit; document migration contract.
- [x] Run relevant tests, editor compilation and full build.
