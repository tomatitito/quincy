import { getKanbanView } from "$lib/application/getKanbanView";
import { createConfigProvider } from "$lib/infrastructure/outbound/config";
import { createTicketFileRepository } from "$lib/infrastructure/outbound/ticketFileRepository";

export async function loadHomePage() {
  const config = await createConfigProvider().getProjectConfig();
  const repository = createTicketFileRepository(config);
  return { kanban: await getKanbanView(repository) };
}
