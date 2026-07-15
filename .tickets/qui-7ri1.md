---
id: qui-7ri1
status: closed
deps: []
links: []
created: 2026-07-15T19:04:52Z
type: bug
priority: 2
assignee: Jens Kouros
tags: [agent, events, runtime, ui]
---
# Stream agent output in real time

Agent panel does not show assistant output in real time while session runs. It appears app listens to only subset of runtime events, so some output chunks are missed until later state changes. Identify missing agent events and wire them into transcript updates so streamed output appears as it arrives.

## Acceptance Criteria

- Agent transcript updates in real time while session runs.
- Missing runtime/app events required for streamed output are identified and handled.
- Existing session resume/transcript behavior stays intact.
- Tests cover streamed output event handling.
- `bun run check` passes.
- `bun run sensors all` passes.

