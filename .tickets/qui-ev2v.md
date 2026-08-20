---
id: qui-ev2v
status: open
deps: []
links: []
created: 2026-07-13T18:05:34Z
type: feature
priority: 1
assignee: Jens Kouros
parent: qui-dnab
tags: [terminal, pty, ui, workspace, pi, migration]
---
# Make terminal-hosted Pi the primary workflow

Add a Terminal workspace view alongside existing views and prove Pi's native CLI/TUI is viable there as Quincy's primary agent workflow. Back it with a server-side PTY whose shell starts in the active project's root. Render terminal output, accept normal terminal keyboard input, and propagate viewport resizing. Do not include Agent panel prompt area or route terminal traffic through agent APIs.

This is a coexistence stage: retain the existing Agent panel unchanged as a fallback while terminal-first Pi is exercised. Do not remove Agent-panel presentation or its transcript/session state in this ticket.

## Acceptance Criteria

- Workspace navigation includes accessible Terminal view on mobile, tablet, and desktop.
- Opening Terminal starts or attaches to interactive server-side PTY in active project root.
- Terminal renders ANSI output and supports normal keyboard input, control sequences, cursor behavior, scrolling, and copy/paste.
- Terminal dimensions follow available panel size and PTY receives resize updates.
- Terminal view has no Agent panel prompt/composer or agent-specific controls.
- Terminal process and transport have explicit close/error states and are cleaned up when session ends or server shuts down.
- Changing active project does not continue using previous project cwd; UI makes resulting terminal lifecycle clear.
- Terminal backend remains separate from agent runtime and normalized agent event contracts.
- Pi's CLI/TUI can be launched in the terminal, operate in the active project, and complete a representative edit/test workflow.
- Terminal is documented and presented as the preferred agent workflow while the existing Agent panel remains available.
- No PTY-output parsing or Agent-panel removal is introduced.
- PTY/API behavior and responsive terminal UI have automated coverage.
- `bun run sensors all` passes.
