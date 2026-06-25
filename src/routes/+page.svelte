<script lang="ts">
  import { invalidateAll } from "$app/navigation";
  import { onMount } from "svelte";
  import ResponsiveWorkspaceLayout from "$lib/components/ResponsiveWorkspaceLayout.svelte";
  import type { WorkspaceTab } from "$lib/components/workspaceTabs";
  import { openAppEventStream } from "$lib/infrastructure/inbound/browser/appEvents";
  import type { BrowserAppEventStream } from "$lib/infrastructure/inbound/browser/appEvents";

  let { data } = $props();
  let activeTab = $state<WorkspaceTab>("graph");
  let selectedTicketId = $state<string | undefined>();
  let appEvents = $state<BrowserAppEventStream>();

  function refreshTickets() {
    void invalidateAll();
  }

  function selectTab(tab: WorkspaceTab) {
    activeTab = tab;
  }

  function selectTicket(ticketId: string) {
    selectedTicketId = ticketId;
  }

  onMount(() => {
    appEvents = openAppEventStream("/events");
    const unlistenTickets = appEvents.listen(["tickets.changed"], refreshTickets);

    return () => {
      unlistenTickets();
      appEvents?.close();
    };
  });
</script>

<svelte:head>
  <title>Quincy</title>
</svelte:head>

<ResponsiveWorkspaceLayout {data} {activeTab} {selectedTicketId} {appEvents} onRefresh={refreshTickets} onTabChange={selectTab} onTicketSelect={selectTicket} />
