---
id: qui-qnqo
status: closed
deps: []
links: []
created: 2026-06-03T00:00:00Z
type: task
priority: 1
assignee: Jens Kouros
parent: qui-ph1o
tags: [agents, svelte, ui]
---
# Add Agent tab placeholder

Add an `Agent` button next to the existing `Details` button in the main workspace tabs. The tab should render a clear placeholder state only; no real agent runtime, event stream, or command API should be introduced in this step.

## Acceptance Criteria

- The main workspace tabs include an `Agent` button next to `Details`.
- Clicking `Agent` switches to an agent placeholder panel.
- The placeholder clearly communicates that the agent panel is not connected yet.
- No pi/agent runtime integration is introduced.
- Existing Graph, Kanban, and Details tab behavior remains unchanged.
- `bun run check`, `bun run build`, and `bun run sensors all` pass.
