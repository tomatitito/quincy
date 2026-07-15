import { createConfigProvider } from "$lib/infrastructure/outbound/config";
import { subscribeToAppEvents } from "$lib/infrastructure/outbound/appEventHub";
import type { AppEvent } from "$lib/infrastructure/outbound/appEventHub";
import { startTicketFileChangeEvents } from "$lib/infrastructure/outbound/ticketFileChangeEvents";
import { readSelectedProjectFromRequest } from "$lib/infrastructure/inbound/http/projectSelectionCookie";

const textEncoder = new TextEncoder();
const configProvider = createConfigProvider();

export async function handleAppEventStreamRequest(request: Request): Promise<Response> {
  const config = await configProvider({ selectedProjectPath: selectedProjectPathFromRequest(request) });
  // Lazily start the ticket event producer when the first browser event stream connects.
  // If more event producers need startup logic, move this into an app composition/bootstrap helper.
  startTicketFileChangeEvents(config.ticketDirectory);
  return new Response(createAppEventStream(request), { headers: sseHeaders() });
}

function sseHeaders(): HeadersInit {
  return {
    "cache-control": "no-cache",
    connection: "keep-alive",
    "content-type": "text/event-stream",
  };
}

function selectedProjectPathFromRequest(request: Request) {
  return new URL(request.url).searchParams.get("projectPath") ?? readSelectedProjectFromRequest(request);
}

function createAppEventStream(request: Request): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      const unsubscribe = subscribeToAppEvents((event) => controller.enqueue(encodeAppEvent(event)));
      request.signal.addEventListener("abort", unsubscribe, { once: true });
      controller.enqueue(encodeSseComment("connected"));
    },
  });
}

function encodeAppEvent(event: AppEvent): Uint8Array {
  return textEncoder.encode(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
}

function encodeSseComment(comment: string): Uint8Array {
  return textEncoder.encode(`: ${comment}\n\n`);
}
