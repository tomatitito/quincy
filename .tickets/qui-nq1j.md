---
id: qui-nq1j
status: closed
deps: []
links: []
created: 2026-06-18T20:31:03Z
type: task
priority: 2
assignee: Jens Kouros
parent: qui-9806
tags: [responsive, mobile, audit]
---
# Audit responsive issues across core views

Review the current application at representative desktop, tablet, and mobile viewport sizes and document concrete usability/layout issues.

## Acceptance Criteria

A prioritized checklist of responsive issues exists for the app shell/navigation, Kanban view, graph view, ticket details if applicable, and shared controls. Each issue includes expected behavior and enough context to create focused implementation tickets. No broad UI rewrite is done in this ticket.

## Audit Findings

Viewport buckets for this responsive epic:

- Desktop: 1200px and wider.
- Tablet: 768px through 1199px.
- Mobile: 767px and narrower.

### Priority 1

#### App shell and workspace layout

Issue: The main route renders each tab directly and only uses CSS media queries for narrow screens. There is no explicit desktop/tablet/mobile layout boundary, so navigation decisions such as mobile ticket selection, mobile details routing, and mobile agent presentation have no single owner.

Viewport: Tablet and mobile.

Expected behavior: Keep route data loading and event-stream setup in `+page.svelte`, but introduce a responsive workspace layout boundary that receives data, active tab, app events, and callbacks. Breakpoints should start as mobile <= 767px, tablet <= 1199px, and desktop otherwise, with values centralized so they can be adjusted later.

Follow-up ticket: `qui-caw8`.

#### Graph mobile direction and selection flow

Issue: Graph layout defaults to left-to-right in component state. On mobile this makes the graph wider than necessary and forces horizontal navigation as the default experience. Ticket selection is local to `GraphView`, so selecting a graph ticket cannot move the workspace to Details on mobile.

Viewport: Mobile.

Expected behavior: Mobile graph should default to top-to-bottom. Selecting a graph ticket on mobile should select that ticket at the workspace level and open Details. Desktop can keep current left-to-right behavior unless the user changes it.

Follow-up ticket: `qui-caw8` for viewport-aware state ownership, then `qui-v9eq` for graph-specific behavior.

#### Details view is a placeholder, not a responsive destination

Issue: The Details tab currently shows only an empty placeholder and does not receive selected ticket state from Graph or Kanban. This blocks the expected mobile single-pane flow where selecting a ticket opens Details.

Viewport: All, but especially mobile.

Expected behavior: Track selected ticket at the workspace level and render a usable single-pane Details view. On mobile, Graph and Kanban selection should route to Details; on desktop/tablet, Details can remain a normal tab until a richer split layout is introduced.

Follow-up ticket: `qui-4phe`.

#### Agent mobile presentation

Issue: Agent is currently a normal tab. Inside the tab, `AgentPanel` collapses its session sidebar above the transcript at <= 760px, but the agreed mobile behavior is a full-screen overlay. The current route has no agent overlay state or return-to-tab behavior.

Viewport: Mobile.

Expected behavior: Agent should present as a full-screen mobile overlay, with a clear close/back action that returns to the last active workspace tab. Desktop/tablet can continue using tab behavior until a side panel is explicitly introduced.

Follow-up ticket: `qui-caw8` for overlay state and flow; agent-specific polish can stay under the agent panel epic if needed.

### Priority 2

#### App shell header and tabs

Issue: At <= 760px the topbar and tabs switch to grid layout, but the tab row remains a fixed row of buttons and the stats row remains fully visible. This is acceptable for four tabs today but brittle as labels or status content grow. The hard-coded project path also consumes header space before truncation.

Viewport: Mobile, some tablet widths.

Expected behavior: Primary navigation and refresh/search controls should remain reachable without page-level horizontal overflow. Stats should be allowed to collapse, wrap below navigation, or hide less important values on mobile. Project path should remain truncated and not compete with controls.

Follow-up ticket: `qui-ykd8`.

#### Kanban mobile scrolling and filter placement

Issue: Kanban uses horizontal scrolling with snap points at <= 760px, and the filter sidebar is the first horizontally-scrolled item. This is touch-friendly enough as a baseline, but it makes filters part of the board content instead of persistent or intentionally discoverable controls.

Viewport: Mobile.

Expected behavior: Keep horizontal scrolling if that remains the chosen interaction, but make filter access deliberate. Options include leaving the filter card first with clearer affordance, moving filters above the board on mobile, or introducing a compact filter drawer later.

Follow-up ticket: `qui-pfup`.

#### Graph controls crowd the graph area

Issue: Graph controls wrap and stretch on mobile, which keeps them reachable, but the controls consume vertical space above a graph canvas that already needs both horizontal and vertical scrolling. The selected-epic multi-select can become tall when active.

Viewport: Mobile and tablet.

Expected behavior: Controls should remain usable without unnecessarily reducing graph canvas space. Consider compact grouping, collapsible advanced filters, or moving less common filters into a secondary row.

Follow-up ticket: `qui-v9eq`.

#### Breakpoint consistency

Issue: Global CSS uses <= 760px while the planned responsive boundary uses <= 767px and <= 1199px. `AgentPanel` also uses 1200px, 900px, 760px, and 420px. These are close but not centralized.

Viewport: All responsive breakpoints.

Expected behavior: Introduce centralized breakpoint constants for behavior decisions. CSS can still use media queries, but values should match the layout boundary or be named/documented as component-specific refinements.

Follow-up ticket: `qui-caw8`.

### Priority 3

#### Tablet behavior is currently incidental

Issue: There is no tablet-specific behavior. Tablet currently receives desktop layout until narrow CSS kicks in near 760px, even though a 768px-1199px viewport has different constraints from desktop.

Viewport: Tablet.

Expected behavior: Tablet should be an explicit mode. Initial behavior can be close to desktop, but code should make it clear where tablet-specific layout decisions belong.

Follow-up ticket: `qui-caw8`.

#### Responsive regression coverage should wait

Issue: There are no automated responsive interaction checks yet. However, the core flows are still being defined, so locking tests now risks testing transient implementation details.

Viewport: Tablet and mobile.

Expected behavior: Defer automated responsive tests until after the layout boundary and first graph/Kanban/app-shell fixes land. Prefer stable selectors and focused flow tests when behavior is settled.

Follow-up ticket: `qui-44k5`.
