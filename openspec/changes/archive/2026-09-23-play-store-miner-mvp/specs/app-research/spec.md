## ADDED Requirements

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

