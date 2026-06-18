---
id: qui-qypz
status: closed
deps: []
links: []
created: 2026-06-18T20:31:03Z
type: task
priority: 1
assignee: Jens Kouros
parent: qui-jdu6
tags: [ui, state, epics, filters, persistence]
---
# Add shared persisted epic filter state

Introduce the shared filter state that will be used by both Kanban and graph views before wiring any filtering behavior.

## Design

Model scope as all tickets, epics only, or selected epic(s). Model selected epic IDs as a set/list. Model status visibility as open only or open + closed. Persist the state in the same style as other view preferences if one exists.

## Acceptance Criteria

A shared filter state can be read and updated from both graph and Kanban UI code. The state stores scope, selected epic IDs, and status visibility. The state persists across reload/navigation. Existing Kanban and graph rendering behavior is unchanged. bun run sensors all passes.

