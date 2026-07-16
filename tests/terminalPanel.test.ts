/// <reference types="bun" />

import { readFileSync } from "node:fs";
import { describe, expect, test } from "bun:test";

const panelSource = readFileSync("src/lib/components/TerminalPanel.svelte", "utf8");
const layoutSource = readFileSync("src/lib/components/ResponsiveWorkspaceLayout.svelte", "utf8");

describe("Terminal workspace UI", () => {
  test("adds terminal navigation without agent composer controls", () => {
    expect(layoutSource).toContain('onclick={() => selectTab("terminal")}');
    expect(layoutSource).toContain("<TerminalPanel projectPath={data.projectPath} />");
    expect(layoutSource).toContain('aria-label={agentOverlayOpen ? "Agent overlay" : "Terminal overlay"}');
    expect(panelSource).toContain('aria-label="Terminal view"');
    expect(panelSource).not.toContain("/api/agent/");
    expect(panelSource).not.toContain("AgentPanel");
  });

  test("delegates terminal behavior to xterm instead of rendered text and hand-coded keys", () => {
    expect(panelSource).toContain('Terminal } from "@xterm/xterm"');
    expect(panelSource).toContain("terminal.onData((input) => void sendInput(input))");
    expect(panelSource).toContain("fitAddon.fit()");
    expect(panelSource).not.toContain("<pre>");
    expect(panelSource).not.toContain("function sequenceForKey");
    expect(panelSource).not.toContain("onkeydown={handleKeydown}");
  });

  test("closes current session during project change and component teardown", () => {
    expect(panelSource).toContain("await closeCurrentTerminal();");
    expect(panelSource).toContain("void closeCurrentTerminal();");
    expect(panelSource).toContain('sendCommand("/api/terminal/close", { sessionId, projectPath: activeProjectPath })');
  });
});
