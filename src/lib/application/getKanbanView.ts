import { createKanbanColumns } from "$lib/domain/tickets";
import type { KanbanColumn, Ticket } from "$lib/domain/tickets";
import type { TicketRepository } from "$lib/domain/ports";

export interface KanbanView {
  columns: KanbanColumn[];
}

export function deriveKanbanView(tickets: Ticket[]): KanbanView {
  return { columns: createKanbanColumns(tickets) };
}

export async function getKanbanView(repository: TicketRepository): Promise<KanbanView> {
  return deriveKanbanView(await repository());
}
