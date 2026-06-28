import type { Ticket } from "./tickets";

export type TicketDirectory = string;
export type ProjectPath = string;
export type ProjectLabel = string;
export type ConfigWarning = string;

export type TicketRepository = () => Promise<Ticket[]>;

export type AgentSessionId = string;
export type AgentInputText = string;
export type AgentCommandMessage = string;
export type AgentCommandAccepted = boolean;
export type AgentSessionLabel = string;
export type AgentSessionPreview = string;
export type AgentSessionLastUsedAt = string;

export interface AgentSessionSummary {
  id: AgentSessionId;
  label: AgentSessionLabel;
  preview: AgentSessionPreview;
  lastUsedAt: AgentSessionLastUsedAt;
}

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

export type AgentSessionSummaryRepository = () => Promise<AgentSessionSummary[]>;

export interface SelectableProject {
  root: ProjectPath;
  label?: ProjectLabel;
  ticketDirectory?: TicketDirectory;
}

export interface ProjectConfig {
  projectPath: ProjectPath;
  ticketDirectory: TicketDirectory;
  selectableProjects: SelectableProject[];
  configWarnings: ConfigWarning[];
}

export interface ConfigRequest {
  selectedProjectPath?: ProjectPath;
}

export type ConfigProvider = (request?: ConfigRequest) => Promise<ProjectConfig>;
