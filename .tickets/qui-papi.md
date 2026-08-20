---
id: qui-papi
status: open
deps: [qui-rchg, qui-tplg, qui-aret, qui-1gtl]
links: []
created: 2026-08-20T19:09:35Z
type: task
priority: 2
assignee: Jens Kouros
parent: qui-dnab
tags: [plugins, api, versioning, documentation, architecture]
---
# Stabilize and version proven plugin APIs

After the repository graph and terminal migrations plus the LSP stress-test consumer have exercised the platform, audit the contracts actually used, remove accidental or unused surface, define compatibility/versioning policy, and publish stable authoring/runtime documentation.

## Scope

- Inventory manifest, lifecycle, server capability, browser loading, UI slot, bridge, CLI, and diagnostic contracts used by real plugins.
- Resolve migration-discovered inconsistencies without adding speculative APIs.
- Define schema/API version negotiation, compatibility guarantees, deprecation process, and unsupported-version diagnostics.
- Update reference documentation, example plugin, and authoring skill to the stabilized contracts.

## Acceptance Criteria

- Audit maps every public contract to a real repository graph, terminal, or LSP use and removes or marks experimental anything unproven.
- Manifest and server/browser APIs have explicit versions and deterministic unsupported-version behavior.
- Compatibility and deprecation policy covers bundled and project-local plugins.
- Architecture documentation distinguishes core, Pi extension/bridge, server plugin, and browser plugin responsibilities.
- Example, skill, CLI help, and API reference agree and pass executable checks.
- `bun run check` and `bun run sensors all` pass.
