export const agentOutputEventTypes = ["agent.output", "agent.output.appended", "agent.message.started", "agent.message.updated", "agent.message.ended"] as const;

export function agentOutputText(payload: Record<string, unknown> | undefined): string | undefined {
  return stringFrom(payload?.delta) ?? stringFrom(payload?.text) ?? stringFrom(payload?.output) ?? stringFrom(payload?.chunk) ?? stringFrom(payload?.line);
}

export function normalizeAgentOutputPayload(eventType: string, payload: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (payload === undefined) return undefined;
  if (payload.strategy === "append" || payload.strategy === "replace") return payload;
  if (eventType === "agent.message.started" || eventType === "agent.message.ended") return { ...payload, strategy: "replace" };
  if (eventType === "agent.message.updated") return { ...payload, strategy: payload.delta === undefined ? "replace" : "append" };
  return payload;
}

function stringFrom(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}
