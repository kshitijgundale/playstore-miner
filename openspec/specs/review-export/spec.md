# review-export Specification

## Purpose

Export locally saved app reviews as a safe CSV for further research.

## Requirements

### Requirement: Choose the scope of an app review CSV export
The system SHALL offer All saved reviews and Current filter export choices on each app's Reviews tab. Current filter SHALL use the selected saved star filter and sort, while All saved reviews SHALL include every saved star rating and use newest-first order.

#### Scenario: Export all saved reviews
- **WHEN** the user selects All saved reviews and downloads the CSV for an app
- **THEN** the file contains every saved review for that app and selected country and language, regardless of the current star filter or the 1,000-row browsing limit

#### Scenario: Export current filter
- **WHEN** the user selects Current filter with a saved star filter and sort and downloads the CSV
- **THEN** the file contains every saved review matching that star filter for the current app and locale in the selected sort order, including matching rows beyond the browsing limit

#### Scenario: No saved reviews
- **WHEN** the user exports an app and locale with no matching saved reviews
- **THEN** the downloaded CSV contains its column header and no review rows

### Requirement: Produce a usable and safe review CSV
The system SHALL export a UTF-8 CSV containing the app and locale, review ID, rating, body, likes, review date, first fetch time, last seen time, marked time, and saved note for each selected review. It SHALL preserve multiline text and CSV quoting, represent missing values as empty fields, and prevent text fields from being interpreted as spreadsheet formulas.

#### Scenario: Annotated review
- **WHEN** a selected review is marked and has a saved note
- **THEN** its CSV row includes the marked time and note

#### Scenario: Special characters in review text
- **WHEN** a review body or note contains commas, quotes, line breaks, Unicode, or formula-leading text
- **THEN** the downloaded CSV remains parseable and the formula-leading text is neutralized for spreadsheet use

### Requirement: Export only local saved evidence
The system SHALL generate the CSV from locally stored reviews and SHALL NOT make a provider request or consume provider quota for export.

#### Scenario: Download after collection
- **WHEN** the user downloads saved reviews
- **THEN** the download completes using local data without starting a review fetch or quota preview

#### Scenario: Invalid export request
- **WHEN** an export request has an invalid package ID, locale, scope, star filter, or sort
- **THEN** the server rejects it without producing a CSV or changing stored reviews
