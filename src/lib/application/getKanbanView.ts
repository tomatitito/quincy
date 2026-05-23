import { createKanbanColumns } from "$lib/domain/tickets";
import type { KanbanColumn } from "$lib/domain/tickets";
import type { TicketRepository } from "$lib/domain/ports";

export interface KanbanView {
  columns: KanbanColumn[];
}

export async function getKanbanView(repository: TicketRepository): Promise<KanbanView> {
  const tickets = await repository.listTickets();
  return { columns: createKanbanColumns(tickets) };
}
