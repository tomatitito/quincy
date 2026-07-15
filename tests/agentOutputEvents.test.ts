/// <reference types="bun" />

import { describe, expect, test } from "bun:test";
import { agentOutputEventTypes, agentOutputText, normalizeAgentOutputPayload } from "$lib/components/agentOutputEvents";

describe("agent output events", () => {
  test("includes streaming message app events", () => {
    expect(agentOutputEventTypes).toEqual(["agent.output", "agent.output.appended", "agent.message.updated", "agent.message.ended"]);
  });

  test("prefers streaming delta text over finalized message text", () => {
    expect(agentOutputText({ delta: "Hello", text: "Hello world" })).toBe("Hello");
  });

  test("maps streaming message events to output update strategies", () => {
    expect(normalizeAgentOutputPayload("agent.message.updated", { messageId: "m1", delta: "Hello" })).toEqual({ messageId: "m1", delta: "Hello", strategy: "append" });
    expect(normalizeAgentOutputPayload("agent.message.updated", { messageId: "m1", text: "Hello world" })).toEqual({ messageId: "m1", text: "Hello world", strategy: "replace" });
    expect(normalizeAgentOutputPayload("agent.message.ended", { messageId: "m1", text: "Hello world" })).toEqual({ messageId: "m1", text: "Hello world", strategy: "replace" });
  });
});
