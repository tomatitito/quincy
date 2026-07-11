---
id: qui-rchg
status: in_progress
deps: []
links: []
created: 2026-07-09T00:00:00Z
type: experiment
priority: 2
assignee: Jens Kouros
tags: [graph, repository, experiment]
---
# Visualize repository changes as graph

Add an experimental graph view that visualizes dependencies between changed parts of the selected repository.

## Removability constraint

Keep implementation easy to remove if experiment fails:

- isolate repo-change graph code under `src/lib/experiments/repoChangeGraph/`
- reuse only existing `deriveGraph(...)` graph algorithm as stable shared primitive
- derive graph on demand from current repo state; add no persistence or schema changes
- add only thin route/tab wiring outside experiment folder
- avoid broad generalization of ticket graph UI

Removal should be limited to deleting experiment folder, tab wiring, and experiment tests.

## Acceptance Criteria

- Changed files in selected repository appear in a separate graph view.
- Import dependencies between changed files are rendered as dependency edges.
- Existing ticket graph behavior remains unchanged.
- `bun run sensors all` passes.
