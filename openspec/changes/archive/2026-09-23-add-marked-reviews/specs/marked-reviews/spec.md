## ADDED Requirements

### Requirement: Mark saved reviews per app and locale
The system SHALL let a user mark or unmark a saved review for the current app, country, and language without a provider request. It SHALL persist the mark across page reloads and repeated review fetches.

#### Scenario: Mark a saved review
- **WHEN** the user marks a saved review in the Reviews tab
- **THEN** that review appears in the current app's Marked reviews tab and remains marked after a reload

#### Scenario: Unmark a saved review
- **WHEN** the user unmarks a review
- **THEN** the review disappears from the Marked reviews tab and remains available among saved reviews

#### Scenario: Repeat provider fetch
- **WHEN** a later review fetch returns an already marked review ID
- **THEN** the system updates provider review fields without clearing the review's mark or note

#### Scenario: Locale isolation
- **WHEN** the same review ID is stored for the app in another country or language
- **THEN** marking the review in one locale does not mark or annotate the other locale's review

### Requirement: Add and edit a note for a saved review
The system SHALL allow an optional, editable note on a saved review. It SHALL save a note only after an explicit user action, allow an empty note to clear it, and retain a note when the review is unmarked and later marked again.

#### Scenario: Add a note while marking
- **WHEN** the user marks a saved review and saves a note
- **THEN** the note appears with that review in the Marked reviews tab and persists after a reload

#### Scenario: Edit or clear a note
- **WHEN** the user saves changed or empty note text on a review
- **THEN** the stored note matches the saved text in both review views

#### Scenario: Re-mark after unmarking
- **WHEN** a review with a saved note is unmarked and later marked again
- **THEN** its prior note is available again

#### Scenario: Invalid annotation request
- **WHEN** an annotation request references a review absent from the selected app and locale, supplies invalid types, or exceeds the note length limit
- **THEN** the system rejects the request without changing review data

### Requirement: Browse marked reviews independently of the saved-review list
The system SHALL show every marked review for the current app and locale in a separate Marked reviews tab, including its rating, review text, saved note, and controls to edit the note or unmark it. Viewing this tab SHALL use only local data.

#### Scenario: No marked reviews
- **WHEN** the current app and locale have no marked reviews
- **THEN** the Marked reviews tab displays a clear empty state

#### Scenario: Marked review outside ordinary browse limit
- **WHEN** a marked review is outside the ordinary saved-review response limit
- **THEN** it is still available in the Marked reviews tab
