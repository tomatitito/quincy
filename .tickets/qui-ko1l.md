---
id: qui-ko1l
status: closed
deps: []
links: []
created: 2026-05-24T00:00:00Z
type: task
priority: 1
assignee: Jens Kouros
parent: awb-gjdz
tags: [architecture, balanced-coupling, modularity, technical-debt]
---
# Address balanced coupling review findings

Capture and address the architectural coupling risks found during a balanced coupling review of Quincy.

Overall verdict: the app is mostly well-balanced for its current size. The domain/application/infrastructure split is healthy, but a few couplings are likely to become painful as project selection, ticket semantics, and additional views evolve.

## Findings

### 1. Graph derivation depends on the richer ticket view model

`src/lib/domain/graph.ts` imports `TicketView`, but graph derivation only appears to need ticket identity and dependency IDs.

This unnecessarily couples graph layout logic to readiness/view concerns owned by `src/lib/domain/tickets.ts`.

Balanced coupling assessment:

- Integration strength: higher than needed, because graph knows the richer ticket view model.
- Distance: low, because both files are in the domain layer.
- Volatility: high, because graph and ticket workflow semantics are core Quincy behavior.

Recommendation: make graph derivation depend on a smaller input contract, such as `{ id, deps }`, or on `Ticket` if that remains sufficient. Keep readiness out of graph derivation unless graph behavior actually depends on readiness.

### 2. Home page loads tickets twice

`src/lib/infrastructure/inbound/pages/loadHomePage.ts` calls both `getGraphView(repository)` and `getKanbanView(repository)`. Each use case reads from the repository independently.

Because the current repository reads files, graph and kanban can theoretically be derived from different snapshots if ticket files change between reads.

Balanced coupling assessment:

- Integration strength: hidden functional coupling between graph and kanban views; they are expected to describe the same ticket set.
- Distance: low today.
- Volatility: medium/high as more page sections are added.

Recommendation: read tickets once for the home page and derive both graph and kanban data from the same snapshot. This could be done with a page-level application function such as `getHomeView(repository)` or by splitting pure derivation functions from repository-reading use cases.

### 3. Composition logic is duplicated between page and API

Both `src/lib/infrastructure/inbound/pages/loadHomePage.ts` and `src/lib/infrastructure/inbound/http/apiRouter.ts` construct config and repository instances manually.

Balanced coupling assessment:

- Integration strength: functional coupling; both places must change together if config or repository construction changes.
- Distance: low now.
- Volatility: medium if project selection/config evolves.

Recommendation: avoid over-abstracting immediately, but introduce a small composition helper once config becomes dynamic, for example `createTicketRepository()` or `createAppServices()`.

### 4. AppHeader hard-codes the local project path

`src/lib/components/AppHeader.svelte` contains `/Volumes/sourcecode/personal/quincy` directly in the UI.

This leaks local environment/configuration knowledge into a presentation component.

Balanced coupling assessment:

- Integration strength: intrusive/functional coupling to the local environment.
- Distance: medium; UI knows something config/infrastructure should own.
- Volatility: medium/high if project selection is planned.

Recommendation: pass project path/config into `AppHeader` from page data, even if the config provider remains static for now.

### 5. Core IDs are still stringly typed

`TicketId`, `DependencyId`, and related aliases are plain TypeScript string aliases. This documents intent but does not protect boundaries.

Balanced coupling assessment:

- Integration strength: stringly-typed model coupling.
- Distance: low inside the domain, medium once values flow into UI/API.
- Volatility: high because ticket IDs and dependency IDs are core concepts.

Recommendation: do not introduce a large value-object framework. If ID mixups begin to appear, add small branded types for core IDs only.

## Suggested implementation order

1. Remove `TicketView` dependency from graph derivation.
2. Read tickets once for the home page and derive graph/kanban from one snapshot.
3. Pass project path/config into `AppHeader` instead of hard-coding it.
4. Consider a small composition helper when project config becomes dynamic.
5. Consider branded ID types only if string ID mistakes appear.

## Acceptance Criteria

- `deriveGraph` no longer depends on `TicketView` unless readiness is explicitly required by graph behavior.
- The home page derives graph and kanban from a single ticket snapshot.
- `AppHeader` receives the displayed project path as data/props instead of hard-coding the local path.
- Any introduced composition helper remains small and does not obscure the current architecture.
- Architecture and static sensors pass.
