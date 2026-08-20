---
id: qui-plcf
status: open
deps: [qui-pmft]
links: []
created: 2026-08-20T19:09:35Z
type: feature
priority: 1
assignee: Jens Kouros
parent: qui-dnab
tags: [plugins, server, lifecycle, reliability]
---
# Implement atomic server plugin lifecycle

Load trusted server plugin factories into host-owned candidate registrations, validate them, and atomically activate or reload them. Every contribution and resource must be owned by plugin ID and disposable; failed activation must preserve the previous working plugin.

## Scope

- Implement candidate registration, validation, start, activation, stop/disposal, and reload states.
- Prevent plugin factories from accessing private registries.
- Track concise diagnostics and active/candidate version state.
- Time-box startup/shutdown where practical and keep core usable when every plugin is disabled.

## Acceptance Criteria

- A trusted TypeScript server factory registers through a controlled API.
- Registrations and managed resources are attributed to one plugin and disposed together.
- Activation swaps complete validated candidates atomically; dispatch never observes a partial candidate.
- Failed initial load is isolated, and failed reload leaves the previous version active with diagnostics.
- Disable and server shutdown dispose active plugin resources cleanly.
- Tests cover ownership, validation, disposal order, concurrent reload, rollback, and disabled-plugin recovery.
- `bun run check` and `bun run sensors all` pass.
