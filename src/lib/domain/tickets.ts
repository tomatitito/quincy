export type TicketStatus = "open" | "in_progress" | "closed";
export type KanbanColumnId = "backlog" | TicketStatus;

export interface Ticket {
  id: string;
  title: string;
  status: TicketStatus;
  priority: number;
  type: string;
  deps: string[];
}

export interface TicketView extends Ticket {
  ready: boolean;
}

export interface KanbanColumn {
  id: KanbanColumnId;
  tickets: TicketView[];
}

const orderedColumnIds: KanbanColumnId[] = ["backlog", "open", "in_progress", "closed"];

export function createKanbanColumns(tickets: Ticket[]): KanbanColumn[] {
  const views = tickets.map((ticket) => ({ ...ticket, ready: isReady(ticket, tickets) }));
  return orderedColumnIds.map((id) => ({ id, tickets: views.filter((ticket) => columnIdForTicket(ticket) === id) }));
}

function columnIdForTicket(ticket: TicketView): KanbanColumnId {
  if (ticket.status === "open" && !ticket.ready) return "backlog";
  return ticket.status;
}

function isReady(ticket: Ticket, tickets: Ticket[]): boolean {
  return ticket.status !== "closed" && ticket.deps.every((dependencyId) => isClosedDependency(dependencyId, tickets));
}

function isClosedDependency(dependencyId: string, tickets: Ticket[]): boolean {
  return tickets.some((ticket) => ticket.id === dependencyId && ticket.status === "closed");
}
