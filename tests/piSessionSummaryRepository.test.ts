/// <reference types="bun" />

import { describe, expect, test } from "bun:test";
import { createPiSessionSummaryRepository } from "$lib/infrastructure/outbound/piSessionSummaryRepository";

describe("createPiSessionSummaryRepository", () => {
  test("lists mixed Quincy-started and external Pi sessions without duplicates", async () => {
    const calls: string[] = [];
    const repository = createPiSessionSummaryRepository({ cwd: "/active-project", loadSdk: async () => createSdk(calls) });

    const sessions = await repository();

    expect(calls).toEqual(["list:/active-project"]);
    expect(sessions).toEqual([
      { id: "external-session", label: "External task", preview: "Started in Pi TUI", lastUsedAt: "2026-07-13T12:00:00.000Z" },
      { id: "quincy-session", label: "Started from Quincy", preview: "Started from Quincy", lastUsedAt: "2026-07-13T11:00:00.000Z" },
    ]);
  });
});

function createSdk(calls: string[]) {
  return {
    SessionManager: {
      list: async (cwd: string) => {
        calls.push(`list:${cwd}`);
        return [
          { id: "quincy-session", modified: new Date("2026-07-13T11:00:00Z"), firstMessage: "Started from Quincy" },
          { id: "external-session", name: "External task", modified: new Date("2026-07-13T12:00:00Z"), firstMessage: "Started in Pi TUI" },
          { id: "quincy-session", modified: new Date("2026-07-13T11:00:00Z"), firstMessage: "Started from Quincy" },
        ];
      },
    },
  };
}
