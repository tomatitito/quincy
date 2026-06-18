import type { AgentSessionSummaryRepository } from "$lib/domain/ports";

export function getAgentSessionSummaries(repository: AgentSessionSummaryRepository) {
  return repository();
}
