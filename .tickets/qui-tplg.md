---
id: qui-tplg
status: open
deps: [qui-rchg]
links: []
created: 2026-08-20T19:09:35Z
type: feature
priority: 1
assignee: Jens Kouros
parent: qui-dnab
tags: [plugins, terminal, pty, workspace, migration]
---
# Migrate terminal workspace into bundled plugin

Move the proven terminal workspace, including PTY repository/transport, panel, and navigation contribution, into a trusted bundled native plugin without changing recovery, project-switching, resize, or process behavior.

## Scope

- Register terminal server behavior through narrow managed-process/RPC capabilities and UI through the workspace slot.
- Preserve active-project cwd isolation, reconnect/recovery, resize, close/error, shutdown, and process cleanup behavior.
- Keep a core recovery path when the terminal plugin is disabled or fails to activate.
- Continue hosting Pi's CLI/TUI as the primary agent workflow while retaining the Agent panel during verification.

## Acceptance Criteria

- Core no longer directly imports or branches for terminal server/UI implementation.
- Trusted bundled terminal plugin activates, reloads, and disposes through native lifecycle.
- Existing terminal behavior and automated PTY/responsive coverage remain green through the plugin boundary.
- Failed terminal plugin reload preserves the previous working terminal contribution or exposes the documented recovery path.
- Pi can complete the authoring example from the plugin-hosted terminal.
- The Agent panel is still present; its removal is explicitly deferred to `qui-aret`.
- `bun run check` and `bun run sensors all` pass.
