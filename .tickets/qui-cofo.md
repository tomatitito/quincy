---
id: qui-cofo
status: closed
deps: []
links: []
created: 2026-07-12T09:24:18Z
type: task
priority: 2
assignee: Jens Kouros
tags: [build, sveltekit, production]
---
# Add standalone production server

Configure SvelteKit's Node adapter so Quincy produces a runnable production server. Add a package.json script that starts the generated build.

## Acceptance Criteria

- @sveltejs/adapter-node replaces adapter-auto.
- bun run build produces the Node server in build/.
- A package.json script starts the built server.
- Production build and start commands are documented.
- bun run sensors all passes.

