export interface BrowserAppEvent {
  type: string;
  payload?: unknown;
  occurredAt?: string;
}

type AppEventHandler = (event: BrowserAppEvent) => void;

export interface BrowserAppEventStream {
  listen(eventTypes: string[], handler: AppEventHandler): () => void;
  close(): void;
}

export function openAppEventStream(url: string): BrowserAppEventStream {
  const source = new EventSource(url);

  return {
    listen: (eventTypes, handler) => listenToEvents(source, eventTypes, handler),
    close: () => source.close(),
  };
}

function listenToEvents(source: EventSource, eventTypes: string[], handler: AppEventHandler): () => void {
  const listener = createEventListener(handler);

  for (const eventType of eventTypes) source.addEventListener(eventType, listener);
  return () => removeEventListeners(source, eventTypes, listener);
}

function createEventListener(handler: AppEventHandler): (message: MessageEvent<string>) => void {
  return (message) => {
    const event = parseAppEvent(message.data);
    if (event !== undefined) handler(event);
  };
}

function removeEventListeners(source: EventSource, eventTypes: string[], listener: (message: MessageEvent<string>) => void) {
  for (const eventType of eventTypes) source.removeEventListener(eventType, listener);
}

function parseAppEvent(data: string): BrowserAppEvent | undefined {
  try {
    const parsed: unknown = JSON.parse(data);
    if (!isRecord(parsed) || typeof parsed.type !== "string") return undefined;
    return { type: parsed.type, payload: parsed.payload, occurredAt: typeof parsed.occurredAt === "string" ? parsed.occurredAt : undefined };
  } catch {
    return undefined;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
