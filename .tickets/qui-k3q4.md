---
id: qui-k3q4
status: closed
deps: []
links: []
created: 2026-07-12T15:36:39Z
type: task
priority: 2
assignee: Jens Kouros
tags: [agent, mobile, sessions, ui]
---
# Hide agent sessions behind mobile bottom sheet

On mobile, prioritize session activity and chat by hiding the repository session list initially. Add a `Sessions` button to the agent activity header that opens the list in a bottom sheet.

Use a bottom sheet because sessions are temporary navigation/context within the full-screen mobile agent view. Implement it as an accessible modal dialog; avoid swipe-to-dismiss unless existing UI infrastructure supports it. Keep current sidebar layout on tablet and desktop.

## Acceptance Criteria

- At mobile viewport width, repository session list is hidden when agent view opens.
- Agent activity header includes an accessible `Sessions` button on mobile.
- Button opens session list as a bottom sheet over agent activity.
- Sheet includes session loading, empty, error, list, and refresh states already available in sidebar.
- Sheet can be closed through visible close action, backdrop press, and Escape.
- Opening sheet moves focus into it; closing restores focus to `Sessions` button.
- Background content cannot be interacted with while sheet is open.
- Tablet and desktop session sidebar behavior and layout remain unchanged.
- Mobile coverage verifies default-hidden, open, and close behavior.
- `bun run sensors all` passes.
