import type { AgentCommandResult, AgentInputText, AgentRepository, AgentSessionId } from "$lib/domain/ports";
import { createAgentAppEvents } from "$lib/infrastructure/outbound/agentAppEvents";
import type { AgentRuntimeEvent } from "$lib/infrastructure/outbound/agentAppEvents";
import type { AppEventPublisher } from "$lib/infrastructure/outbound/appEventHub";

interface PiRuntimeRepositoryDependencies {
  createSessionId: () => AgentSessionId;
  cwd: string;
  publishEvent: AppEventPublisher;
}

interface PiAgentSession {
  isStreaming: boolean;
  prompt(input: string, options?: { streamingBehavior?: "followUp" }): Promise<void>;
  abort(): Promise<void>;
  subscribe(listener: (event: unknown) => void): () => void;
}

interface ActivePiSession {
  session: PiAgentSession;
  unsubscribe: () => void;
}

type SessionRegistrar = (sessionId: AgentSessionId, session: ActivePiSession) => void;

export function createPiRuntimeRepository(dependencies: PiRuntimeRepositoryDependencies): AgentRepository {
  const sessions = new Map<AgentSessionId, ActivePiSession>();
  const registerSession = (sessionId: AgentSessionId, session: ActivePiSession) => sessions.set(sessionId, session);
  return {
    start: (command) => startSession(dependencies, registerSession, command.prompt),
    stop: (command) => stopSession(dependencies.publishEvent, sessions, command.sessionId),
    sendInput: (command) => sendInput(dependencies.publishEvent, sessions, command.sessionId, command.input),
  };
}

// eslint-disable-next-line sensors/max-function-lines
async function startSession({ createSessionId, cwd, publishEvent }: PiRuntimeRepositoryDependencies, registerSession: SessionRegistrar, prompt: string | undefined): Promise<AgentCommandResult> {
  const sessionId = createSessionId();
  try {
    const { createAgentSession, SessionManager } = await loadPiSdk();
    const { session } = await createAgentSession({ cwd, sessionManager: SessionManager.inMemory(cwd) });
    const unsubscribe = session.subscribe((event) => publishPiSessionEvent(publishEvent, sessionId, event));
    registerSession(sessionId, { session, unsubscribe });
    publishRuntimeEvents(publishEvent, sessionId, [{ type: "agent_start", message: "Agent session is running." }]);
    if (prompt !== undefined) runPrompt(publishEvent, sessionId, session, prompt);
    return createResult(sessionId, "Agent start command accepted.");
  } catch (error) {
    const message = errorMessage(error, "Agent session failed to start.");
    publishRuntimeEvents(publishEvent, sessionId, [{ type: "agent_end", status: "failed", message }]);
    return { accepted: false, sessionId, message };
  }
}

async function stopSession(publishEvent: AppEventPublisher, sessions: Map<AgentSessionId, ActivePiSession>, sessionId: AgentSessionId): Promise<AgentCommandResult> {
  const activeSession = sessions.get(sessionId);
  if (activeSession === undefined) return { accepted: false, sessionId, message: "Agent session not found." };
  void activeSession.session.abort().catch((error) => publishRuntimeEvents(publishEvent, sessionId, [{ type: "agent_end", status: "failed", message: errorMessage(error, "Agent session cancellation failed.") }]));
  publishRuntimeEvents(publishEvent, sessionId, [{ type: "agent_end", status: "cancelled", cancelled: true, message: "Agent session cancelled." }]);
  return createResult(sessionId, "Agent stop command accepted.");
}

async function sendInput(publishEvent: AppEventPublisher, sessions: Map<AgentSessionId, ActivePiSession>, sessionId: AgentSessionId, input: AgentInputText): Promise<AgentCommandResult> {
  const activeSession = sessions.get(sessionId);
  if (activeSession === undefined) return { accepted: false, sessionId, message: "Agent session not found." };
  runPrompt(publishEvent, sessionId, activeSession.session, input);
  return createResult(sessionId, "Agent input command accepted.");
}

async function loadPiSdk() {
  const packageName = "@earendil-works/pi-coding-" + "agent";
  return import(packageName) as Promise<{ createAgentSession: (options: unknown) => Promise<{ session: PiAgentSession }>; SessionManager: { inMemory: (cwd?: string) => unknown } }>;
}

function runPrompt(publishEvent: AppEventPublisher, sessionId: AgentSessionId, session: PiAgentSession, input: AgentInputText) {
  void session.prompt(input, { streamingBehavior: session.isStreaming ? "followUp" : undefined }).catch((error) => publishRuntimeEvents(publishEvent, sessionId, [{ type: "agent_end", status: "failed", message: errorMessage(error, "Agent prompt failed.") }]));
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
      return { type: "message_start", id: messageId(event.message), role: messageRole(event.message), text: messageText(event.message) };
    case "message_update":
      return { type: "message_update", id: messageId(event.message), role: messageRole(event.message), delta: deltaText(event.assistantMessageEvent), text: messageText(event.message) };
    case "message_end":
      return { type: "message_end", id: messageId(event.message), role: messageRole(event.message), text: messageText(event.message) };
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

function messageId(message: unknown): string | undefined {
  return stringValue(asRecord(message)?.id);
}

function messageRole(message: unknown): string | undefined {
  return stringValue(asRecord(message)?.role);
}

function messageText(message: unknown): string | undefined {
  const record = asRecord(message);
  if (typeof record?.errorMessage === "string") return record.errorMessage;
  const content = record?.content;
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return undefined;
  return content.map(contentText).filter((text) => text.length > 0).join("");
}

function contentText(value: unknown): string {
  return stringValue(asRecord(value)?.text) ?? "";
}

function deltaText(value: unknown): string | undefined {
  const record = asRecord(value);
  return stringValue(record?.delta) ?? stringValue(record?.text);
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
