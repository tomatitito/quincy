---
id: qui-047z
status: open
deps: []
links: []
created: 2026-07-16T19:54:57Z
type: task
priority: 1
assignee: Jens Kouros
parent: qui-yvh4
tags: [build, binary, bun, macos]
---
# Build standalone Quincy executable with Bun

Add Bun script that builds Quincy and packages runnable standalone executable. Binary must contain or locate all production assets needed to start Quincy without repository checkout or dependency install.

## Acceptance Criteria

- `package.json` contains explicit version and remains sole source for runtime/build version.
- Documented Bun package script produces executable Quincy binary from clean checkout.
- Executable starts Quincy server and serves complete UI without `node_modules` or source checkout.
- Build embeds version matching `package.json`; executable exposes version through CLI flag or equivalent testable interface.
- Packaging includes SvelteKit output, static assets, Pi runtime assets/extensions, and terminal PTY requirements.
- Build can target macOS arm64 and x64 without silently mixing native dependencies between architectures.
- Output paths and artifact names are deterministic and include platform/architecture.
- Automated smoke test launches packaged executable and verifies health/page response and embedded version.
- Build usage and supported macOS targets are documented.
- `bun run check` passes.
- `bun run sensors all` passes.
