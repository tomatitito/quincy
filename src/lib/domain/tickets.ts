export type TicketId = string;
export type TicketTitle = string;
export type TicketStatus = "open" | "in_progress" | "closed";
export type TicketPriority = number;
export type TicketType = string;
export type DependencyId = string;
export type TicketReadiness = boolean;
export type KanbanColumnId = "backlog" | TicketStatus;

export interface Ticket {
  id: TicketId;
  title: TicketTitle;
  status: TicketStatus;
  priority: TicketPriority;
  type: TicketType;
  deps: DependencyId[];
  parent?: TicketId;
}

export interface TicketView extends Ticket {
  ready: TicketReadiness;
}

export interface KanbanColumn {
  id: KanbanColumnId;
  tickets: TicketView[];
}

const orderedColumnIds: KanbanColumnId[] = ["backlog", "open", "in_progress", "closed"];

export function createKanbanColumns(tickets: Ticket[]): KanbanColumn[] {
  const views = createTicketViews(tickets);
  return orderedColumnIds.map((id) => ({ id, tickets: views.filter((ticket) => columnIdForTicket(ticket) === id) }));
}

export function createTicketViews(tickets: Ticket[]): TicketView[] {
  return tickets.map((ticket) => ({ ...ticket, ready: isReady(ticket, tickets) }));
}

function columnIdForTicket(ticket: TicketView): KanbanColumnId {
  if (ticket.status === "open" && !ticket.ready) return "backlog";
  return ticket.status;
}

function isReady(ticket: Ticket, tickets: Ticket[]): TicketReadiness {
  return ticket.status !== "closed" && ticket.deps.every((dependencyId) => isClosedDependency(dependencyId, tickets));
}

function isClosedDependency(dependencyId: DependencyId, tickets: Ticket[]): TicketReadiness {
  return tickets.some((ticket) => ticket.id === dependencyId && ticket.status === "closed");
}
