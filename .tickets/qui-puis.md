---
id: qui-puis
status: open
deps: [qui-pcap, qui-pweb]
links: []
created: 2026-08-20T19:09:35Z
type: feature
priority: 1
assignee: Jens Kouros
parent: qui-dnab
tags: [plugins, ui, svelte, registry, slots]
---
# Add migration-proven UI contribution slots

Add a narrow browser contribution registry and core-rendered slots required by real migrations: workspace panel and header action, plus ticket-detail tab/action only where the repository graph or LSP plugin demonstrates the need.

## Scope

- Define candidate registrations with stable IDs, ownership, ordering, validation, and disposal.
- Render contributions through explicit Svelte stores/components rather than plugin access to component instances.
- Replace feature-specific workspace/header wiring only when the corresponding plugin migration consumes the slot.
- Do not add arbitrary layout injection, generic component lookup, or speculative slots.

## Acceptance Criteria

- A browser plugin can register a workspace panel and header action through documented slots.
- Ticket-detail tab/action contracts are added only if a migration proves them necessary.
- Duplicate/invalid contributions fail candidate validation without changing active UI.
- Disable/reload removes every plugin-owned contribution and preserves core navigation.
- Core remains usable with all plugins disabled.
- Tests cover ordering, ownership, collision handling, atomic replacement, disposal, and responsive rendering.
- `bun run check` and `bun run sensors all` pass.
