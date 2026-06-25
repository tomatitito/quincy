<script lang="ts">
  import { deriveGraph, type GraphDerivation } from "$lib/domain/graph";
  import { filterTicketsForGraph } from "$lib/domain/graphFilters";
  import type { TicketView } from "$lib/domain/tickets";
  import { epicFilterState, setEpicFilterScope, setEpicFilterStatusVisibility, setSelectedEpicIds } from "$lib/infrastructure/inbound/browser/epicFilterState";
  import type { EpicFilterScope, EpicFilterStatusVisibility } from "$lib/infrastructure/inbound/browser/epicFilterState";

  interface Props {
    tickets: TicketView[];
    graph: GraphDerivation;
    initialDirection?: "lr" | "tb";
    selectedTicketId?: string;
    onTicketSelect?: (ticketId: string) => void;
  }

  let { tickets, graph, initialDirection = "lr", selectedTicketId, onTicketSelect }: Props = $props();
  let direction = $state<"lr" | "tb">("lr");

  const cardWidth = 220;
  const cardHeight = 104;
  const padding = 48;
  const layerGap = 112;
  const orderGap = 28;

  const filteredTickets = $derived(filterTicketsForGraph(tickets, $epicFilterState));
  const renderedGraph = $derived(isUnfilteredGraph() ? graph : deriveGraph(filteredTickets));
  const ticketById = $derived(new Map(filteredTickets.map((ticket) => [ticket.id, ticket])));
  const selectedFilterEpicIds = $derived(new Set($epicFilterState.scope === "selected" ? $epicFilterState.selectedEpicIds : []));
  const epicTickets = $derived(tickets.filter((ticket) => ticket.type === "epic").sort((left, right) => left.id.localeCompare(right.id)));
  const positionedNodes = $derived(
    renderedGraph.nodes.map((node) => ({
      ...node,
      x: direction === "lr" ? padding + node.layer * (cardWidth + layerGap) : padding + node.order * (cardWidth + orderGap),
      y: direction === "lr" ? padding + node.order * (cardHeight + orderGap) : padding + node.layer * (cardHeight + layerGap),
    })),
  );
  const positionedNodeById = $derived(new Map(positionedNodes.map((node) => [node.id, node])));
  const width = $derived(Math.max(720, positionedNodes.reduce((value, node) => Math.max(value, node.x + cardWidth + padding), 0)));
  const height = $derived(Math.max(360, positionedNodes.reduce((value, node) => Math.max(value, node.y + cardHeight + padding), 0)));
  const layers = $derived(Array.from(new Set(renderedGraph.nodes.map((node) => node.layer))).sort((left, right) => left - right));

  function updateSelectedEpicIds(event: Event) {
    const select = event.currentTarget as HTMLSelectElement;
    setSelectedEpicIds(Array.from(select.selectedOptions, (option) => option.value));
  }

  function isUnfilteredGraph() {
    return $epicFilterState.scope === "all" && $epicFilterState.statusVisibility === "all";
  }

  $effect(() => {
    direction = initialDirection;
  });

  function dependencyPath(source: (typeof positionedNodes)[number], target: (typeof positionedNodes)[number]) {
    if (direction === "lr") {
      const sx = source.x + cardWidth;
      const sy = source.y + cardHeight / 2;
      const tx = target.x;
      const ty = target.y + cardHeight / 2;
      const curve = Math.max(40, (tx - sx) / 2);
      return `M ${sx} ${sy} C ${sx + curve} ${sy}, ${tx - curve} ${ty}, ${tx} ${ty}`;
    }

    const sx = source.x + cardWidth / 2;
    const sy = source.y + cardHeight;
    const tx = target.x + cardWidth / 2;
    const ty = target.y;
    const curve = Math.max(36, (ty - sy) / 2);
    return `M ${sx} ${sy} C ${sx} ${sy + curve}, ${tx} ${ty - curve}, ${tx} ${ty}`;
  }
</script>

<section class="graph-panel" aria-label="Dependency graph">
  <div class="graph-controls">
    <div class="graph-control-segment" aria-label="Graph layout">
      <button type="button" class:active={direction === "lr"} aria-pressed={direction === "lr"} onclick={() => (direction = "lr")}>Left → right</button>
      <button type="button" class:active={direction === "tb"} aria-pressed={direction === "tb"} onclick={() => (direction = "tb")}>Top → bottom</button>
    </div>

    <label class="graph-filter-control">
      <span>Scope</span>
      <select value={$epicFilterState.scope} onchange={(event) => setEpicFilterScope((event.currentTarget as HTMLSelectElement).value as EpicFilterScope)}>
        <option value="all">All tickets</option>
        <option value="epics">Epics only</option>
        <option value="selected">Selected epic(s)</option>
      </select>
    </label>

    <label class="graph-filter-control">
      <span>Status</span>
      <select value={$epicFilterState.statusVisibility} onchange={(event) => setEpicFilterStatusVisibility((event.currentTarget as HTMLSelectElement).value as EpicFilterStatusVisibility)}>
        <option value="open">Open only</option>
        <option value="all">Open + closed</option>
      </select>
    </label>

    {#if $epicFilterState.scope === "selected"}
      <label class="graph-filter-control graph-filter-control-wide">
        <span>Epics</span>
        <select multiple size={Math.min(4, Math.max(2, epicTickets.length))} onchange={updateSelectedEpicIds}>
          {#each epicTickets as ticket}
            <option value={ticket.id} selected={$epicFilterState.selectedEpicIds.includes(ticket.id)}>{ticket.id} — {ticket.title}</option>
          {/each}
        </select>
      </label>
    {/if}
  </div>

  {#if renderedGraph.hasCycle}
    <div class="graph-empty-state graph-cycle-state">
      <strong>Dependency cycle detected</strong>
      <p>Layered ordering is unavailable because the dependency graph is not acyclic.</p>
      {#if renderedGraph.cycle}
        <code>{renderedGraph.cycle.nodeIds.join(" → ")}</code>
      {/if}
    </div>
  {:else if renderedGraph.nodes.length === 0}
    <div class="graph-empty-state">No tickets to render.</div>
  {:else}
    <div class="graph-legend">
      <span><i class="swatch dep"></i> direct dependency</span>
    </div>
    <div class="graph-canvas">
      <div class="graph-stage" style={`width: ${width}px; height: ${height}px;`}>
        <svg class="graph-svg" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
          <defs>
            <marker id="graph-arrow-dep" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
            </marker>
          </defs>

          {#each layers as layer}
            {@const nodesInLayer = positionedNodes.filter((node) => node.layer === layer)}
            {@const minX = Math.min(...nodesInLayer.map((node) => node.x))}
            {@const maxX = Math.max(...nodesInLayer.map((node) => node.x + cardWidth))}
            {@const minY = Math.min(...nodesInLayer.map((node) => node.y))}
            {@const maxY = Math.max(...nodesInLayer.map((node) => node.y + cardHeight))}
            <g>
              <rect class="graph-layer-band" x={minX - 16} y={minY - 34} width={maxX - minX + 32} height={maxY - minY + 50} rx="14" />
              <text class="graph-layer-label" x={minX} y={minY - 14}>Layer {layer}</text>
            </g>
          {/each}

          {#each renderedGraph.dependencyEdges as edge}
            {@const source = positionedNodeById.get(edge.source)}
            {@const target = positionedNodeById.get(edge.target)}
            {#if source && target}
              <path class="graph-edge dependency" d={dependencyPath(source, target)} marker-end="url(#graph-arrow-dep)" />
            {/if}
          {/each}
        </svg>

        {#each positionedNodes as node}
          {@const ticket = ticketById.get(node.id)}
          {#if ticket}
            <button
              type="button"
              class:ready={ticket.ready}
              class:selected={selectedTicketId === ticket.id}
              class:filtered-epic-context={ticket.type === "epic" && selectedFilterEpicIds.has(ticket.id)}
              class="graph-ticket-card"
              style={`left: ${node.x}px; top: ${node.y}px; width: ${cardWidth}px; height: ${cardHeight}px;`}
              onclick={() => onTicketSelect?.(ticket.id)}
            >
              <div class="graph-ticket-card-top">
                <strong>{ticket.id}</strong>
                <span class={`status-badge status-${ticket.status.replace("_", "-")}`}>{ticket.status}</span>
              </div>
              <div class="graph-ticket-card-title">{ticket.title}</div>
              <div class="graph-ticket-card-meta">
                <span>{ticket.type}</span>
                <span>{ticket.ready ? "ready" : "blocked"}</span>
              </div>
            </button>
          {/if}
        {/each}
      </div>
    </div>
  {/if}
</section>
