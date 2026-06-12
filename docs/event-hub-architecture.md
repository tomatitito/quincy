# Event hub architecture

Quincy uses a small server-side event hub plus a Server-Sent Events endpoint to deliver app events to browser components.

See the architecture diagram: [eventHubArchitecture.svg](./eventHubArchitecture.svg).

## Main parts

### Event producers

Event producers are server-side code that notice something happened and publish an app event.

Current example:

- `src/lib/infrastructure/outbound/ticketFileChangeEvents.ts`

The ticket file watcher publishes `tickets.changed` when a Markdown ticket file changes:

```text
ticket file watcher → publishAppEvent({ type: "tickets.changed", ... })
```

Future producers, such as an agent repository adapter, can publish their own event types through the same path.

### Server-side event hub

The hub lives in:

- `src/lib/infrastructure/outbound/appEventHub.ts`

It is an in-process pub/sub registry. Producers call `publishAppEvent(...)`; server-side subscribers register with `subscribeToAppEvents(...)`.

The hub does not know about browsers, HTTP, or SSE. It only distributes app events inside the server process.

### SSE endpoint

The browser connects to:

- `GET /events`

The route is defined in:

- `src/routes/events/+server.ts`

The implementation lives in:

- `src/lib/infrastructure/inbound/http/appEventStream.ts`

When the browser opens `/events`, the server keeps the HTTP response open. The SSE handler subscribes to the event hub and writes each received event into that already-open response stream.

Important: the SSE handler does not send a new request when an event arrives. The browser made one long-lived request, and the server pushes event chunks through that existing response.

### Browser EventSource wrapper

The browser-side wrapper lives in:

- `src/lib/infrastructure/inbound/browser/appEvents.ts`

It wraps the browser `EventSource` API and exposes a small `listen(...)` helper for Svelte code.

Browser components do not subscribe directly to the server-side event hub. They listen to events that arrive over the `/events` SSE connection.

## Event flow

```text
producer
  → publishAppEvent(...)
  → server-side appEventHub
  → /events SSE stream subscriber
  → open HTTP response
  → browser EventSource
  → component listener
```

Concrete ticket example:

```text
.ticket Markdown file changes
  → ticket file watcher publishes tickets.changed
  → appEventHub notifies subscribers
  → /events stream writes an SSE event
  → browser EventSource receives it
  → +page.svelte refreshes ticket data
```

## Current consumers

Current browser-side consumers include:

- `src/routes/+page.svelte`
  - listens for `tickets.changed`
  - calls `invalidateAll()` to refresh page data

- `src/lib/components/AgentPanel.svelte`
  - listens for `agent.status` / `agent.status.changed`
  - listens for `agent.output` / `agent.output.appended`

The Agent panel subscriptions are ready for agent runtime events, but the real agent event producer is added separately from the command endpoints.
