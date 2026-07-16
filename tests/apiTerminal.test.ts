/// <reference types="bun" />

import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, mock, test } from "bun:test";

const terminalCwds: string[] = [];
const terminalInputs: { sessionId: string; input: string }[] = [];
const terminalResizes: { sessionId: string; cols: number; rows: number }[] = [];
const terminalClosed: string[] = [];
const terminalCloseAll: string[] = [];

mock.module("@earendil-works/pi-coding-agent", () => ({ SessionManager: { list: async () => [] } }));
mock.module("$lib/infrastructure/outbound/terminalRepository", () => ({
  createTerminalRepository: ({ cwd }: { cwd: string }) => {
    terminalCwds.push(cwd);
    return {
      open: () => ({ sessionId: `terminal:${cwd}`, projectPath: cwd, status: "open", output: "", message: `Terminal running in ${cwd}`, cols: 80, rows: 24 }),
      state: (sessionId: string) => ({ sessionId, projectPath: cwd, status: "open", output: "ready", message: "Terminal running", cols: 80, rows: 24 }),
      input: (sessionId: string, input: string) => (terminalInputs.push({ sessionId, input }), { sessionId, projectPath: cwd, status: "open", output: "", message: "Terminal running", cols: 80, rows: 24 }),
      resize: (sessionId: string, cols: number, rows: number) => (terminalResizes.push({ sessionId, cols, rows }), { sessionId, projectPath: cwd, status: "open", output: "", message: "Terminal running", cols, rows }),
      close: (sessionId: string) => (terminalClosed.push(`${cwd}:${sessionId}`), { sessionId, projectPath: cwd, status: "closed", output: "", message: "Terminal closed.", cols: 80, rows: 24 }),
      closeAll: () => terminalCloseAll.push(cwd),
    };
  },
}));

const previousProjectPath = process.env.QUINCY_PROJECT_PATH;

afterEach(() => {
  terminalCwds.length = 0;
  terminalInputs.length = 0;
  terminalResizes.length = 0;
  terminalClosed.length = 0;
  terminalCloseAll.length = 0;
  process.env.QUINCY_PROJECT_PATH = previousProjectPath;
});

describe("/api/terminal", () => {
  test("opens terminal in active project and routes traffic to terminal API", async () => {
    const activeProject = mkdtempSync(join(tmpdir(), "quincy-terminal-"));
    process.env.QUINCY_PROJECT_PATH = activeProject;
    const { handleApiRequest } = await import("$lib/infrastructure/inbound/http/apiRouter");

    const openResponse = await handleApiRequest(new Request("http://localhost/api/terminal/open", { method: "POST", body: "{}" }));
    const inputResponse = await handleApiRequest(new Request("http://localhost/api/terminal/input", { method: "POST", body: JSON.stringify({ sessionId: `terminal:${activeProject}`, input: "pwd\r" }) }));
    const resizeResponse = await handleApiRequest(new Request("http://localhost/api/terminal/resize", { method: "POST", body: JSON.stringify({ sessionId: `terminal:${activeProject}`, cols: 100, rows: 40 }) }));

    expect(await openResponse.json()).toMatchObject({ projectPath: activeProject, status: "open" });
    expect(await inputResponse.json()).toMatchObject({ projectPath: activeProject, status: "open" });
    expect(await resizeResponse.json()).toMatchObject({ cols: 100, rows: 40 });
    expect(terminalCwds).toEqual([activeProject]);
    expect(terminalInputs).toEqual([{ sessionId: `terminal:${activeProject}`, input: "pwd\r" }]);
    expect(terminalResizes).toEqual([{ sessionId: `terminal:${activeProject}`, cols: 100, rows: 40 }]);
  });

  test("closes terminal in explicit project after selected project changes", async () => {
    const oldProject = mkdtempSync(join(tmpdir(), "quincy-terminal-old-"));
    const nextProject = mkdtempSync(join(tmpdir(), "quincy-terminal-next-"));
    process.env.QUINCY_PROJECT_PATH = nextProject;
    const { handleApiRequest } = await import("$lib/infrastructure/inbound/http/apiRouter");

    await handleApiRequest(new Request("http://localhost/api/terminal/close", { method: "POST", body: JSON.stringify({ sessionId: `terminal:${oldProject}`, projectPath: oldProject }) }));

    expect(terminalClosed).toEqual([`${oldProject}:terminal:${oldProject}`]);
  });

  test("closes repositories on project selection and shutdown cleanup", async () => {
    const oldProject = mkdtempSync(join(tmpdir(), "quincy-terminal-old-"));
    const nextProject = mkdtempSync(join(tmpdir(), "quincy-terminal-next-"));
    process.env.QUINCY_PROJECT_PATH = oldProject;
    const { closeTerminalRepositories, handleApiRequest } = await import("$lib/infrastructure/inbound/http/apiRouter");
    await handleApiRequest(new Request("http://localhost/api/terminal/open", { method: "POST", body: "{}" }));

    await handleApiRequest(new Request("http://localhost/api/projects/select", { method: "POST", headers: { cookie: `quincy.project=${encodeURIComponent(oldProject)}` }, body: JSON.stringify({ projectPath: nextProject }) }));
    closeTerminalRepositories();

    expect(terminalCloseAll).toContain(oldProject);
  });
});
