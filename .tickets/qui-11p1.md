---
id: qui-11p1
status: open
deps: []
links: []
created: 2026-07-13T18:05:34Z
type: task
priority: 2
assignee: Jens Kouros
tags: [agent, sessions, pi, ui]
---
# Show externally started Pi sessions

Ensure the Sessions view lists every persisted Pi session associated with the active project, regardless of whether it was started from Quincy's Agent panel or directly through Pi (CLI, TUI, or another integration). Use Pi's session discovery API as source of truth rather than Quincy's active runtime map. Externally started sessions must support the same selection and resume flow as Quincy-started sessions.

## Acceptance Criteria

- Sessions view includes Pi sessions started outside Quincy for active project.
- Quincy-started and externally started sessions appear in one list without duplicates.
- Session discovery comes from Pi persisted session metadata, not only Quincy runtime state.
- Existing label/preview, last-used sorting, active-session indication, refresh, and mobile sheet behavior work for external sessions.
- Selecting an external session resumes its persisted transcript and subsequent input continues same session.
- Sessions belonging to other projects do not leak into active project list.
- Repository and API tests cover mixed Quincy-started and externally started sessions.
- UI coverage verifies external sessions render and can be selected.
- `bun run sensors all` passes.

