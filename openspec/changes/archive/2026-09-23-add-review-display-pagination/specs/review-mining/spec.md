## ADDED Requirements

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
