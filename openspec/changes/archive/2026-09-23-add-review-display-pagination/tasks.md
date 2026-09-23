## 1. Local review browse API

- [x] 1.1 Add validated `page` and `pageSize` inputs to saved and marked review reads, defaulting to page 1 and 100 rows and accepting page sizes 25, 50, 100, and 200.
- [x] 1.2 Apply filters, deterministic sorting, and SQL pagination to saved reviews; remove the 1,000-row cutoff and return matching total plus page metadata while preserving stored count, coverage, and distribution.
- [x] 1.3 Page marked reviews from local storage with a matching total and the same response shape; keep mark and note persistence and provider fetching unchanged.

## 2. Review views

- [x] 2.1 Add reviews-per-page selection, current range, and Previous/Next navigation to the Reviews tab, separate from source fetch pages.
- [x] 2.2 Add the same display controls to Marked reviews and handle empty and final-page unmark states.
- [x] 2.3 Reset or clamp page state after filter, sort, page-size, app, locale, fetch, and annotation changes so the displayed rows and counts remain coherent.

## 3. Verification

- [x] 3.1 Update API tests for the paginated response shape, invalid inputs, filters and ordering, and access to saved and marked reviews beyond row 1,000 without provider calls.
- [x] 3.2 Verify both tabs' page controls, counts, page-size changes, and mark/note behavior; run the relevant server tests and client build.
