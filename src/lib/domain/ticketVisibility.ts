import type { KanbanColumn, TicketId, TicketView } from "$lib/domain/tickets";

export type TicketVisibilityScope = "all" | "epics" | "selected";
export type TicketStatusVisibility = "open" | "all";

export interface TicketVisibilityFilter {
  scope: TicketVisibilityScope;
  selectedEpicIds: TicketId[];
  statusVisibility: TicketStatusVisibility;
}

export function filterTicketViewsByVisibility(tickets: TicketView[], filter: TicketVisibilityFilter): TicketView[] {
  const selectedIds = selectedTreeIds(tickets, filter.selectedEpicIds);
  const scopedTickets = tickets.filter((ticket) => matchesScope(ticket, filter, selectedIds));
  if (filter.statusVisibility === "all") return scopedTickets;
  return scopedTickets.filter((ticket) => ticket.status !== "closed");
}

export function filterKanbanColumnsByVisibility(columns: KanbanColumn[], filter: TicketVisibilityFilter): KanbanColumn[] {
  const visibleTicketIds = new Set(filterTicketViewsByVisibility(columns.flatMap((column) => column.tickets), filter).map((ticket) => ticket.id));
  return columns.map((column) => ({ ...column, tickets: column.tickets.filter((ticket) => visibleTicketIds.has(ticket.id)) }));
}

function matchesScope(ticket: TicketView, filter: TicketVisibilityFilter, selectedIds: Set<TicketId>) {
  if (filter.scope === "all") return true;
  if (filter.scope === "epics") return ticket.type === "epic";
  return selectedIds.has(ticket.id);
}

function selectedTreeIds(tickets: TicketView[], selectedEpicIds: TicketId[]): Set<TicketId> {
  const visibleIds = new Set<TicketId>(selectedEpicIds);
  let previousSize = 0;
  while (visibleIds.size !== previousSize) {
    previousSize = visibleIds.size;
    for (const ticket of tickets) if (ticket.parent && visibleIds.has(ticket.parent)) visibleIds.add(ticket.id);
  }

  return visibleIds;
}
