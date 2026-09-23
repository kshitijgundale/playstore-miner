## Context

This is a new single-user, local research tool. It must help identify existing Android apps with visible demand and room for a better or cheaper competitor, while preserving a 250-search/month SerpApi allowance. The repository has no application code or existing product specifications. SerpApi's Google Play chart response can contain up to 50 ranked results; keyword results are grouped lists, and product and review requests are separate. Its Account API provides quota totals without consuming a search. Source fields vary by response and locale, so missing fields must remain unknown.

## Goals / Non-Goals

**Goals:**

- Make category charts, keyword searches, app detail inspection, negative-review research, and shortlisting useful in one local workflow.
- Use SQLite as the working dataset and preserve source observations for later comparison.
- Keep every potentially billable action visible and bounded before execution.
- Distinguish source-observed values, parsed thresholds, and derived changes.
- Leave one narrow provider seam for a future direct Play Store scraper.

**Non-Goals:**

- Multi-user access, authentication, hosted deployment, Docker, queues, scheduled scans, or exhaustive Play Store coverage.
- Direct scraping, LLM complaint clustering, exact install or revenue estimates, subscription-price discovery, or an opaque opportunity score.
- Claims of daily/weekly growth until comparable observations exist.

## Decisions

### One JavaScript monorepo and a narrow provider seam

Use `client/` for React JavaScript, `server/` for Node.js + Express, and `data/` for a gitignored SQLite file. Keep routing, SQL, normalization, and provider calls in small modules. Only the backend receives `SERPAPI_API_KEY`; the client calls Express. The provider exposes `getChart`, `searchApps`, `getApp`, and `getReviews`; quota lookup is a SerpApi-specific method. Normalizers convert provider responses to one local shape. A future direct scraper can implement these methods without changing routes or storage. This seam is preferable to either provider-specific logic throughout handlers or a larger plugin framework.

Suggested tree: `client/src/{pages,components,api.js}`, `server/src/{routes,services,providers,normalize,db}`, root `package.json` and `.env.example`. Use Recharts only for real historical series. SQLite migrations are versioned SQL files.

### Separate discovery context, app identity, and observations

Use `apps(package_id PK, first_seen_at, last_seen_at, shortlisted_at, wedge_note, improvement_note, pricing_note, complaints_note)` for identity and user research. Do not place country-specific metrics on this row.

Use `discovery_runs(id PK, kind, country, language, category_id, chart, keyword, provider, fetched_at, source_observed_at, source_request_id)` and `discovery_items(run_id, package_id, section, display_position, chart_rank NULL, title, developer, category, rating, reported_count NULL, install_band_text NULL, price_text NULL, icon_url NULL, description NULL)`. Chart rank is populated only from an actual `top_charts` response; keyword position is merely display order. Preserve the returned section for keyword results. Index the run query dimensions and fetch time.

Use `app_details(package_id, country, language, fetched_at, source_request_id, description, screenshots_json, related_json, updated_on_text, monetization fields, rating distribution JSON)` as the latest detailed view. Use `app_snapshots(id, package_id, country, language, source_type, source_request_id, observed_at, rating NULL, reported_count NULL, install_band_text NULL, install_floor NULL, price_text NULL, ads_flag NULL, iap_flag NULL)` as append-only observed metrics. Keep the source field name and its meaning in the normalizer; product `reviews` and per-star `ratings` must not be silently treated as the same count. Snapshot uniqueness is based on app, locale, source type, and source request ID; if a provider lacks a stable ID, use its observation timestamp plus a response fingerprint. `observed_at` comes from source metadata when available. A local cache read never appends a snapshot.

Use `reviews(package_id, review_id, country, language, stars, body, likes, review_date, first_fetched_at, last_seen_at)` with a uniqueness constraint on package, review ID, and locale. `review_fetches` records source rating filter, sort, requested page token, next page token, count, locale, and fetch time. This describes sample coverage without claiming the saved review distribution represents all Play Store reviews.

Use `api_requests` to record operation, sanitized parameters, outcome, possible cost, source request ID, and time. Record local cache hits separately from outbound calls. `account_snapshots` stores quota fields and fetch time, never the API key. Dashboard counts are derived from these tables; no counter cache is needed.

### Local-first fetch endpoints

`GET` routes read SQLite only. `POST /api/fetch/preview` accepts an operation and validated parameters, then reports cache status, maximum possible searches, account remaining, and whether the operation is allowed. `POST /api/discoveries` performs a chart or keyword fetch only when the matching local result is stale or the user requests refresh. `GET /api/discoveries/:id/items` reads one saved run. `GET /api/apps/:packageId` reads local app detail and history; `POST /api/apps/:packageId/detail` requests product enrichment. `GET /api/apps/:packageId/reviews` reads saved reviews and coverage; `POST /api/apps/:packageId/reviews` requests a bounded review slice. `PATCH /api/apps/:packageId/shortlist`, `GET /api/shortlist`, `GET /api/dashboard`, and `GET /api/usage` complete the surface.

An app detail view must not fetch SerpApi automatically. The explicit action is labeled with its possible one-search cost. Shortlisting does not silently fetch reviews; it exposes a convenient review action. Sort and filter returned rows locally. Restrict requests to `store=apps`, validated country and language codes, known chart values, and a maintained supported category list.

### Cache policy and request semantics

Use local TTLs of 24 hours for a chart, 7 days for a keyword search, and 7 days for app detail. Reviews do not automatically refresh. The dashboard's account status may be cached for 5 minutes, but refresh the Account API before any potentially billable search. A fresh local match returns its run/detail with no SerpApi call. A user can request refresh; an additional explicit `forceLive` choice is needed when bypassing SerpApi's own one-hour cache with `no_cache=true`. A cached source response must not create a second historical observation.

Keep country and language in every cache key. For charts include category and chart; for search include a trimmed normalized keyword; for detail include package ID; for review fetch include package ID, source rating, source sort, and pagination token. Do not auto-follow pagination. The default review fetch is one page with `num=199`; an explicit request may choose at most three pages, and its preview uses that maximum. Save a page's reviews transactionally before requesting the next page, and stop if no next token exists.

### Quota guard and honest accounting

The Account API's `searches_per_month`, `this_month_usage`, `plan_searches_left`, and renewal date are the source of truth for overall quota. A configurable local safety floor defaults to 20. Before source calls, recheck the account, serialize identical in-flight work, reserve the maximum possible request count for this process, and block if it would cross the floor. If account status is unavailable, block billable work and show the reason. Do not retry after ambiguous network failures because the request may already have been charged. Persist every attempt and reconcile the account after it. Display local requests by operation as attempts or possible cost, not exact billable usage; SerpApi's own free cache can make actual charges differ.

### Historical views and derived metrics

Charts query actual `discovery_runs` and `app_snapshots`, never fabricated daily rows. Rank history is scoped to the same country, language, category, and chart; lower rank is better. Rating and reported-count history is scoped to the same country and language and displays source type. Prefer detail observations for count series when available and do not mix incompatible source counts. Install bands are labeled thresholds and plotted as steps only when a change is observed. Show an insufficient-history state before two comparable points exist. Later 1/7/30-day deltas must report the dates compared and only calculate when there is a suitable observation near the requested lookback.

### Dense research UI

The dashboard shows account remaining/used/limit, locally discovered apps, detail-enriched apps, distinct saved reviews, distinct scanned country/category pairs, recent fetch outcomes, and shortlisted apps. Category Explorer and Search share a sortable/filterable table with explicit source and freshness labels. The app page includes metadata, screenshots when available, description, monetization signals, related-result group labels, review coverage, and small Recharts views when history exists. Unknown price, ads, IAP, count, update date, and installs render as `Unknown`, not zero or false.

## Risks / Trade-offs

- **Provider response changes** → Keep normalizers isolated, tolerate absent fields, and validate against saved example responses before live quota use.
- **SerpApi cache reused during refresh** → Record its source request ID/time and avoid a duplicate observation; explain the difference between refresh and force live.
- **Account totals differ from local operation totals** → Label local counts as attempts and use Account API totals for remaining quota.
- **Review sample bias** → Display source filters, fetched page count, and stored sample size; do not call sample proportions global distributions.
- **Locale differences** → Scope observations, cache keys, and rank comparisons to matching locale and chart context.
- **Sparse early history** → Show data points and empty states, with no interpolated growth or trend claim.
- **Single-process budget reservation** → Run one local Express process in v1; revisit coordination if deployment changes.

## Migration Plan

Create the initial schema from versioned migrations on first local startup. Keep the SQLite file outside version control and provide a documented backup copy procedure before later migrations. This is a new application, so no existing user data needs migration or rollback. A failed migration should stop startup rather than continue against a partial schema.

## Open Questions

- Which country should be the initial UI default? Use `US/en` until the user selects another; all stored data remains locale-scoped.
- How much of the Google Play category catalog should be exposed initially? Start with a maintained supported list and expand it without a schema change.
