## 1. Shared workspace

- [x] 1.1 Define dark color, type, spacing, surface, control, and focus tokens in the client stylesheet based on the supplied reference.
- [x] 1.2 Build the responsive app shell with labeled Dashboard, Apps, Games, and Shortlist navigation, active states, page context, and locale controls.
- [x] 1.3 Apply consistent button, input, tab, badge, empty, loading, error, and fetch-preview styles with keyboard focus and readable contrast.

## 2. Dashboard and discovery

- [x] 2.1 Rework the dashboard hierarchy around discovery actions, real dataset counts, quota freshness, recent activity, and candidate links; verify empty and unavailable states.
- [x] 2.2 Rework Apps and Games discovery controls and saved-run header so source, locale, observed time, freshness, and result count are clear.
- [x] 2.3 Build a compact comparison view with visible key fields, local filter/sort, shortlist action, and reachable secondary saved fields while preserving unknown and rank semantics.
- [x] 2.4 Preserve selected run, mode, local filter/sort, and result position when opening an app and returning; verify this makes no provider request.
- [x] 2.5 Provide a narrow-screen result layout that remains readable without horizontal page scrolling.

## 3. App investigation

- [x] 3.1 Rework the app header and overview to prioritize identity, shortlist state, key facts, source freshness, and the explicit detail-fetch preview.
- [x] 3.2 Group secondary metadata, full description, screenshots, related results, and history so all saved fields remain accessible without dominating the initial view.
- [x] 3.3 Give research notes an identifiable section with explicit save and visible unsaved state; confirm saved values appear in the shortlist.

## 4. Reviews and shortlist

- [x] 4.1 Separate review source-fetch controls and cost preview from local saved-review filters, coverage, pagination, and export.
- [x] 4.2 Render saved and marked reviews at a bounded reading width with compact mark state and on-demand note editing, preserving explicit saves and unsaved feedback.
- [x] 4.3 Rework shortlist candidates into compact summaries with observed evidence, notes, missing-evidence cues, and navigation to app research.

## 5. Verification

- [x] 5.1 Run the client build and existing relevant tests; fix regressions caused by the redesign.
- [x] 5.2 Inspect dashboard, Apps/Games, detail, Reviews, Marked reviews, and Shortlist at desktop and narrow widths, including keyboard focus, contrast, overflow, empty states, and long content.
- [x] 5.3 Verify fetch previews still precede billable actions and that local navigation, filtering, sorting, pagination, marking, and note editing do not trigger provider requests.
