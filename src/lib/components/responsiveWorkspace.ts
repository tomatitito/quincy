import type { ViewportMode } from "$lib/infrastructure/inbound/browser/viewportModeCore";
import { isWorkspacePane, type WorkspacePane, type WorkspaceTab } from "$lib/components/workspaceTabs";

export type GraphDirection = "lr" | "tb";

export interface ResponsiveWorkspaceState {
  agentOverlayOpen: boolean;
  terminalOverlayOpen: boolean;
  graphDirection: GraphDirection;
  visibleTab: WorkspaceTab;
}

export function responsiveWorkspaceState(mode: ViewportMode, activeTab: WorkspaceTab, lastWorkspaceTab: WorkspacePane): ResponsiveWorkspaceState {
  const agentOverlayOpen = mobileOverlayOpen(mode, activeTab, "agent");
  const terminalOverlayOpen = mobileOverlayOpen(mode, activeTab, "terminal");
  return {
    agentOverlayOpen,
    terminalOverlayOpen,
    graphDirection: mode === "mobile" ? "tb" : "lr",
    visibleTab: agentOverlayOpen || terminalOverlayOpen ? lastWorkspaceTab : activeTab,
  };
}

function mobileOverlayOpen(mode: ViewportMode, activeTab: WorkspaceTab, tab: WorkspaceTab): boolean {
  return mode === "mobile" && activeTab === tab;
}

export function nextLastWorkspaceTab(currentTab: WorkspacePane, activeTab: WorkspaceTab): WorkspacePane {
  return isWorkspacePane(activeTab) ? activeTab : currentTab;
}

export function tabAfterTicketSelection(mode: ViewportMode, currentTab: WorkspaceTab): WorkspaceTab {
  return mode === "mobile" ? "details" : currentTab;
}
