import type { AgentRepository, ResumeAgentSessionCommand } from "$lib/domain/ports";

export async function resumeAgentSession(repository: AgentRepository, command: ResumeAgentSessionCommand) {
  return repository.resume(command);
}
