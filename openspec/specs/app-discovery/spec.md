# app-discovery Specification

## Purpose
TBD - created by archiving change play-store-miner-mvp. Update Purpose after archive.
## Requirements
### Requirement: Explore a category chart
The system SHALL let the user select Apps or Games, a country, a supported category for that source, and a Top Free, Top Paid, or Top Grossing chart and obtain a saved result set. Category charts SHALL be the default discovery view in each source tab.

#### Scenario: First chart request
- **WHEN** the user requests a source/country/category/chart combination with no sufficiently fresh local run and the budget guard allows one request
- **THEN** the backend fetches that chart through the source's provider engine, persists the run and returned apps, and displays them with fetch time and source

#### Scenario: Fresh chart revisited
- **WHEN** the user requests a chart whose local run for the same source, locale, category, and chart is within its freshness period without choosing refresh
- **THEN** the system returns the saved run without a Play Store provider request

#### Scenario: Category belongs to another source
- **WHEN** a Games category is submitted for Apps, or an Apps category is submitted for Games
- **THEN** the system rejects the request before a provider call

### Requirement: Search by keyword
The system SHALL let the user search Google Play from either the Apps or Games tab by keyword and save the returned result groups and apps for reuse. The system SHALL identify the selected discovery source without claiming that Games keyword results contain only games.

#### Scenario: Keyword result
- **WHEN** the user submits a non-empty keyword, source, and country with no fresh matching result
- **THEN** the system saves the provider result, including its source and each item's section and display position

#### Scenario: Repeated keyword
- **WHEN** the same normalized keyword, source, and locale have a fresh saved result
- **THEN** the system displays that result without a new provider request

#### Scenario: Same keyword in the other tab
- **WHEN** a keyword has a fresh Apps run but no Games run for the same locale
- **THEN** a Games search is treated as a separate request with its own quota preview and saved run

### Requirement: Navigate separate Apps and Games discovery tabs
The system SHALL show Apps and Games as separate top-level discovery tabs. Each tab SHALL provide the existing category-chart and keyword-search workflows, with category charts shown first and saved runs limited to the selected source. Opening a discovered product SHALL continue to use the shared app detail, review, and shortlist workflows.

#### Scenario: Open Games tab
- **WHEN** the user selects Games
- **THEN** the category chart controls show Games categories and the tab's saved Games runs, with Search available in that tab

#### Scenario: Switch back to Apps
- **WHEN** the user returns from Games to Apps
- **THEN** the app categories and saved Apps runs appear without mixing in Games runs

#### Scenario: Existing saved discovery data
- **WHEN** a database created before Games support is opened after migration
- **THEN** its saved discovery runs remain available in Apps with their items and observations intact

### Requirement: Honest and useful discovery table
The system SHALL show available rank, icon, name, developer, category, rating, reported count, install band, paid price, ads, IAP, and update information in a locally sortable and filterable comparison view. The primary view SHALL emphasize app identity, rating, installs, price, and shortlist action, while keeping every other saved listing field reachable through labeled expansion or an equivalent detail view. Fields not returned for an item SHALL be shown as unknown rather than inferred.

#### Scenario: Chart result order
- **WHEN** an item came from a chart response
- **THEN** its rank is its position in that specific saved chart run

#### Scenario: Keyword result order
- **WHEN** an item came from a keyword response
- **THEN** the UI identifies its position as result order and does not label it chart rank

#### Scenario: Missing monetization field
- **WHEN** the listing response has no ad, IAP, or price field for an app
- **THEN** the available comparison or expanded view shows unknown rather than assuming no ads, no IAP, or free

#### Scenario: Inspect secondary listing fields
- **WHEN** the user opens an item's secondary fields
- **THEN** developer, category, reported count, ads, IAP, update information, and other saved listing values remain available without a provider request

### Requirement: Preserve screening context
The client SHALL retain the selected Apps or Games source, discovery mode, selected saved run, local filter, sort, and result position while the user opens an app and returns to discovery.

#### Scenario: Return from app detail
- **WHEN** the user opens an app from a filtered saved run and returns
- **THEN** the same run, filter, sort, and result position are restored without another provider request

### Requirement: Explain active result provenance
The discovery view SHALL identify the active run's source, locale, observed time, freshness, and result count near its results.

#### Scenario: Open an older saved run
- **WHEN** the user selects an older run
- **THEN** the result header identifies that run and its observation time without implying it is current live data
