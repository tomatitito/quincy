---
id: qui-6omu
status: closed
deps: []
links: [qui-x6mw]
created: 2026-07-15T00:00:00Z
type: bug
priority: 2
assignee: Jens Kouros
tags: [projects, ui, kanban, graph]
---
# Refresh UI when switching projects

Switching active project from header does not refresh ticket UI. Kanban and graph keep showing tickets from previous project instead of selected project.

## Acceptance Criteria

- Selecting different project refreshes kanban with tickets from selected project.
- Selecting different project refreshes graph with tickets from selected project.
- Ticket detail/selection does not stay pinned to stale ticket data from previous project.
- Project switch does not require manual reload.
- Regression coverage verifies project switch updates visible ticket data.
- `bun run check` passes.
- `bun run sensors all` passes.
