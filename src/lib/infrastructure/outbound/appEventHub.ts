import { logAppEvent } from "$lib/infrastructure/outbound/appEventLogger";

export interface AppEvent {
  type: string;
  payload?: unknown;
  occurredAt: string;
}

export type AppEventPublisher = (event: Omit<AppEvent, "occurredAt">) => AppEvent;

type AppEventSubscriber = (event: AppEvent) => unknown;

const subscribers = new Set<AppEventSubscriber>();

export function publishAppEvent(event: Omit<AppEvent, "occurredAt">): AppEvent {
  const publishedEvent = { ...event, occurredAt: new Date().toISOString() };
  logAppEvent(publishedEvent);
  for (const subscriber of subscribers) subscriber(publishedEvent);
  return publishedEvent;
}

export function subscribeToAppEvents(subscriber: AppEventSubscriber): () => boolean {
  subscribers.add(subscriber);
  return () => subscribers.delete(subscriber);
}
