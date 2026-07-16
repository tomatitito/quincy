/// <reference types="bun" />

import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, mock, test } from "bun:test";

const listCalls: string[] = [];

mock.module("@earendil-works/pi-coding-agent", () => ({
  SessionManager: {
    list: async (cwd: string) => {
      listCalls.push(cwd);
      return sessionsByProject[cwd] ?? [];
    },
  },
}));

const previousProjectPath = process.env.QUINCY_PROJECT_PATH;
const sessionsByProject: Record<string, unknown[]> = {};

afterEach(() => {
  listCalls.length = 0;
  process.env.QUINCY_PROJECT_PATH = previousProjectPath;
});

describe("GET /api/agent/sessions", () => {
  test("returns persisted Pi sessions for active project only", async () => {
    const activeProject = mkdtempSync(join(tmpdir(), "quincy-active-"));
    const otherProject = mkdtempSync(join(tmpdir(), "quincy-other-"));
    process.env.QUINCY_PROJECT_PATH = activeProject;
    sessionsByProject[activeProject] = [{ id: "external-session", name: "External", modified: new Date("2026-07-13T12:00:00Z"), firstMessage: "External transcript" }];
    sessionsByProject[otherProject] = [{ id: "other-session", modified: new Date("2026-07-13T13:00:00Z"), firstMessage: "Other project" }];
    const { handleApiRequest } = await import("$lib/infrastructure/inbound/http/apiRouter");

    const response = await handleApiRequest(new Request("http://localhost/api/agent/sessions"));

    expect(await response.json()).toEqual([{ id: "external-session", label: "External", preview: "External transcript", lastUsedAt: "2026-07-13T12:00:00.000Z" }]);
    expect(listCalls).toEqual([activeProject]);
  });
});
