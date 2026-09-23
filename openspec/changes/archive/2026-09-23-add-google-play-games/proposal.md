## Why

The miner currently discovers only Google Play apps, so game categories and their charts cannot be researched. Games should use the same saved, quota-aware research flow while keeping Apps and Games discovery results distinct.

## What Changes

- Replace the separate Category Explorer and Search navigation entries with Apps and Games discovery tabs. Each tab keeps the existing category-chart and keyword-search pattern; category charts are the primary entry point.
- Add supported Google Play Games categories and route game discovery through SerpApi's `google_play_games` engine and `games_category` parameter. Keep product detail and review research shared by package ID.
- Save the discovery source on each run and include it in freshness, duplicate detection, recent runs, and rank comparisons. Preserve existing saved runs as Apps runs.
- Keep keyword search in both tabs, while making no claim that the Games query endpoint filters results to games.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `app-discovery`: Discover category charts and keyword results from separate Apps and Games tabs, with source-specific categories and saved runs.
- `historical-observations`: Compare chart ranks only within the same Apps or Games discovery source in addition to the existing locale, category, and chart dimensions.

## Impact

The discovery UI, request validation, SerpApi provider, discovery API, local cache and SQLite discovery-run schema change. Existing product detail, reviews, shortlist data, quota controls, and app records remain shared. A database migration is required for existing saved runs.
