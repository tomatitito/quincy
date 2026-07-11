import type { ProjectPath } from "$lib/domain/ports";
import { deriveGraphView } from "$lib/application/getGraphView";
import { deriveKanbanView } from "$lib/application/getKanbanView";
import { createConfigProvider } from "$lib/infrastructure/outbound/config";
import { createTicketFileRepository } from "$lib/infrastructure/outbound/ticketFileRepository";
import { getRepoChangeGraph } from "$lib/experiments/repoChangeGraph/repoChangeRepository";

const configProvider = createConfigProvider();

export async function loadHomePage(selectedProjectPath?: ProjectPath) {
  const config = await configProvider({ selectedProjectPath });
  const tickets = await createTicketFileRepository(config.ticketDirectory)();
  return await createHomePageData(config, tickets);
}

async function createHomePageData(config: Awaited<ReturnType<typeof configProvider>>, tickets: Awaited<ReturnType<ReturnType<typeof createTicketFileRepository>>>) {
  return {
    ...createTicketHomePageData(config, tickets),
    repoChangeGraph: await getRepoChangeGraph(config.projectPath),
  };
}

function createTicketHomePageData(config: Awaited<ReturnType<typeof configProvider>>, tickets: Awaited<ReturnType<ReturnType<typeof createTicketFileRepository>>>) {
  return {
    projectPath: config.projectPath,
    ticketDirectory: config.ticketDirectory,
    selectableProjects: config.selectableProjects,
    configWarnings: config.configWarnings,
    graph: deriveGraphView(tickets),
    kanban: deriveKanbanView(tickets),
  };
}
