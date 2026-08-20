---
id: qui-pweb
status: open
deps: [qui-plcf, qui-paut]
links: []
created: 2026-08-20T19:09:35Z
type: feature
priority: 1
assignee: Jens Kouros
parent: qui-dnab
tags: [plugins, browser, svelte, build, events]
---
# Build and atomically load browser plugins

Support a separate browser entrypoint compiled with Svelte into content-hashed ESM and CSS, exposed through plugin inventory and dynamically registered as a candidate before an atomic UI swap.

## Scope

- Compile browser TypeScript/Svelte into `app-<hash>.js` and `app-<hash>.css` artifacts.
- Expose enabled plugin inventory with plugin ID, bundle/CSS URLs, and content hash while constraining served files to plugin roots.
- Dynamically import and validate browser candidates, then replace plugin-owned registrations and stylesheets together.
- Notify browsers of plugin changes through the existing event hub/SSE transport.

## Acceptance Criteria

- Browser build changes the hash when JavaScript or CSS content changes.
- Inventory contains only trusted, enabled, valid browser plugins and safe artifact URLs.
- Browser registration is candidate-based; failed imports/validation retain the previous working UI and CSS.
- Successful reload disposes old browser registrations and stylesheet without a page or Quincy restart.
- `plugins.changed` causes inventory reconciliation without duplicate registrations or stale CSS.
- Tests cover hashes, inventory security, dynamic loading, atomic swap, rollback, notification, and CSS disposal.
- `bun run check` and `bun run sensors all` pass.
