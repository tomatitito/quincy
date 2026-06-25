import { deriveGraphView } from "$lib/application/getGraphView";
import { deriveKanbanView } from "$lib/application/getKanbanView";
import { createConfigProvider } from "$lib/infrastructure/outbound/config";
import { createTicketFileRepository } from "$lib/infrastructure/outbound/ticketFileRepository";

export async function loadHomePage() {
  const config = await createConfigProvider()();
  const repository = createTicketFileRepository(config.ticketDirectory);
  const tickets = await repository();
  return { projectPath: config.projectPath, graph: deriveGraphView(tickets), kanban: deriveKanbanView(tickets) };
}
