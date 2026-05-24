<script lang="ts">
  import { invalidateAll } from "$app/navigation";
  import AppHeader from "$lib/components/AppHeader.svelte";
  import GraphView from "$lib/components/GraphView.svelte";
  import KanbanBoard from "$lib/components/KanbanBoard.svelte";

  let { data } = $props();
  let activeTab = $state<"graph" | "kanban" | "details">("graph");

  const tickets = $derived(data.graph.tickets);
  const openCount = $derived(tickets.filter((ticket) => ticket.status === "open").length);
  const closedCount = $derived(tickets.filter((ticket) => ticket.status === "closed").length);
  const readyCount = $derived(tickets.filter((ticket) => ticket.ready).length);

  function refreshTickets() {
    void invalidateAll();
  }
</script>

<svelte:head>
  <title>Quincy</title>
</svelte:head>

<div class="app-shell">
  <AppHeader onRefresh={refreshTickets} />

  <section class="tabs" aria-label="Workspace summary">
    <nav class="tabs-nav" aria-label="Views">
      <button type="button" class:active={activeTab === "graph"} onclick={() => (activeTab = "graph")}>Graph</button>
      <button type="button" class:active={activeTab === "kanban"} onclick={() => (activeTab = "kanban")}>Kanban</button>
      <button type="button" class:active={activeTab === "details"} onclick={() => (activeTab = "details")}>Details</button>
    </nav>
    <div class="stats-row">
      <span>Total: {tickets.length}</span>
      <span>Open: {openCount}</span>
      <span>Closed: {closedCount}</span>
      <span>Ready: {readyCount}</span>
      {#if data.graph.graph.hasCycle}
        <span class="stats-warning">Dependency cycle detected</span>
      {:else}
        <span>Critical path: {data.graph.graph.criticalPath.length} edges</span>
      {/if}
    </div>
  </section>

  <main class="content">
    {#if activeTab === "graph"}
      <GraphView tickets={data.graph.tickets} graph={data.graph.graph} />
    {:else if activeTab === "kanban"}
      <KanbanBoard columns={data.kanban.columns} />
    {:else}
      <section class="empty-state">Select a ticket in Graph or Kanban to inspect details.</section>
    {/if}
  </main>
</div>
