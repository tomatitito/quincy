---
id: qui-jdu6
status: open
deps: []
links: []
created: 2026-06-18T20:31:03Z
type: epic
priority: 1
assignee: Jens Kouros
tags: [ui, kanban, graph, epics, filters]
---
# Epic-aware Kanban and graph filtering

Add epic-aware filtering to the Kanban board and graph views. Users should be able to view epics only, select one or more epics and view the selected epic trees, toggle open-only versus open-and-closed items, and keep the selection shared and persisted across views.

## Design

Treat tickets with type=epic as epics. Verify the tk relationship model before implementing filtering, especially whether tickets can belong to one or multiple epics. Prefer small vertical slices: shared state first, UI controls wired to state next, behavior last. New UI must be designed with responsive/mobile use in mind and must not worsen narrow viewport usability.

## Acceptance Criteria

Kanban and graph views support these shared scopes: all tickets, epics only, and selected epic(s). Users can select one or more epics and see the selected epic(s) plus the full tree of tickets belonging to them. Users can choose open only or open + closed using tk status semantics. Filter choices are shared between Kanban and graph views and persist across reload/navigation. The graph critical path option and related logic are removed. Changes are delivered as small reviewable commits. bun run sensors all passes.

