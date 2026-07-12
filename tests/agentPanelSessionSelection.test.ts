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

  test("successful selection emits sheet-compatible close event while failures keep state unchanged", () => {
    expect(source).toContain("closeMobileSessionSheet();");
    expect(source).toContain('new CustomEvent("agent-session-selected", { bubbles: true })');
    expect(source).toContain("if (result === undefined) return;");
  });

  test("mobile sessions are default-hidden behind accessible bottom sheet controls", () => {
    expect(source).toContain('class="mobile-sessions-button"');
    expect(source).toContain('aria-haspopup="dialog"');
    expect(source).toContain('aria-expanded={mobileSessionSheetOpen}');
    expect(source).toContain('role="dialog"');
    expect(source).toContain('aria-modal="true"');
    expect(source).toContain('@media (max-width: 760px)');
    expect(source).toContain('.agent-session-sidebar {\n      display: none;');
  });

  test("mobile sheet state follows breakpoint and does not keep desktop content inert", () => {
    expect(source).toContain('window.matchMedia("(max-width: 760px)")');
    expect(source).toContain("if (!query.matches) closeMobileSessionSheet(false);");
    expect(source).toContain("inert={mobileSessionSheetOpen && mobileViewport}");
  });

  test("mobile sheet traps keyboard focus and restores focus only to visible trigger", () => {
    expect(source).toContain("containTabFocus(event, mobileSessionSheet)");
    expect(source).toContain("if (isVisibleElement(mobileSessionsButton)) mobileSessionsButton.focus();");
    expect(source).toContain('class="session-sheet-backdrop" aria-hidden="true" onpointerdown={handleMobileSessionBackdropPointerdown}');
    expect(source).toContain("if (isBackdropPointerEvent(event)) closeMobileSessionSheet();");
    expect(source).not.toContain('class="session-sheet-backdrop" aria-label=');
    expect(source).not.toContain('class="session-sheet-backdrop" tabindex=');
    expect(source).not.toContain('class="session-sheet-backdrop" role="button"');
  });
});
