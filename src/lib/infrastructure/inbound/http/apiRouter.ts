import { getKanbanView } from "$lib/application/getKanbanView";
import type { TicketRepository } from "$lib/domain/ports";

const emptyTicketRepository: TicketRepository = {
  listTickets: async () => [],
};

export async function handleApiRequest(request: Request): Promise<Response> {
  const path = new URL(request.url).pathname;
  if (path.endsWith("/kanban")) return Response.json(await getKanbanView(emptyTicketRepository));
  return Response.json({ error: "Not found" }, { status: 404 });
}
