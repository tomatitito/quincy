import { randomUUID } from "node:crypto";
import type { AgentRepository, AgentSessionId } from "$lib/domain/ports";

export function createStubAgentRepository(): AgentRepository {
  return { start: startStubAgent, stop: stopStubAgent, sendInput: sendStubAgentInput };
}

async function startStubAgent() {
  return createResult(randomUUID(), "Agent start command accepted by stub repository.");
}

async function stopStubAgent({ sessionId }: { sessionId: AgentSessionId }) {
  return createResult(sessionId, "Agent stop command accepted by stub repository.");
}

async function sendStubAgentInput({ sessionId }: { sessionId: AgentSessionId }) {
  return createResult(sessionId, "Agent input command accepted by stub repository.");
}

function createResult(sessionId: AgentSessionId, message: string) {
  return { accepted: true, sessionId, message };
}
