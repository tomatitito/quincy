---
id: qui-k4qm
status: closed
deps: []
links: []
created: 2026-07-15T19:04:52Z
type: task
priority: 2
assignee: Jens Kouros
tags: [agent, mobile, tools, ui]
---
# Collapse tool call output by default on mobile

Mobile agent transcript is too crowded when tool output renders inline at full size. Render tool calls as compact, expandable cards on mobile: collapsed by default with tool name and short preview, expandable on tap to reveal full output. Keep current desktop behavior unless implementation needs shared component structure.

## Acceptance Criteria

- On mobile, tool call output is collapsed by default.
- Collapsed state shows tool call affordance with tool name and short preview.
- Tapping collapsed tool call expands it to show full output; user can collapse again.
- Non-tool transcript entries keep current mobile behavior.
- Desktop transcript behavior stays unchanged.
- UI coverage verifies collapsed and expanded mobile states.
- `bun run check` passes.
- `bun run sensors all` passes.

