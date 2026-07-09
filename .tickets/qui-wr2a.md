---
id: qui-wr2a
status: closed
deps: []
links: []
created: 2026-07-09T00:00:00Z
type: feature
priority: 2
assignee: Jens Kouros
tags: [ui, agent, autocomplete]
---
# Add project file autocomplete to agent input

When typing `@` in the agent panel input, show project file suggestions and insert the selected file reference.

## Acceptance Criteria

- Typing `@` in the agent panel opens project file suggestions.
- Suggestions filter as more path text is typed.
- Keyboard selection with arrow keys and Enter/Tab works.
- Clicking a suggestion inserts the file reference.
- `bun run sensors all` passes.
