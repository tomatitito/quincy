/// <reference types="bun" />

import path from "node:path";
import { describe, expect, test } from "bun:test";
import { createPiRuntimeRepository } from "$lib/infrastructure/outbound/piRuntimeRepository";
import type { AppEventPublisher } from "$lib/infrastructure/outbound/appEventHub";

const createScenario = () => {
  const calls: string[] = [];
  const session = createSession(calls);
  const sdk = createSdk(calls, session);
  const events: string[] = [];
  const publishEvent: AppEventPublisher = (event) => {
    events.push(event.type);
    return { ...event, occurredAt: "2026-01-01T00:00:00.000Z" };
  };
  const repository = createPiRuntimeRepository({ createSessionId: () => "new-session", cwd: "/repo", publishEvent, loadSdk: async () => sdk });
  return { calls, events, repository, session };
};

describe("createPiRuntimeRepository", () => {
  test("starts session with persisted Pi session id", async () => {
    const scenario = createScenario();

    const result = await scenario.repository.start({ prompt: "begin" });

    expect(result.sessionId).toBe("created-session");
    expect(scenario.calls).toContain("create:/repo");
    expect(scenario.session.prompts).toEqual(["begin"]);
  });

  test("resumes an existing persisted session and returns transcript", async () => {
    const scenario = createScenario();

    const result = await scenario.repository.resume({ sessionId: "persisted-session" });

    expect(result).toEqual({ accepted: true, sessionId: "persisted-session", message: "Agent resume command accepted.", transcript: [{ messageId: "m1", role: "user", text: "Existing prompt" }, { messageId: "m2", role: "assistant", text: "Existing answer", contentKind: "text" }, { messageId: "m3", role: "assistant", text: "Existing thought", contentKind: "thinking" }, { messageId: "m4", role: "tool", text: "tool output", contentKind: "text" }, { messageId: "m5", role: "tool", text: "command output" }, { messageId: "m6", role: "assistant", text: "compact summary" }] });
    expect(scenario.calls).toContain("list:/repo");
    expect(scenario.calls).toContain("open:/sessions/persisted.jsonl");
    expect(scenario.calls).not.toContain("create:/repo");
  });

  test("loads Quincy delegation extension into pi services", async () => {
    const scenario = createScenario();

    await scenario.repository.resume({ sessionId: "persisted-session" });

    expect(scenario.calls).toContain("services:delegation-extension");
  });

  test("continues resumed session without creating replacement", async () => {
    const scenario = createScenario();

    await scenario.repository.resume({ sessionId: "persisted-session" });
    const result = await scenario.repository.sendInput({ sessionId: "persisted-session", input: "continue" });

    expect(result).toEqual({ accepted: true, sessionId: "persisted-session", message: "Agent input command accepted." });
    expect(scenario.session.prompts).toEqual(["continue"]);
    expect(scenario.calls.filter((call) => call === "create:/repo")).toHaveLength(0);
  });

  test("failed resume leaves previous active session usable", async () => {
    const scenario = createScenario();

    await scenario.repository.resume({ sessionId: "persisted-session" });
    const failed = await scenario.repository.resume({ sessionId: "missing-session" });
    await scenario.repository.sendInput({ sessionId: "persisted-session", input: "still active" });

    expect(failed).toEqual({ accepted: false, sessionId: "missing-session", message: "Agent session not found." });
    expect(scenario.session.prompts).toEqual(["still active"]);
  });
});

function createSession(calls: string[]) {
  return {
    isStreaming: false,
    messages: [{ id: "m1", role: "user", content: "Existing prompt" }, { id: "m2", role: "assistant", content: [{ type: "text", text: "Existing answer" }] }, { id: "m3", role: "assistant", content: [{ type: "thinking", thinking: "Existing thought" }] }, { id: "m4", role: "toolResult", content: [{ type: "text", text: "tool output" }] }, { id: "m5", role: "bashExecution", output: "command output" }, { id: "m6", role: "compactionSummary", summary: "compact summary" }],
    prompts: [] as string[],
    prompt(input: string) {
      this.prompts.push(input);
      calls.push(`prompt:${input}`);
      return Promise.resolve();
    },
    abort: () => Promise.resolve(),
    subscribe: () => () => undefined,
  };
}

function createSdk(calls: string[], session: ReturnType<typeof createSession>): any {
  return {
    getAgentDir: () => "/agent",
    createAgentSessionServices: async (options: { resourceLoaderOptions?: { additionalExtensionPaths?: string[] } }) => {
      const extensionPath = path.resolve(process.cwd(), "pi/extensions/delegation/index.ts");
      calls.push(options.resourceLoaderOptions?.additionalExtensionPaths?.includes(extensionPath) === true ? "services:delegation-extension" : "services:no-extension");
      return { diagnostics: [] };
    },
    createAgentSessionFromServices: async () => ({ session }),
    createAgentSessionRuntime: async (factory: (options: any) => Promise<unknown>, options: { sessionManager: unknown }) => {
      calls.push(`runtime:${String(options.sessionManager)}`);
      await factory({ cwd: "/repo", agentDir: "/agent", sessionManager: options.sessionManager });
      return { session, dispose: async () => undefined };
    },
    SessionManager: {
      create: (cwd: string) => {
        calls.push(`create:${cwd}`);
        return { getSessionId: () => "created-session", toString: () => `created:${cwd}` };
      },
      open: (path: string) => {
        calls.push(`open:${path}`);
        return `opened:${path}`;
      },
      list: async (cwd: string) => {
        calls.push(`list:${cwd}`);
        return [{ id: "persisted-session", path: "/sessions/persisted.jsonl" }];
      },
    },
  };
}
