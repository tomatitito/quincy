---
id: qui-dnab
status: open
deps: []
links: []
created: 2026-08-07T22:11:07Z
type: epic
priority: 1
assignee: Jens Kouros
tags: [architecture, plugins, agentic, self-extension]
---
# Make Quincy self-extensible through native plugins

Quincy should become self-extensible: an agent running inside Quincy can author, build, install, activate, and reload trusted Quincy plugins without editing or restarting core application code.

This is distinct from literal binary self-modification. Agents can already edit Quincy source through Pi tools, and Vite HMR can apply frontend source changes during development. Goal is stable runtime extension mechanism comparable to Pi extensions and bb plugins.

Current architecture already provides useful foundations:

- `src/lib/domain/ports.ts` defines agent-facing ports.
- `src/lib/infrastructure/outbound/piRuntimeRepository.ts` embeds Pi SDK and owns agent sessions.
- `src/lib/infrastructure/outbound/agentAppEvents.ts` translates Pi events.
- `src/lib/infrastructure/outbound/appEventHub.ts` and SSE deliver updates to browser.
- `pi/extensions/delegation/index.ts` proves Pi extension registration works, but extension path is hard-coded.
- Vite provides frontend HMR under `bun run dev`; production source changes require rebuild/restart.

Two extension levels must remain explicit:

1. Pi extensions extend agent behavior: tools, commands, prompts, lifecycle hooks, and model/session behavior.
2. Native Quincy plugins extend Quincy application surfaces: Svelte UI, ticket actions, routes, services, storage, background work, and agent contributions.

Implement native Quincy plugin API while reusing Pi extensions for agent-runtime-specific capabilities.

## Design

## Core boundary

Treat Quincy core as a recovery-oriented microkernel plus its defining markdown-ticket workflow. Core must remain usable when every native plugin is disabled.

Keep in core:

- process bootstrap, configuration, project selection, and workspace identity
- markdown ticket model, repository port, ticket actions, Kanban, dependency graph, and ticket details
- agent session orchestration and semantic lifecycle events
- Pi runtime adapter behind the existing agent port; Pi-specific behavior remains in Pi extensions
- plugin discovery, trust, lifecycle, ownership, disposal, atomic activation, rollback, diagnostics, and recovery controls
- generic application shell, documented UI slots, namespaced RPC dispatch, and event transport over the existing HTTP/SSE infrastructure

Move optional or volatile capabilities into native plugins:

- repository-change graph under `src/lib/experiments/repoChangeGraph/` as the first platform proof
- LSP change-impact graph from child ticket `qui-1gtl`
- terminal workspace, including its server repository, HTTP handling, panel, and tab
- future analyzers, visualizers, background workers, alternate storage integrations, and optional ticket/UI contributions

The ticket workflow stays in core initially because it defines Quincy and its parts co-evolve closely. Reconsider extracting it only if Quincy becomes a generic agent workspace rather than a markdown-ticket workbench.

`ResponsiveWorkspaceLayout.svelte` and `apiRouter.ts` must stop being feature switchboards. Core registries should render UI contributions and dispatch namespaced backend contributions without hard-coded imports or route branches for each plugin.

## Role models

- Pi: https://github.com/earendil-works/pi
  - Extension docs: `packages/coding-agent/docs/extensions.md`
  - Loader/runner: `packages/coding-agent/src/core/extensions/`
  - Pattern: TypeScript factory receives controlled API, registers tools/commands/hooks, `/reload` recreates runtime.
- bb: https://github.com/get-bb/bb
  - Plugin authoring skill: `apps/server/src/services/skills/builtin-skills/bb-plugin-authoring/SKILL.md`
  - Plugin API/runtime: `apps/server/src/services/plugins/plugin-api.ts`, `plugin-runtime.ts`
  - Frontend loader: `apps/app/src/lib/plugin-frontend.ts`
  - Pattern: backend candidate registration plus atomic activation; browser imports content-hashed frontend bundles and replaces UI registrations.

## Plugin contract

Use package-shaped plugins with explicit manifest and separate server/browser entrypoints:

```text
my-plugin/
├── quincy-plugin.json
├── server.ts
├── app.ts
└── MyPanel.svelte
```

Example manifest:

```json
{
  "id": "my-plugin",
  "server": "./server.ts",
  "app": "./app.ts"
}
```

Both entrypoints default-export a factory. Importing module returns function; host explicitly invokes it with controlled API.

```ts
export default function register(api: QuincyPluginApi) {
  api.registerTicketAction(...);
}
```

## Lifecycle and registration

Define lifecycle `discover -> load candidate -> register -> validate -> start -> activate -> stop/dispose -> reload`.

Registration is host-owned:

```text
plugin factory
→ controlled API calls
→ candidate registration records
→ validation
→ atomic registry swap
→ runtime dispatch/rendering
```

Failed reload must preserve previous working plugin. Every registration is owned by plugin ID and disposable so unloading removes all tools, handlers, routes, UI, CSS, timers, and services.

Start with narrow, stable contracts instead of arbitrary access to Svelte/server internals. This keeps high-volatility plugin code contract-coupled to core rather than intrusively coupled.

Expose capability-specific namespaces through one lifecycle-owned API rather than one broad service API:

```ts
export default function register(api: QuincyPluginApi) {
  api.ui.registerPanel({
    id: "impact",
    title: "Impact",
    component: ImpactPanel,
  });

  api.commands.register({
    id: "impact.refresh",
    title: "Refresh impact graph",
    execute: refreshImpactGraph,
  });
}
```

Initial namespaces:

- `api.ui` — panels, ticket-detail tabs/actions, and header actions
- `api.commands` — user- or agent-invokable application commands
- `api.agents` — agent tools and semantic run lifecycle hooks
- `api.rpc` — namespaced browser-to-server calls
- `api.events` — documented publish/subscribe contracts
- `api.storage` — plugin-owned persistence
- `api.processes` — managed background processes
- `api.workspace` — project identity and documented file-mutation hooks

Server and browser entrypoints receive only namespaces available in their runtime. Core records every contribution and managed resource under plugin ID so disable or reload disposes them together.

Avoid unrestricted `registerRoute(...)`, generic `registerService(...)`, direct filesystem access through host internals, and access to Svelte component instances or private registries. Generic route and service registration would create a service locator and make plugins depend on core structure. Add broader capabilities only from demonstrated plugin needs.

## Frontend loading

Jiti can load server TypeScript, but browser cannot load raw `.svelte` files. Add plugin build command using Vite/Rollup to compile `app.ts` and Svelte components into content-hashed ESM and CSS:

```text
dist/app-<hash>.js
dist/app-<hash>.css
```

Expose plugin inventory endpoint containing plugin ID, bundle URL, CSS URL, and hash. Browser plugin manager dynamically imports bundle URL with hash, invokes frontend factory against candidate registry, then swaps old registrations and stylesheet.

Use explicit Svelte stores/registries rendered by core slot components. Do not let plugins query or mutate internal component instances.

## Reload loop

```text
Agent edits plugin server.ts/MyPanel.svelte
→ `quincy plugin build`
→ `quincy plugin reload <id>`
→ server loads and validates backend candidate
→ server atomically activates candidate
→ existing event hub/SSE emits `plugins.changed`
→ browser imports new content-hashed bundle
→ browser replaces plugin-owned UI registrations and CSS
```

Content hashes are required because browser ESM modules are cached. Vite HMR remains source-development mechanism; plugin reload is explicit production/runtime mechanism.

## Agent bootstrap

Provide:

- built-in `quincy-plugin-authoring` skill documenting contracts, examples, build/test/reload flow, and security
- `quincy plugin new`, `build`, `install`, `list`, `reload`, `disable`, and `remove` commands
- agent-callable build/reload tools or CLI available through Pi bash
- example plugin serving as executable documentation
- visible build/load diagnostics in existing agent/UI event stream

For Pi-level extension, separately support trusted project `.pi/extensions` discovery and expose Pi runtime reload. Do not duplicate Pi agent lifecycle APIs in native Quincy plugin API.

## Security

Plugins are arbitrary code:

- require explicit trust before loading project-local plugins
- display source and permissions/provenance
- validate manifest and IDs
- constrain served files to plugin root
- prevent path traversal
- time-box startup/shutdown where practical
- document that server plugins have process/data access and frontend plugins execute same-origin JavaScript
- use iframe/process isolation later if untrusted plugins become a requirement

## Suggested implementation order

1. Manifest/schema, discovery, trust, and server plugin registry.
2. Lifecycle with candidate validation, disposal, atomic reload, and failure rollback.
3. CLI scaffolding/build/install/reload commands.
4. Browser inventory, UI slot registry, hashed ESM/CSS loader, and SSE reload notification.
5. Convert repository-change graph into the first native plugin and remove its hard-coded page/layout wiring.
6. Convert terminal workspace into a bundled native plugin.
7. Add built-in authoring skill, examples, diagnostics, and tests.
8. Add broader surfaces only from demonstrated plugin needs.

## Acceptance Criteria

- Native plugin manifest supports separate server and browser entrypoints.
- Server loads trusted TypeScript plugin factory through documented API without plugin access to private registries.
- Plugin can register at least one server contribution and cleanly dispose it.
- Frontend plugin build compiles TypeScript/Svelte into content-hashed ESM and CSS.
- Browser loads plugin inventory and renders at least one contribution in a documented UI slot.
- Capability-specific API namespaces cover UI, commands, agents, RPC, events, storage, managed processes, and workspace access without exposing private host registries.
- Core remains usable with all native plugins disabled.
- `ResponsiveWorkspaceLayout.svelte` and `apiRouter.ts` do not require feature-specific branches for plugin contributions.
- Repository-change graph runs as a native plugin without direct imports from core page loading or workspace layout.
- Terminal workspace runs as a bundled native plugin.
- Reload disposes old registrations and activates changed backend and frontend code without restarting Quincy.
- Failed build/load/reload leaves previous working plugin active and exposes concise diagnostics.
- Existing event hub/SSE notifies browser of plugin changes.
- Agent can scaffold, build, install, and reload example plugin from a Quincy thread using documented commands/skill.
- Project-local plugins require explicit trust; plugin provenance and full-trust implications are visible.
- Pi extension responsibilities and native Quincy plugin responsibilities are documented separately.
- Automated tests cover discovery, registration ownership, disposal, reload rollback, bundle hash changes, browser reconciliation, and trust rejection.
- `bun run check` and `bun run sensors all` pass.

