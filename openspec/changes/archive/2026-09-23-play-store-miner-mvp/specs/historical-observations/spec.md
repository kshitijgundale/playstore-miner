## ADDED Requirements

### Requirement: Save actual source observations
The system SHALL append a historical observation only for a new provider source observation, with source, locale, and observed time. Opening local data or receiving the same cached source response SHALL NOT create another observation.

#### Scenario: Same SerpApi result reused
- **WHEN** a refresh returns the same source request ID as a saved result
- **THEN** no duplicate app metric snapshot or chart run is recorded as a new observation

#### Scenario: New chart scan
- **WHEN** a later chart scan returns a new source observation
- **THEN** the system persists that chart's membership and ranks separately from previous runs

### Requirement: Compare like with like
The system SHALL compare rank only across the same country, language, category, and chart. It SHALL compare metric series only across compatible locale and source fields.

#### Scenario: App appears in two countries
- **WHEN** an app has rank observations from US and IN charts
- **THEN** the rank chart keeps those series separate

#### Scenario: Search result exists
- **WHEN** an app appears only in keyword search results
- **THEN** it has no chart-rank history from that result

### Requirement: Show only supported historical claims
The system SHALL chart actual observations and display their dates. It SHALL show insufficient history until two comparable points exist, and SHALL treat install bands as thresholds rather than exact installations.

#### Scenario: Single observation
- **WHEN** an app has one comparable metric observation
- **THEN** the view shows the observed value and date but no growth claim or line between invented dates

#### Scenario: Install band changes
- **WHEN** an app moves from `10,000+` to `50,000+` across actual observations
- **THEN** the view shows the threshold change and does not claim exactly 40,000 new installs

