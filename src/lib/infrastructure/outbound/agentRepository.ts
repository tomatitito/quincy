import type { AgentCommandResult, AgentInputText, AgentRepository, AgentSessionId } from "$lib/domain/ports";
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
  publishAgentStatus(publishEvent, sessionId, "running", "Stub agent session is running.");
  publishAgentOutput(publishEvent, sessionId, "Stub agent session started.");
  return createResult(sessionId, "Agent start command accepted by stub repository.");
}

async function stopAgent({ publishEvent }: StubAgentRepositoryDependencies, sessionId: AgentSessionId) {
  publishAgentOutput(publishEvent, sessionId, "Stub agent session stopped.");
  publishAgentStatus(publishEvent, sessionId, "completed", "Stub agent session completed.");
  return createResult(sessionId, "Agent stop command accepted by stub repository.");
}

async function sendAgentInput({ publishEvent }: StubAgentRepositoryDependencies, sessionId: AgentSessionId, input: AgentInputText) {
  publishAgentOutput(publishEvent, sessionId, `Stub agent received input: ${input}`);
  return createResult(sessionId, "Agent input command accepted by stub repository.");
}

function publishAgentStatus(publishEvent: AppEventPublisher, sessionId: AgentSessionId, status: string, message: string) {
  publishEvent({ type: "agent.status.changed", payload: { sessionId, status, message } });
}

function publishAgentOutput(publishEvent: AppEventPublisher, sessionId: AgentSessionId, text: string) {
  publishEvent({ type: "agent.output.appended", payload: { sessionId, text } });
}

function createResult(sessionId: AgentSessionId, message: string): AgentCommandResult {
  return { accepted: true, sessionId, message };
}
