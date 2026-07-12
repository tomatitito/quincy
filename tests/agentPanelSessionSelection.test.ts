/// <reference types="bun" />

import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const source = readFileSync("src/lib/components/AgentPanel.svelte", "utf8");

describe("AgentPanel session selection", () => {
  test("renders session rows as accessible controls with active state", () => {
    expect(source).toContain('<button type="button" class="agent-session-row"');
    expect(source).toContain('class:active={session.id === activeSessionId}');
    expect(source).toContain('aria-current={session.id === activeSessionId ? "true" : undefined}');
    expect(source).toContain('<span class="session-label">{session.label}</span>');
  });

  test("resumes selected session and restores returned transcript", () => {
    expect(source).toContain('sendCommand("/api/agent/resume", { sessionId })');
    expect(source).toContain("activeSessionId = result.sessionId");
    expect(source).toContain("output = result.transcript.map(outputFromTranscript)");
  });

  test("failed selection keeps state unchanged", () => {
    expect(source).toContain("if (result === undefined) return;");
  });
});
