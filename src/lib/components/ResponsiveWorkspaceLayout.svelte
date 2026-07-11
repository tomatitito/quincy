<script lang="ts">
  import AgentPanel from "$lib/components/AgentPanel.svelte";
  import AppHeader from "$lib/components/AppHeader.svelte";
  import GraphView from "$lib/components/GraphView.svelte";
  import KanbanBoard from "$lib/components/KanbanBoard.svelte";
  import TicketDetails from "$lib/components/TicketDetails.svelte";
  import RepoChangeGraphView from "$lib/experiments/repoChangeGraph/RepoChangeGraphView.svelte";
  import type { RepoChangeGraphView as RepoChangeGraphViewData } from "$lib/experiments/repoChangeGraph/repoChangeGraph";
  import type { GraphView as GraphViewData } from "$lib/application/getGraphView";
  import type { KanbanView } from "$lib/application/getKanbanView";
  import { nextLastWorkspaceTab, responsiveWorkspaceState, tabAfterTicketSelection } from "$lib/components/responsiveWorkspace";
  import type { WorkspacePane, WorkspaceTab } from "$lib/components/workspaceTabs";
  import type { SelectableProject } from "$lib/domain/ports";
  import type { BrowserAppEventStream } from "$lib/infrastructure/inbound/browser/appEvents";
  import { viewportMode } from "$lib/infrastructure/inbound/browser/viewportMode";

  interface Props {
    data: {
      projectPath: string;
      ticketDirectory: string;
      selectableProjects: SelectableProject[];
      graph: GraphViewData;
      kanban: KanbanView;
      repoChangeGraph: RepoChangeGraphViewData;
    };
    activeTab: WorkspaceTab;
    selectedTicketId?: string;
    appEvents?: BrowserAppEventStream;
    onRefresh: () => void;
    onProjectSelect: (projectPath: string) => void;
    onTabChange: (tab: WorkspaceTab) => void;
    onTicketSelect: (ticketId: string) => void;
  }

  let { data, activeTab, selectedTicketId, appEvents, onRefresh, onProjectSelect, onTabChange, onTicketSelect }: Props = $props();
  let lastWorkspaceTab = $state<WorkspacePane>("graph");

  const tickets = $derived(data.graph.tickets);
  const openCount = $derived(tickets.filter((ticket) => ticket.status === "open").length);
  const closedCount = $derived(tickets.filter((ticket) => ticket.status === "closed").length);
  const readyCount = $derived(tickets.filter((ticket) => ticket.ready).length);
  const workspaceState = $derived(responsiveWorkspaceState($viewportMode, activeTab, lastWorkspaceTab));
  const agentOverlayOpen = $derived(workspaceState.agentOverlayOpen);
  const visibleTab = $derived(workspaceState.visibleTab);
  const graphDirection = $derived(workspaceState.graphDirection);
  const selectedTicket = $derived(tickets.find((ticket) => ticket.id === selectedTicketId));

  $effect(() => {
    lastWorkspaceTab = nextLastWorkspaceTab(lastWorkspaceTab, activeTab);
  });

  function selectTab(tab: WorkspaceTab) {
    onTabChange(tab);
  }

  function closeAgentOverlay() {
    onTabChange(lastWorkspaceTab);
  }

  function selectTicket(ticketId: string) {
    onTicketSelect(ticketId);
    const nextTab = tabAfterTicketSelection($viewportMode, activeTab);
    if (nextTab !== activeTab) {
      onTabChange(nextTab);
    }
  }
</script>

<div class="app-shell" data-viewport-mode={$viewportMode}>
  <AppHeader projectPath={data.projectPath} selectableProjects={data.selectableProjects} {onRefresh} {onProjectSelect} />

  <section class="tabs" aria-label="Workspace summary">
    <nav class="tabs-nav" aria-label="Views">
      <button type="button" class:active={!agentOverlayOpen && visibleTab === "graph"} onclick={() => selectTab("graph")}>Graph</button>
      <button type="button" class:active={!agentOverlayOpen && visibleTab === "changes"} onclick={() => selectTab("changes")}>Changes</button>
      <button type="button" class:active={!agentOverlayOpen && visibleTab === "kanban"} onclick={() => selectTab("kanban")}>Kanban</button>
      <button type="button" class:active={!agentOverlayOpen && visibleTab === "details"} onclick={() => selectTab("details")}>Details</button>
      <button type="button" class:active={agentOverlayOpen || activeTab === "agent"} onclick={() => selectTab("agent")}>Agent</button>
    </nav>
    <div class="stats-row">
      <span>Total: {tickets.length}</span>
      <span>Open: {openCount}</span>
      <span>Closed: {closedCount}</span>
      <span>Ready: {readyCount}</span>
      <span>Changed files: {data.repoChangeGraph.nodes.length}</span>
      {#if data.graph.graph.hasCycle}
        <span class="stats-warning">Dependency cycle detected</span>
      {/if}
    </div>
  </section>

  {#if $viewportMode === "desktop"}
    <main class="content">
      {#if visibleTab === "graph"}
        <GraphView tickets={data.graph.tickets} graph={data.graph.graph} initialDirection={graphDirection} {selectedTicketId} onTicketSelect={selectTicket} />
      {:else if visibleTab === "changes"}
        <RepoChangeGraphView nodes={data.repoChangeGraph.nodes} graph={data.repoChangeGraph.graph} initialDirection={graphDirection} />
      {:else if visibleTab === "kanban"}
        <KanbanBoard columns={data.kanban.columns} {selectedTicketId} onTicketSelect={selectTicket} />
      {:else if visibleTab === "details"}
        <TicketDetails ticket={selectedTicket} />
      {:else}
        <AgentPanel {appEvents} projectPath={data.projectPath} />
      {/if}
    </main>
  {:else if $viewportMode === "tablet"}
    <main class="content">
      {#if visibleTab === "graph"}
        <GraphView tickets={data.graph.tickets} graph={data.graph.graph} initialDirection={graphDirection} {selectedTicketId} onTicketSelect={selectTicket} />
      {:else if visibleTab === "changes"}
        <RepoChangeGraphView nodes={data.repoChangeGraph.nodes} graph={data.repoChangeGraph.graph} initialDirection={graphDirection} />
      {:else if visibleTab === "kanban"}
        <KanbanBoard columns={data.kanban.columns} {selectedTicketId} onTicketSelect={selectTicket} />
      {:else if visibleTab === "details"}
        <TicketDetails ticket={selectedTicket} />
      {:else}
        <AgentPanel {appEvents} projectPath={data.projectPath} />
      {/if}
    </main>
  {:else}
    <main class="content">
      {#if visibleTab === "graph"}
        <GraphView tickets={data.graph.tickets} graph={data.graph.graph} initialDirection={graphDirection} {selectedTicketId} onTicketSelect={selectTicket} />
      {:else if visibleTab === "changes"}
        <RepoChangeGraphView nodes={data.repoChangeGraph.nodes} graph={data.repoChangeGraph.graph} initialDirection={graphDirection} />
      {:else if visibleTab === "kanban"}
        <KanbanBoard columns={data.kanban.columns} {selectedTicketId} onTicketSelect={selectTicket} />
      {:else}
        <TicketDetails ticket={selectedTicket} />
      {/if}
    </main>

    {#if agentOverlayOpen}
      <section class="mobile-agent-overlay" aria-label="Agent overlay">
        <header class="mobile-agent-overlay-header">
          <button type="button" onclick={closeAgentOverlay} aria-label="Back to workspace">Back</button>
          <h2>Agent</h2>
        </header>
        <div class="mobile-agent-overlay-body">
          <AgentPanel {appEvents} projectPath={data.projectPath} />
        </div>
      </section>
    {/if}
  {/if}
</div>

<style>
  .mobile-agent-overlay {
    background: var(--body-bg);
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    inset: 0;
    min-height: 0;
    position: fixed;
    z-index: 20;
  }

  .mobile-agent-overlay-header {
    align-items: center;
    background: var(--container-bg);
    border-bottom: 1px solid var(--dim);
    display: grid;
    gap: 12px;
    grid-template-columns: auto minmax(0, 1fr);
    padding: 10px 12px;
  }

  .mobile-agent-overlay-header h2 {
    color: var(--text);
    font-size: 14px;
    margin: 0;
  }

  .mobile-agent-overlay-header button {
    background: transparent;
    border: 1px solid var(--dim);
    border-radius: 3px;
    color: var(--muted);
    cursor: pointer;
    font: inherit;
    padding: 4px 8px;
  }

  .mobile-agent-overlay-body {
    min-height: 0;
    overflow: hidden;
  }
</style>
