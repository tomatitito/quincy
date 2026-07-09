---
id: qui-synh
status: open
deps: [qui-mdmk]
links: []
created: 2026-07-09T12:46:12Z
type: task
priority: 2
assignee: Jens Kouros
parent: awb-gjdz
tags: [details, tickets, markdown, syntax-highlighting]
---
# Add syntax highlighting for ticket description code blocks

Highlight fenced code blocks rendered in ticket descriptions using a direct syntax highlighting dependency and a matching code theme.

## Acceptance Criteria

- A direct syntax highlighting dependency is added to `package.json`.
- Fenced code blocks in ticket descriptions are highlighted when a language is provided.
- Unknown or missing code block languages render safely as plain code.
- Code block styling preserves monospace alignment and horizontal scrolling.
- `bun run sensors all` passes.
