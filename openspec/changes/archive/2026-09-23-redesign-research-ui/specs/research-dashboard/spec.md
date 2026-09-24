## ADDED Requirements

### Requirement: Resume research from the dashboard
The dashboard SHALL present a clear route into Apps and Games discovery, a compact quota summary with freshness, recent fetch outcomes, and recent shortlisted candidates in a scannable hierarchy.

#### Scenario: Existing research data
- **WHEN** saved runs and shortlisted apps exist
- **THEN** the dashboard shows navigable recent candidates and activity with concise labels and observed times

#### Scenario: No research data
- **WHEN** the local database is empty
- **THEN** the dashboard presents an obvious discovery action and does not show empty decorative panels
