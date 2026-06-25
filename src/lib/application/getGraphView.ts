import { deriveGraph } from "$lib/domain/graph";
import type { GraphDerivation } from "$lib/domain/graph";
import { createTicketViews } from "$lib/domain/tickets";
import type { Ticket, TicketView } from "$lib/domain/tickets";
import type { TicketRepository } from "$lib/domain/ports";

export interface GraphView {
  tickets: TicketView[];
  graph: GraphDerivation;
}

export function deriveGraphView(tickets: Ticket[]): GraphView {
  const ticketViews = createTicketViews(tickets);
  return { tickets: ticketViews, graph: deriveGraph(ticketViews) };
}

export async function getGraphView(repository: TicketRepository): Promise<GraphView> {
  return deriveGraphView(await repository());
}
