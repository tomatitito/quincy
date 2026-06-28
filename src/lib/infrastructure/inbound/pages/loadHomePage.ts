import type { ProjectPath } from "$lib/domain/ports";
import { deriveGraphView } from "$lib/application/getGraphView";
import { deriveKanbanView } from "$lib/application/getKanbanView";
import { createConfigProvider } from "$lib/infrastructure/outbound/config";
import { createTicketFileRepository } from "$lib/infrastructure/outbound/ticketFileRepository";

const configProvider = createConfigProvider();

export async function loadHomePage(selectedProjectPath?: ProjectPath) {
  const config = await configProvider({ selectedProjectPath });
  const tickets = await createTicketFileRepository(config.ticketDirectory)();
  return createHomePageData(config, tickets);
}

function createHomePageData(config: Awaited<ReturnType<typeof configProvider>>, tickets: Awaited<ReturnType<ReturnType<typeof createTicketFileRepository>>>) {
  return {
    projectPath: config.projectPath,
    ticketDirectory: config.ticketDirectory,
    selectableProjects: config.selectableProjects,
    configWarnings: config.configWarnings,
    graph: deriveGraphView(tickets),
    kanban: deriveKanbanView(tickets),
  };
}
