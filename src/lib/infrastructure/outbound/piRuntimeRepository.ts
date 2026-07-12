/* eslint-disable sensors/max-file-lines */
import type { AgentCommandResult, AgentInputText, AgentRepository, AgentSessionId, AgentTranscriptEntry } from "$lib/domain/ports";
import { createAgentAppEvents } from "$lib/infrastructure/outbound/agentAppEvents";
import type { AgentRuntimeEvent } from "$lib/infrastructure/outbound/agentAppEvents";
import type { AppEventPublisher } from "$lib/infrastructure/outbound/appEventHub";

interface PiRuntimeRepositoryDependencies {
  createSessionId: () => AgentSessionId;
  cwd: string;
  publishEvent: AppEventPublisher;
  loadSdk?: () => Promise<PiSdk>;
}

interface PiAgentSession {
  isStreaming: boolean;
  messages: unknown[];
  prompt(input: string, options?: { streamingBehavior?: "followUp" }): Promise<void>;
  abort(): Promise<void>;
  subscribe(listener: (event: unknown) => void): () => void;
}

interface PiAgentSessionRuntime {
  session: PiAgentSession;
  dispose(): Promise<void>;
}

interface PiSessionInfo {
  id: string;
  path: string;
}

interface PiSdk {
  createAgentSessionRuntime: (factory: PiRuntimeFactory, options: { cwd: string; agentDir: string; sessionManager: unknown }) => Promise<PiAgentSessionRuntime>;
  createAgentSessionFromServices: (options: { services: PiServices; sessionManager: unknown; sessionStartEvent?: unknown }) => Promise<{ session: PiAgentSession }>;
  createAgentSessionServices: (options: { cwd: string; agentDir: string }) => Promise<PiServices>;
  getAgentDir: () => string;
  SessionManager: { create: (cwd?: string) => unknown; open: (path: string) => unknown; list: (cwd: string) => Promise<PiSessionInfo[]> };
}

interface PiServices {
  diagnostics: unknown[];
}

type PiRuntimeFactory = (options: { cwd: string; agentDir: string; sessionManager: unknown; sessionStartEvent?: unknown }) => Promise<{ session: PiAgentSession; services: PiServices; diagnostics: unknown[] }>;

interface ActivePiSession {
  runtime: PiAgentSessionRuntime;
  unsubscribe: () => void;
}

type SessionRegistrar = (sessionId: AgentSessionId, session: ActivePiSession) => void;

// eslint-disable-next-line sensors/max-function-lines
export function createPiRuntimeRepository(dependencies: PiRuntimeRepositoryDependencies): AgentRepository {
  const sessions = new Map<AgentSessionId, ActivePiSession>();
  const registerSession = (sessionId: AgentSessionId, session: ActivePiSession) => {
    replaceSession(sessions, sessionId, session);
  };
  return {
    start: (command) => startSession(dependencies, registerSession, command.prompt),
    resume: (command) => resumeSession(dependencies, registerSession, command.sessionId),
    stop: (command) => stopSession(dependencies.publishEvent, sessions, command.sessionId),
    sendInput: (command) => sendInput(dependencies.publishEvent, sessions, command.sessionId, command.input),
  };
}

async function startSession(dependencies: PiRuntimeRepositoryDependencies, registerSession: SessionRegistrar, prompt: string | undefined): Promise<AgentCommandResult> {
  const sessionId = dependencies.createSessionId();
  return activateSession(dependencies, registerSession, sessionId, prompt, (sdk) => sdk.SessionManager.create(dependencies.cwd), "Agent start command accepted.", "Agent session failed to start.");
}

async function resumeSession(dependencies: PiRuntimeRepositoryDependencies, registerSession: SessionRegistrar, sessionId: AgentSessionId): Promise<AgentCommandResult> {
  try {
    const sdk = await loadPiSdk(dependencies);
    const sessionPath = await findSessionPath(sdk, dependencies.cwd, sessionId);
    if (sessionPath === undefined) return { accepted: false, sessionId, message: "Agent session not found." };
    return activateSession(dependencies, registerSession, sessionId, undefined, () => sdk.SessionManager.open(sessionPath), "Agent resume command accepted.", "Agent session failed to resume.", sdk);
  } catch (error) {
    return { accepted: false, sessionId, message: errorMessage(error, "Agent session failed to resume.") };
  }
}

// eslint-disable-next-line sensors/max-function-lines
async function activateSession(dependencies: PiRuntimeRepositoryDependencies, registerSession: SessionRegistrar, sessionId: AgentSessionId, prompt: string | undefined, sessionManager: (sdk: PiSdk) => unknown, successMessage: string, failureMessage: string, loadedSdk?: PiSdk): Promise<AgentCommandResult> {
  try {
    const sdk = loadedSdk ?? (await loadPiSdk(dependencies));
    const runtime = await createRuntime(sdk, dependencies.cwd, sessionManager(sdk));
    const unsubscribe = runtime.session.subscribe((event) => publishPiSessionEvent(dependencies.publishEvent, sessionId, event));
    registerSession(sessionId, { runtime, unsubscribe });
    publishRuntimeEvents(dependencies.publishEvent, sessionId, [{ type: "agent_start", message: "Agent session is running." }]);
    if (prompt !== undefined) runPrompt(dependencies.publishEvent, sessionId, runtime.session, prompt);
    return { ...createResult(sessionId, successMessage), transcript: transcriptFromMessages(runtime.session.messages) };
  } catch (error) {
    const message = errorMessage(error, failureMessage);
    publishRuntimeEvents(dependencies.publishEvent, sessionId, [{ type: "agent_end", status: "failed", message }]);
    return { accepted: false, sessionId, message };
  }
}

async function createRuntime(sdk: PiSdk, cwd: string, sessionManager: unknown) {
  const agentDir = sdk.getAgentDir();
  return sdk.createAgentSessionRuntime(runtimeFactory(sdk), { cwd, agentDir, sessionManager });
}

function runtimeFactory(sdk: PiSdk): PiRuntimeFactory {
  return async ({ cwd, agentDir, sessionManager, sessionStartEvent }) => {
    const services = await sdk.createAgentSessionServices({ cwd, agentDir });
    return { ...(await sdk.createAgentSessionFromServices({ services, sessionManager, sessionStartEvent })), services, diagnostics: services.diagnostics };
  };
}

async function findSessionPath(sdk: PiSdk, cwd: string, sessionId: AgentSessionId) {
  return (await sdk.SessionManager.list(cwd)).find((session) => session.id === sessionId)?.path;
}

function replaceSession(sessions: Map<AgentSessionId, ActivePiSession>, sessionId: AgentSessionId, session: ActivePiSession) {
  const previous = sessions.get(sessionId);
  previous?.unsubscribe();
  void previous?.runtime.dispose().catch(() => undefined);
  sessions.set(sessionId, session);
  return sessions;
}

async function stopSession(publishEvent: AppEventPublisher, sessions: Map<AgentSessionId, ActivePiSession>, sessionId: AgentSessionId): Promise<AgentCommandResult> {
  const activeSession = sessions.get(sessionId);
  if (activeSession === undefined) return { accepted: false, sessionId, message: "Agent session not found." };
  void activeSession.runtime.session.abort().catch((error) => publishRuntimeEvents(publishEvent, sessionId, [{ type: "agent_end", status: "failed", message: errorMessage(error, "Agent session cancellation failed.") }]));
  publishRuntimeEvents(publishEvent, sessionId, [{ type: "agent_end", status: "cancelled", cancelled: true, message: "Agent session cancelled." }]);
  return createResult(sessionId, "Agent stop command accepted.");
}

async function sendInput(publishEvent: AppEventPublisher, sessions: Map<AgentSessionId, ActivePiSession>, sessionId: AgentSessionId, input: AgentInputText): Promise<AgentCommandResult> {
  const activeSession = sessions.get(sessionId);
  if (activeSession === undefined) return { accepted: false, sessionId, message: "Agent session not found." };
  runPrompt(publishEvent, sessionId, activeSession.runtime.session, input);
  return createResult(sessionId, "Agent input command accepted.");
}

async function loadPiSdk(dependencies: PiRuntimeRepositoryDependencies) {
  if (dependencies.loadSdk !== undefined) return dependencies.loadSdk();
  const packageName = "@earendil-works/pi-coding-" + "agent";
  return import(/* @vite-ignore */ packageName) as Promise<PiSdk>;
}

function runPrompt(publishEvent: AppEventPublisher, sessionId: AgentSessionId, session: PiAgentSession, input: AgentInputText) {
  void session.prompt(input, { streamingBehavior: session.isStreaming ? "followUp" : undefined }).catch((error) => publishRuntimeEvents(publishEvent, sessionId, [{ type: "agent_end", status: "failed", message: errorMessage(error, "Agent prompt failed.") }]));
}

function transcriptFromMessages(messages: unknown[]): AgentTranscriptEntry[] {
  return messages.map(transcriptEntry).filter((entry): entry is AgentTranscriptEntry => entry !== undefined);
}

function transcriptEntry(message: unknown, index: number): AgentTranscriptEntry | undefined {
  const text = messageText(message);
  const role = messageRole(message);
  if (text === undefined || role === undefined) return undefined;
  return { messageId: messageId(message) ?? `transcript-${index}`, role, text, contentKind: messageContentKind(message) };
}

function publishPiSessionEvent(publishEvent: AppEventPublisher, sessionId: AgentSessionId, event: unknown) {
  const runtimeEvent = toRuntimeEvent(event);
  if (runtimeEvent !== undefined) publishRuntimeEvents(publishEvent, sessionId, [runtimeEvent]);
}

// eslint-disable-next-line sensors/max-function-lines
function toRuntimeEvent(value: unknown): AgentRuntimeEvent | undefined {
  const event = asRecord(value);
  switch (event?.type) {
    case "agent_start":
      return { type: "agent_start" };
    case "agent_end":
      return { type: "agent_end", status: event.willRetry === true ? "running" : statusFromMessages(asArray(event.messages)), message: messageFromMessages(asArray(event.messages)) };
    case "turn_start":
      return { type: "turn_start" };
    case "turn_end":
      return { type: "turn_end", status: statusFromMessage(event.message), message: messageText(event.message) };
    case "message_start":
      return { type: "message_start", id: eventMessageId(event), role: messageRole(event.message), text: messageText(event.message) };
    case "message_update":
      return { type: "message_update", id: eventMessageId(event), role: messageRole(event.message), delta: deltaText(event.assistantMessageEvent), text: messageText(event.message), contentKind: messageEventContentKind(event.assistantMessageEvent) };
    case "message_end":
      return { type: "message_end", id: eventMessageId(event), role: messageRole(event.message), text: messageText(event.message) };
    case "tool_execution_start":
      return { type: "tool_execution_start", id: stringValue(event.toolCallId), name: stringValue(event.toolName), input: event.args };
    case "tool_execution_update":
      return { type: "tool_execution_update", id: stringValue(event.toolCallId), name: stringValue(event.toolName), status: "running", output: event.partialResult };
    case "tool_execution_end":
      return { type: "tool_execution_end", id: stringValue(event.toolCallId), name: stringValue(event.toolName), status: event.isError === true ? "failed" : "completed", output: event.result };
    case "queue_update":
      return { type: "queue_update", size: asArray(event.steering).length + asArray(event.followUp).length };
    case "compaction_start":
      return { type: "compaction_start", message: stringValue(event.reason) };
    case "compaction_end":
      return { type: "compaction_end", status: event.aborted === true ? "cancelled" : event.errorMessage === undefined ? "completed" : "failed", message: stringValue(event.errorMessage) ?? stringValue(event.reason) };
    case "auto_retry_start":
      return { type: "auto_retry_start", reason: stringValue(event.errorMessage), message: `Retrying agent request (${event.attempt}/${event.maxAttempts}).` };
    case "auto_retry_end":
      return { type: "auto_retry_end", status: event.success === true ? "completed" : "failed", message: stringValue(event.finalError) };
    default:
      return undefined;
  }
}

function publishRuntimeEvents(publishEvent: AppEventPublisher, sessionId: AgentSessionId, runtimeEvents: AgentRuntimeEvent[]) {
  for (const runtimeEvent of runtimeEvents) {
    for (const appEvent of createAgentAppEvents(sessionId, runtimeEvent)) publishEvent(appEvent);
  }
}

function createResult(sessionId: AgentSessionId, message: string): AgentCommandResult {
  return { accepted: true, sessionId, message };
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message.length > 0 ? error.message : fallback;
}

function statusFromMessages(messages: unknown[]): string {
  return statusFromMessage(messages.at(-1));
}

function statusFromMessage(message: unknown): string {
  const record = asRecord(message);
  if (record?.stopReason === "error") return "failed";
  if (record?.stopReason === "aborted") return "cancelled";
  return "completed";
}

function messageFromMessages(messages: unknown[]): string | undefined {
  return messageText(messages.at(-1));
}

function eventMessageId(event: Record<string, unknown>): string | undefined {
  return messageId(event.message) ?? messageId(event.assistantMessageEvent);
}

function messageId(message: unknown): string | undefined {
  const record = asRecord(message);
  return stringValue(record?.id) ?? stringValue(record?.messageId);
}

function messageRole(message: unknown): "user" | "assistant" | "tool" | undefined {
  const role = stringValue(asRecord(message)?.role);
  if (role === "user" || role === "assistant" || role === "tool") return role;
  if (role === "toolResult" || role === "bashExecution" || role === "custom") return "tool";
  if (role === "branchSummary" || role === "compactionSummary") return "assistant";
  return undefined;
}

function messageText(message: unknown): string | undefined {
  const record = asRecord(message);
  if (typeof record?.errorMessage === "string") return record.errorMessage;
  const contentTextValue = messageContentText(record?.content);
  if (contentTextValue !== undefined) return contentTextValue;
  return stringValue(record?.output) ?? stringValue(record?.summary);
}

function messageContentText(content: unknown): string | undefined {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return undefined;
  const text = content.map(contentBlockText).filter((part) => part.length > 0).join("");
  return text.length === 0 ? undefined : text;
}

function contentBlockText(value: unknown): string {
  const record = asRecord(value);
  return stringValue(record?.text) ?? stringValue(record?.thinking) ?? "";
}

function messageContentKind(message: unknown): "text" | "thinking" | undefined {
  const content = asRecord(message)?.content;
  if (!Array.isArray(content)) return undefined;
  return content.every((value) => asRecord(value)?.type === "thinking") ? "thinking" : "text";
}

function deltaText(value: unknown): string | undefined {
  const record = asRecord(value);
  return stringValue(record?.delta) ?? stringValue(record?.text);
}

function messageEventContentKind(value: unknown): "text" | "thinking" | undefined {
  const type = stringValue(asRecord(value)?.type);
  if (type?.startsWith("thinking_")) return "thinking";
  if (type?.startsWith("text_")) return "text";
  return undefined;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : undefined;
}
