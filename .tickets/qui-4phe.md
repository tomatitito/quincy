---
id: qui-4phe
status: closed
deps: [qui-nq1j]
links: []
created: 2026-06-25T13:09:53Z
type: task
priority: 2
assignee: Jens Kouros
parent: qui-9806
tags: [responsive, mobile, details]
---
# Add responsive ticket details destination

Add the missing Details destination needed by responsive mobile flows. Graph and Kanban selection should be able to set a workspace-level selected ticket, and the Details tab should render that selected ticket instead of a placeholder.

## Design

Keep this focused on selection state and a minimal usable Details view. Do not introduce a desktop split-pane redesign unless a later ticket asks for it. This ticket should compose with the responsive layout boundary from qui-caw8: +page.svelte or the layout boundary owns selected ticket state; GraphView and KanbanBoard receive selection callbacks instead of keeping selection entirely local.

## Acceptance Criteria

Selecting a ticket from Graph or Kanban can update workspace-level selected ticket state. The Details tab renders the selected ticket with enough information to be useful on mobile. Empty Details state remains clear when no ticket is selected. The change stays compatible with the responsive layout boundary work. bun run sensors all passes.

