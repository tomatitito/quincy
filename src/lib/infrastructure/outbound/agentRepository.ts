import type { AgentCommandResult, AgentInputText, AgentRepository, AgentSessionId } from "$lib/domain/ports";
import { createAgentAppEvents } from "$lib/infrastructure/outbound/agentAppEvents";
import type { AgentRuntimeEvent } from "$lib/infrastructure/outbound/agentAppEvents";
import type { AppEventPublisher } from "$lib/infrastructure/outbound/appEventHub";

interface StubAgentRepositoryDependencies {
  createSessionId: () => AgentSessionId;
  publishEvent: AppEventPublisher;
}

export function createStubAgentRepository(dependencies: StubAgentRepositoryDependencies): AgentRepository {
  return { start: () => startAgent(dependencies), stop: (command) => stopAgent(dependencies, command.sessionId), sendInput: (command) => sendAgentInput(dependencies, command.sessionId, command.input) };
}

async function startAgent({ createSessionId, publishEvent }: StubAgentRepositoryDependencies) {
  const sessionId = createSessionId();
  publishRuntimeEvents(publishEvent, sessionId, stubStartEvents());
  return createResult(sessionId, "Agent start command accepted by stub repository.");
}

async function stopAgent({ publishEvent }: StubAgentRepositoryDependencies, sessionId: AgentSessionId) {
  publishRuntimeEvents(publishEvent, sessionId, [
    { type: "message_update", id: "stub-message-stop", role: "assistant", delta: "Stub agent session stopped." },
    { type: "turn_end", id: "stub-turn-1", status: "cancelled", message: "Stub agent turn cancelled." },
    { type: "agent_end", status: "cancelled", cancelled: true, message: "Stub agent session cancelled." },
  ]);
  return createResult(sessionId, "Agent stop command accepted by stub repository.");
}

async function sendAgentInput({ publishEvent }: StubAgentRepositoryDependencies, sessionId: AgentSessionId, input: AgentInputText) {
  publishRuntimeEvents(publishEvent, sessionId, stubInputEvents(input));
  return createResult(sessionId, "Agent input command accepted by stub repository.");
}

function stubStartEvents(): AgentRuntimeEvent[] {
  return [
    { type: "agent_start", message: "Stub agent session is running." },
    { type: "queue_update", size: 0, message: "No queued agent work." },
    { type: "turn_start", id: "stub-turn-1", message: "Stub agent turn started." },
    { type: "message_start", id: "stub-message-1", role: "assistant" },
    { type: "message_update", id: "stub-message-1", role: "assistant", delta: "Stub agent session started." },
    { type: "message_end", id: "stub-message-1", role: "assistant" },
  ];
}

function stubInputEvents(input: AgentInputText): AgentRuntimeEvent[] {
  return [...stubToolEvents(input), ...stubMaintenanceEvents(), { type: "message_update", id: "stub-message-input", role: "assistant", delta: `Stub agent received input: ${input}` }];
}

function stubToolEvents(input: AgentInputText): AgentRuntimeEvent[] {
  return [
    { type: "tool_execution_start", id: "stub-tool-1", name: "stub_adapter", input },
    { type: "tool_execution_update", id: "stub-tool-1", name: "stub_adapter", status: "running", message: "Stub adapter is processing input." },
    { type: "tool_execution_end", id: "stub-tool-1", name: "stub_adapter", status: "completed", output: "accepted" },
  ];
}

function stubMaintenanceEvents(): AgentRuntimeEvent[] {
  return [
    { type: "compaction_start", message: "Stub compaction started." },
    { type: "compaction_end", status: "completed", message: "Stub compaction completed." },
    { type: "auto_retry_start", reason: "stub demonstration", message: "Stub retry cycle started." },
    { type: "auto_retry_end", status: "completed", message: "Stub retry cycle completed." },
  ];
}

function publishRuntimeEvents(publishEvent: AppEventPublisher, sessionId: AgentSessionId, runtimeEvents: AgentRuntimeEvent[]) {
  for (const runtimeEvent of runtimeEvents) {
    for (const appEvent of createAgentAppEvents(sessionId, runtimeEvent)) publishEvent(appEvent);
  }
}

function createResult(sessionId: AgentSessionId, message: string): AgentCommandResult {
  return { accepted: true, sessionId, message };
}
