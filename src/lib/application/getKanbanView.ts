import type { KanbanColumn, Ticket, TicketStatus } from "$lib/domain/tickets";
import type { TicketRepository } from "$lib/domain/ports";

export interface KanbanView {
  columns: KanbanColumn[];
}

const statuses: TicketStatus[] = ["open", "in_progress", "closed"];

export async function getKanbanView(repository: TicketRepository): Promise<KanbanView> {
  const tickets = await repository.listTickets();
  return { columns: statuses.map((status) => columnForStatus(status, tickets)) };
}

function columnForStatus(status: TicketStatus, tickets: Ticket[]): KanbanColumn {
  return { status, tickets: tickets.filter((ticket) => ticket.status === status) };
}
