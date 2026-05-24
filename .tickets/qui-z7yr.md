---
id: qui-z7yr
status: in_progress
deps: []
links: []
created: 2026-05-23T23:31:14Z
type: task
priority: 2
assignee: Jens Kouros
parent: qui-oec9
tags: [sensors, eslint, typescript]
---
# Add sensor for single-method interfaces

Add a custom static sensor that flags interfaces or object-shaped classes with a single method, such as TicketRepository. Prefer a function type alias for these cases.

## Acceptance Criteria

- Static sensors flag single-method interfaces in TypeScript source.\n- Existing single-method interfaces are migrated to function type aliases where appropriate.\n- The rule message explains that one-method interfaces should usually be function type aliases.\n- bun run sensors all passes.

