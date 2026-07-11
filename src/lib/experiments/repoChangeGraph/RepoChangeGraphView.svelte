<script lang="ts">
  import type { GraphDerivation } from "$lib/domain/graph";
  import type { RepoChangeNode } from "$lib/experiments/repoChangeGraph/repoChangeGraph";

  interface Props {
    nodes: RepoChangeNode[];
    graph: GraphDerivation;
    initialDirection?: "lr" | "tb";
  }

  let { nodes, graph, initialDirection = "lr" }: Props = $props();
  let direction = $state<"lr" | "tb">("lr");

  const cardWidth = 340;
  const cardHeight = 142;
  const padding = 48;
  const layerGap = 112;
  const orderGap = 28;

  const nodeById = $derived(new Map(nodes.map((node) => [node.id, node])));
  const positionedNodes = $derived(
    graph.nodes.map((node) => ({
      ...node,
      x: direction === "lr" ? padding + node.layer * (cardWidth + layerGap) : padding + node.order * (cardWidth + orderGap),
      y: direction === "lr" ? padding + node.order * (cardHeight + orderGap) : padding + node.layer * (cardHeight + layerGap),
    })),
  );
  const positionedNodeById = $derived(new Map(positionedNodes.map((node) => [node.id, node])));
  const width = $derived(Math.max(720, positionedNodes.reduce((value, node) => Math.max(value, node.x + cardWidth + padding), 0)));
  const height = $derived(Math.max(360, positionedNodes.reduce((value, node) => Math.max(value, node.y + cardHeight + padding), 0)));
  const layers = $derived(Array.from(new Set(graph.nodes.map((node) => node.layer))).sort((left, right) => left - right));

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

<section class="graph-panel" aria-label="Repository change graph">
  <div class="graph-controls">
    <div class="graph-control-segment" aria-label="Graph layout">
      <button type="button" class:active={direction === "lr"} aria-pressed={direction === "lr"} onclick={() => (direction = "lr")}>Left → right</button>
      <button type="button" class:active={direction === "tb"} aria-pressed={direction === "tb"} onclick={() => (direction = "tb")}>Top → bottom</button>
    </div>
  </div>

  {#if graph.hasCycle}
    <div class="graph-empty-state graph-cycle-state">
      <strong>Dependency cycle detected</strong>
      <p>Layered ordering is unavailable because changed files form an import cycle.</p>
      {#if graph.cycle}
        <code>{graph.cycle.nodeIds.join(" → ")}</code>
      {/if}
    </div>
  {:else if graph.nodes.length === 0}
    <div class="graph-empty-state">No changed source files to render.</div>
  {:else}
    <div class="graph-legend">
      <span><i class="swatch dep"></i> changed-file import dependency</span>
    </div>
    <div class="graph-canvas">
      <div class="graph-stage" style={`width: ${width}px; height: ${height}px;`}>
        <svg class="graph-svg" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
          <defs>
            <marker id="repo-change-graph-arrow-dep" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
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

          {#each graph.dependencyEdges as edge}
            {@const source = positionedNodeById.get(edge.source)}
            {@const target = positionedNodeById.get(edge.target)}
            {#if source && target}
              <path class="graph-edge dependency" d={dependencyPath(source, target)} marker-end="url(#repo-change-graph-arrow-dep)" />
            {/if}
          {/each}
        </svg>

        {#each positionedNodes as graphNode}
          {@const node = nodeById.get(graphNode.id)}
          {#if node}
            <article class:repo-change-connector={!node.changed} class="repo-change-card" style={`left: ${graphNode.x}px; top: ${graphNode.y}px; width: ${cardWidth}px; height: ${cardHeight}px;`}>
              <div class="repo-change-card-top">
                <strong>{node.path.split("/").at(-1)}</strong>
                <span>{node.deps.length} deps</span>
              </div>
              <div class="repo-change-card-path">{node.path}</div>
              <div class="repo-change-card-meta">
                <span>{node.changed ? "changed file" : "connector"}</span>
                <span>{node.deps.length === 0 ? "root" : "imports graph files"}</span>
              </div>
            </article>
          {/if}
        {/each}
      </div>
    </div>
  {/if}
</section>

<style>
  .repo-change-card {
    background: var(--container-bg);
    border: 1px solid var(--dim);
    border-radius: 4px;
    color: var(--text);
    display: grid;
    gap: 10px;
    grid-template-rows: auto minmax(0, 1fr) auto;
    padding: 12px;
    position: absolute;
  }

  .repo-change-card-top,
  .repo-change-card-meta {
    align-items: center;
    display: flex;
    gap: 10px;
    justify-content: space-between;
    min-width: 0;
  }

  .repo-change-card-top strong,
  .repo-change-card-top span,
  .repo-change-card-meta span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .repo-change-card-path {
    color: var(--text);
    font-weight: 700;
    line-height: 1.35;
    overflow-wrap: anywhere;
    overflow-y: auto;
  }

  .repo-change-card-meta {
    color: var(--dim);
    font-size: 10px;
  }

  .repo-change-connector {
    background: rgba(255, 255, 255, 0.025);
    border-style: dashed;
    color: var(--muted);
    opacity: 0.72;
  }
</style>
