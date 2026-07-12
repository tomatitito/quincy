import type { Ticket } from "./tickets";

export type TicketDirectory = string;
export type ProjectPath = string;
export type ProjectLabel = string;
export type ProjectFilePath = string;
export type ProjectFileSuggestionQueryText = string;
export type ProjectFileSuggestionLimit = number;
export type ConfigWarning = string;

export type TicketRepository = () => Promise<Ticket[]>;

export type AgentSessionId = string;
export type AgentInputText = string;
export type AgentCommandMessage = string;
export type AgentCommandAccepted = boolean;
export type AgentSessionLabel = string;
export type AgentSessionPreview = string;
export type AgentSessionLastUsedAt = string;
export type AgentTranscriptMessageId = string;
export type AgentTranscriptRole = "user" | "assistant" | "tool";
export type AgentTranscriptText = string;
export type AgentTranscriptContentKind = "text" | "thinking";

export interface AgentSessionSummary {
  id: AgentSessionId;
  label: AgentSessionLabel;
  preview: AgentSessionPreview;
  lastUsedAt: AgentSessionLastUsedAt;
}

export interface AgentTranscriptEntry {
  messageId?: AgentTranscriptMessageId;
  role: AgentTranscriptRole;
  text: AgentTranscriptText;
  contentKind?: AgentTranscriptContentKind;
}

export interface StartAgentSessionCommand {
  prompt?: AgentInputText;
}

export interface StopAgentSessionCommand {
  sessionId: AgentSessionId;
}

export interface ResumeAgentSessionCommand {
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
  transcript?: AgentTranscriptEntry[];
}

export interface AgentRepository {
  start(command: StartAgentSessionCommand): Promise<AgentCommandResult>;
  resume(command: ResumeAgentSessionCommand): Promise<AgentCommandResult>;
  stop(command: StopAgentSessionCommand): Promise<AgentCommandResult>;
  sendInput(command: SendAgentInputCommand): Promise<AgentCommandResult>;
}

export type AgentSessionSummaryRepository = () => Promise<AgentSessionSummary[]>;

export interface ProjectFileSuggestion {
  path: ProjectFilePath;
}

export interface ProjectFileSuggestionQuery {
  query: ProjectFileSuggestionQueryText;
  limit: ProjectFileSuggestionLimit;
}

export type ProjectFileRepository = (query: ProjectFileSuggestionQuery) => Promise<ProjectFileSuggestion[]>;

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
