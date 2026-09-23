## 1. Persist review annotations

- [x] 1.1 Add an ordered SQLite migration for nullable mark timestamp and note columns on saved reviews, plus an app/locale marked-review lookup index.
- [x] 1.2 Implement locale-scoped mark and note updates with validation, explicit note clearing, retained notes on unmark, and an error for missing reviews.
- [x] 1.3 Expose annotation fields in saved-review responses and add a local marked-review list endpoint independent of the ordinary browse limit.

## 2. Build the app-page experience

- [x] 2.1 Add accessible Overview, Reviews, and Marked reviews tabs below the app header; move existing sections into the appropriate views and reset to Overview for another app.
- [x] 2.2 Add Mark/Unmark and inline note editing to saved review rows, including save progress, error feedback, and protection for unsaved drafts when changing tabs.
- [x] 2.3 Build the current app's Marked reviews view with review context, note editing, unmarking, and an empty state; refresh its local data after annotation changes.
- [x] 2.4 Style the tab bar and review actions for desktop and narrow screens.

## 3. Verify the change

- [x] 3.1 Add API and storage tests for mark/note lifecycle, invalid requests, locale isolation, marked reviews beyond the ordinary browse limit, and repeated provider upserts.
- [x] 3.2 Verify app-page tab navigation and annotation interactions, then run the existing build and test commands.
