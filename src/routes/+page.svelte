<script lang="ts">
  import { invalidateAll } from "$app/navigation";
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
    await fetch("/api/projects/select", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ projectPath }),
    });
    selectedTicketId = undefined;
    reconnectAppEvents();
    await invalidateAll();
  }

  function selectTab(tab: WorkspaceTab) {
    activeTab = tab;
  }

  function selectTicket(ticketId: string) {
    selectedTicketId = ticketId;
  }

  function reconnectAppEvents() {
    closeAppEvents();
    appEvents = openAppEventStream("/events");
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
