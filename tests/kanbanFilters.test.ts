/// <reference types="bun" />

import { describe, expect, test } from "bun:test";
import { createKanbanColumns, type Ticket } from "$lib/domain/tickets";
import { filterKanbanColumnsByVisibility } from "$lib/domain/ticketVisibility";

describe("kanban ticket filters", () => {
  test("keeps existing column placement while hiding non-visible tickets", () => {
    const columns = createKanbanColumns([
      ticket("epic-a", "epic", "open", [], undefined),
      ticket("task-a", "task", "open", [], "epic-a"),
      ticket("blocked-a", "task", "open", ["missing-dep"], "epic-a"),
      ticket("child-a", "task", "closed", [], "task-a"),
      ticket("epic-b", "epic", "closed", [], undefined),
      ticket("task-b", "task", "in_progress", [], "epic-b"),
      ticket("loose", "task", "open", [], undefined),
    ]);

    const filteredColumns = filterKanbanColumnsByVisibility(columns, { scope: "selected", selectedEpicIds: ["epic-a"], statusVisibility: "open" });

    expect(columnIds(filteredColumns, "backlog")).toEqual(["blocked-a"]);
    expect(columnIds(filteredColumns, "open")).toEqual(["epic-a", "task-a"]);
    expect(columnIds(filteredColumns, "in_progress")).toEqual([]);
    expect(columnIds(filteredColumns, "closed")).toEqual([]);
  });

  test("epics only includes epic cards and open plus closed includes closed epics", () => {
    const columns = createKanbanColumns([ticket("epic-a", "epic", "open", [], undefined), ticket("epic-b", "epic", "closed", [], undefined), ticket("task-a", "task", "open", [], "epic-a")]);

    const filteredColumns = filterKanbanColumnsByVisibility(columns, { scope: "epics", selectedEpicIds: [], statusVisibility: "all" });

    expect(columnIds(filteredColumns, "open")).toEqual(["epic-a"]);
    expect(columnIds(filteredColumns, "closed")).toEqual(["epic-b"]);
  });
});

function ticket(id: string, type: string, status: Ticket["status"], deps: string[], parent: string | undefined): Ticket {
  return { id, title: id, status, priority: 1, type, deps, parent };
}

function columnIds(columns: ReturnType<typeof createKanbanColumns>, columnId: string): string[] {
  return columns.find((column) => column.id === columnId)?.tickets.map((ticket) => ticket.id) ?? [];
}
