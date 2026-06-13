---
id: qui-pi1r
status: open
deps: [qui-2n77, qui-7kyn, qui-asj6]
links: []
created: 2026-06-13T00:00:00Z
type: task
priority: 1
assignee: Jens Kouros
parent: qui-ph1o
tags: [agents, pi, infrastructure, events, sdk]
---
# Start real pi agent sessions from Quincy

Replace the current stub/in-memory agent runner path with a real pi SDK-backed adapter so Quincy can start and prompt a real pi agent from the Agent panel while preserving the existing architecture boundaries.

## Goal

Quincy can create a real pi agent session, send user input to it, and stream resulting agent output through the existing normalized app event path used by the Agent panel.

## Scope

- Add a pi SDK dependency if needed.
- Add a pi-backed `AgentRepository` infrastructure adapter.
- Use in-memory sessions only; do not persist pi session state.
- Track active pi sessions in server memory by Quincy session id.
- Subscribe to pi `AgentSessionEvent` events from each active session.
- Normalize pi session events through the existing agent application event mapping.
- Wire API/server composition to use the real pi-backed adapter.
- Keep Svelte decoupled from pi runtime details.

## Non-goals

- No chat history, resume, or persistence.
- No session picker.
- No provider/model selection UI.
- No raw pi events in the browser.
- No direct pi imports in Svelte components.

## Acceptance Criteria

- Starting an agent from the Agent panel creates a real pi session.
- Sending input prompts the real pi agent and streams text through the existing event path.
- ESC/stop cancels the active pi session and publishes a cancelled status event.
- Event flow remains: pi SDK -> infrastructure adapter -> normalized `agent.*` events -> app event hub -> SSE -> `AgentPanel`.
- Svelte components do not import pi runtime modules directly.
- `bun run check`, `bun run build`, and `bun run sensors all` pass.

## Open Questions / Risks

- Choose a minimal default for pi session cwd selection.
- Credentials or model configuration failures need clear failure events.
- In-memory sessions are lost on server restart.
- Prompting the agent must not block HTTP responses.
- Confirm pi SDK support for the project's Node/runtime environment.
