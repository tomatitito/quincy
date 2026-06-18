---
id: qui-x894
status: open
deps: []
links: []
created: 2026-06-18T20:31:03Z
type: task
priority: 1
assignee: Jens Kouros
parent: qui-jdu6
tags: [graph, cleanup]
---
# Remove graph critical path support

Remove the graph critical path option and its related logic because it is no longer needed.

## Acceptance Criteria

The critical path control no longer appears in the graph view. Critical path computation/rendering code is removed when it has no remaining callers. The existing top-bottom versus left-right graph layout control still works. bun run sensors all passes.

