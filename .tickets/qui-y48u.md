---
id: qui-y48u
status: closed
deps: []
links: [qui-k3q4]
created: 2026-07-12T15:44:03Z
type: task
priority: 2
assignee: Jens Kouros
tags: [agent, sessions, runtime, ui]
---
# Resume agent session from session list

Make persisted Pi sessions selectable from the agent session list on every viewport. Selecting a session must resume it through the server runtime, make it active, restore its transcript in the agent panel, and allow subsequent input to continue the same persisted session.

On mobile, when the session list is presented in the bottom sheet introduced by `qui-k3q4`, successful selection closes the sheet so the user lands in session activity.

## Acceptance Criteria

- Session rows are accessible controls on mobile, tablet, and desktop.
- Selecting a session asks server runtime to resume persisted Pi session rather than creating a new session.
- Resumed session becomes active and its existing transcript is rendered in agent activity.
- New input continues resumed session and appends to same persisted session.
- Active session is visually identified in session list.
- Successful mobile selection closes session sheet and returns user to agent activity.
- Failed selection leaves current session unchanged and shows clear error; mobile sheet remains open.
- Runtime/API tests verify resuming existing session, loading its transcript, and continuing it without creating a replacement session.
- UI coverage verifies selection, active state, transcript restoration, and failure behavior.
- `bun run sensors all` passes.
