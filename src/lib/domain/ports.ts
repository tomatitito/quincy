import type { Ticket } from "./tickets";

export type TicketDirectory = string;

export interface TicketRepository {
  listTickets: () => Promise<Ticket[]>;
}

export interface ProjectConfig {
  ticketDirectory: TicketDirectory;
}

export interface ConfigProvider {
  getProjectConfig: () => Promise<ProjectConfig>;
}
