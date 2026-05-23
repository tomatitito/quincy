---
id: qui-j3kw
status: closed
deps: []
links: []
created: 2026-05-23T23:31:14Z
type: task
priority: 1
assignee: Jens Kouros
parent: qui-37bh
tags: [api, kanban, tickets]
---
# Wire kanban API route to real ticket repository

The /api/kanban endpoint still uses an empty TicketRepository while the root page uses the filesystem adapter. Wire the API route through the same config provider, filesystem repository, and getKanbanView use case.

## Acceptance Criteria

- GET /api/kanban returns kanban columns populated from .tickets markdown files.\n- The route keeps the infrastructure adapter -> application use case flow.\n- No agent functionality is introduced.\n- bun run check, bun run build, and bun run sensors all pass.

