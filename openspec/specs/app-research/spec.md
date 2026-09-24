# app-research Specification

## Purpose
TBD - created by archiving change play-store-miner-mvp. Update Purpose after archive.
## Requirements
### Requirement: Inspect a saved app without implicit spending
The system SHALL open an app detail view from locally saved information without issuing a provider request.

#### Scenario: App opened from discovery
- **WHEN** the user opens an app that has only listing data
- **THEN** the view shows that data, marks unavailable detail fields unknown, and offers an explicit detail fetch with a request preview

### Requirement: Enrich an app on request
The system SHALL support an explicit product-detail fetch and persist available metadata, description, screenshots, category, update date, rating distribution, monetization labels, and related-result groups.

#### Scenario: Successful detail fetch
- **WHEN** the user requests detail enrichment and the budget guard permits it
- **THEN** the backend saves the normalized detail and source observation and the UI displays the fetched time and locale

#### Scenario: Related result grouping
- **WHEN** the provider returns similar or related apps in named groups
- **THEN** the UI preserves those group labels and does not claim every returned app is a direct competitor

### Requirement: Preserve uncertainty in pricing and demand fields
The system SHALL distinguish a listed purchase price, an IAP indicator, an IAP price range, and unknown subscription pricing. It SHALL preserve the original install-band text and SHALL NOT present it as an exact install count or revenue estimate.

#### Scenario: IAP range is returned
- **WHEN** a product response contains an IAP range but no subscription plan price
- **THEN** the app detail shows the range as observed and leaves subscription pricing unknown

#### Scenario: Download threshold is returned
- **WHEN** a product response says `10,000+` downloads
- **THEN** the app detail shows `10,000+` as a threshold and does not display 10,000 as an exact total

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

### Requirement: Prioritize app research evidence
The app page SHALL lead with app identity, shortlist state, key observed facts, and their source freshness, while grouping secondary metadata and long description in clearly labeled sections. All saved product and listing fields SHALL remain accessible.

#### Scenario: Listing-only app
- **WHEN** an app has listing data but no saved product detail
- **THEN** its known listing facts are shown, missing detail is identified, and an explicit previewed detail fetch is available

#### Scenario: Long product description
- **WHEN** a saved product has a long description
- **THEN** the initial view remains scannable and the full description can be opened without truncating stored content

### Requirement: Keep research notes within investigation flow
The app page SHALL provide an identifiable research-notes section for the existing wedge, improvement, pricing, and complaint notes, with explicit saving and visible saved or unsaved state.

#### Scenario: Edit a candidate note
- **WHEN** the user edits a research note
- **THEN** the interface identifies the unsaved change and saves it only after the user activates Save
