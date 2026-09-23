## MODIFIED Requirements

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

## ADDED Requirements

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
