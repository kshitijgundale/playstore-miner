## Why

Researchers can collect and annotate reviews for an app, but cannot take that saved evidence into a spreadsheet or another analysis tool. An app-level CSV export makes the collected sample usable outside Play Store Miner without spending provider quota.

## What Changes

- Add a CSV export control to each app's Reviews tab with a choice between all saved reviews and reviews matching the current saved star filter and sort.
- Export every matching saved review for the selected app, country, and language, including rows beyond the 1,000-review browsing limit.
- Include review fields, marked status, and saved notes in the CSV; export uses local data and makes no provider request.
- Keep review browsing pagination outside this change.

## Capabilities

### New Capabilities

- `review-export`: Download saved reviews for one app and locale as a CSV, with all-saved and current-filter scopes.

### Modified Capabilities

None.

## Impact

- App Reviews tab in `client/src/main.jsx` and its download handling.
- A local-data export route in `server/src/routes/api.js`, with CSV generation and request validation.
- Server tests for export scope, locale isolation, complete result sets, and CSV content.
- No database migration, provider integration, or new package dependency is expected.
