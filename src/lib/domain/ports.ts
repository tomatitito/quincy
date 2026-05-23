import type { Ticket } from "./tickets";

export interface TicketRepository {
  listTickets: () => Promise<Ticket[]>;
}

export interface ProjectConfig {
  ticketDirectory: string;
}

export interface ConfigProvider {
  getProjectConfig: () => Promise<ProjectConfig>;
}
