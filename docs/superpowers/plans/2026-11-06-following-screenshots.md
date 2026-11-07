# Following Screenshot Gallery

**Goal:** Implement the user-approved screenshot version of One Page Love's Similar Websites presentation and demonstrate it with Inspora.

**Architecture:** Keep the main Following directory and three category routes. Add optional `previewImage` metadata and render it as a linked, large screenshot above the source name, domain and custom tags. Keep text-only entries usable. Extend the existing repository image storage to a Following namespace and include these files in editor publication. The editor accepts optional screenshot uploads in both new and existing sources; its required manual inputs remain name, URL and category.

## Tasks

- [x] Obtain and inspect an authentic screenshot of Inspora, using a published preview if direct browser capture remains unavailable; retain provenance and do not fabricate a capture.
- [x] Add failing tests for optional preview metadata, upload application and document-switch protection, Following image storage isolation and image publication.
- [x] Extend image storage/API/publication paths while retaining Notes behavior. Add preview validation and schema support.
- [x] Add optional upload controls to the source creation form and existing-source metadata form, preserving custom tags and the three required inputs.
- [x] Redesign source cards around large screenshot links, plain captions and subtle metadata, with responsive columns and text fallbacks.
- [x] Store the Inspora sample locally and attach only its preview metadata.
- [x] Run editor/data regression tests, production build, gallery HTML checks, live editor/script/image/API checks and an independent code review. Report browser visual verification limits if still unavailable.

No framework migration, video implementation, similarity algorithm, commit, push or deployment is included.

## Inspora sample provenance

- Existing published screenshot: https://creatorstoolbox.com/products/inspora/about ("Inspora preview 2").
- Original asset: https://creatorstoolbox.com/images/galleries/inspora-661abe692d464c726fe7422047d2f083a1c3660575f8e50f0b97507f6944b77b.jpg
- Downloaded 2026-11-06; screenshot capture date unavailable. This is not a fresh browser capture.
- Visually inspected the original 1658 × 1013 image, then encoded it as WebP (60,656 bytes) through the existing image storage pipeline.
- Local asset: `public/images/following/25d58c56da05f006102a8b360db80e25bf7e166fa022ac7eed1591df576189d6.webp`.

## Validation

- `node --test`: 81 passed, 0 failed. Includes upload namespaces, metadata persistence, source-switch protection, reopening dialogs and mutual exclusion between source saves and screenshot uploads.
- `npm run build`: 125 pages, exit 0. All ten sources retained (Research 6, Engineering 3, Design 1), with original bodies and metadata preserved except the already-approved removal of source type and Inspora's added preview path.
- Live directory, Design page, editor, editor module, source read API and screenshot URL: HTTP 200; deduplicated screenshot upload: HTTP 201. Downloaded image SHA-256 matches the repository asset.
- Independent code review found a screenshot/save race, now fixed with regression tests; follow-up review reported no remaining blockers.
- Browser access host is unavailable. Inspected the screenshot asset and validated generated/live HTML, compiled scripts and image delivery; actual page rendering and interactive browser QA remain unverified.
- Local server remains running at `http://127.0.0.1:4321/` for the user's review. Nothing committed, pushed or deployed.

## Awwwards follow-up

- The user-created `following/awwwards.md` was already in Design, but its `previewImage` was the HTML homepage URL. Replaced only that line with a locally stored screenshot, retaining all other file contents.
- Screenshot source: https://stack.liuhuo.org/zh-hans/discover/awwwards ; published asset: https://assets.liuhuo.org/uploads/2026/09/73931d06-2998-456f-ab09-17114f265099.jpg . Source states capture date 2026-09-18. Visually inspected original 3840 × 2160; resized without cropping to 1600 × 900 WebP, 101,536 bytes. This is an existing published screenshot, not a fresh capture.
- Local asset: `public/images/following/30c58b950b6395c06ae02f58b9b742e6a40aa17934c31937191749be4f12815f.webp`.
- Shared validation now rejects a homepage reused as its own image link, including www, protocol, fragment and query variations. New/existing editor fields explain image direct links and show immediate guidance. Reset/upload clear native validation errors; non-Following collection controls are disabled.
- Changed preview fitting from cover to contain and removed hover zoom, so wide screenshots retain their side navigation/logo inside the consistent frame.
- Validation: `node --test` 83 passed; production build 125 pages. Follow-up review found no blockers. Live Design page, editor module, Awwwards metadata and image return HTTP 200; both screenshot entries and downloaded image hash verified. Actual browser rendering remains unverified because browser access host is unavailable.

## GSAP and Refero Styles additions

- Added both user-supplied URLs to Design as `gsap.md` and `refero-styles.md`. Verified names/links against the official sites; custom tags and Markdown notes remain blank.
- GSAP screenshot source: https://frontend.horse/issues/74/ ; published asset: https://images.prismic.io/frontend-horse-newsletter/44a1e285-b2d4-4a6a-981d-e1fb7852a8f4_gsapren.png?auto=compress,format . Visually inspected the 1200 × 608 image showing GSAP navigation and the complete "Animate anything" hero. Historical public screenshot; capture date unavailable. Encoded to WebP without cropping: `675cb6436b8730091451284e12b99ac6143a25c5636f63fa5124d0db74ea9b35.webp`, 32,992 bytes.
- Refero Styles screenshot source: https://forum.trae.cn/t/topic/15191 ; published asset: https://trae-forum-cdn.trae.com.cn/prod/original/3X/1/8/18b99a8be314ebfb3ce53b6664c65c1d96e6ce6a.jpeg . Visually inspected the 2552 × 1308 image showing the Styles header, search and reference gallery. The source post is dated 2026-05-07; capture date unavailable. Resized without cropping to 1600 × 820 WebP: `a4fa206f6af0da28f041108bb4250e7b9b42f3153e707ccdc399786f9965eae0.webp`, 41,626 bytes.
- Both images use the repository image storage/manifest and existing complete-image fitting. These are published previews, not fresh captures. No application code or existing source entries changed for these additions.
- Validation: production build succeeded (125 pages); both new metadata records pass the shared validator and all 11 existing source files retain their exact SHA-256. Built/live Design HTML includes all four screenshot cards with correct links. Live page, both images and editor file list return HTTP 200; downloaded image hashes and editor categories match the new records. Browser rendering was not rechecked because the browser access host remains unavailable.
