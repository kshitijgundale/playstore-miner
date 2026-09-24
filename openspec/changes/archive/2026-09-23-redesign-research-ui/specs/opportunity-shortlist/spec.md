## ADDED Requirements

### Requirement: Scan shortlisted candidates as research summaries
The Shortlist view SHALL present each candidate's identity, observed evidence, saved research notes, and evidence gaps in a compact, navigable summary without assigning an opportunity score.

#### Scenario: Candidate with notes and reviews
- **WHEN** a shortlisted app has saved research notes and reviews
- **THEN** the summary makes those notes and review evidence easy to locate and opens the app's research view

#### Scenario: Sparse candidate
- **WHEN** a shortlisted app has no product detail or saved reviews
- **THEN** the summary identifies the missing evidence without repeating unknown values as a wall of metadata
