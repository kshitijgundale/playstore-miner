## Why

The current interface gives equal visual weight to controls, raw metadata, and research evidence. This makes both quick screening and deeper investigation feel clunky, especially in wide tables and long review lists. A cohesive dark research workspace can make the two workflows easier to scan and connect.

## What Changes

- Adopt the supplied dark dashboard reference as the visual direction across Dashboard, Apps, Games, app detail, Reviews, Marked reviews, and Shortlist: deep navy surfaces, restrained blue accents, compact navigation, clear typography, and lighter use of borders.
- Make discovery results easier to compare while retaining access to every saved field and preserving source, rank, freshness, and unknown-value meaning.
- Make app research progressive: lead with identity and key evidence, organize secondary metadata and description, and keep explicit fetch previews before actions that may spend searches.
- Separate review collection controls from browsing saved reviews; make review marking and note editing compact and accessible.
- Turn the shortlist into a concise bridge between screening and investigation, showing notes and evidence gaps without inventing an opportunity score.
- Preserve the user's discovery context when opening an app and returning to results.

## Capabilities

### New Capabilities

- `research-ui-system`: Shared visual language, responsive workspace shell, navigation, and accessible interaction states.

### Modified Capabilities

- `research-dashboard`: Prioritize resume actions, quota context, recent activity, and candidates in a scannable layout.
- `app-discovery`: Support compact comparison, secondary field access, and return to the prior discovery context.
- `app-research`: Organize app summary, evidence, metadata, and research notes for focused investigation.
- `review-mining`: Separate fetching from local review analysis and reduce persistent editing clutter.
- `marked-reviews`: Present marked evidence and note editing in the same compact review pattern.
- `opportunity-shortlist`: Show concise candidate summaries, saved notes, and missing-evidence states.

## Impact

Primarily the React client in `client/src/main.jsx`, `client/src/style.css`, and related components. Server APIs and stored research data should remain compatible. The existing quota preview and guard, local-only browsing, uncertainty labels, and manual shortlist decisions remain authoritative.
