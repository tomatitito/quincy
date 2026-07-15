<script lang="ts">
  import { goto, invalidateAll } from "$app/navigation";
  import { onMount } from "svelte";
  import ResponsiveWorkspaceLayout from "$lib/components/ResponsiveWorkspaceLayout.svelte";
  import type { WorkspaceTab } from "$lib/components/workspaceTabs";
  import { openAppEventStream } from "$lib/infrastructure/inbound/browser/appEvents";
  import type { BrowserAppEvent, BrowserAppEventStream } from "$lib/infrastructure/inbound/browser/appEvents";

  let { data } = $props();
  let activeTab = $state<WorkspaceTab>("graph");
  let selectedTicketId = $state<string | undefined>();
  let appEvents = $state<BrowserAppEventStream>();
  let unlistenTickets: (() => void) | undefined;

  function refreshTickets(event?: BrowserAppEvent) {
    if (event !== undefined && !isCurrentTicketDirectoryEvent(event)) return;
    void invalidateAll();
  }

  async function selectProject(projectPath: string) {
    const response = await fetch("/api/projects/select", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ projectPath }),
    });
    if (!response.ok) return;
    const selectedProject = (await response.json()) as { projectPath: string };
    selectedTicketId = undefined;
    reconnectAppEvents(selectedProject.projectPath);
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set("projectPath", selectedProject.projectPath);
    await goto(`${nextUrl.pathname}?${nextUrl.searchParams.toString()}`, {
      invalidateAll: true,
      keepFocus: true,
      noScroll: true,
      replaceState: true,
    });
  }

  function selectTab(tab: WorkspaceTab) {
    activeTab = tab;
  }

  function selectTicket(ticketId: string) {
    selectedTicketId = ticketId;
  }

  function reconnectAppEvents(projectPath = data.projectPath) {
    closeAppEvents();
    appEvents = openAppEventStream(`/events?projectPath=${encodeURIComponent(projectPath)}`);
    unlistenTickets = appEvents.listen(["tickets.changed"], refreshTickets);
  }

  function closeAppEvents() {
    unlistenTickets?.();
    appEvents?.close();
    unlistenTickets = undefined;
    appEvents = undefined;
  }

  function isCurrentTicketDirectoryEvent(event: BrowserAppEvent) {
    if (!isRecord(event.payload)) return true;
    return event.payload.ticketDirectory === data.ticketDirectory;
  }

  function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
  }

  onMount(() => {
    reconnectAppEvents();
    return closeAppEvents;
  });
</script>

<svelte:head>
  <title>Quincy</title>
</svelte:head>

<ResponsiveWorkspaceLayout {data} {activeTab} {selectedTicketId} {appEvents} onRefresh={refreshTickets} onProjectSelect={selectProject} onTabChange={selectTab} onTicketSelect={selectTicket} />
