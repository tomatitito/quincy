import path from "node:path";
import type { ConfigProvider, ProjectConfig } from "$lib/domain/ports";

export function createConfigProvider(): ConfigProvider {
  return async () => resolveProjectConfig();
}

function resolveProjectConfig(): ProjectConfig {
  const projectPath = path.resolve(process.env.QUINCY_PROJECT_PATH || process.cwd());
  return { projectPath, ticketDirectory: resolveTicketDirectory(projectPath) };
}

function resolveTicketDirectory(projectPath: string): string {
  const ticketDirectory = process.env.QUINCY_TICKET_DIRECTORY || ".tickets";
  if (path.isAbsolute(ticketDirectory)) return path.normalize(ticketDirectory);
  return path.resolve(projectPath, ticketDirectory);
}
