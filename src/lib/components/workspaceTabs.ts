export const workspacePanes = ["graph", "kanban", "details"] as const;
export const agentTab = "agent";
export const workspaceTabs = [...workspacePanes, agentTab] as const;

export type WorkspacePane = (typeof workspacePanes)[number];
export type WorkspaceTab = (typeof workspaceTabs)[number];

export function isWorkspacePane(tab: WorkspaceTab): tab is WorkspacePane {
  return (workspacePanes as readonly WorkspaceTab[]).includes(tab);
}
