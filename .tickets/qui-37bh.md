---
id: qui-37bh
status: closed
deps: []
links: []
created: 2026-05-23T22:14:17Z
type: task
priority: 1
assignee: Jens Kouros
parent: awb-gjdz
tags: [svelte, kanban, tickets, vertical-slice]
---
# Render real tickets in the kanban board

Replace the mocked kanban cards with real tickets loaded from the configured ticket directory. Keep the slice narrow: current markdown ticket format, basic metadata parsing, dependency readiness derivation, application use case, infrastructure filesystem adapter, and Svelte rendering.

Match AWB's kanban column behavior for the initial slice:

- The ordered kanban columns are `backlog`, `open`, `in_progress`, and `closed`.
- `backlog` is a derived kanban column, not a persisted ticket status.
- A ticket with status `open` belongs in `backlog` when it is not ready.
- A ticket is ready when it is not closed, all declared dependencies exist, and all blocking dependencies are closed.
- Ready `open` tickets remain in the `open` column.

## Acceptance Criteria

- The root page renders kanban columns populated from real `.tickets` markdown files.
- Ticket loading flows through infrastructure adapter -> application use case -> Svelte page/component.
- Basic ticket parsing includes `id`, title, `status`, `priority`, `type`, and `deps`.
- The kanban board derives `ready` state from dependencies and uses AWB-compatible `backlog` placement for unready open tickets.
- No agent functionality is introduced.
- `bun run check`, `bun run build`, and `bun run sensors all` pass.

