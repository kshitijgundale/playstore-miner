## ADDED Requirements

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
