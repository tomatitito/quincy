---
id: qui-0yo5
status: closed
deps: []
links: []
created: 2026-07-09T11:44:13Z
type: bug
priority: 2
assignee: Jens Kouros
tags: [details, ui, scroll]
---
# Make ticket details view scrollable

Detail view for tickets is implemented, but it cannot scroll when content does not fit on screen.

## Acceptance Criteria

Ticket Details panel scrolls when content exceeds viewport. Empty/no-selection states remain visible. Existing layout behavior is preserved. bun run sensors all passes.

