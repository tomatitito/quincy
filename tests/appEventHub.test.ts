/// <reference types="bun" />

import { afterEach, describe, expect, test } from "bun:test";
import { publishAppEvent } from "$lib/infrastructure/outbound/appEventHub";
import type { AppEvent } from "$lib/infrastructure/outbound/appEventHub";

const originalLogEvents = process.env.QUINCY_LOG_EVENTS;
const originalConsoleInfo = console.info;

type RecordedLogCall = unknown[];
type PublishableAppEvent = Omit<AppEvent, "occurredAt">;

type Scenario = {
  given: {
    eventLoggingIsEnabled: () => void;
    eventLoggingIsDisabled: () => void;
  };
  when: {
    appEventIsPublished: (event: PublishableAppEvent) => void;
  };
  then: {
    noEventWasLogged: () => void;
    eventWasLogged: (event: PublishableAppEvent) => void;
    fullTextWasNotLogged: (text: string) => void;
  };
};

const createScenario = (): Scenario => {
  const logCalls: RecordedLogCall[] = [];
  let publishedEvent: AppEvent | undefined;

  console.info = (...args: unknown[]) => logCalls.push(args);

  return {
    given: {
      eventLoggingIsEnabled: () => {
        process.env.QUINCY_LOG_EVENTS = "1";
      },
      eventLoggingIsDisabled: () => {
        delete process.env.QUINCY_LOG_EVENTS;
      },
    },
    when: {
      appEventIsPublished: (event) => {
        publishedEvent = publishAppEvent(event);
      },
    },
    then: {
      noEventWasLogged: () => {
        expect(logCalls).toEqual([]);
      },
      eventWasLogged: (expectedEvent) => {
        expect(publishedEvent).toMatchObject(expectedEvent);
        expect(publishedEvent?.occurredAt).toBeString();
        expect(logCalls).toHaveLength(1);
        expect(logCalls[0][0]).toBe("[app-event]");
        expect(logCalls[0][1]).toEqual({ type: publishedEvent?.type, occurredAt: publishedEvent?.occurredAt, payload: publishedEvent?.payload });
      },
      fullTextWasNotLogged: (text) => {
        const serializedLog = JSON.stringify(logCalls);
        expect(serializedLog).toContain(`"length":${text.length}`);
        expect(serializedLog).not.toContain(text);
      },
    },
  };
};

describe("publishAppEvent logging", () => {
  afterEach(() => {
    process.env.QUINCY_LOG_EVENTS = originalLogEvents;
    console.info = originalConsoleInfo;
  });

  test("is silent by default", () => {
    const scenario = createScenario();

    scenario.given.eventLoggingIsDisabled();
    scenario.when.appEventIsPublished({ type: "tickets.changed", payload: { ticketDirectory: ".tickets" } });

    scenario.then.noEventWasLogged();
  });

  test("logs event type, timestamp, and payload metadata when enabled", () => {
    const scenario = createScenario();

    scenario.given.eventLoggingIsEnabled();
    scenario.when.appEventIsPublished({ type: "agent.status.changed", payload: { sessionId: "session-1", status: "running" } });

    scenario.then.eventWasLogged({ type: "agent.status.changed", payload: { sessionId: "session-1", status: "running" } });
  });

  test("does not log full agent output text", () => {
    const scenario = createScenario();
    const longText = "x".repeat(200);

    scenario.given.eventLoggingIsEnabled();
    scenario.when.appEventIsPublished({ type: "agent.output.appended", payload: { sessionId: "session-1", messageId: "message-1", role: "assistant", strategy: "append", text: longText } });

    scenario.then.fullTextWasNotLogged(longText);
  });
});
