## ADDED Requirements

### Requirement: Separate review collection from saved analysis
The Reviews view SHALL distinguish the source fetch form and cost preview from local saved-review filters, coverage, pagination, and export. The interface SHALL not imply that changing local controls incurs a provider request.

#### Scenario: Filter saved reviews
- **WHEN** the user changes the saved star filter or sort order
- **THEN** the local results update with no provider request and the source fetch settings remain unchanged

#### Scenario: Preview review fetch
- **WHEN** the user previews a review fetch
- **THEN** the possible search cost and next action are clear before execution

### Requirement: Read and annotate reviews without persistent clutter
Saved reviews SHALL use a bounded reading width, show rating and mark state, and reveal an editable note area on request or when a saved note exists. Note saving SHALL remain explicit, with visible unsaved-change feedback.

#### Scenario: Browse unannotated reviews
- **WHEN** the user views saved reviews without notes
- **THEN** each review remains readable without an empty note editor occupying persistent space

#### Scenario: Edit a review note
- **WHEN** the user opens a note editor and changes its text
- **THEN** the change is identified as unsaved until explicitly saved
