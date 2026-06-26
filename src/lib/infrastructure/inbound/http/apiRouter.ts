import { randomUUID } from "node:crypto";
import { getAgentSessionSummaries } from "$lib/application/getAgentSessionSummaries";
import { sendAgentInput } from "$lib/application/sendAgentInput";
import { startAgentSession } from "$lib/application/startAgentSession";
import { stopAgentSession } from "$lib/application/stopAgentSession";
import { getKanbanView } from "$lib/application/getKanbanView";
import { createConfigProvider } from "$lib/infrastructure/outbound/config";
import { createPiRuntimeRepository } from "$lib/infrastructure/outbound/piRuntimeRepository";
import { createPiSessionSummaryRepository } from "$lib/infrastructure/outbound/piSessionSummaryRepository";
import { publishAppEvent } from "$lib/infrastructure/outbound/appEventHub";
import { createTicketFileRepository } from "$lib/infrastructure/outbound/ticketFileRepository";
import type { AgentRepository, AgentSessionSummaryRepository, ProjectPath } from "$lib/domain/ports";

interface ProjectRepositories {
  agentRepository: AgentRepository;
  agentSessionSummaryRepository: AgentSessionSummaryRepository;
}

const configProvider = createConfigProvider();
const projectRepositories = new Map<ProjectPath, ProjectRepositories>();

export async function handleApiRequest(request: Request): Promise<Response> {
  const path = new URL(request.url).pathname;
  if (request.method === "GET" && path.endsWith("/kanban")) return Response.json(await loadKanban());
  if (request.method === "GET" && path.endsWith("/agent/sessions")) return Response.json(await loadAgentSessions());
  if (request.method === "POST" && path.endsWith("/agent/start")) return Response.json(await handleAgentStart(request));
  if (request.method === "POST" && path.endsWith("/agent/stop")) return Response.json(await handleAgentStop(request));
  if (request.method === "POST" && path.endsWith("/agent/input")) return Response.json(await handleAgentInput(request));
  return Response.json({ error: "Not found" }, { status: 404 });
}

async function loadKanban() {
  const config = await configProvider();
  return getKanbanView(createTicketFileRepository(config.ticketDirectory));
}

async function loadAgentSessions() {
  const { agentSessionSummaryRepository } = await loadProjectRepositories();
  return getAgentSessionSummaries(agentSessionSummaryRepository);
}

async function handleAgentStart(request: Request) {
  const body = await readJsonRecord(request);
  const { agentRepository } = await loadProjectRepositories();
  return startAgentSession(agentRepository, { prompt: optionalString(body.prompt) });
}

async function handleAgentStop(request: Request) {
  const body = await readJsonRecord(request);
  const sessionId = requiredString(body.sessionId, "sessionId");
  const { agentRepository } = await loadProjectRepositories();
  return stopAgentSession(agentRepository, { sessionId });
}

async function handleAgentInput(request: Request) {
  const body = await readJsonRecord(request);
  const sessionId = requiredString(body.sessionId, "sessionId");
  const input = requiredString(body.input, "input");
  const { agentRepository } = await loadProjectRepositories();
  return sendAgentInput(agentRepository, { sessionId, input });
}

async function loadProjectRepositories(): Promise<ProjectRepositories> {
  const config = await configProvider();
  return repositoriesForProject(config.projectPath);
}

function repositoriesForProject(projectPath: ProjectPath): ProjectRepositories {
  const existing = projectRepositories.get(projectPath);
  if (existing !== undefined) return existing;
  const repositories = createProjectRepositories(projectPath);
  projectRepositories.set(projectPath, repositories);
  return repositories;
}

function createProjectRepositories(projectPath: ProjectPath): ProjectRepositories {
  return {
    agentRepository: createPiRuntimeRepository({ createSessionId: randomUUID, cwd: projectPath, publishEvent: publishAppEvent }),
    agentSessionSummaryRepository: createPiSessionSummaryRepository({ cwd: projectPath }),
  };
}

async function readJsonRecord(request: Request): Promise<Record<string, unknown>> {
  const body: unknown = await request.json();
  if (typeof body === "object" && body !== null) return body as Record<string, unknown>;
  throw new Response("Expected JSON object", { status: 400 });
}

function optionalString(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function requiredString(value: unknown, name: string) {
  if (typeof value === "string" && value.length > 0) return value;
  throw new Response(`Missing ${name}`, { status: 400 });
}
