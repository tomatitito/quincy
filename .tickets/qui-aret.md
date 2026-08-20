---
id: qui-aret
status: open
deps: [qui-sbrg, qui-tplg]
links: []
created: 2026-08-20T19:09:35Z
type: task
priority: 2
assignee: Jens Kouros
parent: qui-dnab
tags: [agents, pi, ui, migration, cleanup]
---
# Retire duplicated Agent-panel presentation

Retire Quincy's custom Agent-panel transcript, composer, tool rendering, and duplicated browser/session presentation state only after the terminal-first Pi workflow and semantic bridge have been verified in the bundled terminal plugin.

## Prerequisite evidence

- Pi's CLI/TUI can start/resume work and complete the plugin-authoring loop in Quincy's terminal.
- The authenticated bridge reliably supplies the semantic run/workspace events required by native consumers.
- Terminal recovery, project switching, and process behavior remain covered after plugin migration.

## Acceptance Criteria

- Verification evidence for every prerequisite above is recorded before removal begins.
- Custom Agent-panel transcript, prompt composer, Pi tool renderer, and browser-only duplicated transcript/session state are removed with their now-unused command paths.
- Runtime-neutral semantic run/workspace contracts and ticket/run association remain in Quincy.
- Pi owns transcript/session presentation and remains usable in the terminal if the bridge is unavailable.
- Removing the Agent panel does not remove app event infrastructure used by tickets or plugins.
- Tests and documentation describe the terminal-first workflow and bridge limitation.
- `bun run check` and `bun run sensors all` pass.
