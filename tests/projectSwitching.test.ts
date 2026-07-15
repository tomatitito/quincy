/// <reference types="bun" />

import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const pageSource = readFileSync("src/routes/+page.svelte", "utf8");
const serverSource = readFileSync("src/routes/+page.server.ts", "utf8");

describe("project switching", () => {
  test("navigates with selected project in URL after project switch", () => {
    expect(pageSource).toContain('import { goto, invalidateAll } from "$app/navigation";');
    expect(pageSource).toContain('nextUrl.searchParams.set("projectPath", selectedProject.projectPath);');
    expect(pageSource).toContain("await goto(`${nextUrl.pathname}?${nextUrl.searchParams.toString()}`, {");
  });

  test("server load prefers projectPath query over cookie", () => {
    expect(serverSource).toContain('url.searchParams.get("projectPath") ?? cookies.get(projectSelectionCookieName)');
  });
});
