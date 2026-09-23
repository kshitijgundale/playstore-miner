# review-mining Specification

## Purpose
TBD - created by archiving change play-store-miner-mvp. Update Purpose after archive.
## Requirements
### Requirement: Fetch reviews only through a visible action
The system SHALL request reviews only when the user starts a bounded fetch for an app. Shortlisting alone SHALL NOT start a provider request.

#### Scenario: Default negative-review fetch
- **WHEN** the user chooses a 1-star, most-relevant review fetch with default settings
- **THEN** the system previews at most one possible search and requests up to 199 reviews on one page

#### Scenario: Multi-page review fetch
- **WHEN** the user explicitly selects multiple pages
- **THEN** the system previews the selected maximum, fetches at most three pages, and stops early when no next-page token exists

### Requirement: Reuse and deduplicate collected reviews
The system SHALL persist review IDs and text locally, merge repeated IDs, and let the user browse saved reviews without another provider request.

#### Scenario: Repeated review appears
- **WHEN** a later source page contains a review ID already saved for the app and locale
- **THEN** the existing review is updated or retained without creating a duplicate

#### Scenario: Local review filters
- **WHEN** the user changes star, newest, or helpful sorting in the saved-review view
- **THEN** the system applies the filter to local data without a provider request

### Requirement: State review collection coverage
The system SHALL display stored review count, fetched source filters and sorts, fetch times, and page counts. It SHALL distinguish a distribution of saved reviews from a product-level rating distribution.

#### Scenario: One-star sample only
- **WHEN** only one-star reviews have been fetched
- **THEN** the UI labels the local distribution as a one-star sample and does not imply it represents all reviews

