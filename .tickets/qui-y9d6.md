---
id: qui-y9d6
status: closed
deps: []
links: []
created: 2026-06-10T21:49:41Z
type: chore
priority: 2
assignee: Jens Kouros
parent: qui-oec9
tags: [sensors, eslint, typescript]
---
# Add no-default-parameters sensor

Add a static sensor that flags default values in function parameters and move existing fallbacks to explicit call sites.

## Acceptance Criteria

Static sensors flag default-valued function parameters. Existing source passes bun run sensors all.

