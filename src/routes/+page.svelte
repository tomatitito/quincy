<script lang="ts">
  import AppHeader from "$lib/components/AppHeader.svelte";
  import KanbanBoard from "$lib/components/KanbanBoard.svelte";

  let { data } = $props();

  const tickets = $derived(data.kanban.columns.flatMap((column) => column.tickets));
  const openCount = $derived(tickets.filter((ticket) => ticket.status === "open").length);
  const closedCount = $derived(tickets.filter((ticket) => ticket.status === "closed").length);
  const readyCount = $derived(tickets.filter((ticket) => ticket.ready).length);
</script>

<svelte:head>
  <title>Quincy</title>
</svelte:head>

<div class="app-shell">
  <AppHeader />

  <section class="tabs" aria-label="Workspace summary">
    <nav class="tabs-nav" aria-label="Views">
      <button type="button">Graph</button>
      <button type="button" class="active">Kanban</button>
      <button type="button">Details</button>
    </nav>
    <div class="stats-row">
      <span>Total: {tickets.length}</span>
      <span>Open: {openCount}</span>
      <span>Closed: {closedCount}</span>
      <span>Ready: {readyCount}</span>
      <span>Critical path: 0 edges</span>
    </div>
  </section>

  <main class="content">
    <KanbanBoard columns={data.kanban.columns} />
  </main>
</div>
