<script lang="ts">
  import type { KanbanColumn } from "$lib/domain/tickets";

  interface Props {
    columns: KanbanColumn[];
  }

  let { columns }: Props = $props();
</script>

<section aria-label="Kanban board" class="kanban-board">
  {#each columns as column}
    <article class="kanban-column">
      <header>
        <h2>{column.id.replace("_", " ")}</h2>
        <span>{column.tickets.length}</span>
      </header>
      <div class="kanban-cards">
        {#each column.tickets as ticket}
          <div class="kanban-card">
            <div class="kanban-card-header">
              <strong>{ticket.id}</strong>
              <span class={`status-badge status-${ticket.status.replace("_", "-")}`}>P{ticket.priority}</span>
            </div>
            <p class="kanban-card-title">{ticket.title}</p>
            <div class="kanban-card-meta">
              <span>{ticket.type}</span>
              <span>{ticket.status === "closed" ? "closed" : ticket.ready ? "ready" : "blocked"}</span>
            </div>
          </div>
        {/each}
      </div>
    </article>
  {/each}
</section>
