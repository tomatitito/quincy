/// <reference types="bun" />

import { readFileSync } from "node:fs";
import { describe, expect, test } from "bun:test";

const graphSource = readFileSync("src/lib/components/GraphView.svelte", "utf8");
const kanbanSource = readFileSync("src/lib/components/KanbanBoard.svelte", "utf8");
const layoutSource = readFileSync("src/lib/components/ResponsiveWorkspaceLayout.svelte", "utf8");
const detailsSource = readFileSync("src/lib/components/TicketDetails.svelte", "utf8");

describe("ticket activation navigation", () => {
  test("Kanban and graph ticket cards emit ticket selection from accessible buttons", () => {
    expect(kanbanSource).toContain('<button\n              type="button"');
    expect(kanbanSource).toContain("onclick={() => onTicketSelect?.(ticket.id)}");
    expect(graphSource).toContain('<button\n              type="button"');
    expect(graphSource).toContain("onclick={() => onTicketSelect?.(ticket.id)}");
  });

  test("ticket selection routes the workspace to details", () => {
    expect(layoutSource).toContain("function selectTicket(ticketId: string)");
    expect(layoutSource).toContain("onTicketSelect(ticketId);");
    expect(layoutSource).toContain("const nextTab = tabAfterTicketSelection($viewportMode, activeTab);");
    expect(layoutSource).toContain("onTabChange(nextTab);");
  });

  test("details receive focus after opening from ticket activation", () => {
    expect(detailsSource).toContain('import { tick } from "svelte";');
    expect(detailsSource).toContain("void focusDetails();");
    expect(detailsSource).toContain("detailsElement?.focus();");
    expect(detailsSource).toContain('aria-label="Ticket details" tabindex="-1"');
  });
});
