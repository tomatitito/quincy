---
id: qui-mdmk
status: open
deps: []
links: []
created: 2026-07-09T12:46:12Z
type: task
priority: 2
assignee: Jens Kouros
parent: awb-gjdz
tags: [details, tickets, markdown]
---
# Render ticket descriptions as Markdown

Parse ticket description text as Markdown in `TicketDetails.svelte` so headings, lists, links, inline code, and fenced code blocks render as structured HTML instead of escaped plain text.

## Acceptance Criteria

- A direct Markdown parser dependency is added to `package.json`.
- `TicketDetails.svelte` renders ticket descriptions from Markdown-derived HTML.
- Empty descriptions still show the existing empty state.
- Existing details layout remains usable for long descriptions.
- `bun run sensors all` passes.
