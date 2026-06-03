import { getKanbanView } from "$lib/application/getKanbanView";
import { createConfigProvider } from "$lib/infrastructure/outbound/config";
import { createTicketFileRepository } from "$lib/infrastructure/outbound/ticketFileRepository";

export async function handleApiRequest(request: Request): Promise<Response> {
  const path = new URL(request.url).pathname;
  if (path.endsWith("/kanban")) return Response.json(await loadKanban());
  return Response.json({ error: "Not found" }, { status: 404 });
}

async function loadKanban() {
  const config = await createConfigProvider()();
  return getKanbanView(createTicketFileRepository(config.ticketDirectory));
}
