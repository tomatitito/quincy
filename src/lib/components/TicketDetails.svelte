<script lang="ts">
  import hljs from "highlight.js";
  import "highlight.js/styles/github-dark.css";
  import { marked, type Tokens } from "marked";
  import type { TicketView } from "$lib/domain/tickets";

  interface Props {
    ticket?: TicketView;
  }

  let { ticket }: Props = $props();
  let htmlEnabled = $state(false);
  let previousTicketId = $state<string | undefined>();

  $effect(() => {
    if (ticket?.id === previousTicketId) return;
    previousTicketId = ticket?.id;
    htmlEnabled = false;
  });

  let renderedDescription = $derived(ticket?.description ? renderMarkdown(ticket.description, htmlEnabled) : "");

  function renderMarkdown(markdown: string, allowHtml: boolean): string {
    const renderer = new marked.Renderer();
    renderer.code = renderCode;
    renderer.html = ({ text }) => (allowHtml ? text : escapeHtml(text));
    return marked.parse(markdown, { async: false, gfm: true, renderer });
  }

  function renderCode({ text, lang }: Tokens.Code): string {
    const language = lang?.match(/\S+/)?.[0];
    if (language !== undefined && hljs.getLanguage(language) !== undefined) {
      const highlighted = hljs.highlight(text, { language }).value;
      return `<pre><code class="hljs language-${escapeHtml(language)}">${highlighted}</code></pre>`;
    }

    const className = language === undefined ? "hljs" : `hljs language-${escapeHtml(language)}`;
    return `<pre><code class="${className}">${escapeHtml(text)}</code></pre>`;
  }

  function escapeHtml(value: string): string {
    return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
  }
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
      <div class="description-heading">
        <h3>Description</h3>
        {#if ticket.description}
          <button type="button" class="html-toggle" aria-pressed={htmlEnabled} onclick={() => (htmlEnabled = !htmlEnabled)}>
            {htmlEnabled ? "Disable HTML" : "Enable HTML"}
          </button>
        {/if}
      </div>
      {#if ticket.description}
        <div class="ticket-description">{@html renderedDescription}</div>
      {:else}
        <p>No description.</p>
      {/if}
    </section>

    <section>
      <h3>Dependencies</h3>
      {#if ticket.deps.length > 0}
        <ul class="dependency-list">
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
    height: calc(100% - 32px);
    margin: 16px 18px;
    max-width: 720px;
    min-height: 0;
    overflow-y: auto;
    padding: 14px;
    scrollbar-width: thin;
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
    margin: 0;
  }

  .description-heading {
    align-items: center;
    display: flex;
    gap: 8px;
    justify-content: space-between;
    margin: 0 0 8px;
  }

  .html-toggle {
    background: var(--body-bg);
    border: 1px solid var(--dim);
    border-radius: 3px;
    color: var(--muted);
    cursor: pointer;
    font-size: 10px;
    padding: 3px 6px;
  }

  .html-toggle[aria-pressed="true"] {
    color: var(--text);
  }

  .ticket-details section + section {
    margin-top: 16px;
  }

  .ticket-description {
    color: var(--text);
    line-height: 1.5;
  }

  .ticket-description :global(:first-child) {
    margin-top: 0;
  }

  .ticket-description :global(:last-child) {
    margin-bottom: 0;
  }

  .ticket-description :global(pre) {
    border-radius: 3px;
    margin: 8px 0;
    overflow-x: auto;
  }

  .ticket-description :global(code) {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
  }

  .ticket-description :global(:not(pre) > code) {
    background: var(--body-bg);
    border: 1px solid var(--dim);
    border-radius: 3px;
    padding: 1px 4px;
  }

  .ticket-description :global(pre code) {
    display: block;
    overflow-x: auto;
    white-space: pre;
  }

  .dependency-list {
    display: grid;
    gap: 6px;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .dependency-list li {
    background: var(--body-bg);
    border: 1px solid var(--dim);
    border-radius: 3px;
    padding: 6px 8px;
  }

  .ticket-details p {
    margin: 0;
  }
</style>
