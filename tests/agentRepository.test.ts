/// <reference types="bun" />

import { describe, expect, test } from "bun:test";
import type { AgentCommandResult, AgentSessionId } from "$lib/domain/ports";
import { createAgentAppEvents, type AgentRuntimeEvent, type AgentRuntimeEventType } from "$lib/infrastructure/outbound/agentAppEvents";
import type { AppEvent, AppEventPublisher } from "$lib/infrastructure/outbound/appEventHub";
import { createStubAgentRepository } from "$lib/infrastructure/outbound/agentRepository";

type RecordedEvent = Omit<AppEvent, "occurredAt">;

type Scenario = {
  when: {
    agentStarts: (prompt?: string) => Promise<void>;
    agentReceivesInput: (input: string) => Promise<void>;
    agentStops: () => Promise<void>;
  };
  then: {
    lastCommandResultWas: (result: AgentCommandResult) => void;
    eventWasPublished: (event: RecordedEvent) => void;
    eventsWerePublishedTimes: (times: number) => void;
  };
};

const createScenario = (sessionId: AgentSessionId): Scenario => {
  const events: RecordedEvent[] = [];
  let lastCommandResult: AgentCommandResult | undefined;

  const publishEvent: AppEventPublisher = (event) => {
    events.push(event);
    return { ...event, occurredAt: "2026-01-01T00:00:00.000Z" };
  };

  const repository = createStubAgentRepository({ createSessionId: () => sessionId, publishEvent });

  return {
    when: {
      agentStarts: async (prompt?: string) => {
        lastCommandResult = await repository.start({ prompt });
      },
      agentReceivesInput: async (input: string) => {
        lastCommandResult = await repository.sendInput({ sessionId, input });
      },
      agentStops: async () => {
        lastCommandResult = await repository.stop({ sessionId });
      },
    },
    then: {
      lastCommandResultWas: (result: AgentCommandResult) => {
        expect(lastCommandResult).toEqual(result);
      },
      eventWasPublished: (expectedEvent: RecordedEvent) => {
        expect(events).toContainEqual(expectedEvent);
      },
      eventsWerePublishedTimes: (times: number) => {
        expect(events).toHaveLength(times);
      },
    },
  };
};

describe("createStubAgentRepository", () => {
  test("starts an agent session and publishes normalized startup events", async () => {
    const scenario = createScenario("session-1");

    await scenario.when.agentStarts("work on ticket");

    scenario.then.lastCommandResultWas({ accepted: true, sessionId: "session-1", message: "Agent start command accepted by stub repository." });
    scenario.then.eventWasPublished({ type: "agent.started", payload: { sessionId: "session-1", message: "Stub agent session is running." } });
    scenario.then.eventWasPublished({ type: "agent.status.changed", payload: { sessionId: "session-1", status: "running", message: "Stub agent session is running." } });
    scenario.then.eventWasPublished({ type: "agent.output.appended", payload: { sessionId: "session-1", messageId: "stub-message-1", strategy: "append", text: "Stub agent session started." } });
    scenario.then.eventsWerePublishedTimes(8);
  });

  test("publishes normalized runtime events when the agent receives input", async () => {
    const scenario = createScenario("session-2");

    await scenario.when.agentReceivesInput("next step");

    scenario.then.lastCommandResultWas({ accepted: true, sessionId: "session-2", message: "Agent input command accepted by stub repository." });
    scenario.then.eventWasPublished({ type: "agent.tool.started", payload: { sessionId: "session-2", toolCallId: "stub-tool-1", name: "stub_adapter", input: "next step" } });
    scenario.then.eventWasPublished({ type: "agent.compaction.ended", payload: { sessionId: "session-2", status: "completed", message: "Stub compaction completed." } });
    scenario.then.eventWasPublished({ type: "agent.retry.ended", payload: { sessionId: "session-2", status: "completed", message: "Stub retry cycle completed." } });
    scenario.then.eventWasPublished({ type: "agent.output.appended", payload: { sessionId: "session-2", messageId: "stub-message-input", strategy: "append", text: "Stub agent received input: next step" } });
    scenario.then.eventsWerePublishedTimes(9);
  });

  test("stops an agent session as cancellation", async () => {
    const scenario = createScenario("session-3");

    await scenario.when.agentStops();

    scenario.then.lastCommandResultWas({ accepted: true, sessionId: "session-3", message: "Agent stop command accepted by stub repository." });
    scenario.then.eventWasPublished({ type: "agent.output.appended", payload: { sessionId: "session-3", messageId: "stub-message-stop", strategy: "append", text: "Stub agent session stopped." } });
    scenario.then.eventWasPublished({ type: "agent.ended", payload: { sessionId: "session-3", status: "cancelled", message: "Stub agent session cancelled." } });
    scenario.then.eventWasPublished({ type: "agent.status.changed", payload: { sessionId: "session-3", status: "cancelled", message: "Stub agent session cancelled." } });
    scenario.then.eventsWerePublishedTimes(5);
  });
});

describe("createAgentAppEvents", () => {
  test("covers every pi agent session event type with Quincy agent events", () => {
    const runtimeEvents: AgentRuntimeEvent[] = eventTypes.map((type) => ({ type, id: type, text: "text", delta: "delta", name: "tool", status: "completed", message: "message", reason: "reason" }));

    const appEvents = runtimeEvents.flatMap((event) => createAgentAppEvents("session-4", event));

    expect(appEvents.every((event) => event.type.startsWith("agent.") && appEventSessionId(event) === "session-4")).toBe(true);
    expect(new Set(appEvents.map((event) => event.type))).toEqual(
      new Set([
        "agent.started",
        "agent.ended",
        "agent.status.changed",
        "agent.turn.started",
        "agent.turn.ended",
        "agent.message.started",
        "agent.message.updated",
        "agent.message.ended",
        "agent.output.appended",
        "agent.tool.started",
        "agent.tool.updated",
        "agent.tool.ended",
        "agent.queue.updated",
        "agent.compaction.started",
        "agent.compaction.ended",
        "agent.retry.started",
        "agent.retry.ended",
      ]),
    );
  });
});

const eventTypes: AgentRuntimeEventType[] = [
  "agent_start",
  "agent_end",
  "turn_start",
  "turn_end",
  "message_start",
  "message_update",
  "message_end",
  "tool_execution_start",
  "tool_execution_update",
  "tool_execution_end",
  "queue_update",
  "compaction_start",
  "compaction_end",
  "auto_retry_start",
  "auto_retry_end",
];

function appEventSessionId(event: RecordedEvent): unknown {
  return typeof event.payload === "object" && event.payload !== null ? (event.payload as Record<string, unknown>).sessionId : undefined;
}
