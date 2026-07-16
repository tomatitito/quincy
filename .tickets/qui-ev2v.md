---
id: qui-ev2v
status: open
deps: []
links: []
created: 2026-07-13T18:05:34Z
type: feature
priority: 2
assignee: Jens Kouros
tags: [terminal, pty, ui, workspace]
---
# Add terminal workspace view

Add a Terminal workspace view alongside existing views, with layout behavior similar to Agent panel but a standard interactive terminal instead of agent transcript and prompt composer. Back it with a server-side PTY whose shell starts in active project's root. Render terminal output, accept normal terminal keyboard input, and propagate viewport resizing. Do not include Agent panel prompt area or route terminal traffic through agent APIs.

## Acceptance Criteria

- Workspace navigation includes accessible Terminal view on mobile, tablet, and desktop.
- Opening Terminal starts or attaches to interactive server-side PTY in active project root.
- Terminal renders ANSI output and supports normal keyboard input, control sequences, cursor behavior, scrolling, and copy/paste.
- Terminal dimensions follow available panel size and PTY receives resize updates.
- Terminal view has no Agent panel prompt/composer or agent-specific controls.
- Terminal process and transport have explicit close/error states and are cleaned up when session ends or server shuts down.
- Changing active project does not continue using previous project cwd; UI makes resulting terminal lifecycle clear.
- Terminal backend remains separate from agent runtime and normalized agent event contracts.
- PTY/API behavior and responsive terminal UI have automated coverage.
- `bun run sensors all` passes.

