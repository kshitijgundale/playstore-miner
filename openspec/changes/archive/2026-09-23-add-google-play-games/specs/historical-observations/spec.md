## MODIFIED Requirements

### Requirement: Compare like with like
The system SHALL compare rank only across the same discovery source, country, language, category, and chart. It SHALL compare metric series only across compatible locale and source fields.

#### Scenario: App appears in two countries
- **WHEN** an app has rank observations from US and IN charts
- **THEN** the rank chart keeps those series separate

#### Scenario: Product appears in Apps and Games charts
- **WHEN** a product has rank observations from Apps and Games charts
- **THEN** the rank chart keeps those series separate and identifies their discovery source

#### Scenario: Search result exists
- **WHEN** an app appears only in keyword search results
- **THEN** it has no chart-rank history from that result
