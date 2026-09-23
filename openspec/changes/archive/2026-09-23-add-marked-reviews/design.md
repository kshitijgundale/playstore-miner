## Context

The app page currently renders detail, history, Review Miner, and research notes in one vertical view. Saved reviews live in SQLite under the composite key `(package_id, review_id, country, language)`. Review fetches upsert provider fields; the local review endpoint filters and returns at most 1,000 reviews. App shortlisting and its notes are separate, app-level research data.

## Goals / Non-Goals

**Goals:**
- Put Overview, Reviews, and Marked reviews tabs immediately below the app title and locale.
- Let a researcher mark a saved review and attach an optional editable note, preserving both across reloads and repeat fetches.
- Keep annotation reads and writes entirely local and scoped to the current app and locale.

**Non-Goals:**
- Global review collections, shared accounts, review tags, or marking unsaved featured reviews.
- Automatic review fetching, changes to provider quota rules, or importing annotations from SerpApi.

## Decisions

### App-page navigation

Render an accessible tab bar below the app header. Overview contains the existing app detail, history, and research notes. Reviews contains the existing Review Miner. Marked reviews contains only marked saved reviews and their notes, with an empty state when none are marked. Reset the selected tab to Overview when the app ID changes. Preserve the existing global navigation and Back behavior. This is a small local navigation change; separate routes or a new global navigation item would add scope without improving access within one app.

### Annotation storage and identity

Add nullable `marked_at` and `review_note` columns to `reviews` in a new ordered SQLite migration. The existing composite key makes a mark specific to one app, review ID, country, and language. A nullable timestamp distinguishes marked from unmarked and supports stable marked-list ordering. Keep notes when a review is unmarked so an accidental unmark is reversible; unmarked reviews do not appear in the marked tab. Provider upserts continue to update only provider-owned columns, leaving annotations intact. Separate annotation rows were considered, but extra joins and lifecycle coordination are unnecessary for this single-user local store.

### Local API

Add a local `PATCH /api/apps/:packageId/reviews/:reviewId/mark` accepting locale, `marked` boolean, and optional `note` string. Validate the review exists for that full key, reject invalid types and notes over 5,000 characters, and return the updated review. Allow `note: ""` to clear a note. Marking an already marked review keeps its original `marked_at`; unmarking clears the timestamp but retains the note. Extend the ordinary saved-review response with annotation fields and add `GET /api/apps/:packageId/reviews/marked` for the current locale. The marked endpoint queries marked rows independently of the ordinary 1,000-review browse limit so every marked review is reachable. A query flag on the existing endpoint was considered, but a dedicated endpoint avoids mixing marked-list behavior with fetch coverage and saved-sample statistics.

### Interaction and state

Each saved review has a labeled Mark/Unmark control and an inline note editor with an explicit Save action. The Marked reviews tab offers the same note editing and unmark control. After a successful write, update the visible review and refresh marked-list data when opened. Show pending and error states so failed writes do not appear saved. Review annotation requests never call the provider or quota preview. Keep the saved-review source fetch and its existing local filters in the Reviews tab.

## Risks / Trade-offs

- [An annotation disappears from the ordinary browse list because of its 1,000-row limit] → The marked endpoint reads marked rows independently.
- [A repeat provider fetch overwrites a user's mark or note] → Upsert only provider-owned review columns; verify with a persistence test.
- [Locale changes show annotations from another locale] → Validate and query the complete review key for reads and writes.
- [Long marked lists become slow] → Index marked lookups by app and locale; paginate later if real usage requires it.
- [An unsaved note is lost while switching tabs] → Use explicit Save and show an unsaved-change state or retain the draft until the tab is revisited.

## Migration Plan

Run a new additive migration on startup. Existing reviews start unmarked with no note. Rollback to the previous application version remains possible because it ignores the added columns; reversing the schema or recovering annotations requires restoring a database backup.

## Open Questions

None blocking. The default marked-list order is most recently marked first.
