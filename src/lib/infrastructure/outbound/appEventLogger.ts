import type { AppEvent } from "$lib/infrastructure/outbound/appEventHub";

const LONG_STRING_LIMIT = 120;
const OUTPUT_PREVIEW_LIMIT = 80;
const MAX_PAYLOAD_DEPTH = 2;

type EventLogPayload = {
  type: string;
  occurredAt: string;
  payload?: unknown;
};

export type AppEventLogger = (event: AppEvent) => void;

export const logAppEvent: AppEventLogger = (event) => {
  if (!appEventLoggingEnabled()) return;
  console.info("[app-event]", createEventLogPayload(event));
};

function appEventLoggingEnabled(): boolean {
  return process.env.QUINCY_LOG_EVENTS === "1";
}

function createEventLogPayload(event: AppEvent): EventLogPayload {
  return {
    type: event.type,
    occurredAt: event.occurredAt,
    payload: summarizePayload(event.type, event.payload),
  };
}

function summarizePayload(eventType: string, payload: unknown): unknown {
  return summarizeValue(payload, { eventType, key: undefined, depth: 0 });
}

function summarizeValue(value: unknown, context: { eventType: string; key: string | undefined; depth: number }): unknown {
  if (value === undefined || value === null) return value;
  if (typeof value === "string") return summarizeString(value, context);
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) return context.depth >= MAX_PAYLOAD_DEPTH ? `[array:${value.length}]` : value.map((item) => summarizeValue(item, { ...context, key: undefined, depth: context.depth + 1 }));
  if (typeof value === "object") return summarizeObject(value as Record<string, unknown>, context);
  return `[${typeof value}]`;
}

function summarizeObject(value: Record<string, unknown>, context: { eventType: string; key: string | undefined; depth: number }): Record<string, unknown> | string {
  if (context.depth >= MAX_PAYLOAD_DEPTH) return "[structured data]";
  return Object.fromEntries(Object.entries(value).map(([key, nestedValue]) => [key, summarizeValue(nestedValue, { eventType: context.eventType, key, depth: context.depth + 1 })]));
}

function summarizeString(value: string, context: { eventType: string; key: string | undefined; depth: number }): string | { length: number; preview: string } {
  if (context.eventType === "agent.output.appended" && context.key === "text") return { length: value.length, preview: truncate(value, OUTPUT_PREVIEW_LIMIT) };
  return truncate(value, LONG_STRING_LIMIT);
}

function truncate(value: string, limit: number): string {
  return value.length <= limit ? value : `${value.slice(0, limit)}…`;
}
