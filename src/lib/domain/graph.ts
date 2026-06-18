/* eslint-disable sensors/max-function-lines, sensors/no-domain-primitives */
import type { TicketView } from "$lib/domain/tickets";

export interface GraphCycle {
  nodeIds: string[];
  edgeIds: string[];
}

export interface GraphDependencyEdge {
  id: string;
  source: string;
  target: string;
}

export interface GraphNodeLayout {
  id: string;
  layer: number;
  order: number;
}

export interface GraphDerivation {
  hasCycle: boolean;
  cycle?: GraphCycle;
  nodes: GraphNodeLayout[];
  dependencyEdges: GraphDependencyEdge[];
}

function compareIds(a: string, b: string): number {
  return a.localeCompare(b);
}

function edgeId(source: string, target: string): string {
  return `${source}->${target}`;
}

function buildAdjacency(tickets: TicketView[]) {
  const ids = tickets.map((ticket) => ticket.id).sort(compareIds);
  const known = new Set(ids);
  const outgoing = new Map<string, string[]>();
  const incoming = new Map<string, string[]>();

  for (const id of ids) {
    outgoing.set(id, []);
    incoming.set(id, []);
  }

  for (const ticket of tickets) {
    const uniqueDeps = Array.from(new Set(ticket.deps.filter((dep) => known.has(dep)))).sort(compareIds);
    for (const dep of uniqueDeps) {
      outgoing.get(dep)?.push(ticket.id);
      incoming.get(ticket.id)?.push(dep);
    }
  }

  return { nodes: ids, outgoing, incoming };
}

function detectCycle(nodes: string[], outgoing: Map<string, string[]>): GraphCycle | undefined {
  const state = new Map<string, number>();
  const stack: string[] = [];
  let found: GraphCycle | undefined;

  const visit = (nodeId: string) => {
    if (found) return;
    state.set(nodeId, 1);
    stack.push(nodeId);

    for (const nextId of outgoing.get(nodeId) ?? []) {
      const nextState = state.get(nextId) ?? 0;
      if (nextState === 0) {
        visit(nextId);
      } else if (nextState === 1) {
        const startIndex = stack.indexOf(nextId);
        const nodeIds = [...stack.slice(startIndex), nextId];
        found = { nodeIds, edgeIds: nodeIds.slice(0, -1).map((current, index) => edgeId(current, nodeIds[index + 1])) };
      }
      if (found) return;
    }

    stack.pop();
    state.set(nodeId, 2);
  };

  for (const nodeId of nodes) {
    if ((state.get(nodeId) ?? 0) === 0) visit(nodeId);
    if (found) break;
  }

  return found;
}

function deriveLayers(nodes: string[], incoming: Map<string, string[]>, outgoing: Map<string, string[]>): GraphNodeLayout[] {
  const inDegree = new Map<string, number>();
  const longestIncomingDepth = new Map<string, number>();

  for (const nodeId of nodes) {
    inDegree.set(nodeId, incoming.get(nodeId)?.length ?? 0);
    longestIncomingDepth.set(nodeId, 0);
  }

  const ready = nodes.filter((nodeId) => (inDegree.get(nodeId) ?? 0) === 0).sort(compareIds);
  const order: string[] = [];

  while (ready.length > 0) {
    const nodeId = ready.shift();
    if (nodeId === undefined) break;
    order.push(nodeId);

    for (const nextId of outgoing.get(nodeId) ?? []) {
      longestIncomingDepth.set(nextId, Math.max(longestIncomingDepth.get(nextId) ?? 0, (longestIncomingDepth.get(nodeId) ?? 0) + 1));
      const remaining = (inDegree.get(nextId) ?? 0) - 1;
      inDegree.set(nextId, remaining);
      if (remaining === 0) {
        ready.push(nextId);
        ready.sort(compareIds);
      }
    }
  }

  const layerGroups = new Map<number, string[]>();
  for (const nodeId of order) {
    const layer = longestIncomingDepth.get(nodeId) ?? 0;
    layerGroups.set(layer, [...(layerGroups.get(layer) ?? []), nodeId]);
  }

  return order.map((nodeId) => {
    const layer = longestIncomingDepth.get(nodeId) ?? 0;
    return { id: nodeId, layer, order: layerGroups.get(layer)?.indexOf(nodeId) ?? 0 };
  });
}

function hasAlternatePath(source: string, target: string, outgoing: Map<string, string[]>): boolean {
  const queue = [...(outgoing.get(source) ?? []).filter((candidate) => candidate !== target)];
  const visited = new Set<string>([source]);

  while (queue.length > 0) {
    const nodeId = queue.shift();
    if (nodeId === undefined) break;
    if (nodeId === target) return true;
    if (visited.has(nodeId)) continue;
    visited.add(nodeId);
    queue.push(...(outgoing.get(nodeId) ?? []).filter((nextId) => !visited.has(nextId)));
  }

  return false;
}

function deriveReducedEdges(nodes: string[], outgoing: Map<string, string[]>): GraphDependencyEdge[] {
  return nodes
    .flatMap((source) =>
      (outgoing.get(source) ?? [])
        .filter((target) => !hasAlternatePath(source, target, outgoing))
        .map((target) => ({ id: edgeId(source, target), source, target })),
    )
    .sort((left, right) => left.id.localeCompare(right.id));
}

export function deriveGraph(tickets: TicketView[]): GraphDerivation {
  const { nodes, outgoing, incoming } = buildAdjacency(tickets);
  const cycle = detectCycle(nodes, outgoing);

  if (cycle) {
    return { hasCycle: true, cycle, nodes: [], dependencyEdges: [] };
  }

  return {
    hasCycle: false,
    nodes: deriveLayers(nodes, incoming, outgoing),
    dependencyEdges: deriveReducedEdges(nodes, outgoing),
  };
}
