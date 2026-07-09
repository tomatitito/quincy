<script lang="ts">
  import type { TicketView } from "$lib/domain/tickets";

  interface Props {
    ticket?: TicketView;
  }

  let { ticket }: Props = $props();
</script>

{#if ticket}
  <article class="ticket-details" aria-label="Ticket details">
    <header>
      <div>
        <strong>{ticket.id}</strong>
        <h2>{ticket.title}</h2>
      </div>
      <span class={`status-badge status-${ticket.status.replace("_", "-")}`}>{ticket.status}</span>
    </header>

    <dl>
      <div>
        <dt>Type</dt>
        <dd>{ticket.type}</dd>
      </div>
      <div>
        <dt>Priority</dt>
        <dd>P{ticket.priority}</dd>
      </div>
      <div>
        <dt>Readiness</dt>
        <dd>{ticket.ready ? "Ready" : "Blocked"}</dd>
      </div>
      <div>
        <dt>Parent</dt>
        <dd>{ticket.parent ?? "None"}</dd>
      </div>
    </dl>

    <section>
      <h3>Description</h3>
      {#if ticket.description}
        <div class="ticket-description">{ticket.description}</div>
      {:else}
        <p>No description.</p>
      {/if}
    </section>

    <section>
      <h3>Dependencies</h3>
      {#if ticket.deps.length > 0}
        <ul>
          {#each ticket.deps as dependency}
            <li>{dependency}</li>
          {/each}
        </ul>
      {:else}
        <p>No dependencies.</p>
      {/if}
    </section>
  </article>
{:else}
  <section class="empty-state">Select a ticket in Graph or Kanban to inspect details.</section>
{/if}

<style>
  .ticket-details {
    background: var(--container-bg);
    border: 1px solid var(--dim);
    border-radius: 4px;
    margin: 16px 18px;
    max-width: 720px;
    padding: 14px;
  }

  .ticket-details header {
    align-items: flex-start;
    display: flex;
    gap: 12px;
    justify-content: space-between;
  }

  .ticket-details strong,
  .ticket-details dt,
  .ticket-details h3 {
    color: var(--muted);
    font-size: 10px;
  }

  .ticket-details h2 {
    color: var(--text);
    font-size: 14px;
    line-height: 1.4;
    margin: 4px 0 0;
  }

  .ticket-details dl {
    display: grid;
    gap: 8px;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    margin: 16px 0;
  }

  .ticket-details dt,
  .ticket-details dd {
    margin: 0;
  }

  .ticket-details dd,
  .ticket-details p,
  .ticket-details li {
    color: var(--text);
  }

  .ticket-details h3 {
    margin: 0 0 8px;
  }

  .ticket-details section + section {
    margin-top: 16px;
  }

  .ticket-description {
    color: var(--text);
    line-height: 1.5;
    white-space: pre-wrap;
  }

  .ticket-details ul {
    display: grid;
    gap: 6px;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .ticket-details li {
    background: var(--body-bg);
    border: 1px solid var(--dim);
    border-radius: 3px;
    padding: 6px 8px;
  }

  .ticket-details p {
    margin: 0;
  }
</style>
