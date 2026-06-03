---
id: qui-7kyn
status: open
deps: [qui-2n77, qui-y7ds]
links: []
created: 2026-06-03T00:00:00Z
type: task
priority: 1
assignee: Jens Kouros
parent: qui-ph1o
tags: [agents, events, infrastructure, pi]
---
# Emit agent runtime events through the app event hub

Connect the agent runner infrastructure adapter to the generic app event hub so browser UI receives agent status and output through the same event stream used by other app events.

## Scope

- Emit `agent.*` app events from the infrastructure adapter when agent runtime activity occurs.
- Include session identity in event payloads so the Agent panel can associate events with the active session.
- Represent status changes, output appended, tool-call milestones, completion, and failures as app events.
- Keep pi-specific event shapes translated at the infrastructure boundary.
- Do not expose raw pi runtime objects or provider-specific payloads to Svelte components.

## Acceptance Criteria

- Agent runtime updates flow through infrastructure adapter -> app event hub -> SSE endpoint -> browser subscriber.
- The Agent panel updates from app event contracts, not direct runtime callbacks.
- pi-specific details are translated into stable app-level event payloads before publication.
- Existing ticket events continue to use the same app event hub and SSE endpoint.
- The design remains open to additional event producers without hard-coding the stream to agents.
- `bun run check`, `bun run build`, and `bun run sensors all` pass.
