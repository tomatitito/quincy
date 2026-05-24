import type { Ticket } from "./tickets";

export type TicketDirectory = string;

export type TicketRepository = () => Promise<Ticket[]>;

export interface ProjectConfig {
  ticketDirectory: TicketDirectory;
}

export type ConfigProvider = () => Promise<ProjectConfig>;
