import type { AgentSessionSummary, AgentSessionSummaryRepository } from "$lib/domain/ports";

interface PiSessionSummaryRepositoryDependencies {
  cwd: string;
}

interface PiSessionInfo {
  id: string;
  name?: string;
  modified: Date;
  firstMessage: string;
}

export function createPiSessionSummaryRepository(dependencies: PiSessionSummaryRepositoryDependencies): AgentSessionSummaryRepository {
  return () => listSessionSummaries(dependencies.cwd);
}

async function listSessionSummaries(cwd: string): Promise<AgentSessionSummary[]> {
  const { SessionManager } = await loadPiSdk();
  const sessions = await SessionManager.list(cwd);
  return sessions.map(toSessionSummary).sort(byLastUsedDesc);
}

async function loadPiSdk() {
  const packageName = "@earendil-works/pi-coding-" + "agent";
  return import(/* @vite-ignore */ packageName) as Promise<{ SessionManager: { list: (cwd: string) => Promise<PiSessionInfo[]> } }>;
}

function toSessionSummary(session: PiSessionInfo): AgentSessionSummary {
  const preview = session.firstMessage.trim();
  return {
    id: session.id,
    label: session.name?.trim() || preview || "Untitled session",
    preview,
    lastUsedAt: session.modified.toISOString(),
  };
}

function byLastUsedDesc(left: AgentSessionSummary, right: AgentSessionSummary): number {
  return right.lastUsedAt.localeCompare(left.lastUsedAt);
}
