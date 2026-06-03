---
id: qui-asj6
status: open
deps: [qui-qnqo, qui-y7ds]
links: []
created: 2026-06-03T00:00:00Z
type: task
priority: 1
assignee: Jens Kouros
parent: qui-ph1o
tags: [agents, svelte, events, sse]
---
# Add Agent panel shell and event subscription

Replace the Agent tab placeholder with a dedicated Agent panel component that can display session status and streamed agent activity from the generic app event stream. This step should consume events only; it should not start or control a real agent process yet.

## Scope

- Introduce an `AgentPanel.svelte` component.
- Subscribe to the generic app event stream from the browser.
- Handle a small initial set of `agent.*` event contracts in local panel state, such as status changes and output appended.
- Show empty, running, completed, and failed states if the corresponding events are received.
- Keep event parsing defensive and local to the panel or a small client-side helper.

## Acceptance Criteria

- The Agent tab renders `AgentPanel.svelte` instead of an inline placeholder.
- The panel can consume generic app events without knowing SSE implementation details beyond the browser adapter/helper.
- The panel handles agent event types without importing pi runtime code.
- No command endpoints or real agent execution are introduced in this ticket.
- Existing ticket event refresh behavior from `qui-y7ds` remains intact.
- `bun run check`, `bun run build`, and `bun run sensors all` pass.
