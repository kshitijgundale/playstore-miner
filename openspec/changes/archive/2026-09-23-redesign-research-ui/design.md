## Context

The React client currently keeps most screens and state in `main.jsx` and uses a compact global stylesheet. The screenshots show a wide, bright interface with many equal-weight bordered panels, a twelve-column discovery table, persistent note editors, and long ungrouped detail text. The reference image establishes a dark navy workspace with a compact icon rail, soft layered surfaces, understated blue lighting, and restrained controls. This is a local, single-user research app; fetch previews, saved evidence provenance, unknown values, and quota safety must remain clear.

## Goals / Non-Goals

**Goals:**
- Deliver a coherent dark UI across all existing screens, with responsive, keyboard-accessible navigation.
- Support fast comparison in discovery and sustained investigation in app detail without losing context between them.
- Reduce visual clutter through hierarchy and progressive disclosure while preserving access to saved facts and actions.
- Keep explicit request previews and clearly separate provider fetch controls from local data browsing.

**Non-Goals:**
- No new analytics, generated opportunity score, AI assistant, or decorative chart populated with invented data.
- No changes to provider behavior, quota enforcement, database schema, or API contracts unless an existing response lacks data needed for the stated UI.
- No requirement to reproduce the reference's finance-specific widgets, imagery, branding, or account features.

## Decisions

### Shared shell and tokens
Create one workspace shell with a persistent left navigation rail on desktop, a compact labeled navigation pattern on narrow screens, and a top utility area for page context and locale. Use a small token set for dark background, raised surfaces, subtle outlines, text hierarchy, blue accents, spacing, and focus rings. The icon rail will have accessible names and a clearly visible selected state. Prefer CSS and simple inline/vector icons already available in the codebase over a new component library or decorative assets; this keeps the redesign consistent and lightweight.

### Discovery as a comparison surface
Keep Apps and Games as separate destinations. Put chart/search mode and fetch controls in a compact, clearly grouped control area. Above results, show the active saved run, source, locale, observed time, freshness, and result count. Keep key comparison fields visible in the primary table; expose remaining listing fields through an expandable row or equivalent on-demand detail. Preserve sorting and filtering against local data, rank semantics, and explicit unknown values. Preserve run selection, filter, sort, and scroll position when entering an app and returning. A separate mobile layout can show each result as a compact item instead of forcing a desktop-width table into the viewport.

### Research as a focused workspace
Lead app detail with identity, shortlist state, key observed facts, and provenance. Keep Overview, Reviews, and Marked reviews as keyboard-accessible sections. Group secondary metadata and long description behind clearly named expandable sections. Keep research notes easy to find and edit. Use the same data values and uncertainty labels as today; hiding a field in a collapsed group must not turn unknown into an inferred value.

### Reviews and fetch costs
Separate the provider fetch form and preview from local review filters, pagination, and export. Show saved sample count and coverage with concise labels, and preserve the distinction from product rating distribution. Render review text at a bounded reading width. Show mark state immediately; reveal the note editor on request or when a note exists, while keeping explicit Save note behavior and unsaved-change feedback. Reuse this pattern for Marked reviews. Keep the existing two-step preview and quota guard for all billable actions, but present the possible cost and next action in a compact, readable confirmation surface.

### Shortlist and dashboard
The shortlist becomes a candidate overview: identity, strongest observed evidence, saved notes, marked-review or saved-review context where available, and clear missing-evidence states. Dashboard uses real counts, quota status, recent activity, and candidate links, with a prominent route back into discovery. Neither screen computes or implies an opportunity score.

## Risks / Trade-offs

- Dark low-contrast surfaces can harm readability → define contrast targets, visible focus states, and verify text, controls, status colors, and disabled states on every screen.
- Progressive disclosure can hide data needed for screening → keep key comparison fields visible, label expansion clearly, and verify all existing listing/detail fields remain reachable.
- Restoring discovery context can conflict with current component mounting and page state → preserve the existing mounted discovery views and explicitly restore the selected run, filter, sort, and scroll position after detail navigation.
- A dense table can still overflow on smaller screens → provide a responsive compact result presentation and test narrow widths.
- Existing API data may not include marked-review totals on shortlist → show only counts already available or compute from local endpoints; do not invent coverage.

## Migration Plan

Implement the shared shell and tokens first, then migrate dashboard, discovery, app detail, reviews, and shortlist in stages. Preserve existing API contracts and stored data. Rollback is a client-only revert because no database migration is planned.

## Open Questions

None blocking. Use the supplied image as a visual reference for color, layering, and density; adapt layout and content to the research workflows above.
