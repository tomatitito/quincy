---
id: qui-7ffr
status: closed
deps: [qui-qypz, qui-hn1q]
links: []
created: 2026-06-18T20:31:03Z
type: task
priority: 1
assignee: Jens Kouros
parent: qui-jdu6
tags: [graph, epics, filters, behavior]
---
# Apply epic and status filters to graph view

Use the shared epic filter state to change which nodes and edges are rendered in the graph view.

## Design

For selected epic(s), show each selected epic subtly plus the full tree of tickets belonging to it. Use tk status semantics for open versus closed. Verify how tk represents epic membership before implementing.

## Acceptance Criteria

Epics only shows only epic nodes. Selected epic(s) shows the selected epic(s) plus the full tree of tickets belonging to them. Open only excludes closed nodes according to tk status semantics. Open + closed includes closed nodes. Filtering preserves graph layout direction behavior. bun run sensors all passes.

