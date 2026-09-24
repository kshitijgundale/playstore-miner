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

### Requirement: Page the saved-review display
The system SHALL show saved reviews in local display pages for the selected app and locale, with a user-selectable page size of 25, 50, 100, or 200 and a default of 100. It SHALL apply the selected star filter and saved-review sort before paging, expose the total number of matching saved reviews and current range, and make every matching saved review reachable without a provider request or a fixed browse cutoff. Display pagination SHALL NOT change the source fetch page setting, fetch preview, provider request, or CSV export scope.

#### Scenario: Open saved reviews
- **WHEN** the user opens the Reviews tab for an app and locale with more than 100 saved reviews
- **THEN** the first 100 matching reviews are shown with the range and navigation to later saved reviews, including those beyond the former 1,000-row limit

#### Scenario: Change display page size
- **WHEN** the user selects a different supported reviews-per-page value
- **THEN** the saved-review display returns to page 1 with that many reviews at most and makes no provider request

#### Scenario: Filter or sort saved reviews
- **WHEN** the user changes the saved star filter or sort order while on a later display page
- **THEN** the display returns to page 1 of the filtered and sorted local results and shows their matching count

#### Scenario: Navigate saved reviews
- **WHEN** the user moves to the next or previous display page
- **THEN** the view shows the corresponding saved reviews in deterministic sort order without a provider request

#### Scenario: No matching saved reviews
- **WHEN** no saved reviews match the current app, locale, and star filter
- **THEN** the view shows an empty state and no enabled page navigation

### Requirement: Separate review collection from saved analysis
The Reviews view SHALL distinguish the source fetch form and cost preview from local saved-review filters, coverage, pagination, and export. The interface SHALL not imply that changing local controls incurs a provider request.

#### Scenario: Filter saved reviews
- **WHEN** the user changes the saved star filter or sort order
- **THEN** the local results update with no provider request and the source fetch settings remain unchanged

#### Scenario: Preview review fetch
- **WHEN** the user previews a review fetch
- **THEN** the possible search cost and next action are clear before execution

### Requirement: Read and annotate reviews without persistent clutter
Saved reviews SHALL use a bounded reading width, show rating and mark state, and reveal an editable note area on request or when a saved note exists. Note saving SHALL remain explicit, with visible unsaved-change feedback.

#### Scenario: Browse unannotated reviews
- **WHEN** the user views saved reviews without notes
- **THEN** each review remains readable without an empty note editor occupying persistent space

#### Scenario: Edit a review note
- **WHEN** the user opens a note editor and changes its text
- **THEN** the change is identified as unsaved until explicitly saved
