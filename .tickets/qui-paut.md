---
id: qui-paut
status: open
deps: [qui-pcap]
links: []
created: 2026-08-20T19:09:35Z
type: feature
priority: 1
assignee: Jens Kouros
parent: qui-dnab
tags: [plugins, cli, skill, tooling, documentation]
---
# Add native plugin authoring workflow

Provide the CLI, scaffolding, executable example, and Pi-facing `quincy-plugin-authoring` skill needed for Pi running in Quincy's terminal to author and reload a server plugin without editing or restarting Quincy core.

## Scope

- Add `quincy plugin new`, `build`, `test`, `install`, `list`, `reload`, `disable`, and `remove` commands.
- Scaffold the native manifest and separate server/browser entrypoints without inventing unsupported APIs.
- Add an executable example plugin and authoring skill covering contracts, trust, diagnostics, and build/test/reload flow.
- Surface lifecycle and rollback diagnostics in CLI output.

## Acceptance Criteria

- From Pi in Quincy's terminal, an agent can scaffold, implement, test, install, list, reload, disable, and remove the example server plugin.
- Commands use the same manifest, trust, lifecycle, and diagnostics contracts as runtime loading.
- Reload does not restart Quincy and reports whether the prior version remains active after failure.
- Generated files build and tests exercise the generated plugin rather than only snapshotting templates.
- The skill distinguishes Pi extensions, the semantic bridge, and native Quincy plugins.
- `bun run check` and `bun run sensors all` pass.
