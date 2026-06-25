---
id: qui-xge5
status: closed
deps: []
links: []
created: 2026-06-18T16:18:35Z
type: task
priority: 1
assignee: Jens Kouros
parent: qui-ph1o
tags: [agents, sessions, ui, pi]
---
# Add repository-scoped agent session sidebar

Add a sidebar to the Agent panel that lists agent sessions associated with the repository Quincy is currently observing. The first implementation should use Pi's SessionManager API rather than reading Pi session files directly. Use the observed repository path as cwd and map Pi session records into Quincy-owned, provider-neutral session summary DTOs so other agents such as Codex or Claude can be added later behind the same boundary. The list should show session title/first-message preview and last-used time, but should not show user/avatar or project name because Quincy is already scoped to one repository.

## Acceptance Criteria

- Agent panel includes a session sidebar/list.\n- The initial data source uses Pi's session API for the observed repository cwd, not direct JSONL parsing.\n- Session summaries are represented in Quincy-owned provider-neutral contracts.\n- Rows show a useful session label/preview and last-used time.\n- Rows do not show user/avatar or project name.\n- UI remains prepared for additional session providers without coupling AgentPanel directly to Pi.\n- Existing active session streaming behavior is preserved.\n- bun run sensors all passes.
