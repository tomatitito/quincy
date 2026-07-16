---
id: qui-bfnh
status: open
deps: []
links: []
created: 2026-07-12T13:51:07Z
type: task
priority: 2
assignee: Jens Kouros
tags: [projects, configuration, ui]
---
# Add project through server-side folder picker

Add an action near the project selector that opens a dialog for choosing a project directory on the machine running Quincy. Because Quincy may be accessed remotely, browse the server filesystem through Quincy rather than using a browser-native folder picker.

After confirmation, append the selected directory to the Quincy user config, preserve existing project entries and fields, select the new project, and refresh the workspace.

## Acceptance Criteria

- Header provides an accessible action for adding a project.
- Action opens a dialog that lists directories from the Quincy server filesystem and supports navigating into directories and to their parent.
- Dialog clearly shows currently selected absolute path and supports canceling without changes.
- Confirming a valid directory appends `{ "root": "<absolute path>" }` to user `config.json` without changing existing entries or fields.
- Added project becomes active and appears in project selector without manually restarting Quincy.
- Duplicate and non-directory selections are rejected with clear messages.
- Files are not shown as selectable project locations.
- API and config persistence behavior have automated tests.
- Dialog interaction and error states have component or end-to-end coverage.
- `bun run sensors all` passes.
