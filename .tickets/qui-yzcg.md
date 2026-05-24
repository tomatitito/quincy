---
id: qui-yzcg
status: open
deps: [qui-z7yr]
links: []
created: 2026-05-23T23:34:33Z
type: task
priority: 2
assignee: Jens Kouros
parent: qui-oec9
tags: [sensors, eslint, typescript, design]
---
# Add sensor for over-broad parameter objects

Add a custom static sensor that detects functions accepting an object/config parameter when they only read one or a small subset of its properties, e.g. createTicketFileRepository(config) only needs ticketDirectory. Prefer passing the specific needed value instead of the whole object.

## Acceptance Criteria

- Static sensors flag functions that accept an object-like parameter and only access one property from it.\n- The rule message recommends passing the specific property/value instead of the whole object.\n- Existing obvious cases, including createTicketFileRepository, are migrated where appropriate.\n- bun run sensors all passes.

