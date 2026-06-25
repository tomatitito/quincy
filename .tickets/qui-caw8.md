---
id: qui-caw8
status: closed
deps: [qui-nq1j]
links: []
created: 2026-06-25T12:50:03Z
type: task
priority: 2
assignee: Jens Kouros
parent: qui-9806
tags: [responsive, mobile, layout]
---
# Introduce responsive workspace layout boundary

Add an explicit responsive layout boundary for Quincy so desktop, tablet, and mobile workspace behavior is deliberate instead of being only incidental CSS. Use AWB as reference material for the approach: viewport modes, small mobile-flow helpers, and a layout component that owns view-specific rendering/navigation decisions. Do not port AWB's React layout wholesale.

## Design

Prefer a small Svelte implementation: keep +page.svelte responsible for route data, event-stream setup, and top-level state; introduce a ResponsiveWorkspaceLayout.svelte component or equivalent focused boundary that receives the current tab, data, appEvents, and callbacks. Add a tiny viewport-mode helper using matchMedia with mobile <= 767px, tablet <= 1199px, desktop otherwise, unless the responsive audit justifies different breakpoints. Keep mobile navigation rules as pure helpers where possible, e.g. selecting a graph/kanban ticket can move to Details on mobile, and agent panel behavior can become tab or overlay behavior later. Keep changes scoped to layout orchestration; view-specific fixes remain in the graph, Kanban, and app-shell tickets.

## Acceptance Criteria

A responsive layout boundary exists and is used by the main route without moving data loading or event-stream responsibilities out of +page.svelte. Desktop behavior remains equivalent to the current app. Tablet and mobile modes are explicit in code, even if individual view refinements remain in follow-up tickets. Mobile-flow decisions that are non-trivial are covered by focused tests or documented as manual checks if the existing test setup cannot cover them. The implementation does not port unrelated AWB abstractions. bun run sensors all passes.


## Notes

**2026-06-25T12:52:56Z**

Decisions: mobile graph should default to top-to-bottom layout; agent should use a full-screen overlay on mobile; defer automated responsive tests until behavior is stable enough to know what to assert; start with AWB-derived breakpoints mobile <= 767px and tablet <= 1199px, but keep them centralized/configurable.
