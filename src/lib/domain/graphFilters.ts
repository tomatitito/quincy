import type { TicketId, TicketView } from "$lib/domain/tickets";
import { filterTicketViewsByVisibility } from "$lib/domain/ticketVisibility";
import type { TicketStatusVisibility, TicketVisibilityScope } from "$lib/domain/ticketVisibility";

export type GraphFilterScope = TicketVisibilityScope;
export type GraphStatusVisibility = TicketStatusVisibility;

export interface GraphFilterState {
  scope: GraphFilterScope;
  selectedEpicIds: TicketId[];
  statusVisibility: GraphStatusVisibility;
}

export function filterTicketsForGraph(tickets: TicketView[], filter: GraphFilterState): TicketView[] {
  return filterTicketViewsByVisibility(tickets, filter);
}
