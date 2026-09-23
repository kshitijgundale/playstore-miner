## ADDED Requirements

### Requirement: Explore a category chart
The system SHALL let the user select a country, supported Play Store app category, and Top Free, Top Paid, or Top Grossing chart and obtain a saved result set.

#### Scenario: First chart request
- **WHEN** the user requests a country/category/chart combination with no sufficiently fresh local run and the budget guard allows one request
- **THEN** the backend fetches that chart through the provider, persists the run and returned apps, and displays them with fetch time and source

#### Scenario: Fresh chart revisited
- **WHEN** the user requests a chart whose local run is within its freshness period without choosing refresh
- **THEN** the system returns the saved run without a Play Store provider request

### Requirement: Search by keyword
The system SHALL let the user search Google Play apps by keyword and save the returned result groups and apps for reuse.

#### Scenario: Keyword result
- **WHEN** the user submits a non-empty keyword and country with no fresh matching result
- **THEN** the system saves the provider result, including each item's section and display position

#### Scenario: Repeated keyword
- **WHEN** the same normalized keyword and locale have a fresh saved result
- **THEN** the system displays that result without a new provider request

### Requirement: Honest and useful discovery table
The system SHALL show available rank, icon, name, developer, category, rating, reported count, install band, paid price, ads, IAP, and update information in a locally sortable and filterable table. Fields not returned for an item SHALL be shown as unknown.

#### Scenario: Chart result order
- **WHEN** an item came from a chart response
- **THEN** its rank is its position in that specific saved chart run

#### Scenario: Keyword result order
- **WHEN** an item came from a keyword response
- **THEN** the UI identifies its position as result order and does not label it chart rank

#### Scenario: Missing monetization field
- **WHEN** the listing response has no ad, IAP, or price field for an app
- **THEN** the table shows unknown rather than assuming no ads, no IAP, or free

