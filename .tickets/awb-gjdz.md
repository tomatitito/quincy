---
id: awb-gjdz
status: open
deps: []
links: [awb-hcap]
created: 2026-05-23T00:00:00Z
type: epic
priority: 1
assignee: Jens Kouros
tags: [architecture, rewrite, hexagonal, agents, backend, frontend]
---
# Rebuild AWB as Quincy with Svelte and hexagonal boundaries

Rebuild AWB from the ground up as `quincy`, a new Svelte/SvelteKit application around a small, sound hexagonal architecture: SvelteKit route entrypoints, UI components, application use cases, domain types/logic/ports, and infrastructure adapters. The existing AWB codebase may be used as reference material and source for selective copy/paste, but the goal is a new app rather than an incremental refactor. Agent capabilities are intentionally out of scope for this rebuild and will be specified in future tickets when they are reintroduced.

Architecture discussion reference: https://chatgpt.com/share/6a12000f-6820-83eb-8324-2a8b637566cb

## Goals

- Rename/rebuild the app as `quincy`.
- Build `quincy` from the ground up in Svelte/SvelteKit; React is no longer part of the target architecture.
- Use the existing AWB implementation only as a reference and for selectively copying useful logic.
- Do not include agent-related functionality in this rebuild; reintroduction will be planned with future tickets.
- Establish a hexagonal-ish structure with explicit inbound and outbound boundaries.
- Use a Svelte/SvelteKit shape with `src/routes` as the framework entrypoint/controller shell and `src/lib` as the reusable application-code container.
- Keep SvelteKit route files thin; if useful, use a single catch-all API route that delegates to an infrastructure inbound HTTP router.
- Move use-case orchestration into an `application` module with one use-case file per action/view request.
- Keep domain types, pure business logic, and ports separate from HTTP, rendering, configuration loading, and external I/O.
- Treat configuration as a domain port implemented by infrastructure, not as global ambient state imported everywhere.
- Use Svelte stores for UI/config reactivity where appropriate, while keeping the underlying config provider behind a domain port.
- Keep outbound API/filesystem/integration calls in infrastructure and keep UI rendering at the routes/component edge.
- Preserve the core non-agent user experience for loading, filtering, viewing, and navigating tickets.
- Make the ticket directory configurable per repository/project.
- Defer configurable ticket formats to a later ticket/epic; the rebuild should keep seams for it but does not need to implement it.

## Proposed target structure

```txt
src/
  routes/                      # SvelteKit entrypoints/controllers; keep thin
    +page.svelte               # SPA shell if the app remains a true single-page app
    api/
      [...path]/
        +server.ts             # optional thin catch-all API adapter
  lib/                         # SvelteKit application-code container, not a separate layer
    components/                # reusable Svelte UI components
      KanbanBoard.svelte
      TicketCard.svelte
      TicketDetails.svelte
      GraphView.svelte
      ProjectSwitcher.svelte
      ...
    application/               # one use-case orchestrator per action/view request
      getKanbanView.ts
      getGraphView.ts
      getTicketDetails.ts
      switchProject.ts
      ...
    domain/                    # core types, rules, derivations, pure logic, and ports
      tickets.ts
      graph.ts
      config.ts
      filters.ts
      ports.ts
      ...
    infrastructure/            # concrete adapters implementing domain ports
      inbound/
        http/
          apiRouter.ts         # optional internal router delegating to application use cases
      outbound/
        config.ts              # config provider implementation/loading
        tickets.ts             # filesystem ticket repository implementation
        updates.ts             # update-check implementation
        ui.ts                  # optional Svelte-store bridge over ConfigProvider
        ...
```

Use SvelteKit as the target framework. `routes` is the inbound adapter/UI edge, `components` contains reusable Svelte UI components, `application` contains use cases, `domain` contains pure logic and ports, and `infrastructure` contains adapter implementations including HTTP routing, config, filesystem access, update checks, external API calls, and UI-facing stores. `lib` is a SvelteKit convention/container, not an architectural layer by itself. The exact filenames can evolve during implementation, but new code should maintain these responsibilities.

## Scope

### Phase 0: Put architecture sensors in place

- Implement the initial architecture/dependency sensors before starting the Svelte/SvelteKit rebuild.
- Use the sensors to lock in the intended `routes`, `lib/components`, `lib/application`, `lib/domain`, and `lib/infrastructure` boundaries from the beginning.
- Treat `.tickets/awb-hcap.md` as the first implementation ticket for this epic.

### Phase 1: Bootstrap the new Svelte/SvelteKit app

- Create the new `quincy` Svelte/SvelteKit application structure using Bun.
- Treat the current AWB code as reference material, not as the primary implementation to refactor in place.
- Do not carry over React-specific frontend architecture.
- Do not carry over agent-related runtime, UI, API, state, or tests.

### Phase 2: Introduce architectural skeleton

- Add the new `routes`, `lib/components`, `lib/application`, `lib/domain`, and `lib/infrastructure` boundaries.
- Define dependency direction rules:
  - `routes` are SvelteKit entrypoints/controllers; they may call the infrastructure inbound HTTP router, application use cases, and `components`, but should stay thin.
  - `application` defines use cases only; use cases may call `domain` and depend on domain ports, but should not import concrete infrastructure.
  - `domain` owns types, pure logic, and ports; it must stay independent of HTTP, Svelte/React, filesystem, process state, configuration loading, and browser APIs.
  - `infrastructure` owns concrete adapter implementations, including inbound HTTP routing, config loading/resolution, filesystem access, update checks, external API clients, Svelte-store bridges, and implementations of domain ports.

### Phase 3: Reimplement core non-agent behavior

- Route ticket API and page requests through SvelteKit route files.
- Keep `routes/+page.svelte` as the SPA shell and consider `routes/api/[...path]/+server.ts` as a thin catch-all adapter into `lib/infrastructure/inbound/http/apiRouter.ts`.
- Extract one application use case per action/view request, starting with the kanban view request.
- Move ticket loading, project discovery, update checks, config access, external API calls, and other I/O behind domain ports implemented by infrastructure adapters.
- Implement project/repository configuration so the ticket folder is configurable per repository/project.
- Keep the current ticket format initially; configurable ticket formats are explicitly out of scope for this epic except for preserving reasonable seams.
- Keep Svelte/page rendering concerns in `routes` and component files without mixing rendering into infrastructure outbound adapters or application use cases.
- Recreate the important existing non-agent workflows, copying existing logic only where it still fits the new architecture.

### Phase 4: Cleanup and verification

- Remove or ignore obsolete React-era files, exports, config, styles, and dependency paths left behind by the rebuild.
- Add/update tests to target the new boundaries.
- Ensure `bun run check` and the relevant Bun test suites pass.
- Leave clear seams for future configurable ticket formats.
- Leave agent functionality out of scope; future agent work should get its own tickets/epics.

## Acceptance Criteria

- Architecture sensors are in place before the main `quincy` rebuild work begins.
- The rebuilt app is named `quincy` and uses Svelte/SvelteKit, not React.
- No active agent feature code exists in the rebuilt app runtime, UI, server routes, or public API surface.
- The app has explicit request entrypoints in SvelteKit `src/routes/` framework route files.
- Each major non-agent use case is represented by a dedicated orchestrator under `src/lib/application/`.
- Domain types, pure logic, and ports live under `src/lib/domain/` and do not import HTTP, Svelte/React, filesystem, process, config loading, or browser-specific modules.
- External I/O and config implementations live under `src/lib/infrastructure/`, behind domain ports where appropriate.
- Webpage/component rendering lives at the Svelte route/component edge rather than in a separate `views` module.
- Core non-agent workflows work: load tickets, show kanban, show graph, show ticket details, filter/search, switch projects where applicable, and check updates where applicable.
- The ticket directory is configurable per repository/project.
- The current ticket format remains supported; configurable ticket formats are not implemented yet and are tracked as future work when needed.
- Tests and documentation are updated to reflect the new Svelte architecture and the absence of agent functionality.
- `bun run check` passes, or any remaining failures are tracked by follow-up tickets linked from this epic.
