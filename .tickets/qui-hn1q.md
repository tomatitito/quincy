---
id: qui-hn1q
status: open
deps: [qui-qypz]
links: []
created: 2026-06-18T20:31:03Z
type: task
priority: 1
assignee: Jens Kouros
parent: qui-jdu6
tags: [graph, ui, epics, filters]
---
# Add graph epic filter controls wired to state

Add epic and status filter controls in the graph view next to the existing graph layout direction control. This ticket only wires controls to shared persisted state; it does not change graph contents yet.

## Design

Expose controls for scope: all tickets, epics only, selected epic(s). Expose status visibility: open only, open + closed. Show an epic multi-select when selected epic(s) is active. Keep controls usable on narrow/mobile viewports.

## Acceptance Criteria

Graph controls allow changing scope, selected epic(s), and status visibility. Changes update the shared persisted filter state immediately. Reload restores the selected control values. Graph contents do not need to change in this ticket. Existing graph layout direction control still works. bun run sensors all passes.

