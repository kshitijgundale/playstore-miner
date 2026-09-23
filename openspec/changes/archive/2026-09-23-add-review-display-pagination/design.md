## Context

`ReviewMiner` currently loads saved reviews with one GET request and renders the returned array. The local query has `LIMIT 1000`, while `storedCount` reports all saved reviews for the app and locale. `MarkedReviews` loads every marked row as an array. The existing `Pages` control selects how many source pages a provider fetch may request; it is unrelated to display pagination. CSV export already reads local reviews independently of the browse limit.

## Goals / Non-Goals

**Goals:**
- Make every saved and marked review reachable through bounded local pages.
- Default both views to 100 reviews per page and offer 25, 50, 100, and 200.
- Keep star filters, sort order, counts, marks, notes, and CSV export coherent while navigating pages.

**Non-Goals:**
- Change provider requests, source page tokens, fetch preview, quota costs, review storage, or CSV export scope.
- Persist a page size preference across app visits or browser sessions.

## Decisions

### Use local database pagination

The ordinary and marked GET endpoints will accept one-based `page` and `pageSize` query parameters. Missing values default to 1 and 100; page sizes are limited to 25, 50, 100, and 200. Reject invalid values instead of silently coercing them. Apply the ordinary star filter and selected sort before SQL `LIMIT`/`OFFSET`; count the filtered rows with the same app and locale predicates. The marked endpoint counts and pages marked rows for that app and locale. Return `reviews`, `total`, `page`, and `pageSize` in both responses. Preserve `storedCount`, coverage, and sample distribution on the ordinary response, where `storedCount` remains the count of all saved reviews for the app and locale.

This removes the 1,000-row cutoff and bounds response size. Loading all saved rows and slicing in React would still grow with the collection and could make the page slow.

### Make ordering deterministic

Keep the current newest, oldest, and helpful orders for ordinary reviews, adding `review_id` as a final tie breaker so rows with equal dates or likes have a stable order. Keep marked reviews ordered by mark time descending and review ID. Pagination is applied after this ordering.

### Keep display state in each tab

Each review view owns its current page and page size. Label the new control `Reviews per page`, leaving the source fetch control labeled `Pages` or clarifying it as `Source pages`. Show a range such as `101–200 of 342` with Previous and Next buttons disabled at the ends. Reset to page 1 after a filter, sort, or page-size change and when app or locale changes. When unmarking removes the last item from a marked page, load the nearest remaining page. Refresh the current ordinary page after a provider fetch; clamp it if its total changes. Mark and note updates should keep the current view accurate without a provider request.

### Change local browse response shape

The marked GET endpoint changes from a bare array to a paginated object; ordinary GET and the review POST response continue to contain `reviews` but now return a page and pagination metadata. The React callers and affected API tests must be updated together. There is no versioned external API contract in this repository, so an opt-in compatibility mode would add complexity without helping the current client.

## Risks / Trade-offs

- [Data changes between page requests can shift offset boundaries] → Use deterministic ordering and reload the active page after local mutations; tolerate movement caused by a separate concurrent fetch.
- [A page beyond the last page can appear after an unmark or changed filter] → Clamp to the last valid page and show the empty state only when the matching total is zero.
- [The marked endpoint response change can affect direct API callers] → Document the shape in the proposal and update all repository callers and tests in the same change.

## Migration Plan

No database migration is needed. Deploy the server and bundled client together. Rollback restores the prior endpoint shapes and UI; stored review data is unchanged.

## Open Questions

None.
