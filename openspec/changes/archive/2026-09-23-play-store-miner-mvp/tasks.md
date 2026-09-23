## 1. Project foundation

- [x] 1.1 Create the root workspace scripts, `client/` React JavaScript app, `server/` Express app, `.env.example`, and gitignored `data/` path.
- [x] 1.2 Add a SQLite connection and versioned migration runner that stops startup on migration failure.
- [x] 1.3 Create tables, constraints, and indexes for apps, discovery runs/items, app details/snapshots, reviews/fetches, API requests, and account snapshots.
- [x] 1.4 Add shared server validation for package IDs, country/language, supported categories/charts, keywords, review options, and bounded page counts.

## 2. Provider and quota controls

- [x] 2.1 Define the small PlayStoreProvider data-method contract and implement the SerpApi chart, search, product, and review calls server-side.
- [x] 2.2 Add the SerpApi Account API adapter; persist only quota fields and expose a sanitized `GET /api/usage` response.
- [x] 2.3 Implement locale-aware cache keys and freshness checks for charts, searches, and app details; log local cache hits.
- [x] 2.4 Implement `POST /api/fetch/preview` with maximum possible search cost, current quota, freshness, and a configurable safety floor.
- [x] 2.5 Gate outbound requests with a current account check, in-process reservation and identical-request coalescing; record outcomes without retrying ambiguous failures.
- [x] 2.6 Verify budget guard behavior with cases for cache hits, floor crossing, unavailable account status, and a free provider cache response.

## 3. Discovery workflow

- [x] 3.1 Normalize chart `top_charts` and grouped keyword `organic_results` with nullable fields and distinct chart rank versus display position.
- [x] 3.2 Save successful discovery runs, items, app identities, and new source observations transactionally; deduplicate repeated source request IDs.
- [x] 3.3 Implement discovery fetch and saved-run read endpoints with local-first behavior and explicit refresh/force-live options.
- [x] 3.4 Build Category Explorer and Search controls with one shared dense, sortable, filterable app table and visible source/freshness states.
- [x] 3.5 Verify chart rank, keyword position, missing fields, fresh cache reuse, and repeat-source deduplication using saved provider fixtures.

## 4. App detail and history

- [x] 4.1 Normalize product metadata, screenshots, rating distribution, related-result groups, ads/IAP labels, price text, install band, and updated date without guessing missing values.
- [x] 4.2 Implement local app-detail read and explicit product-fetch endpoints, including snapshot deduplication and locale-scoped detail caching.
- [x] 4.3 Build the app detail page with an explicit fetch preview, metadata, screenshots, monetization fields, and labeled related groups.
- [x] 4.4 Add Recharts rank, rating, and compatible reported-count histories from actual observations, plus install-band threshold changes and sparse-history states.
- [x] 4.5 Verify that local opens and repeat source responses add no observations, and that rank series do not mix charts or countries.

## 5. Reviews and shortlist

- [x] 5.1 Implement a default one-page `num=199` review fetch and explicitly bounded multi-page fetch with page-by-page persistence and review-ID deduplication.
- [x] 5.2 Implement saved-review read/filter/sort endpoints and report fetch coverage separately from product-level rating distribution.
- [x] 5.3 Build Review Miner controls, request preview, saved-review list, sample distribution, and coverage labels.
- [x] 5.4 Implement shortlist update/read endpoints for star state and the four structured note fields without triggering provider requests.
- [x] 5.5 Build shortlist controls in the table/detail views and a shortlist page with evidence dates and missing-data states.
- [x] 5.6 Verify that review filters and shortlist edits cost zero provider requests and repeated review IDs do not inflate stored counts.

## 6. Dashboard and final verification

- [x] 6.1 Implement local dashboard aggregates, recent fetch activity, distinct category-scan count, shortlisted-app summary, and cached quota status.
- [x] 6.2 Build the compact dashboard with empty states and clear stale or unavailable account status.
- [x] 6.3 Document setup, server-side key configuration, SQLite backup, cache TTLs, quota guard, and the difference between observed and derived data.
- [x] 6.4 Run OpenSpec validation, build the client/server, and exercise the core research flow with fixtures or a mock provider so no live SerpApi quota is needed for verification.
