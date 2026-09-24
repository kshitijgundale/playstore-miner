# research-ui-system Specification

## Purpose
Shared visual and interaction requirements for the research workspace.

## Requirements

### Requirement: Consistent research workspace
The client SHALL present Dashboard, Apps, Games, app detail, Reviews, Marked reviews, and Shortlist using a consistent dark navy visual system inspired by the supplied reference, with legible text hierarchy, restrained blue accents, layered surfaces, and consistent controls and spacing.

#### Scenario: Move between research areas
- **WHEN** the user navigates between any two main areas
- **THEN** the navigation, typography, control styling, and active state remain consistent and the current area is identifiable

### Requirement: Responsive and accessible navigation
The client SHALL provide labeled, keyboard-operable navigation and visible focus and selected states at desktop and narrow viewport widths. Content SHALL remain readable and actionable without horizontal page overflow.

#### Scenario: Narrow viewport
- **WHEN** the workspace is viewed on a narrow screen
- **THEN** the main navigation remains usable, controls reflow, and primary content can be read and operated without horizontal page scrolling

#### Scenario: Keyboard navigation
- **WHEN** the user navigates with a keyboard
- **THEN** navigation and action controls expose accessible names and visible focus states

### Requirement: Data-grounded presentation
The redesign SHALL use real saved or account data for quantitative summaries and SHALL preserve explicit provenance and unknown states. It SHALL NOT introduce illustrative metrics that could be mistaken for research evidence.

#### Scenario: No history for a chart
- **WHEN** fewer than two comparable observations exist
- **THEN** the workspace shows an insufficient-history state instead of a decorative trend
