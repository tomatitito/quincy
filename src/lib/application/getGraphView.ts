import { deriveGraph } from "$lib/domain/graph";
import type { GraphDerivation } from "$lib/domain/graph";
import { createTicketViews } from "$lib/domain/tickets";
import type { TicketView } from "$lib/domain/tickets";
import type { TicketRepository } from "$lib/domain/ports";

export interface GraphView {
  tickets: TicketView[];
  graph: GraphDerivation;
}

export async function getGraphView(repository: TicketRepository): Promise<GraphView> {
  const tickets = createTicketViews(await repository());
  return { tickets, graph: deriveGraph(tickets) };
}
