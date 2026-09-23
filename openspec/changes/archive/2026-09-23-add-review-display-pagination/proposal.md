## Why

Saved reviews currently render as one long list, and the ordinary review endpoint silently stops at 1,000 rows even when more are stored. Paging the two review views will make large collections usable and make every saved review reachable without changing how reviews are fetched from Google Play.

## What Changes

- Add display pagination to the Reviews and Marked reviews tabs, with a user-selectable page size defaulting to 100.
- Page and count reviews from local storage after applying the selected view's filters and sort order; remove the ordinary review endpoint's 1,000-row browse cutoff.
- Show the current result range and page navigation, and keep the existing source fetch controls separate from display pagination.
- **BREAKING**: Change the local saved-review browse responses to include paginated rows and pagination metadata; callers that assume the Marked reviews endpoint returns a bare array must adapt.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `review-mining`: Browse every saved review through local display pages with a configurable page size.
- `marked-reviews`: Browse every marked review through local display pages while preserving mark and note actions.

## Impact

- React review views and their local state, saved-review GET endpoints and SQL queries, and API tests.
- CSV export and provider fetch/preview behavior remain as currently specified.
