---
id: qui-c00j
status: closed
deps: []
links: []
created: 2026-06-26T21:13:04Z
type: task
priority: 1
assignee: Jens Kouros
parent: awb-gjdz
tags: [config, projects, tickets, architecture]
---
# Add project-scoped ticket directory configuration

Replace the current static ticket directory configuration with project-scoped configuration so Quincy can observe a repository/project and load tickets from that project's configured ticket directory.

## Design

Keep the architecture boundary intact: route/UI code should receive project/config data through page data or application use cases; filesystem and config loading stay in infrastructure; domain exposes only small ports/contracts. This should not introduce configurable ticket formats yet.

## Acceptance Criteria

The observed project path and ticket directory are configurable instead of hard-coded to process cwd plus .tickets. Home page, API routes, event stream watchers, and agent repository cwd use the same project-scoped configuration. Existing ticket format remains supported. bun run check and bun run sensors all pass.

