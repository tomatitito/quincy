/// <reference types="bun" />

import { readFileSync } from "node:fs";
import { describe, expect, test } from "bun:test";

const panelSource = readFileSync("src/lib/components/TerminalPanel.svelte", "utf8");
const layoutSource = readFileSync("src/lib/components/ResponsiveWorkspaceLayout.svelte", "utf8");

describe("Terminal workspace UI", () => {
  test("adds terminal navigation without agent composer controls", () => {
    expect(layoutSource).toContain('onclick={() => selectTab("terminal")}');
    expect(layoutSource).toContain('aria-label="Terminal — preferred agent workflow"');
    expect(layoutSource).toContain("<TerminalPanel projectPath={data.projectPath} />");
    expect(layoutSource).toContain('aria-label={agentOverlayOpen ? "Agent overlay" : "Terminal overlay"}');
    expect(panelSource).toContain('aria-label="Terminal view"');
    expect(panelSource).toContain("Terminal · Preferred agent workflow");
    expect(panelSource).not.toContain("/api/agent/");
    expect(panelSource).not.toContain("AgentPanel");
  });

  test("delegates terminal behavior to xterm instead of rendered text and hand-coded keys", () => {
    expect(panelSource).toContain('Terminal } from "@xterm/xterm"');
    expect(panelSource).toContain("inputQueue = inputQueue.then(() => sendInput(input))");
    expect(panelSource).toContain("fitAddon.fit()");
    expect(panelSource).not.toContain("<pre>");
    expect(panelSource).not.toContain("function sequenceForKey");
    expect(panelSource).not.toContain("onkeydown={handleKeydown}");
  });

  test("closes current session during project change and component teardown", () => {
    expect(panelSource).toContain("await inputQueue;");
    expect(panelSource).toContain("await closeCurrentTerminal();");
    expect(panelSource).toContain("inputQueue = inputQueue.then(closeCurrentTerminal);");
    expect(panelSource).toContain('sendCommand("/api/terminal/close", { sessionId, projectPath: activeProjectPath })');
  });

  test("makes connection failures explicit and lets users reopen", () => {
    expect(panelSource).toContain("Terminal connection lost. Reopen to retry.");
    expect(panelSource).toContain("Terminal request failed (${status}): ${body}");
    expect(panelSource).toContain('onclick={openTerminal}>Reopen</button>');
    expect(panelSource).toContain("terminal?.focus()");
  });
});
