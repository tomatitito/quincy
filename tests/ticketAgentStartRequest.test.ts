/// <reference types="bun" />

import { describe, expect, test } from "bun:test";
import { createTicketAgentStartRequest } from "$lib/components/ticketAgentStartRequest";
import type { TicketView } from "$lib/domain/tickets";

const ticket: TicketView = {
  id: "qui-test",
  title: "Start agent from details",
  description: "Implement selected ticket behavior.",
  status: "open",
  priority: 1,
  type: "feature",
  deps: ["qui-dep"],
  parent: "qui-epic",
  ready: false,
};

describe("ticket agent start request", () => {
  test("includes selected ticket context in initial agent prompt", () => {
    const request = createTicketAgentStartRequest(ticket, "request-1");

    expect(request.id).toBe("request-1");
    expect(request.prompt).toContain("Work on ticket qui-test");
    expect(request.prompt).toContain("# qui-test — Start agent from details");
    expect(request.prompt).toContain("- Dependencies: qui-dep");
    expect(request.prompt).toContain("Implement selected ticket behavior.");
  });

  test("represents absent optional context explicitly", () => {
    const request = createTicketAgentStartRequest({ ...ticket, description: "", deps: [], parent: undefined }, "request-2");

    expect(request.prompt).toContain("- Parent: None");
    expect(request.prompt).toContain("- Dependencies: None");
    expect(request.prompt).toContain("No description.");
  });
});
