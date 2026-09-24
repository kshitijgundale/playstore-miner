## MODIFIED Requirements

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

## ADDED Requirements

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
