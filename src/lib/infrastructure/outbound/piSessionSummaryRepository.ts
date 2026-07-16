import type { AgentSessionSummary, AgentSessionSummaryRepository } from "$lib/domain/ports";

interface PiSessionSummaryRepositoryDependencies {
  cwd: string;
  loadSdk?: () => Promise<PiSessionSummarySdk>;
}

interface PiSessionInfo {
  id: string;
  name?: string;
  modified: Date;
  firstMessage: string;
}

interface PiSessionSummarySdk {
  SessionManager: { list: (cwd: string) => Promise<PiSessionInfo[]> };
}

export function createPiSessionSummaryRepository(dependencies: PiSessionSummaryRepositoryDependencies): AgentSessionSummaryRepository {
  return () => listSessionSummaries(dependencies);
}

async function listSessionSummaries(dependencies: PiSessionSummaryRepositoryDependencies): Promise<AgentSessionSummary[]> {
  const { SessionManager } = await loadPiSdk(dependencies);
  const sessions = await SessionManager.list(dependencies.cwd);
  return uniqueSessions(sessions).map(toSessionSummary).sort(byLastUsedDesc);
}

async function loadPiSdk(dependencies: PiSessionSummaryRepositoryDependencies) {
  if (dependencies.loadSdk !== undefined) return dependencies.loadSdk();
  const packageName = "@earendil-works/pi-coding-" + "agent";
  return import(/* @vite-ignore */ packageName) as Promise<PiSessionSummarySdk>;
}

function uniqueSessions(sessions: PiSessionInfo[]): PiSessionInfo[] {
  const byId = new Map<string, PiSessionInfo>();
  for (const session of sessions) if (!byId.has(session.id)) byId.set(session.id, session);
  return [...byId.values()];
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
