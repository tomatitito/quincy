---
id: qui-qqdm
status: closed
deps: []
links: []
created: 2026-06-16T00:00:00Z
type: task
priority: 2
assignee: Jens Kouros
parent: qui-ph1o
tags: [agents, events, logging, diagnostics]
---
# Add opt-in app event logging

Quincy currently publishes app events through the in-memory app event hub and streams them to subscribers, but does not log them. This makes it harder to diagnose event sequencing issues such as duplicate agent transcript output.

## Goal

Add a small internal logging path for app events, gated by an environment variable, so developers can inspect event flow in the server/dev process console without changing UI behavior.

## Proposed Approach

- Add a minimal internal logger abstraction instead of scattering `console.*` calls.
- Log app events from the central publisher in `src/lib/infrastructure/outbound/appEventHub.ts`.
- Gate app event logging behind an environment variable, for example:
  - `QUINCY_LOG_EVENTS=1`
- Emit logs to the process console where Quincy is running, e.g. the terminal for `bun run dev`.
- Keep logging disabled by default.
- Avoid leaking large or sensitive agent content by default:
  - truncate long string fields, especially `agent.output.appended` text, or
  - log metadata only for output events unless explicitly expanded later.

## Notes

A good first implementation can be intentionally small. It does not need file logging, browser-console logging, a UI event log, or a third-party logging dependency.

Suggested files to touch:

- `src/lib/infrastructure/outbound/appEventHub.ts`
- optionally a new logger helper near the infrastructure layer

## Acceptance Criteria

- When `QUINCY_LOG_EVENTS=1` is set, published app events are logged to the server/dev process console.
- When the variable is not set, app event logging is silent.
- Logs include at least event type and timestamp.
- Logs include enough payload metadata to diagnose agent event sequencing.
- Agent output text is not logged in full by default.
- Existing app event publishing and SSE streaming behavior is unchanged.
- Tests cover enabled and disabled logging behavior, or equivalent behavior is verified with a small focused test.
- `bun run sensors all` passes.
