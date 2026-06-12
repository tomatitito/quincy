import type { AgentRepository, StartAgentSessionCommand } from "$lib/domain/ports";

export async function startAgentSession(repository: AgentRepository, command: StartAgentSessionCommand) {
  return repository.start(command);
}
