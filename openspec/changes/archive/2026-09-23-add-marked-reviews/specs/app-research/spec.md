## ADDED Requirements

### Requirement: Navigate app research from the app header
The system SHALL display Overview, Reviews, and Marked reviews tabs near the top of each app page and show the selected section without leaving the app. The tabs SHALL identify the active section and be operable by keyboard.

#### Scenario: Open an app
- **WHEN** the user opens an app from a discovery, dashboard, or shortlist view
- **THEN** the app page opens on Overview with the tab bar visible below its header

#### Scenario: Select reviews
- **WHEN** the user selects the Reviews tab
- **THEN** the app page shows saved review browsing and the existing explicit review-fetch controls for that app

#### Scenario: Select marked reviews
- **WHEN** the user selects the Marked reviews tab
- **THEN** the app page shows marked saved reviews for that app and selected locale without fetching from the provider

#### Scenario: Open another app
- **WHEN** the app page switches to a different app
- **THEN** the selected tab resets to Overview and no previous app's reviews are shown
