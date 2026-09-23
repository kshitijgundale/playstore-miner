## MODIFIED Requirements

### Requirement: Browse marked reviews independently of the saved-review list
The system SHALL show every marked review for the current app and locale in a separate Marked reviews tab, including its rating, review text, saved note, and controls to edit the note or unmark it. It SHALL display marked reviews in local pages with a user-selectable page size of 25, 50, 100, or 200, defaulting to 100, and show the matching total and current range. Viewing or navigating this tab SHALL use only local data.

#### Scenario: No marked reviews
- **WHEN** the current app and locale have no marked reviews
- **THEN** the Marked reviews tab displays a clear empty state and no enabled page navigation

#### Scenario: Marked review outside ordinary browse limit
- **WHEN** a marked review was beyond the former 1,000-row ordinary browse limit
- **THEN** it is reachable through the Marked reviews tab's local pages

#### Scenario: Navigate marked reviews
- **WHEN** the user moves between marked-review pages or changes reviews per page
- **THEN** the view shows the corresponding marked reviews in deterministic mark-time order without a provider request, returning to page 1 after a page-size change

#### Scenario: Unmark the final review on a page
- **WHEN** the user unmarks the only review on a later marked-review page
- **THEN** the view moves to the nearest remaining page and updates its count and range without a provider request
