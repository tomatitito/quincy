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

Quincy should become self-extensible: an agent running Pi's CLI/TUI inside Quincy's existing terminal panel can author, build, install, activate, and reload trusted Quincy plugins without editing or restarting core application code.

This is distinct from literal binary self-modification. Agents can already edit Quincy source through Pi tools, and Vite HMR can apply frontend source changes during development. Goal is stable runtime extension mechanism comparable to Pi extensions and bb plugins.

Current architecture already provides useful migration inputs:

- `src/lib/domain/ports.ts` defines agent-facing ports.
- `src/lib/infrastructure/outbound/piRuntimeRepository.ts` embeds Pi SDK and owns agent sessions.
- `src/lib/infrastructure/outbound/agentAppEvents.ts` translates Pi events.
- `src/lib/infrastructure/outbound/appEventHub.ts` and SSE deliver updates to browser.
- Quincy's terminal panel can host Pi's native CLI/TUI rather than reproducing its transcript UI.
- `pi/extensions/delegation/index.ts` proves Pi extension registration works, but extension path is hard-coded.
- Vite provides frontend HMR under `bun run dev`; production source changes require rebuild/restart.

Two extension levels must remain explicit:

1. Pi extensions extend agent behavior: tools, commands, prompts, lifecycle hooks, and model/session behavior.
2. Native Quincy plugins extend Quincy application surfaces: Svelte UI, ticket actions, routes, services, storage, background work, semantic run/workspace reactions, and commands callable by users or agents.

Implement native Quincy plugin API while reusing Pi extensions for agent-runtime-specific capabilities. Pi's CLI/TUI in the terminal is the preferred agent user interface. Retain the parallel Agent panel until terminal-first Pi and the semantic bridge are verified, then retire its duplicated presentation in child ticket `qui-aret`. This replaces the presentation layer, not Quincy's semantic awareness of agent activity.

## Design

## Core boundary

Treat Quincy core as a recovery-oriented microkernel plus its defining markdown-ticket workflow. Core must remain usable when every native plugin is disabled.

Keep in core:

- process bootstrap, configuration, project selection, and workspace identity
- markdown ticket model, repository port, ticket actions, Kanban, dependency graph, and ticket details
- runtime-neutral semantic run/workspace events and ticket/run association
- authenticated local transport used by bundled integrations to publish those semantic events
- plugin discovery, trust, lifecycle, ownership, disposal, atomic activation, rollback, diagnostics, and recovery controls
- generic application shell, documented UI slots, namespaced RPC dispatch, and event transport over the existing HTTP/SSE infrastructure

Move optional or volatile capabilities into native plugins:

- repository-change graph under `src/lib/experiments/repoChangeGraph/` as the first platform proof
- LSP change-impact graph from child ticket `qui-1gtl`
- terminal workspace, including its server repository, HTTP handling, panel, and tab
- future analyzers, visualizers, background workers, alternate storage integrations, and optional ticket/UI contributions

The ticket workflow stays in core initially because it defines Quincy and its parts co-evolve closely. Reconsider extracting it only if Quincy becomes a generic agent workspace rather than a markdown-ticket workbench.

The custom Agent panel is not a long-term core surface to preserve. The bundled terminal workspace should launch and host Pi's CLI/TUI as the primary interaction surface. Pi continues to own transcript rendering, model and session behavior, commands, prompts, tools, and native lifecycle details. Quincy must keep the Agent panel available until child ticket `qui-aret`, whose dependencies and acceptance criteria require the replacement path to be verified before duplicated presentation is removed.

`ResponsiveWorkspaceLayout.svelte` and `apiRouter.ts` must stop being feature switchboards. Core registries should render UI contributions and dispatch namespaced backend contributions without hard-coded imports or route branches for each plugin.

## Pi integration boundary

Terminal-first operation does not mean treating Pi as an opaque PTY process. Raw terminal output is sufficient for interaction and transcript presentation, but it is not a stable input for structured native-plugin features such as run-aware LSP impact analysis.

Provide a thin, headless Quincy–Pi bridge, likely as a bundled Pi extension communicating with Quincy over a local authenticated structured channel. The bridge translates selected Pi lifecycle information into runtime-neutral Quincy events such as:

- run started and run settled
- file mutation starting and completed
- ticket/run association
- diagnostics associated with a run or workspace mutation

These are Quincy semantic contracts, not a mirror of Pi's event schema. The bridge owns adaptation across Pi versions; native plugins consume stable Quincy run/workspace hooks and never subscribe to raw Pi events. Keep the channel local, authenticated, and scoped to the active Quincy workspace. Do not add a general remote-agent protocol or duplicate Pi session control unless a demonstrated plugin need requires it.

This boundary also unifies embedded and external Pi usage: any Pi session with the bundled bridge can participate in Quincy semantics while retaining Pi's native UI and behavior. Without the bridge, Pi remains fully usable in the terminal, but structured Quincy features may not know which run or file operation produced a change.

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
- `api.runs` — runtime-neutral run lifecycle, ticket association, and diagnostics hooks
- `api.rpc` — namespaced browser-to-server calls
- `api.events` — documented publish/subscribe contracts
- `api.storage` — plugin-owned persistence
- `api.processes` — managed background processes
- `api.workspace` — project identity and documented file-mutation hooks

Server and browser entrypoints receive only namespaces available in their runtime. Core records every contribution and managed resource under plugin ID so disable or reload disposes them together.

Do not introduce a broad `api.agents` namespace. It would couple native plugins to Pi's tools, sessions, or lifecycle vocabulary. `api.runs` and `api.workspace` expose the semantic facts native plugins need independent of the runtime that produced them. `api.commands` remains the bridge for functionality that should be invokable from Quincy UI, Pi, or another authorized caller; Pi-specific tools or commands stay Pi extensions and may call a documented Quincy command rather than becoming native plugin registrations.

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
Pi runs in Quincy's terminal panel
→ agent edits plugin server.ts/MyPanel.svelte
→ `quincy plugin build`
→ `quincy plugin test <id>`
→ `quincy plugin reload <id>`
→ server loads and validates backend candidate
→ server atomically activates candidate
→ existing event hub/SSE emits `plugins.changed`
→ browser imports new content-hashed bundle
→ browser replaces plugin-owned UI registrations and CSS
```

Content hashes are required because browser ESM modules are cached. Vite HMR remains source-development mechanism; plugin reload is explicit production/runtime mechanism.

The terminal-first loop is the self-extension UI: Pi edits files and invokes ordinary `quincy plugin build/test/reload` commands, while Quincy hosts, validates, and atomically activates the result. Quincy does not need a second transcript, prompt composer, tool renderer, or bespoke agent action protocol to support self-extension. Build, test, activation, and rollback diagnostics should be available through CLI output and the structured Quincy event/diagnostic surfaces.

## Agent bootstrap

Provide:

- built-in `quincy-plugin-authoring` skill documenting contracts, examples, build/test/reload flow, and security
- `quincy plugin new`, `build`, `test`, `install`, `list`, `reload`, `disable`, and `remove` commands
- CLI available directly through Pi's native bash/tool workflow
- example plugin serving as executable documentation
- visible build/load diagnostics in CLI output and documented Quincy diagnostic events
- bundled headless Pi extension that connects to the local authenticated bridge and publishes the narrow semantic event set

For Pi-level extension, separately support trusted project `.pi/extensions` discovery and Pi's native reload behavior. Do not duplicate Pi commands, transcript/session APIs, or lifecycle details in native Quincy plugin API. The bundled bridge is integration infrastructure, not a replacement agent runtime owned by Quincy.

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

Ticket metadata is the source of truth for ordering. The thirteen migration stages map to real tickets as follows:

1. `qui-ev2v` — make terminal-hosted Pi the primary workflow while retaining the Agent panel.
2. `qui-sbrg` — add the authenticated Pi semantic bridge after terminal viability.
3. `qui-pmft` — define manifest/schema, discovery, provenance, and trust; this can proceed in parallel with `qui-sbrg` after `qui-ev2v`.
4. `qui-plcf` — add server candidate registration, ownership/disposal, atomic activation/reload, diagnostics, and rollback after `qui-pmft`.
5. `qui-pcap` — add narrow commands, runs/workspace hooks, events, storage, RPC, and demonstrated managed-process capabilities; this joins `qui-sbrg` and `qui-plcf`.
6. `qui-paut` — add plugin CLI/scaffolding/build/test/install/list/reload/disable/remove, authoring skill, and executable example.
7. `qui-pweb` — add browser inventory/build/loading, content-hashed ESM/CSS, atomic browser swap, CSS disposal, and plugin-change notification.
8. `qui-puis` — add migration-proven workspace/header/ticket-detail UI slots after server capabilities and browser loading.
9. `qui-rchg` — migrate repository-change graph into the first substantial native plugin and remove hard-coded core wiring.
10. `qui-tplg` — migrate terminal workspace into a trusted bundled plugin after the first native plugin proves the path.
11. `qui-aret` — retire duplicated Agent-panel presentation only after `qui-sbrg` and `qui-tplg` complete and their replacement-path evidence is verified.
12. `qui-1gtl` — implement the LSP architecture stress test once every platform capability it consumes is available; it can proceed in parallel with terminal migration and Agent-panel cleanup because it does not consume them.
13. `qui-papi` — perform final API audit, versioning, and documentation stabilization after the repository graph, terminal, Agent-panel retirement, and LSP consumer.

This is intentionally not a single chain: bridge and manifest work can proceed in parallel, and the LSP consumer does not wait on the unrelated terminal migration or Agent-panel cleanup. Transitive dependencies still make manifest/lifecycle and server/browser prerequisites visible in the graph.

## Acceptance Criteria

- Native plugin manifest supports separate server and browser entrypoints.
- Server loads trusted TypeScript plugin factory through documented API without plugin access to private registries.
- Plugin can register at least one server contribution and cleanly dispose it.
- Frontend plugin build compiles TypeScript/Svelte into content-hashed ESM and CSS.
- Browser loads plugin inventory and renders at least one contribution in a documented UI slot.
- Capability-specific API namespaces cover UI, commands, runs, RPC, events, storage, managed processes, and workspace access without exposing private host registries.
- Core remains usable with all native plugins disabled.
- `ResponsiveWorkspaceLayout.svelte` and `apiRouter.ts` do not require feature-specific branches for plugin contributions.
- Repository-change graph runs as a native plugin without direct imports from core page loading or workspace layout.
- Terminal workspace runs as a bundled native plugin and hosts Pi's native CLI/TUI as the preferred agent interface.
- Quincy does not require a separate Agent-panel transcript renderer, prompt composer, or Pi tool renderer for the terminal-first workflow.
- A bundled headless Pi extension publishes the documented run started/settled, file mutation starting/completed, ticket/run association, and diagnostic semantics over a local authenticated structured channel.
- Native plugins consume runtime-neutral `api.runs` and `api.workspace` hooks rather than raw Pi events or Pi session objects.
- Pi remains usable through the terminal without the semantic bridge, with the documented limitation that run-aware native plugin features are unavailable.
- Reload disposes old registrations and activates changed backend and frontend code without restarting Quincy.
- Failed build/load/reload leaves previous working plugin active and exposes concise diagnostics.
- Existing event hub/SSE notifies browser of plugin changes.
- Agent can scaffold, build, test, install, and reload an example plugin from Pi in Quincy's terminal using documented CLI commands and authoring skill.
- Project-local plugins require explicit trust; plugin provenance and full-trust implications are visible.
- Pi extension/runtime responsibilities, the thin semantic bridge, and native Quincy plugin responsibilities are documented separately.
- Automated tests cover discovery, registration ownership, disposal, reload rollback, bundle hash changes, browser reconciliation, trust rejection, bridge authentication, and Pi-to-Quincy semantic event adaptation.
- `bun run check` and `bun run sensors all` pass.
