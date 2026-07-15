---
id: qui-mh2x
status: closed
deps: []
links: []
created: 2026-07-15T00:00:00Z
type: bug
priority: 2
assignee: Jens Kouros
tags: [ui, mobile, agent]
---
# Fix horizontal scrolling for agent responses on mobile

Agent output in mobile view should allow horizontal scrolling for long unwrapped lines instead of clipping or forcing unreadable wrapping.

## Acceptance Criteria

- Agent responses in mobile view can scroll horizontally when a line exceeds available width.
- Desktop agent transcript behavior stays unchanged.
- `bun run check` passes.
- `bun run sensors all` passes.
