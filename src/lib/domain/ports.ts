import type { Ticket } from "./tickets";

export type TicketDirectory = string;

export type TicketRepository = () => Promise<Ticket[]>;

export type AgentSessionId = string;
export type AgentInputText = string;
export type AgentCommandMessage = string;
export type AgentCommandAccepted = boolean;

export interface StartAgentSessionCommand {
  prompt?: AgentInputText;
}

export interface StopAgentSessionCommand {
  sessionId: AgentSessionId;
}

export interface SendAgentInputCommand {
  sessionId: AgentSessionId;
  input: AgentInputText;
}

export interface AgentCommandResult {
  accepted: AgentCommandAccepted;
  sessionId: AgentSessionId;
  message: AgentCommandMessage;
}

export interface AgentRepository {
  start(command: StartAgentSessionCommand): Promise<AgentCommandResult>;
  stop(command: StopAgentSessionCommand): Promise<AgentCommandResult>;
  sendInput(command: SendAgentInputCommand): Promise<AgentCommandResult>;
}

export interface ProjectConfig {
  ticketDirectory: TicketDirectory;
}

export type ConfigProvider = () => Promise<ProjectConfig>;
