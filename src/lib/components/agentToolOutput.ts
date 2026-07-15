export type AgentTranscriptEntryKind = "user" | "thinking" | "answer" | "tool" | "tool-error" | "edit";

export function isCollapsibleToolOutput(kind: AgentTranscriptEntryKind): boolean {
  return kind === "tool" || kind === "tool-error" || kind === "edit";
}

export function shouldShowToolOutputBody(mobileViewport: boolean, kind: AgentTranscriptEntryKind, expanded: boolean): boolean {
  return !mobileViewport || !isCollapsibleToolOutput(kind) || expanded;
}

export function toolOutputTitle(text: string): string {
  return firstLine(text).split(/\s+/, 1)[0] || "tool";
}

export function toolOutputPreview(text: string, maxLength?: number): string {
  const resolvedMaxLength = maxLength ?? 96;
  const previewSource = bodyText(text) || firstLine(text) || "No output.";
  if (previewSource.length <= resolvedMaxLength) return previewSource;
  return `${previewSource.slice(0, resolvedMaxLength - 1).trimEnd()}…`;
}

function firstLine(text: string): string {
  return text.trim().split("\n", 1)[0]?.trim() ?? "";
}

function bodyText(text: string): string {
  const [, ...rest] = text.trim().split("\n");
  return rest.join(" ").replace(/\s+/g, " ").trim();
}
