import { getGraphView } from "$lib/application/getGraphView";
import { getKanbanView } from "$lib/application/getKanbanView";
import { createConfigProvider } from "$lib/infrastructure/outbound/config";
import { createTicketFileRepository } from "$lib/infrastructure/outbound/ticketFileRepository";

export async function loadHomePage() {
  const config = await createConfigProvider()();
  const repository = createTicketFileRepository(config);
  return { graph: await getGraphView(repository), kanban: await getKanbanView(repository) };
}
