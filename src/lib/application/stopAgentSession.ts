import type { AgentRepository, StopAgentSessionCommand } from "$lib/domain/ports";

export async function stopAgentSession(repository: AgentRepository, command: StopAgentSessionCommand) {
  return repository.stop(command);
}
