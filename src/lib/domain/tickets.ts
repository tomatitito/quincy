export type TicketStatus = "open" | "in_progress" | "closed";

export interface Ticket {
  id: string;
  title: string;
  status: TicketStatus;
  priority: number;
}

export interface KanbanColumn {
  status: TicketStatus;
  tickets: Ticket[];
}
