# opportunity-shortlist Specification

## Purpose
TBD - created by archiving change play-store-miner-mvp. Update Purpose after archive.
## Requirements
### Requirement: Maintain a manual opportunity shortlist
The system SHALL let the user star or unstar saved apps and view all starred apps in one place.

#### Scenario: Star an app
- **WHEN** the user stars an app from a result table or detail view
- **THEN** it appears in the shortlist without any provider request

#### Scenario: Unstar an app
- **WHEN** the user unstars an app
- **THEN** it leaves the shortlist while its saved observations and notes remain available

### Requirement: Record a concrete competing angle
The system SHALL support separate notes for a possible wedge, what to build better, pricing opportunity, and interesting complaints.

#### Scenario: Save research notes
- **WHEN** the user edits and saves these notes
- **THEN** the notes persist locally and appear on the app detail and shortlist views

### Requirement: Keep evidence visible
The shortlist SHALL show observed demand and monetization fields with their dates and unknown states; it SHALL NOT assert a computed opportunity score in v1.

#### Scenario: Sparse candidate
- **WHEN** an app is shortlisted with only a chart listing and no detail or reviews
- **THEN** the shortlist makes the missing detail and review evidence visible

