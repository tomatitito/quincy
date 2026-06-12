/// <reference types="bun" />

import { describe, expect, test } from "bun:test";
import type { AgentCommandResult, AgentSessionId } from "$lib/domain/ports";
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
    eventsWerePublished: (events: RecordedEvent[]) => void;
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
      eventsWerePublished: (expectedEvents: RecordedEvent[]) => {
        expect(events).toEqual(expectedEvents);
      },
      eventsWerePublishedTimes: (times: number) => {
        expect(events).toHaveLength(times);
      },
    },
  };
};

describe("createStubAgentRepository", () => {
  test("starts an agent session and publishes the runtime startup events", async () => {
    const scenario = createScenario("session-1");

    await scenario.when.agentStarts("work on ticket");

    scenario.then.lastCommandResultWas({ accepted: true, sessionId: "session-1", message: "Agent start command accepted by stub repository." });
    scenario.then.eventsWerePublished([
      { type: "agent.status.changed", payload: { sessionId: "session-1", status: "running", message: "Stub agent session is running." } },
      { type: "agent.output.appended", payload: { sessionId: "session-1", text: "Stub agent session started." } },
    ]);
  });

  test("appends output when the agent receives input", async () => {
    const scenario = createScenario("session-2");

    await scenario.when.agentReceivesInput("next step");

    scenario.then.lastCommandResultWas({ accepted: true, sessionId: "session-2", message: "Agent input command accepted by stub repository." });
    scenario.then.eventsWerePublished([{ type: "agent.output.appended", payload: { sessionId: "session-2", text: "Stub agent received input: next step" } }]);
  });

  test("stops an agent session and publishes completion events", async () => {
    const scenario = createScenario("session-3");

    await scenario.when.agentStops();

    scenario.then.lastCommandResultWas({ accepted: true, sessionId: "session-3", message: "Agent stop command accepted by stub repository." });
    scenario.then.eventsWerePublished([
      { type: "agent.output.appended", payload: { sessionId: "session-3", text: "Stub agent session stopped." } },
      { type: "agent.status.changed", payload: { sessionId: "session-3", status: "completed", message: "Stub agent session completed." } },
    ]);
  });

  test("runs a full deterministic agent session", async () => {
    const scenario = createScenario("session-4");

    await scenario.when.agentStarts("work on ticket");
    await scenario.when.agentReceivesInput("continue");
    await scenario.when.agentStops();

    scenario.then.eventsWerePublished([
      { type: "agent.status.changed", payload: { sessionId: "session-4", status: "running", message: "Stub agent session is running." } },
      { type: "agent.output.appended", payload: { sessionId: "session-4", text: "Stub agent session started." } },
      { type: "agent.output.appended", payload: { sessionId: "session-4", text: "Stub agent received input: continue" } },
      { type: "agent.output.appended", payload: { sessionId: "session-4", text: "Stub agent session stopped." } },
      { type: "agent.status.changed", payload: { sessionId: "session-4", status: "completed", message: "Stub agent session completed." } },
    ]);
    scenario.then.eventsWerePublishedTimes(5);
  });
});
