---
id: qui-rchg
status: open
deps: [qui-puis]
links: []
created: 2026-07-09T00:00:00Z
type: feature
priority: 1
assignee: Jens Kouros
parent: qui-dnab
tags: [plugins, graph, repository, migration]
---
# Migrate repository-change graph into native plugin

Turn the existing repository-change graph experiment into Quincy's first substantial native plugin. Preserve its current changed-file dependency visualization while moving server/UI registration behind the proven plugin capabilities and removing hard-coded core wiring.

## Removability constraint

Preserve the experiment's removability as it moves into a plugin:

- move repo-change graph code into one package-shaped bundled plugin
- reuse only existing `deriveGraph(...)` graph algorithm as stable shared primitive
- derive graph on demand from current repo state; add no persistence or schema changes
- register backend behavior through narrow commands/workspace/RPC/events capabilities and UI through documented slots
- avoid broad generalization of ticket graph UI

Removal should be limited to disabling or deleting the plugin and its tests.

## Acceptance Criteria

- Changed files in selected repository appear in a separate graph view.
- Import dependencies between changed files are rendered as dependency edges.
- Plugin installs, activates, reloads, and disposes through native server/browser lifecycle.
- Core page loading, API routing, and `ResponsiveWorkspaceLayout.svelte` no longer directly import or branch for repository-change graph code.
- Failed reload leaves the previous working graph plugin active and reports diagnostics.
- Core remains usable when the repository-change graph plugin is disabled.
- Existing ticket graph behavior remains unchanged.
- `bun run check` and `bun run sensors all` pass.
