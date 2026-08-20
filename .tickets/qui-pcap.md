---
id: qui-pcap
status: open
deps: [qui-sbrg, qui-plcf]
links: []
created: 2026-08-20T19:09:35Z
type: feature
priority: 1
assignee: Jens Kouros
parent: qui-dnab
tags: [plugins, api, commands, workspace, rpc]
---
# Add narrow server plugin capabilities

Add only the server capabilities required by the planned repository graph, terminal, and LSP plugins: commands, runtime-neutral runs/workspace hooks, documented events, plugin-owned storage, namespaced RPC, and managed processes where a real consumer requires them.

## Scope

- Expose capability-specific namespaces through the lifecycle-owned API.
- Attribute handlers, subscriptions, storage, and processes to the owning plugin for disposal.
- Use the semantic bridge contracts for run/workspace hooks without a broad `api.agents` namespace.
- Avoid unrestricted route registration, generic service registration, private filesystem/registry access, and speculative capabilities.

## Acceptance Criteria

- Plugins can register namespaced commands and RPC handlers with collision validation.
- Plugins can consume documented run/workspace hooks and publish/subscribe to documented events.
- Plugin-owned storage is namespaced and remains isolated across plugins.
- Managed process support has explicit startup, shutdown, output/diagnostic, and disposal behavior proven by terminal or LSP needs.
- Disabling/reloading a plugin removes every owned handler, subscription, and process.
- Tests cover authorization/namespacing, ownership, disposal, process failure, and event/RPC isolation.
- `bun run check` and `bun run sensors all` pass.
