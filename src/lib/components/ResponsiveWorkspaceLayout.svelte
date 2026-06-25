<script lang="ts">
  import AgentPanel from "$lib/components/AgentPanel.svelte";
  import AppHeader from "$lib/components/AppHeader.svelte";
  import GraphView from "$lib/components/GraphView.svelte";
  import KanbanBoard from "$lib/components/KanbanBoard.svelte";
  import TicketDetails from "$lib/components/TicketDetails.svelte";
  import type { GraphView as GraphViewData } from "$lib/application/getGraphView";
  import type { KanbanView } from "$lib/application/getKanbanView";
  import { isWorkspacePane, type WorkspacePane, type WorkspaceTab } from "$lib/components/workspaceTabs";
  import type { BrowserAppEventStream } from "$lib/infrastructure/inbound/browser/appEvents";
  import { viewportMode } from "$lib/infrastructure/inbound/browser/viewportMode";

  interface Props {
    data: {
      graph: GraphViewData;
      kanban: KanbanView;
    };
    activeTab: WorkspaceTab;
    selectedTicketId?: string;
    appEvents?: BrowserAppEventStream;
    onRefresh: () => void;
    onTabChange: (tab: WorkspaceTab) => void;
    onTicketSelect: (ticketId: string) => void;
  }

  let { data, activeTab, selectedTicketId, appEvents, onRefresh, onTabChange, onTicketSelect }: Props = $props();
  let lastWorkspaceTab = $state<WorkspacePane>("graph");

  const tickets = $derived(data.graph.tickets);
  const openCount = $derived(tickets.filter((ticket) => ticket.status === "open").length);
  const closedCount = $derived(tickets.filter((ticket) => ticket.status === "closed").length);
  const readyCount = $derived(tickets.filter((ticket) => ticket.ready).length);
  const isMobile = $derived($viewportMode === "mobile");
  const agentOverlayOpen = $derived(isMobile && activeTab === "agent");
  const visibleTab = $derived(agentOverlayOpen ? lastWorkspaceTab : activeTab);
  const graphDirection = $derived(isMobile ? "tb" : "lr");
  const selectedTicket = $derived(tickets.find((ticket) => ticket.id === selectedTicketId));

  $effect(() => {
    if (isWorkspacePane(activeTab)) {
      lastWorkspaceTab = activeTab;
    }
  });

  function selectTab(tab: WorkspaceTab) {
    onTabChange(tab);
  }

  function closeAgentOverlay() {
    onTabChange(lastWorkspaceTab);
  }

  function selectTicket(ticketId: string) {
    onTicketSelect(ticketId);
    if (isMobile) {
      onTabChange("details");
    }
  }
</script>

<div class="app-shell" data-viewport-mode={$viewportMode}>
  <AppHeader {onRefresh} />

  <section class="tabs" aria-label="Workspace summary">
    <nav class="tabs-nav" aria-label="Views">
      <button type="button" class:active={!agentOverlayOpen && visibleTab === "graph"} onclick={() => selectTab("graph")}>Graph</button>
      <button type="button" class:active={!agentOverlayOpen && visibleTab === "kanban"} onclick={() => selectTab("kanban")}>Kanban</button>
      <button type="button" class:active={!agentOverlayOpen && visibleTab === "details"} onclick={() => selectTab("details")}>Details</button>
      <button type="button" class:active={agentOverlayOpen || activeTab === "agent"} onclick={() => selectTab("agent")}>Agent</button>
    </nav>
    <div class="stats-row">
      <span>Total: {tickets.length}</span>
      <span>Open: {openCount}</span>
      <span>Closed: {closedCount}</span>
      <span>Ready: {readyCount}</span>
      {#if data.graph.graph.hasCycle}
        <span class="stats-warning">Dependency cycle detected</span>
      {/if}
    </div>
  </section>

  {#if $viewportMode === "desktop"}
    <main class="content">
      {#if visibleTab === "graph"}
        <GraphView tickets={data.graph.tickets} graph={data.graph.graph} initialDirection={graphDirection} {selectedTicketId} onTicketSelect={selectTicket} />
      {:else if visibleTab === "kanban"}
        <KanbanBoard columns={data.kanban.columns} {selectedTicketId} onTicketSelect={selectTicket} />
      {:else if visibleTab === "details"}
        <TicketDetails ticket={selectedTicket} />
      {:else}
        <AgentPanel {appEvents} />
      {/if}
    </main>
  {:else if $viewportMode === "tablet"}
    <main class="content">
      {#if visibleTab === "graph"}
        <GraphView tickets={data.graph.tickets} graph={data.graph.graph} initialDirection={graphDirection} {selectedTicketId} onTicketSelect={selectTicket} />
      {:else if visibleTab === "kanban"}
        <KanbanBoard columns={data.kanban.columns} {selectedTicketId} onTicketSelect={selectTicket} />
      {:else if visibleTab === "details"}
        <TicketDetails ticket={selectedTicket} />
      {:else}
        <AgentPanel {appEvents} />
      {/if}
    </main>
  {:else}
    <main class="content">
      {#if visibleTab === "graph"}
        <GraphView tickets={data.graph.tickets} graph={data.graph.graph} initialDirection={graphDirection} {selectedTicketId} onTicketSelect={selectTicket} />
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
          <AgentPanel {appEvents} />
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
