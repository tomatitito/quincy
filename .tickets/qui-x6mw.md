---
id: qui-x6mw
status: closed
deps: []
links: []
created: 2026-06-28T00:00:00Z
type: task
priority: 2
assignee: Jens Kouros
tags: [configuration, projects, frontend]
---
# Add user project config and header project switcher

Add AWB-style user project selection to Quincy. Quincy should read a user config file, discover configured projects, show them in the top header bar, and allow switching the active project from a dropdown.

## Background

Current Quincy configuration is runtime/env based:

- `QUINCY_PROJECT_PATH` selects the active project.
- `QUINCY_TICKET_DIRECTORY` selects the ticket directory.
- If unset, Quincy uses `process.cwd()` and `.tickets`.

AWB had a user config under the platform config directory, commonly `~/.config/awb/config.json`, with `projects` entries containing project roots and optional labels. Quincy should provide the same product affordance for multiple projects, adapted to Quincy naming and architecture.

Example target config:

```json
{
  "projects": [
    { "root": "/path/to/project-a", "label": "Project A" },
    { "root": "/path/to/project-b" }
  ]
}
```

## Scope

- Add Quincy user config discovery for configured projects.
  - Linux/default: `$XDG_CONFIG_HOME/quincy/config.json` or `~/.config/quincy/config.json`.
  - macOS: `~/Library/Application Support/quincy/config.json` unless `$XDG_CONFIG_HOME` is set.
  - Windows: `%APPDATA%/quincy/config.json`.
- Parse `projects` as an array of objects with:
  - `root`: required project/repository path.
  - `label`: optional display label.
  - `ticketDirectory`: optional per-project ticket directory override, if needed to preserve current configurability.
- Validate and normalize project entries:
  - ignore invalid entries with warnings.
  - ignore missing/non-directory roots with warnings.
  - ignore duplicate roots with warnings.
- Keep current env behavior as fallback/override:
  - `QUINCY_PROJECT_PATH` continues to work.
  - `QUINCY_TICKET_DIRECTORY` continues to work.
- Expose selectable projects to the home page/API through existing application/domain/infrastructure boundaries.
- Replace current static active-project header display with a project dropdown in the top header bar.
- Switching projects updates graph, kanban, details, ticket watchers/events, and agent runtime cwd to the selected project.
- Persist selected project for the current browser session or document chosen non-persistence explicitly.
- Update configuration docs and tests.

## Acceptance Criteria

- Quincy reads configured projects from the platform-specific Quincy user config file.
- Header bar shows a dropdown when configured projects exist, with labels when provided and roots otherwise.
- Selecting a project changes active project without restarting Quincy.
- Ticket loading, graph, kanban, details, refresh, file watching, and agent commands use the selected project root.
- Invalid config entries do not crash the app and produce test-covered warnings.
- Existing env-based single-project startup still works.
- Architecture boundaries remain intact: config/project discovery lives in infrastructure behind ports/use cases; UI does not read files or `process.env` directly.
- `docs/configuration.md` documents config path, JSON shape, env precedence, and switching behavior.
- Tests cover project config parsing, fallback behavior, and project switching use case/UI state.
- `bun run check`, `bun run build`, and `bun run sensors all` pass.
