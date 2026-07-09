---
id: qui-u0rv
status: closed
deps: [qui-4phe]
links: []
created: 2026-07-07T10:12:09Z
type: task
priority: 2
assignee: Jens Kouros
parent: awb-gjdz
tags: [details, tickets, markdown]
---
# Show ticket descriptions in details view

Load ticket markdown body content beyond the `# Title` heading and render it in the Details view so users can read ticket descriptions and acceptance criteria without opening the markdown file.

## Acceptance Criteria

Ticket parsing preserves a description/body field from markdown after the title heading. The ticket domain/view model exposes that description without breaking existing Kanban or graph behavior. `TicketDetails.svelte` renders the description when a ticket is selected and handles empty descriptions cleanly. Existing ticket repository tests cover description parsing. bun run sensors all passes.
