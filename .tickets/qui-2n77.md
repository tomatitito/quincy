---
id: qui-2n77
status: closed
deps: [qui-asj6]
links: []
created: 2026-06-03T00:00:00Z
type: task
priority: 1
assignee: Jens Kouros
parent: qui-ph1o
tags: [agents, api, application, hexagonal]
---
# Add agent command use cases and API endpoints

Add explicit command paths for controlling an agent session. Commands should flow through application use cases and an agent repository port, with pi-specific execution hidden behind an infrastructure adapter.

## Scope

- Define small agent command contracts for starting a session, stopping a session, and sending input.
- Add application use cases for those commands.
- Add an `AgentRepository` port or equivalent functional port in the domain/application boundary.
- Add HTTP endpoints or SvelteKit actions that call the application use cases.
- Add a minimal infrastructure adapter stub if the real pi runner is not ready yet.

## Acceptance Criteria

- The UI/API layer does not construct or control pi runtime objects directly.
- Agent commands flow through UI/API -> application use case -> agent repository port -> infrastructure adapter.
- Command responses are request/response oriented and do not duplicate streaming event responsibilities.
- The implementation keeps command contracts small and avoids speculative session-management features.
- Agent panel UI can call the command endpoints or actions for the implemented commands.
- `bun run check`, `bun run build`, and `bun run sensors all` pass.
