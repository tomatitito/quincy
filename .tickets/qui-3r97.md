---
id: qui-3r97
status: closed
deps: []
links: []
created: 2026-07-07T09:32:10Z
type: task
priority: 2
assignee: Jens Kouros
parent: qui-9806
tags: [ui, graph, polish]
---
# Prevent graph ticket titles from being cut off

Increase graph ticket card height and allow ticket titles to use three lines so longer titles remain readable in graph nodes.

## Acceptance Criteria

Graph ticket cards have enough vertical space for longer titles. Ticket titles in graph nodes can wrap to three lines before clipping. Existing graph layout behavior remains unchanged. bun run sensors all passes.
