---
id: qui-ug2d
status: open
deps: [qui-cq0e]
links: []
created: 2026-07-16T19:54:57Z
type: feature
priority: 1
assignee: Jens Kouros
parent: qui-yvh4
tags: [updates, ui, github-releases, restart]
---
# Detect, install, and reload Quincy updates

Add update workflow for packaged Quincy binaries. Quincy should check published GitHub Releases, compare latest valid release against running package-derived version, show update action when newer version exists, install matching macOS architecture artifact, restart, and reload UI into replacement process.

## Design

Keep release lookup, semantic-version comparison, checksum verification, executable replacement, and restart behind infrastructure boundaries. Expose small application-level update state/action contract to UI. Update remains user-initiated: detection may be automatic, installation starts only after button activation.

Use safe replacement: download to temporary location, verify checksum, preserve executable permissions, replace atomically where filesystem permits, and retain or restore previous executable if activation fails. Never execute unverified download.

## Acceptance Criteria

- Quincy checks for updates without blocking startup and periodically or explicitly refreshes update state.
- Comparison uses running version embedded from `package.json` and ignores invalid, draft, prerelease, older, and same-version releases unless release policy explicitly enables them.
- Newer version displays accessible update button and target version; no button appears when current.
- Update selects artifact matching current macOS architecture and verifies published SHA-256 checksum before replacement.
- Progress, success, and concise failure states are visible; duplicate concurrent updates are prevented.
- Failed download, checksum, replacement, or restart leaves current executable runnable.
- Successful replacement starts new executable with required launch context, stops old process, waits for replacement server readiness, and automatically reloads browser UI.
- Reloaded UI reports new running version and clears stale update state.
- Source/dev execution cannot overwrite source tooling and reports unsupported install mode clearly if update is requested.
- Repository/API tests cover release parsing, version comparison, architecture selection, checksum failure, replacement rollback, and restart coordination.
- UI coverage verifies update button and progress/error/reload states.
- `bun run check` passes.
- `bun run sensors all` passes.
