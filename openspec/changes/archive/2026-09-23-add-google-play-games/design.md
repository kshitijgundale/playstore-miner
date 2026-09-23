## Context

Discovery currently validates only app categories, and SerpApi calls use `engine=google_play`, `store=apps`, and `apps_category`. Chart and keyword runs share one table and are cached by kind, locale, category/chart or keyword. The UI has separate Category Explorer and Search pages. Product detail and reviews already use `google_play_product` with package IDs, which also supports game products.

SerpApi documents a separate `google_play_games` discovery engine with `games_category`, the same three chart values, and compatible `top_charts` and `organic_results` structures. Its keyword documentation says query results are the same as Apps results, so the UI must not describe Games search as game-only filtering.

## Goals / Non-Goals

**Goals:**

- Present Apps and Games as top-level discovery tabs. Each tab opens on category charts and offers the existing keyword search workflow.
- Keep category choices, provider calls, saved runs, freshness checks, and chart history specific to the chosen discovery source.
- Keep details, reviews, shortlist, quota previews, and local app identity shared by package ID.
- Retain all existing runs as Apps runs after migration.

**Non-Goals:**

- Category landing-page sections, pagination, device filters, or extra game-specific metadata.
- A game-only guarantee for keyword search results.
- Live SerpApi requests during automated tests.

## Decisions

### Model discovery source explicitly

Use a validated source value (`apps` or `games`) on every discovery request and persisted discovery run. Requests that omit the field default to `apps` for existing clients. Add the source to run lookup, duplicate detection, recent-run filtering, and chart-rank context. Keep a single `apps` table keyed by package ID because the same product can appear in more than one discovery source.

Alternative considered: infer Games from a `GAME_*` category. This cannot distinguish Apps and Games keyword searches and would make future overlapping categories ambiguous.

### Keep the current discovery operations

Retain `kind=chart` and `kind=search`, quota preview, one-request cost, freshness periods, and normalization. Dispatch chart and search requests to the appropriate SerpApi discovery engine. Apps continue to use `google_play` plus `apps_category`; Games use `google_play_games` plus `games_category`. Product details and reviews continue to use `google_play_product` and `store=apps`, as documented in game result product links.

Alternative considered: add separate game routes and tables. Shared discovery operations and result shapes make that duplication unnecessary.

### Make category choices source-specific

Expose app and game category lists from the backend configuration endpoint and validate category IDs against the selected source. The Games list includes `GAME` and the documented game genres. Continue to use Top Free, Top Paid, and Top Grossing charts. The UI uses two top-level Apps and Games tabs, each with category charts as the default view and Search as the secondary view. Each tab retains its own selected category, chart, keyword, current result, and recent-run list while the app detail view remains shared.

Alternative considered: a single mixed category dropdown. Distinct tabs make the requested research context visible and reduce accidental cross-source scans.

### Migrate saved runs in place

Add a non-null discovery-source column with default `apps` to `discovery_runs`, then add an index covering source-aware lookup. Existing rows and their items remain intact. All new lookup and deduplication queries include source; in-memory quota deduplication keys include it through validated request parameters. Rank history queries return source and the UI includes it in series grouping. The old uniqueness constraint remains for compatibility; application-level duplicate detection continues to be authoritative.

Alternative considered: rebuild the table to replace its unique constraint. That adds migration risk without improving the current deduplication behavior, which already relies on an explicit lookup.

## Risks / Trade-offs

- [Games keyword results overlap Apps results] → Keep separate source provenance and avoid game-only wording; users may still choose Search deliberately.
- [Some locale/category/chart combinations return no chart items] → Preserve an empty saved run with its source and observation time, and show the existing empty-results state.
- [Historical rank ambiguity for a game also found through Apps] → Group rank series by source as well as locale, category, and chart.
- [Older clients omit source] → Default omitted source to `apps` at validation and in the database migration.

## Migration Plan

Apply an additive SQLite migration before serving requests; existing rows receive `apps`. Deploy the source-aware backend and UI together. A rollback to older code can still read the database because it ignores the added column, but it should not serve Games runs; restoring a pre-change database backup is the full rollback path.

## Open Questions

None for the agreed scope.
