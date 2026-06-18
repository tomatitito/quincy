---
id: qui-f6uk
status: open
deps: [qui-qypz, qui-h9oi]
links: []
created: 2026-06-18T20:31:03Z
type: task
priority: 1
assignee: Jens Kouros
parent: qui-jdu6
tags: [kanban, epics, filters, behavior]
---
# Apply epic and status filters to Kanban view

Use the shared epic filter state to change which cards are rendered in the Kanban board.

## Design

For selected epic(s), keep the selected epic visible but visually subtle and show the full tree of tickets belonging to it. Use tk status semantics for open versus closed. Verify how tk represents epic membership before implementing.

## Acceptance Criteria

Epics only shows only epic cards/items. Selected epic(s) shows selected epic(s) plus the full tree of tickets belonging to them. Open only excludes closed tickets according to tk status semantics. Open + closed includes closed tickets. Existing backlog/open/in_progress/closed placement rules still work for visible tickets. bun run sensors all passes.

