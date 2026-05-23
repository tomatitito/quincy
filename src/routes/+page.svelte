<script lang="ts">
  import AppHeader from "$lib/components/AppHeader.svelte";
  import KanbanBoard from "$lib/components/KanbanBoard.svelte";
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
      <span>Total: 3</span>
      <span>Open: 2</span>
      <span>Closed: 1</span>
      <span>Ready: 1</span>
      <span>Critical path: 0 edges</span>
    </div>
  </section>

  <main class="content">
    <KanbanBoard />
  </main>
</div>
