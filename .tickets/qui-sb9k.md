---
id: qui-sb9k
status: closed
deps: [qui-pi1r]
links: []
created: 2026-07-16T00:00:00Z
type: task
priority: 1
assignee: Jens Kouros
parent: qui-ph1o
tags: [agents, pi, subagents, delegation]
---
# Add subagent delegation to Quincy agent runtime

Enable Quincy's pi-backed agent runtime to expose a built-in `subagent` tool so parent agent can delegate recon, planning, implementation, or review work to isolated child sessions.

## Scope

- Register Quincy-owned pi extension during runtime service creation.
- Add `subagent` tool with built-in roles: `scout`, `planner`, `worker`, `reviewer`.
- Run delegated work in isolated in-memory child sessions.
- Reuse current project cwd and system prompt context for delegated runs.
- Keep child sessions from recursively receiving `subagent` tool.

## Acceptance Criteria

- Quincy-started agent sessions expose `subagent` tool without user-side pi setup.
- Delegated runs use isolated child sessions and return final child output to parent agent.
- `subagent` role selection rejects unknown roles with clear error.
- `bun run check`, `bun run build`, and `bun run sensors all` pass.
