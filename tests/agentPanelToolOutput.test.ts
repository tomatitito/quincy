/// <reference types="bun" />

import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const source = readFileSync("src/lib/components/AgentPanel.svelte", "utf8");

describe("AgentPanel mobile tool output", () => {
  test("keeps non-tool transcript entries on current path", () => {
    expect(source).toContain('{#if mobileViewport && isCollapsibleToolOutput(entry.kind)}');
    expect(source).toContain('{#if shouldShowToolOutputBody(mobileViewport, entry.kind, toolOutputExpanded(entry))}');
  });

  test("renders mobile tool output as collapsed expandable cards", () => {
    expect(source).toContain('class="tool-output-toggle"');
    expect(source).toContain('aria-expanded={toolOutputExpanded(entry)}');
    expect(source).toContain('onclick={() => toggleToolOutput(entry)}');
    expect(source).toContain('class="tool-output-title">{toolOutputTitle(entry.text)}');
    expect(source).toContain('class="tool-output-preview">{toolOutputPreview(entry.text)}');
    expect(source).toContain('{toolOutputExpanded(entry) ? "Hide" : "Show"}');
  });
});
