---
id: qui-ph1o
status: open
deps: [qui-y7ds]
links: []
created: 2026-06-03T00:00:00Z
type: epic
priority: 1
assignee: Jens Kouros
parent: awb-gjdz
tags: [agents, architecture, events, svelte, balanced-coupling]
---
# Reintroduce an agent panel with balanced architecture boundaries

Reintroduce agent functionality as a focused panel in Quincy without coupling the Svelte UI directly to the agent runtime. The design should keep commands explicit, stream runtime updates through the generic app event path, and hide pi-specific process details behind infrastructure adapters.

Balanced coupling goal: agent behavior is expected to be volatile, and it crosses browser/server/runtime boundaries. Keep high-volatility details behind low-strength contracts so changes in agent execution do not cascade through the UI and application layers.

## Scope

- Add a visible agent panel entry point in the main workspace tabs.
- Build the agent panel as a shell before wiring real runtime behavior.
- Use explicit application use cases for agent commands such as start, stop, and send input.
- Use the generic app event stream for agent runtime updates such as output, status, tool calls, failures, and completion.
- Keep pi-specific execution details in infrastructure adapters.

## Suggested implementation order

1. Add the Agent tab placeholder.
2. Implement the generic app event stream from `qui-y7ds`.
3. Add the Agent panel shell and browser event subscription.
4. Add agent command use cases and HTTP endpoints.
5. Emit agent events from the pi runner adapter through the app event hub.

## Acceptance Criteria

- Agent UI code does not import or directly depend on pi runtime implementation details.
- Commands flow through UI/API -> application use case -> agent repository port -> infrastructure adapter.
- Agent updates flow through infrastructure adapter -> app event hub -> SSE/browser subscriber -> Agent panel state.
- Event contracts remain generic app events, not a ticket-only or agent-only transport.
- The implementation preserves existing ticket graph and kanban behavior.
- `bun run check`, `bun run build`, and `bun run sensors all` pass.
