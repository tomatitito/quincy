import { randomUUID } from "node:crypto";
import { sendAgentInput } from "$lib/application/sendAgentInput";
import { startAgentSession } from "$lib/application/startAgentSession";
import { stopAgentSession } from "$lib/application/stopAgentSession";
import { getKanbanView } from "$lib/application/getKanbanView";
import { createConfigProvider } from "$lib/infrastructure/outbound/config";
import { createPiRuntimeRepository } from "$lib/infrastructure/outbound/piRuntimeRepository";
import { publishAppEvent } from "$lib/infrastructure/outbound/appEventHub";
import { createTicketFileRepository } from "$lib/infrastructure/outbound/ticketFileRepository";

const agentRepository = createPiRuntimeRepository({ createSessionId: randomUUID, cwd: process.cwd(), publishEvent: publishAppEvent });

export async function handleApiRequest(request: Request): Promise<Response> {
  const path = new URL(request.url).pathname;
  if (request.method === "GET" && path.endsWith("/kanban")) return Response.json(await loadKanban());
  if (request.method === "POST" && path.endsWith("/agent/start")) return Response.json(await handleAgentStart(request));
  if (request.method === "POST" && path.endsWith("/agent/stop")) return Response.json(await handleAgentStop(request));
  if (request.method === "POST" && path.endsWith("/agent/input")) return Response.json(await handleAgentInput(request));
  return Response.json({ error: "Not found" }, { status: 404 });
}

async function loadKanban() {
  const config = await createConfigProvider()();
  return getKanbanView(createTicketFileRepository(config.ticketDirectory));
}

async function handleAgentStart(request: Request) {
  const body = await readJsonRecord(request);
  return startAgentSession(agentRepository, { prompt: optionalString(body.prompt) });
}

async function handleAgentStop(request: Request) {
  const body = await readJsonRecord(request);
  const sessionId = requiredString(body.sessionId, "sessionId");
  return stopAgentSession(agentRepository, { sessionId });
}

async function handleAgentInput(request: Request) {
  const body = await readJsonRecord(request);
  const sessionId = requiredString(body.sessionId, "sessionId");
  const input = requiredString(body.input, "input");
  return sendAgentInput(agentRepository, { sessionId, input });
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
