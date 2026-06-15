import type { AgentSessionId } from "$lib/domain/ports";
import type { AppEvent } from "$lib/infrastructure/outbound/appEventHub";

export type AgentRuntimeEventType =
  | "agent_start"
  | "agent_end"
  | "turn_start"
  | "turn_end"
  | "message_start"
  | "message_update"
  | "message_end"
  | "tool_execution_start"
  | "tool_execution_update"
  | "tool_execution_end"
  | "queue_update"
  | "compaction_start"
  | "compaction_end"
  | "auto_retry_start"
  | "auto_retry_end";

export type AgentAppStatus = "running" | "completed" | "failed" | "cancelled";

export interface AgentRuntimeEvent {
  type: AgentRuntimeEventType;
  id?: string;
  role?: string;
  text?: string;
  delta?: string;
  name?: string;
  status?: string;
  message?: string;
  reason?: string;
  cancelled?: boolean;
  position?: number;
  size?: number;
  input?: unknown;
  output?: unknown;
  error?: unknown;
}

type AgentAppEvent = Omit<AppEvent, "occurredAt">;
type OutputStrategy = "append" | "replace";
type RuntimeEventMapper = (sessionId: AgentSessionId, event: AgentRuntimeEvent) => AgentAppEvent[];

const eventMappers: Record<AgentRuntimeEventType, RuntimeEventMapper> = {
  agent_start: (sessionId, event) => [agentEvent("agent.started", sessionId, { message: textOr(event.message, "Agent session started.") }), statusEvent(sessionId, "running", textOr(event.message, "Agent session is running."))],
  agent_end: (sessionId, event) => [agentEvent("agent.ended", sessionId, { status: endStatus(event), message: endMessage(event) }), statusEvent(sessionId, endStatus(event), endMessage(event))],
  turn_start: (sessionId, event) => [agentEvent("agent.turn.started", sessionId, { turnId: event.id, message: event.message })],
  turn_end: (sessionId, event) => [agentEvent("agent.turn.ended", sessionId, { turnId: event.id, status: event.status, message: event.message })],
  message_start: (sessionId, event) => [agentEvent("agent.message.started", sessionId, messagePayload(event))],
  message_update: (sessionId, event) => withOutput(agentEvent("agent.message.updated", sessionId, messagePayload(event)), sessionId, event.id, event.delta ?? event.text, event.delta === undefined ? "replace" : "append"),
  message_end: (sessionId, event) => withOutput(agentEvent("agent.message.ended", sessionId, messagePayload(event)), sessionId, event.id, event.text, "replace"),
  tool_execution_start: (sessionId, event) => [agentEvent("agent.tool.started", sessionId, toolPayload(event))],
  tool_execution_update: (sessionId, event) => [agentEvent("agent.tool.updated", sessionId, toolPayload(event))],
  tool_execution_end: (sessionId, event) => [agentEvent("agent.tool.ended", sessionId, toolPayload(event))],
  queue_update: (sessionId, event) => [agentEvent("agent.queue.updated", sessionId, { position: event.position, size: event.size, message: event.message })],
  compaction_start: (sessionId, event) => [agentEvent("agent.compaction.started", sessionId, { message: event.message })],
  compaction_end: (sessionId, event) => [agentEvent("agent.compaction.ended", sessionId, { status: event.status, message: event.message })],
  auto_retry_start: (sessionId, event) => [agentEvent("agent.retry.started", sessionId, { message: event.message, reason: event.reason })],
  auto_retry_end: (sessionId, event) => [agentEvent("agent.retry.ended", sessionId, { status: event.status, message: event.message })],
};

export function createAgentAppEvents(sessionId: AgentSessionId, runtimeEvent: AgentRuntimeEvent): AgentAppEvent[] {
  return eventMappers[runtimeEvent.type](sessionId, runtimeEvent);
}

function agentEvent(type: string, sessionId: AgentSessionId, payload: Record<string, unknown>): AgentAppEvent {
  return { type, payload: stripUndefined({ sessionId, ...payload }) };
}

function statusEvent(sessionId: AgentSessionId, status: AgentAppStatus, message: string): AgentAppEvent {
  return agentEvent("agent.status.changed", sessionId, { status, message });
}

function withOutput(event: AgentAppEvent, sessionId: AgentSessionId, messageId: string | undefined, text: string | undefined, strategy: OutputStrategy): AgentAppEvent[] {
  if (text === undefined || text.length === 0) return [event];
  return [event, agentEvent("agent.output.appended", sessionId, { messageId, strategy, text })];
}

function messagePayload(event: AgentRuntimeEvent) {
  return { messageId: event.id, role: event.role, text: event.text, delta: event.delta };
}

function toolPayload(event: AgentRuntimeEvent) {
  return { toolCallId: event.id, name: event.name, status: event.status, input: summarize(event.input), output: summarize(event.output), error: summarize(event.error), message: event.message };
}

function endStatus(event: AgentRuntimeEvent): AgentAppStatus {
  if (event.cancelled === true || event.status === "cancelled") return "cancelled";
  if (event.status === "failed") return "failed";
  return "completed";
}

function endMessage(event: AgentRuntimeEvent): string {
  if (event.message !== undefined) return event.message;
  if (endStatus(event) === "cancelled") return "Agent session cancelled.";
  if (endStatus(event) === "failed") return "Agent session failed.";
  return "Agent session completed.";
}

function textOr(value: string | undefined, fallback: string) {
  return value === undefined || value.length === 0 ? fallback : value;
}

function summarize(value: unknown): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "[structured data]";
}

function stripUndefined(payload: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
}
