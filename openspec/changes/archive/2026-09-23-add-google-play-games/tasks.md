## 1. Discovery source and persistence

- [x] 1.1 Add an additive database migration that marks existing discovery runs as `apps` and supports source-aware lookup.
- [x] 1.2 Validate the discovery source, default omitted values to `apps`, and validate chart categories against separate Apps and Games lists exposed by the configuration API.
- [x] 1.3 Include discovery source in saved-run lookup, duplicate detection, recent-run selection, and chart-rank history without splitting shared app records.

## 2. Provider and API behavior

- [x] 2.1 Route Games chart and keyword requests to SerpApi `google_play_games`, using `games_category` for charts; preserve existing Apps requests and shared product/review calls.
- [x] 2.2 Make preview, freshness, request coalescing, and saved-result responses source-aware while retaining existing quota costs and cache lifetimes.
- [x] 2.3 Add provider and API tests with game chart/search fixtures covering source-specific requests, invalid cross-source categories, independent cache entries, and migrated Apps runs.

## 3. User interface and history

- [x] 3.1 Replace Category Explorer and Search navigation with top-level Apps and Games tabs, each offering category charts by default and keyword search as a secondary view.
- [x] 3.2 Populate each tab's categories and recent runs by source, preserve its discovery controls and results when switching tabs, and label Games search without promising game-only results.
- [x] 3.3 Include discovery source in rank-history labels and grouping while keeping detail, reviews, and shortlist shared.

## 4. Verification and documentation

- [x] 4.1 Update the README to describe Apps and Games discovery, game categories, keyword-search limits, and source-aware saved history.
- [x] 4.2 Run the relevant tests and build, then verify the Apps and Games tab flows and existing saved-run behavior.
