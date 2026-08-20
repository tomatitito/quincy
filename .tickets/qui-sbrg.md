---
id: qui-sbrg
status: open
deps: [qui-ev2v]
links: []
created: 2026-08-20T19:09:35Z
type: feature
priority: 1
assignee: Jens Kouros
parent: qui-dnab
tags: [agents, pi, events, bridge, security]
---
# Add authenticated Pi semantic bridge

Add a bundled, thin Pi extension that publishes selected Pi lifecycle facts to Quincy over a local authenticated channel. Translate them at the boundary into runtime-neutral run/workspace events; do not parse terminal output or expose raw Pi event/session objects.

## Scope

- Authenticate and scope bridge connections to the active Quincy workspace.
- Emit run started/settled, file mutation starting/completed, ticket/run association, and diagnostics events.
- Keep terminal Pi fully usable when the bridge is absent, while documenting that semantic consumers will lack run-aware data.
- Reuse the existing app event transport where appropriate without introducing remote-agent control or duplicated transcript/session APIs.

## Acceptance Criteria

- Bundled Pi extension connects through a local authenticated structured channel.
- Pi lifecycle data is adapted into documented runtime-neutral run/workspace contracts.
- Native consumers need no Pi dependency and never parse PTY output.
- Invalid credentials and cross-workspace publications are rejected.
- Tests cover authentication, workspace scoping, event adaptation, reconnect/disposal, and operation without the bridge.
- The existing Agent panel remains available during this proof stage.
- `bun run check` and `bun run sensors all` pass.
