---
id: qui-yvh4
status: open
deps: []
links: [qui-bqze]
created: 2026-07-16T19:54:57Z
type: epic
priority: 1
assignee: Jens Kouros
tags: [distribution, releases, updates, macos]
---
# Distribute and self-update Quincy macOS binaries

Define Quincy's release channel, produce standalone macOS executables, publish releases from `package.json` versions, and let installed Quincy binaries update themselves. This supersedes the earlier deferral in `qui-bqze` now that distribution and update behavior are specified.

## Design

Use `package.json` as the only version source. Git tags, GitHub Release names, binary metadata, update comparisons, and UI version display must derive from it. Deliver packaging first, release automation second, and in-app update behavior last.

Initial platform scope is macOS Apple Silicon and Intel. Keep build/release details outside application domain logic; update checks and installation belong behind infrastructure ports, while UI only consumes update state and actions.

## Acceptance Criteria

- Quincy can be built as standalone executable for macOS arm64 and x64.
- New `package.json` version triggers one corresponding GitHub Release with both architecture artifacts.
- Quincy reports its running version from `package.json`-derived build metadata.
- Installed binary detects newer published version and offers user-initiated update.
- Successful update replaces current executable, restarts Quincy, and automatically reloads connected UI into new version.
- Failed update leaves working executable usable and presents concise recovery information.
- Automated coverage exists for version detection, release decisions, update state, and restart/reload flow.
- `bun run check` passes.
- `bun run sensors all` passes.
