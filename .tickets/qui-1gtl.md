---
id: qui-1gtl
status: open
deps: [qui-sbrg, qui-pcap, qui-paut, qui-pweb, qui-puis]
links: []
created: 2026-08-07T23:09:47Z
type: feature
priority: 2
assignee: Jens Kouros
parent: qui-dnab
tags: [plugins, lsp, graph, agentic, typescript]
---
# Build LSP change-impact graph plugin

Create native Quincy plugin that uses Language Server Protocol data to visualize semantic impact of code changed by an agent.

Analysis runs once after agent has fully settled, not after every LLM turn or intermediate file write. During execution, plugin captures only lightweight mutation metadata and preserves each touched file's pre-change version. After `agent_settled`, plugin compares final files with preserved versions, identifies changed symbols, queries language server, and publishes graph.

Initial scope:

- TypeScript projects only.
- Functions, classes, methods, modules, references, callers, and callees.
- Changes made during one settled agent run.
- Native Quincy backend service plus Svelte graph panel.
- Agent-callable impact query tool.

Explicitly defer business-workflow inference. LSP reports code structure and relationships; it does not reliably understand application workflows. Workflow roots, framework analyzers, and agent-generated explanations should be designed separately after semantic graph proves useful.

## Design

## Dependency and role

Implement as the architecture stress test for the native plugin platform from parent epic `qui-dnab`; the narrower repository graph migration remains the first planned native-plugin proof. Plugin should validate lifecycle, managed processes, runtime-neutral run/workspace hooks, RPC/events, commands, UI slots, storage, browser loading, and reload behavior without reaching into Quincy internals.

## Package shape

```text
plugins/lsp-impact/
├── quincy-plugin.json
├── server/
│   ├── index.ts
│   ├── lspManager.ts
│   ├── changeTracker.ts
│   ├── symbolDiff.ts
│   └── graphBuilder.ts
├── app/
│   ├── index.ts
│   └── LspImpactPanel.svelte
└── tests/
```

Manifest declares separate server and browser entrypoints.

## Lifecycle

Use agent-run lifecycle rather than individual LLM turn lifecycle:

```text
agent_start
→ begin change set
→ before first mutation of each file: preserve original content/version
→ record subsequent touched paths without analysis
→ agent_settled
→ read final content
→ update/open documents in LSP
→ diff symbols
→ query references/call hierarchy
→ build and publish graph
```

`agent_settled` is required because `turn_end` can occur repeatedly while model continues issuing tools, retries, compaction, or queued follow-ups.

Quincy plugin API should expose semantic hooks rather than raw Pi event objects, for example:

```ts
api.runs.onStarted(...)
api.workspace.onFileMutationStarting(...)
api.workspace.onFileMutationCompleted(...)
api.runs.onSettled(...)
```

A pre-mutation hook is necessary to preserve accurate baseline when worktree already contains unrelated dirty changes. Do not compare only against Git HEAD. Initial version may limit tracked mutations to Quincy/Pi write and edit tools; terminal/external-editor changes can be added later with watcher/snapshot strategy.

## LSP service

Start and stop TypeScript language server as plugin-owned background service over stdio. Implement LSP initialize/initialized, document synchronization, capability checks, shutdown, and exit. Configure command and arguments; expected default is `typescript-language-server --stdio`.

Use server-supported methods:

- `textDocument/documentSymbol`
- `textDocument/references`
- `textDocument/definition`
- `textDocument/implementation`
- `textDocument/prepareCallHierarchy`
- `callHierarchy/incomingCalls`
- `callHierarchy/outgoingCalls`

Optional operations must be gated by advertised capabilities. Bound graph traversal by configurable depth and node count.

## Symbol change detection

For each touched file, compare document symbols before and after settled run. Classify symbols as added, removed, or modified using URI, symbol kind, qualified/container name, and source ranges. Keep uncertainty explicit when ranges move or server cannot provide stable identity.

Graph nodes:

- agent run/change set
- file/module
- function
- method
- class/interface
- reference location when useful

Graph edges:

- `changed`
- `contains`
- `references`
- `defines`
- `implements`
- `calls`
- `called-by`

Every edge records provenance, such as LSP method and server, so observed relationships remain distinguishable from future inferred relationships.

## Backend registration

Server factory should approximately register:

```ts
export default function register(api: QuincyServerPluginApi) {
  const service = new LspImpactService(api.workspace.root);

  api.processes.register({
    id: "lsp-impact",
    start: () => service.start(),
    stop: () => service.stop()
  });

  api.runs.onStarted((run) => service.begin(run));
  api.workspace.onFileMutationStarting((event) => service.captureBaseline(event));
  api.workspace.onFileMutationCompleted((event) => service.recordTouched(event));
  api.runs.onSettled((run) => service.analyze(run));

  api.rpc.register("current", () => service.currentGraph());
  api.commands.register({
    id: "query-code-impact",
    title: "Query code impact",
    execute: (input) => service.query(input)
  });
}
```

Persist latest graph and bounded history in plugin-owned storage. Publish graph update through existing Quincy event hub/SSE plugin event surface.

## Frontend

Frontend factory registers `LspImpactPanel` in documented panel slot. Compile through native plugin frontend build into content-hashed ESM/CSS.

Panel should:

- highlight added, removed, and modified symbols
- group or cluster symbols by module/file
- expand incoming/outgoing calls to bounded depth
- distinguish changed nodes from contextual nodes
- display edge provenance
- filter by change kind and relation kind
- show empty, unsupported, loading, partial, and failed states
- select node to display file path, symbol kind, range, and relation details

Opening file at line can be added if Quincy exposes stable open-location API; otherwise display/copy location in MVP.

## Deferred scope

- Business workflow inference.
- Framework-specific entry-point detection.
- LLM-generated workflow descriptions.
- Runtime tracing.
- Languages other than TypeScript.
- Complete repository-wide call graph.
- Reliable capture of terminal or external-editor changes unless native plugin platform provides baseline-safe events.

Create follow-up tickets only after MVP graph is evaluated.

## Acceptance Criteria

- Plugin installs, starts, stops, and reloads through native Quincy plugin lifecycle.
- TypeScript language server runs as disposable plugin-owned process and shuts down cleanly.
- Plugin begins one change set at agent-run start and analyzes it only after `agent_settled`.
- Original content/version is preserved before first tracked mutation of each file, including when worktree was already dirty.
- Repeated writes to same file during run produce one final before/after comparison.
- Added, removed, and modified TypeScript symbols are identified for tracked files.
- Graph includes containing file/module and supported references, definitions, implementations, incoming calls, and outgoing calls.
- Optional LSP features are capability-gated; unsupported/partial data does not fail whole analysis.
- Traversal depth and node count are bounded.
- Graph records provenance for relationships and does not label inferred business workflows as LSP facts.
- Backend exposes current graph through namespaced plugin RPC and a `query-code-impact` Quincy command callable from Pi through the documented command bridge.
- Existing event/SSE mechanism notifies frontend after graph update.
- Svelte plugin panel renders changed symbols and contextual dependency graph with useful loading, empty, partial, unsupported, and error states.
- Tests cover settled-run timing, repeated mutations, dirty baseline, symbol classification, capability fallback, traversal limits, process disposal, and plugin reload.
- Workflow inference and non-TypeScript languages remain out of scope.
- `bun run check` and `bun run sensors all` pass.
