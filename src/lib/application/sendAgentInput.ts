import type { AgentRepository, SendAgentInputCommand } from "$lib/domain/ports";

export async function sendAgentInput(repository: AgentRepository, command: SendAgentInputCommand) {
  return repository.sendInput(command);
}
