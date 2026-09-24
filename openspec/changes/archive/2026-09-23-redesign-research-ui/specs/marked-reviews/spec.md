## ADDED Requirements

### Requirement: Focus marked-review evidence
The Marked reviews view SHALL use the same readable review and note-editing pattern as saved reviews, while preserving mark state, local pagination, and the ability to unmark a review.

#### Scenario: Review has a saved note
- **WHEN** a marked review has a saved note
- **THEN** the note is visible or clearly discoverable and remains editable without a provider request

#### Scenario: Unmark review
- **WHEN** the user unmarks a review
- **THEN** the view updates its local count and page state according to the existing marked-review behavior
