/// <reference types="bun" />

import { describe, expect, test } from "bun:test";
import { isCollapsibleToolOutput, shouldShowToolOutputBody, toolOutputPreview, toolOutputTitle } from "$lib/components/agentToolOutput";

describe("agent tool output", () => {
  test("collapses only tool-like transcript entries on mobile", () => {
    expect(isCollapsibleToolOutput("tool")).toBe(true);
    expect(isCollapsibleToolOutput("tool-error")).toBe(true);
    expect(isCollapsibleToolOutput("edit")).toBe(true);
    expect(isCollapsibleToolOutput("answer")).toBe(false);
    expect(isCollapsibleToolOutput("thinking")).toBe(false);
    expect(isCollapsibleToolOutput("user")).toBe(false);
    expect(shouldShowToolOutputBody(true, "tool", false)).toBe(false);
    expect(shouldShowToolOutputBody(true, "tool", true)).toBe(true);
    expect(shouldShowToolOutputBody(true, "answer", false)).toBe(true);
    expect(shouldShowToolOutputBody(false, "tool", false)).toBe(true);
  });

  test("derives compact mobile card title and preview from tool output", () => {
    const text = "bash completed\n\nstdout line one\nstdout line two";

    expect(toolOutputTitle(text)).toBe("bash");
    expect(toolOutputPreview(text)).toBe("stdout line one stdout line two");
  });

  test("falls back cleanly when tool output has no body", () => {
    expect(toolOutputPreview("read")).toBe("read");
    expect(toolOutputPreview(`bash completed\n\n${"x".repeat(120)}`, 24)).toBe(`${"x".repeat(23)}…`);
  });
});
