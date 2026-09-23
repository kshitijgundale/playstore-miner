# research-dashboard Specification

## Purpose
TBD - created by archiving change play-store-miner-mvp. Update Purpose after archive.
## Requirements
### Requirement: Summarize the local research dataset
The dashboard SHALL show distinct apps discovered, apps with saved product details, distinct reviews stored, distinct country/category combinations scanned, recent mining activity, and shortlisted apps.

#### Scenario: Initial empty database
- **WHEN** no scans or app details have been saved
- **THEN** the dashboard shows zero local counts and a clear path to scan a category or search

#### Scenario: Repeated discovery
- **WHEN** the same app appears in more than one saved run
- **THEN** the discovered-app count includes it once

### Requirement: Surface quota status
The dashboard SHALL show the latest available monthly SerpApi limit, used, remaining, and renewal date, along with when account status was checked.

#### Scenario: Account API unavailable
- **WHEN** quota status cannot be refreshed
- **THEN** the dashboard labels the displayed account data as stale or unavailable and does not invent current remaining searches

### Requirement: Surface recent activity and candidates
The dashboard SHALL show recent fetch outcomes and a compact shortlist ordered by recent user activity.

#### Scenario: Recent failed fetch
- **WHEN** a provider request fails
- **THEN** recent activity shows the failed attempt and does not increment saved-result counts

