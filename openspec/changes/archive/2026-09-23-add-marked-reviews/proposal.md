## Why

Researchers can save review samples, but cannot identify individual reviews worth revisiting or record why they matter. The app page also puts those reviews far below the app details, making review work harder to resume.

## What Changes

- Add an app-page tab bar near the app title with Overview, Reviews, and Marked reviews views.
- Let users mark or unmark a saved review and add or edit an optional note for that review.
- Show marked reviews and their notes in a dedicated tab for the current app, with access to edit and unmark them.
- Persist review marks and notes locally across page reloads and repeated review fetches, without making provider requests for annotation actions.

## Capabilities

### New Capabilities

- `marked-reviews`: Persist per-review marks and notes and browse them for the current app.

### Modified Capabilities

- `app-research`: Provide top-level tabs within the app page so saved review work is directly accessible.

## Impact

- Client app detail and Review Miner UI in `client/src/main.jsx` and styles in `client/src/style.css`.
- SQLite schema and local review API in `server/src/db/migrations/` and `server/src/routes/api.js`.
- API and persistence tests for annotation lifecycle, locale separation, and repeat fetches. No new external dependency or SerpApi operation.
