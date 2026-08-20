---
id: qui-pmft
status: open
deps: [qui-ev2v]
links: []
created: 2026-08-20T19:09:35Z
type: feature
priority: 1
assignee: Jens Kouros
parent: qui-dnab
tags: [plugins, manifest, discovery, security]
---
# Define native plugin manifests, discovery, and trust

Define package-shaped native Quincy plugins with validated manifests, separate optional server/browser entrypoints, deterministic discovery, visible provenance, and explicit trust before project-local code can load.

## Scope

- Specify and validate `quincy-plugin.json`, plugin IDs, entrypoint paths, and supported schema version.
- Discover bundled and configured project-local plugins without importing their code.
- Record provenance and trust state, constrain paths to plugin roots, and reject traversal.
- Document that trusted server plugins have process/data access and browser plugins execute same-origin JavaScript.

## Acceptance Criteria

- Discovery returns validated descriptors without executing plugin entrypoints.
- Invalid IDs, schemas, entrypoints, duplicate IDs, and paths outside plugin roots produce actionable diagnostics.
- Bundled provenance is distinguishable from project-local provenance.
- Project-local plugins do not load until explicitly trusted and their provenance/full-trust implications are visible.
- Tests cover discovery order, schema rejection, duplicate IDs, path traversal, provenance, and trust rejection.
- `bun run check` and `bun run sensors all` pass.
