## Context

The Reviews tab reads locally stored rows through `GET /apps/:packageId/reviews`, which applies the selected star filter and saved sort but limits its response to 1,000 reviews. Reviews are keyed by package ID, country, and language. Marked status and notes live on those same rows. A separate marked-review route already demonstrates that rows outside the ordinary browse limit remain available.

## Goals / Non-Goals

**Goals:**
- Download a UTF-8 CSV from an app's Reviews tab with explicit All saved reviews and Current filter choices.
- Include every matching saved row for the current app and locale, including marked state and note, without provider access.
- Make current-filter export use the selected saved star filter and sort.

**Non-Goals:**
- Change the 1,000-row browsing limit or add pagination.
- Fetch reviews during export, export multiple apps or locales at once, or export source fetch history.
- Add other file formats or a database migration.

## Decisions

### Export from a dedicated local-data endpoint

Add `GET /api/apps/:packageId/reviews/export` with `country`, `language`, and `scope=all|current`. For `scope=current`, pass `stars` and `sort` from the saved-review controls. Validate package, locale, scope, star filter, and sort; reject invalid values with HTTP 400. The endpoint queries `reviews` directly without the browsing `LIMIT 1000` and never calls the provider or budget service. This avoids building a CSV from an incomplete browser response. A client-only CSV built from the displayed rows was considered but would silently omit saved reviews past the limit.

### Keep scope and ordering explicit

`all` ignores the current star filter and uses newest-first ordering. `current` applies the selected star filter, including no filter when All is selected, and the selected newest, oldest, or helpful sort. Add `review_id` as a stable tie-breaker. The UI presents the two scopes adjacent to the download action and uses the current locale. Export remains available when there are no saved reviews; the resulting CSV has a header and zero data rows.

### Use a stable, spreadsheet-friendly CSV shape

Write a header and these columns in order: `package_id`, `country`, `language`, `review_id`, `stars`, `body`, `likes`, `review_date`, `first_fetched_at`, `last_seen_at`, `marked_at`, `review_note`. Represent database null as an empty field; preserve Unicode and multiline text using standard CSV quoting and doubled quotes. Prefix text cells that could be interpreted as spreadsheet formulas with an apostrophe before CSV quoting. Stream database rows to the response so export size is not bound by the browse response or a second full in-memory copy. Set `text/csv; charset=utf-8` and an attachment filename containing the app ID, locale, and scope.

### Handle downloads separately from JSON API calls

The client JSON helper cannot read CSV. Fetch the export as a Blob, surface non-2xx errors in the Reviews tab, and trigger a browser download from a temporary object URL. This keeps failures visible while preserving the existing JSON helper.

## Risks / Trade-offs

- [CSV text can be interpreted as a spreadsheet formula] → Neutralize formula-leading text fields and test that behavior.
- [Large exports may take time] → Stream rows from SQLite and show a busy state while the download is prepared.
- [Review data may change during export] → Treat the download as a read of the local database at request time; it does not represent a historical snapshot.

## Migration Plan

No schema or data migration is needed. Deploy the route and UI together; rollback removes them without changing saved reviews.

## Open Questions

None for this change.
