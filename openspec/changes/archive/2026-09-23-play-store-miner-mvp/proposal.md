## Why

Play Store Miner needs a small, persistent research workflow for finding Android apps with proven demand and a plausible opening for a better or cheaper competitor. The 250-search monthly SerpApi allowance makes local reuse, explicit fetches, and honest source labeling essential from the first version.

## What Changes

- Create a local React JavaScript and Express application backed by SQLite, with the SerpApi key held only by the backend.
- Add country-specific category chart and keyword discovery with a dense, sortable table and persistent results.
- Add app detail enrichment, monetization indicators, screenshots, related apps, and explicit review collection for promising apps.
- Add a shortlist with structured research notes and a compact dashboard for resuming research.
- Record source observations and chart positions over time for truthful historical charts and later momentum calculations.
- Add request previews, local cache reuse, account quota reporting, and a safety floor before any potentially billable request.

## Capabilities

### New Capabilities

- `app-discovery`: Fetch and reuse category charts and keyword searches, preserving result context and order.
- `app-research`: Show app metadata and selectively enrich it with a product detail request.
- `review-mining`: Explicitly collect, deduplicate, filter, and browse reviews with visible collection coverage.
- `opportunity-shortlist`: Star apps and record a concrete competing angle in structured notes.
- `research-dashboard`: Summarize dataset size, recent activity, quota, and shortlisted apps.
- `request-budget`: Preview, account for, and constrain SerpApi requests while preferring local data.
- `historical-observations`: Preserve actual source observations and chart ranks for comparable history views.

### Modified Capabilities

None; the repository has no existing product specifications.

## Impact

- Adds a simple `client/`, `server/`, and local `data/` project structure.
- Adds SQLite schema and migrations, Express endpoints, a React UI, and a narrow Play Store provider interface implemented with SerpApi.
- Requires a server-side `SERPAPI_API_KEY`; no user authentication or hosted infrastructure is introduced.
- Later direct scraping, scheduled mining, LLM complaint clustering, and estimated revenue or growth scoring remain outside this change.
