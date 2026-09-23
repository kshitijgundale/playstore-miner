## 1. Local CSV export

- [x] 1.1 Add and validate the app review export route's package ID, locale, scope, star filter, and sort parameters.
- [x] 1.2 Query all matching saved rows without the browsing limit, apply deterministic ordering, and stream a CSV with the specified columns, escaping, attachment headers, and header-only empty result.

## 2. Reviews tab download

- [x] 2.1 Add All saved reviews and Current filter choices beside a Download CSV action on the Reviews tab.
- [x] 2.2 Request the CSV for the current app and locale, pass star filter and sort for Current filter, start the browser download, and show busy or error feedback.

## 3. Verification

- [x] 3.1 Add server tests for both scopes, selected sort, locale isolation, rows beyond 1,000, empty results, annotations, CSV escaping and formula neutralization, invalid requests, and no provider calls.
- [x] 3.2 Run the relevant test suite and client build; verify the download control against the spec.
