/// <reference types="bun" />

import { describe, expect, test } from "bun:test";
import { filterTicketsForGraph } from "$lib/domain/graphFilters";
import type { TicketView } from "$lib/domain/tickets";

const tickets: TicketView[] = [
  ticket("epic-a", "epic", "open"),
  ticket("task-a", "task", "open", "epic-a"),
  ticket("child-a", "task", "closed", "task-a"),
  ticket("epic-b", "epic", "closed"),
  ticket("task-b", "task", "in_progress", "epic-b"),
  ticket("loose", "task", "open"),
];

describe("graph ticket filters", () => {
  test("epics only includes epic nodes", () => {
    expect(ids(filterTicketsForGraph(tickets, { scope: "epics", selectedEpicIds: [], statusVisibility: "all" }))).toEqual(["epic-a", "epic-b"]);
  });

  test("selected epics include the selected epic and descendant tree", () => {
    expect(ids(filterTicketsForGraph(tickets, { scope: "selected", selectedEpicIds: ["epic-a"], statusVisibility: "all" }))).toEqual(["epic-a", "task-a", "child-a"]);
  });

  test("open only excludes closed nodes", () => {
    expect(ids(filterTicketsForGraph(tickets, { scope: "selected", selectedEpicIds: ["epic-b"], statusVisibility: "open" }))).toEqual(["task-b"]);
  });
});

function ticket(id: string, type: string, status: TicketView["status"], parent?: string): TicketView {
  return { id, title: id, description: "", status, priority: 1, type, deps: [], parent, ready: status !== "closed" };
}

function ids(filteredTickets: TicketView[]): string[] {
  return filteredTickets.map((ticket) => ticket.id);
}
