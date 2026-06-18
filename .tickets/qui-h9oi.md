---
id: qui-h9oi
status: closed
deps: [qui-qypz]
links: []
created: 2026-06-18T20:31:03Z
type: task
priority: 1
assignee: Jens Kouros
parent: qui-jdu6
tags: [kanban, ui, epics, filters, responsive]
---
# Add Kanban epic filter sidebar wired to state

Add a leftmost Kanban filter area before the backlog column for choosing epic-related filters. This should be a sidebar/filter panel, not a real Kanban status column. This ticket only wires the UI to shared persisted state; it does not change Kanban contents yet.

## Design

The desktop UI can be a left sidebar. On small screens, choose a responsive treatment such as a collapsible drawer or compact top filter area rather than forcing an unusable extra column.

## Acceptance Criteria

The Kanban view provides controls for all tickets, epics only, selecting one or more epics, and open only versus open + closed. Selecting options updates the shared persisted filter state immediately. Reload restores the sidebar selections. The UI is usable on narrow/mobile viewports. Kanban contents do not need to change in this ticket. bun run sensors all passes.

