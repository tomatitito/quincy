---
id: qui-cq0e
status: open
deps: [qui-047z]
links: []
created: 2026-07-16T19:54:57Z
type: task
priority: 1
assignee: Jens Kouros
parent: qui-yvh4
tags: [github-actions, releases, macos, ci]
---
# Publish macOS binaries when package version changes

Add GitHub Actions release workflow that treats `package.json` version as release source of truth. On eligible `main` updates, compare package version with existing release/tag state and publish only when version is new.

## Acceptance Criteria

- Workflow reads version directly from `package.json`; no separate workflow version value exists.
- Invalid or already-published version exits without creating duplicate tag or release.
- New version builds and smoke-tests macOS arm64 and x64 executables on architecture-compatible runners.
- Release is created only after both architecture builds succeed.
- Git tag and GitHub Release use deterministic version derived from package version, such as `v1.2.3`.
- Release contains clearly named arm64 and x64 artifacts plus SHA-256 checksums suitable for updater verification.
- Published executables report same version as release and `package.json`.
- Workflow permissions are least-privilege and release creation is safe when jobs retry.
- Pull requests validate packaging without publishing releases.
- Workflow decision/build logic has automated or script-level coverage where practical.
- `bun run check` passes.
- `bun run sensors all` passes.
