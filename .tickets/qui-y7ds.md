---
id: qui-y7ds
status: open
deps: [qui-37bh]
links: []
created: 2026-05-23T22:48:56Z
type: task
priority: 1
assignee: Jens Kouros
parent: qui-37bh
tags: [svelte, kanban, tickets, events, sse]
---
# Add app event stream for live UI updates

The dev app currently shows stale ticket data after ticket markdown changes, such as closing a ticket from the CLI. Add a generic app-event path so the browser can react to server-side events while the app is running.

Keep SSE as the browser delivery adapter, not as ticket-specific architecture. Ticket file changes should emit an app event such as `tickets.changed`; future producers, including pi coding agent events, should be able to emit their own event types through the same server-side event hub and SSE endpoint.

## Acceptance Criteria

- A small server-side app event hub supports multiple event producers and subscribers.
- Ticket file changes emit a generic app event, e.g. `tickets.changed`.
- A SvelteKit SSE endpoint streams app events to the browser.
- The browser reacts to `tickets.changed` by refreshing/revalidating kanban data without restarting the app.
- The design does not hard-code the event stream to tickets only; future pi events can use the same event hub and SSE endpoint.
- Ticket data refresh still flows through infrastructure adapter -> application use case -> Svelte rendering.
- No pi/agent integration is implemented in this ticket.
- `bun run check`, `bun run build`, and `bun run sensors all` pass.
