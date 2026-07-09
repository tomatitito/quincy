/// <reference types="bun" />

import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, test } from "bun:test";
import { createTicketFileRepository } from "$lib/infrastructure/outbound/ticketFileRepository";

let tempDir: string | undefined;

afterEach(async () => {
  if (tempDir !== undefined) await rm(tempDir, { force: true, recursive: true });
  tempDir = undefined;
});

describe("createTicketFileRepository", () => {
  test("ignores markdown files without ticket frontmatter", async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), "quincy-tickets-"));
    await writeFile(path.join(tempDir, "ticket.md"), ticketMarkdown("qui-1234"));
    await writeFile(path.join(tempDir, "notes.md"), "# Notes\n\nNot a tk ticket.\n");

    const tickets = await createTicketFileRepository(tempDir)();

    expect(tickets.map((ticket) => ticket.id)).toEqual(["qui-1234"]);
  });

  test("parses markdown body after title as description", async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), "quincy-tickets-"));
    await writeFile(path.join(tempDir, "ticket.md"), ticketMarkdown("qui-desc"));

    const tickets = await createTicketFileRepository(tempDir)();

    expect(tickets[0]?.description).toBe("Ticket details.\n\n## Acceptance Criteria\n\n- Description is preserved.");
  });
});

function ticketMarkdown(id: string): string {
  return `---
id: ${id}
status: open
deps: []
links: []
created: 2026-01-01T00:00:00Z
type: task
priority: 2
---
# Example ticket

Ticket details.

## Acceptance Criteria

- Description is preserved.
`;
}
