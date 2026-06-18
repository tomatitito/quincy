import type { TicketId, TicketView } from "$lib/domain/tickets";

export type GraphFilterScope = "all" | "epics" | "selected";
export type GraphStatusVisibility = "open" | "all";

export interface GraphFilterState {
  scope: GraphFilterScope;
  selectedEpicIds: TicketId[];
  statusVisibility: GraphStatusVisibility;
}

export function filterTicketsForGraph(tickets: TicketView[], filter: GraphFilterState): TicketView[] {
  const selectedIds = selectedTreeIds(tickets, filter.selectedEpicIds);
  const scopedTickets = tickets.filter((ticket) => matchesScope(ticket, filter, selectedIds));
  if (filter.statusVisibility === "all") return scopedTickets;
  return scopedTickets.filter((ticket) => ticket.status !== "closed");
}

function matchesScope(ticket: TicketView, filter: GraphFilterState, selectedIds: Set<TicketId>) {
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
