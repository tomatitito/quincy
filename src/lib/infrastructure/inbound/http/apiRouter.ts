import { randomUUID } from "node:crypto";
import { getAgentSessionSummaries } from "$lib/application/getAgentSessionSummaries";
import { resumeAgentSession } from "$lib/application/resumeAgentSession";
import { sendAgentInput } from "$lib/application/sendAgentInput";
import { startAgentSession } from "$lib/application/startAgentSession";
import { stopAgentSession } from "$lib/application/stopAgentSession";
import { getKanbanView } from "$lib/application/getKanbanView";
import { getProjectFileSuggestions } from "$lib/application/getProjectFileSuggestions";
import { createConfigProvider } from "$lib/infrastructure/outbound/config";
import { createPiRuntimeRepository } from "$lib/infrastructure/outbound/piRuntimeRepository";
import { createPiSessionSummaryRepository } from "$lib/infrastructure/outbound/piSessionSummaryRepository";
import { createProjectFileRepository } from "$lib/infrastructure/outbound/projectFileRepository";
import { publishAppEvent } from "$lib/infrastructure/outbound/appEventHub";
import { createTicketFileRepository } from "$lib/infrastructure/outbound/ticketFileRepository";
import { createSelectedProjectCookie, readSelectedProjectFromRequest } from "$lib/infrastructure/inbound/http/projectSelectionCookie";
import type { AgentRepository, AgentSessionSummaryRepository, ProjectFileRepository, ProjectPath } from "$lib/domain/ports";

interface ProjectRepositories {
  agentRepository: AgentRepository;
  agentSessionSummaryRepository: AgentSessionSummaryRepository;
  projectFileRepository: ProjectFileRepository;
}

const configProvider = createConfigProvider();
const projectRepositories = new Map<ProjectPath, ProjectRepositories>();

export async function handleApiRequest(request: Request): Promise<Response> {
  const path = new URL(request.url).pathname;
  if (request.method === "GET") return handleGetRequest(request, path);
  if (request.method === "POST") return handlePostRequest(request, path);
  return notFoundResponse();
}

async function handleGetRequest(request: Request, path: string): Promise<Response> {
  if (path.endsWith("/kanban")) return Response.json(await loadKanban(request));
  if (path.endsWith("/agent/sessions")) return Response.json(await loadAgentSessions(request));
  if (path.endsWith("/project-files")) return Response.json(await loadProjectFileSuggestions(request));
  return notFoundResponse();
}

async function handlePostRequest(request: Request, path: string): Promise<Response> {
  if (path.endsWith("/projects/select")) return handleProjectSelect(request);
  if (path.endsWith("/agent/start")) return Response.json(await handleAgentStart(request));
  if (path.endsWith("/agent/resume")) return Response.json(await handleAgentResume(request));
  if (path.endsWith("/agent/stop")) return Response.json(await handleAgentStop(request));
  if (path.endsWith("/agent/input")) return Response.json(await handleAgentInput(request));
  return notFoundResponse();
}

function notFoundResponse(): Response {
  return Response.json({ error: "Not found" }, { status: 404 });
}

async function loadKanban(request: Request) {
  const config = await loadConfig(request);
  return getKanbanView(createTicketFileRepository(config.ticketDirectory));
}

async function loadAgentSessions(request: Request) {
  const { agentSessionSummaryRepository } = await loadProjectRepositories(request);
  return getAgentSessionSummaries(agentSessionSummaryRepository);
}

async function loadProjectFileSuggestions(request: Request) {
  const { projectFileRepository } = await loadProjectRepositories(request);
  return getProjectFileSuggestions(projectFileRepository, { query: new URL(request.url).searchParams.get("query") ?? "" });
}

async function handleProjectSelect(request: Request) {
  const body = await readJsonRecord(request);
  const projectPath = requiredString(body.projectPath, "projectPath");
  const config = await configProvider({ selectedProjectPath: projectPath });
  return Response.json(
    { projectPath: config.projectPath, ticketDirectory: config.ticketDirectory },
    { headers: { "set-cookie": createSelectedProjectCookie(config.projectPath) } },
  );
}

async function handleAgentStart(request: Request) {
  const body = await readJsonRecord(request);
  const { agentRepository } = await loadProjectRepositories(request);
  return startAgentSession(agentRepository, { prompt: optionalString(body.prompt) });
}

async function handleAgentResume(request: Request) {
  const body = await readJsonRecord(request);
  const sessionId = requiredString(body.sessionId, "sessionId");
  const { agentRepository } = await loadProjectRepositories(request);
  return resumeAgentSession(agentRepository, { sessionId });
}

async function handleAgentStop(request: Request) {
  const body = await readJsonRecord(request);
  const sessionId = requiredString(body.sessionId, "sessionId");
  const { agentRepository } = await loadProjectRepositories(request);
  return stopAgentSession(agentRepository, { sessionId });
}

async function handleAgentInput(request: Request) {
  const body = await readJsonRecord(request);
  const sessionId = requiredString(body.sessionId, "sessionId");
  const input = requiredString(body.input, "input");
  const { agentRepository } = await loadProjectRepositories(request);
  return sendAgentInput(agentRepository, { sessionId, input });
}

async function loadProjectRepositories(request: Request): Promise<ProjectRepositories> {
  const config = await loadConfig(request);
  return repositoriesForProject(config.projectPath);
}

async function loadConfig(request: Request) {
  return configProvider({ selectedProjectPath: readSelectedProjectFromRequest(request) });
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
    projectFileRepository: createProjectFileRepository(projectPath),
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
