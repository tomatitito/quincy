import type { ViewportMode } from "$lib/infrastructure/inbound/browser/viewportModeCore";
import { isWorkspacePane, type WorkspacePane, type WorkspaceTab } from "$lib/components/workspaceTabs";

export type GraphDirection = "lr" | "tb";

export interface ResponsiveWorkspaceState {
  agentOverlayOpen: boolean;
  graphDirection: GraphDirection;
  visibleTab: WorkspaceTab;
}

export function responsiveWorkspaceState(mode: ViewportMode, activeTab: WorkspaceTab, lastWorkspaceTab: WorkspacePane): ResponsiveWorkspaceState {
  const agentOverlayOpen = mode === "mobile" && activeTab === "agent";

  return {
    agentOverlayOpen,
    graphDirection: mode === "mobile" ? "tb" : "lr",
    visibleTab: agentOverlayOpen ? lastWorkspaceTab : activeTab,
  };
}

export function nextLastWorkspaceTab(currentTab: WorkspacePane, activeTab: WorkspaceTab): WorkspacePane {
  return isWorkspacePane(activeTab) ? activeTab : currentTab;
}

export function tabAfterTicketSelection(mode: ViewportMode, currentTab: WorkspaceTab): WorkspaceTab {
  return mode === "mobile" ? "details" : currentTab;
}
