<script lang="ts">
  import type { KanbanColumn } from "$lib/domain/tickets";
  import { filterKanbanColumnsByVisibility } from "$lib/domain/ticketVisibility";
  import { epicFilterState, setEpicFilterScope, setEpicFilterStatusVisibility, setSelectedEpicIds } from "$lib/infrastructure/inbound/browser/epicFilterState";
  import type { EpicFilterScope, EpicFilterStatusVisibility } from "$lib/infrastructure/inbound/browser/epicFilterState";

  interface Props {
    columns: KanbanColumn[];
  }

  let { columns }: Props = $props();

  const tickets = $derived(columns.flatMap((column) => column.tickets));
  const filteredColumns = $derived(filterKanbanColumnsByVisibility(columns, $epicFilterState));
  const visibleTicketCount = $derived(filteredColumns.reduce((count, column) => count + column.tickets.length, 0));
  const epicTickets = $derived(
    Array.from(new Map(tickets.filter((ticket) => ticket.type === "epic").map((ticket) => [ticket.id, ticket] as const)).values()).sort((left, right) => left.id.localeCompare(right.id)),
  );

  function updateSelectedEpicIds(event: Event) {
    const select = event.currentTarget as HTMLSelectElement;
    setSelectedEpicIds(Array.from(select.selectedOptions, (option) => option.value));
  }

  function setScope(event: Event) {
    setEpicFilterScope((event.currentTarget as HTMLInputElement).value as EpicFilterScope);
  }

  function setStatusVisibility(event: Event) {
    setEpicFilterStatusVisibility((event.currentTarget as HTMLSelectElement).value as EpicFilterStatusVisibility);
  }
</script>

<section aria-label="Kanban board" class="kanban-board">
  <aside aria-label="Kanban epic filters" class="kanban-filter-sidebar">
    <header>
      <h2>Filter</h2>
      <span>{visibleTicketCount} visible</span>
    </header>

    <fieldset class="kanban-filter-group">
      <legend>Scope</legend>
      <label>
        <input type="radio" name="kanban-epic-scope" value="all" checked={$epicFilterState.scope === "all"} onchange={setScope} />
        All tickets
      </label>
      <label>
        <input type="radio" name="kanban-epic-scope" value="epics" checked={$epicFilterState.scope === "epics"} onchange={setScope} />
        Epics only
      </label>
      <label>
        <input type="radio" name="kanban-epic-scope" value="selected" checked={$epicFilterState.scope === "selected"} onchange={setScope} />
        Selected epic(s)
      </label>
    </fieldset>

    <label class="kanban-filter-control">
      <span>Status</span>
      <select value={$epicFilterState.statusVisibility} onchange={setStatusVisibility}>
        <option value="open">Open only</option>
        <option value="all">Open + closed</option>
      </select>
    </label>

    <label class="kanban-filter-control">
      <span>Epics</span>
      <select multiple size={Math.min(6, Math.max(3, epicTickets.length))} onchange={updateSelectedEpicIds}>
        {#each epicTickets as ticket}
          <option value={ticket.id} selected={$epicFilterState.selectedEpicIds.includes(ticket.id)}>{ticket.id} — {ticket.title}</option>
        {:else}
          <option disabled>No epics found</option>
        {/each}
      </select>
    </label>
  </aside>
  {#each filteredColumns as column}
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
