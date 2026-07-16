/// <reference types="bun" />

import { describe, expect, test } from "bun:test";
import { responsiveWorkspaceState, nextLastWorkspaceTab, tabAfterTicketSelection } from "$lib/components/responsiveWorkspace";
import { viewportModeFromWidth } from "$lib/infrastructure/inbound/browser/viewportModeCore";

describe("responsive workspace behavior", () => {
  test("maps viewport widths to the app shell modes", () => {
    expect(viewportModeFromWidth(767)).toBe("mobile");
    expect(viewportModeFromWidth(768)).toBe("tablet");
    expect(viewportModeFromWidth(1199)).toBe("tablet");
    expect(viewportModeFromWidth(1200)).toBe("desktop");
  });

  test("keeps desktop and tablet navigation as normal tabs", () => {
    expect(responsiveWorkspaceState("desktop", "agent", "kanban")).toEqual({
      agentOverlayOpen: false,
      terminalOverlayOpen: false,
      graphDirection: "lr",
      visibleTab: "agent",
    });
    expect(responsiveWorkspaceState("tablet", "graph", "details")).toEqual({
      agentOverlayOpen: false,
      terminalOverlayOpen: false,
      graphDirection: "lr",
      visibleTab: "graph",
    });
  });

  test("uses mobile graph direction and routes ticket selection to details", () => {
    expect(responsiveWorkspaceState("mobile", "graph", "graph").graphDirection).toBe("tb");
    expect(tabAfterTicketSelection("mobile", "graph")).toBe("details");
    expect(tabAfterTicketSelection("mobile", "kanban")).toBe("details");
    expect(tabAfterTicketSelection("desktop", "kanban")).toBe("kanban");
  });

  test("shows agent as a mobile overlay over the last workspace tab", () => {
    expect(nextLastWorkspaceTab("graph", "kanban")).toBe("kanban");
    expect(nextLastWorkspaceTab("kanban", "agent")).toBe("kanban");
    expect(responsiveWorkspaceState("mobile", "agent", "kanban")).toEqual({
      agentOverlayOpen: true,
      terminalOverlayOpen: false,
      graphDirection: "tb",
      visibleTab: "kanban",
    });
  });

  test("shows terminal as a mobile overlay over the last workspace tab", () => {
    expect(nextLastWorkspaceTab("kanban", "terminal")).toBe("kanban");
    expect(responsiveWorkspaceState("mobile", "terminal", "details")).toEqual({
      agentOverlayOpen: false,
      terminalOverlayOpen: true,
      graphDirection: "tb",
      visibleTab: "details",
    });
  });
});
