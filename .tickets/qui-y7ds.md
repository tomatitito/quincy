---
id: qui-y7ds
status: open
deps: []
links: []
created: 2026-05-23T22:48:56Z
type: task
priority: 1
assignee: Jens Kouros
parent: qui-37bh
tags: [svelte, kanban, tickets, refresh]
---
# Dynamically refresh kanban when ticket files change

The dev app currently shows stale ticket data after ticket markdown changes, such as closing qui-oec9. Add a narrow refresh path so the kanban view re-renders from current ticket files while the app is running.

## Acceptance Criteria

- Changing a ticket markdown file while the dev app is running is reflected in the kanban board without restarting the app.\n- The refresh path still flows through infrastructure adapter -> application use case -> Svelte rendering.\n- No agent functionality is introduced.\n- bun run check, bun run build, and bun run sensors all pass.

