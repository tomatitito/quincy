---
id: qui-4epc
status: closed
deps: [qui-37bh]
links: []
created: 2026-05-24T00:00:00Z
type: task
priority: 1
assignee: Jens Kouros
parent: awb-gjdz
tags: [svelte, kanban, graph, epics, selection]
---
# Enable selecting an epic in graph and kanban views

Add a UI affordance for selecting an epic from either the dependency graph or the kanban board, then use that selection consistently across both views. Selecting an epic should make it easy to focus on the epic and its child tickets without losing the existing board/graph behavior.

## Scope

- Treat tickets with `type: epic` as selectable epics.
- Surface epic identity from the ticket repository through the application view models as needed, including `parent` relationships for child tickets.
- Let users select an epic from the graph view when clicking an epic node.
- Let users select an epic from the kanban view when clicking an epic card or choosing from an epic selector.
- Keep the selected epic state shared between graph and kanban views.
- Visually distinguish the selected epic and its child tickets in both views.
- Provide a clear way to reset the selection and return to the full graph/kanban view.

## Acceptance Criteria

- Epic tickets are identifiable in the loaded ticket data, and child tickets can be associated through their `parent` metadata.
- Selecting an epic in the graph updates the kanban view to reflect the same selected epic.
- Selecting an epic in the kanban view updates the graph view to reflect the same selected epic.
- The selected epic and its child tickets are visually highlighted or focused in both views.
- Clearing the selection restores the existing unfiltered graph and kanban behavior.
- The implementation keeps data loading through infrastructure adapter -> application use case -> Svelte rendering.
- No agent functionality is introduced.
- `bun run check`, `bun run build`, and `bun run sensors all` pass.
