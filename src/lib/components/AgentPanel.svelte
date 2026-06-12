<script lang="ts">
  import type { BrowserAppEvent, BrowserAppEventStream } from "$lib/infrastructure/inbound/browser/appEvents";

  type AgentStatus = "empty" | "running" | "completed" | "failed";

  let { appEvents }: { appEvents?: BrowserAppEventStream } = $props();

  let status = $state<AgentStatus>("empty");
  let message = $state("No agent session has reported activity yet.");
  let commandMessage = $state("No agent command has been sent yet.");
  let inputText = $state("");
  let activeSessionId = $state<string>();
  let commandBusy = $state(false);
  let output = $state<string[]>([]);

  const statusLabel = $derived(status === "empty" ? "Not connected" : status);
  const canSendSessionCommand = $derived(activeSessionId !== undefined && !commandBusy);

  $effect(() => {
    if (appEvents === undefined) return;

    const unlistenStatus = appEvents.listen(["agent.status", "agent.status.changed"], handleStatusEvent);
    const unlistenOutput = appEvents.listen(["agent.output", "agent.output.appended"], handleOutputEvent);

    return () => {
      unlistenStatus();
      unlistenOutput();
    };
  });

  function handleStatusEvent(event: BrowserAppEvent) {
    const payload = asRecord(event.payload);
    const nextStatus = toStatus(payload?.status);
    if (nextStatus === undefined) return;

    status = nextStatus;
    message = stringFrom(payload?.message) ?? defaultMessage(nextStatus);
  }

  function handleOutputEvent(event: BrowserAppEvent) {
    const payload = asRecord(event.payload);
    const text = stringFrom(payload?.text) ?? stringFrom(payload?.output) ?? stringFrom(payload?.chunk) ?? stringFrom(payload?.line);
    if (text === undefined || text.length === 0) return;

    output = [...output, text];
    if (status === "empty") {
      status = "running";
      message = defaultMessage("running");
    }
  }

  async function startSession() {
    const result = await sendCommand("/api/agent/start", {});
    if (result === undefined) return;
    activeSessionId = result.sessionId;
    commandMessage = result.message;
  }

  async function stopSession() {
    if (activeSessionId === undefined) return;
    const result = await sendCommand("/api/agent/stop", { sessionId: activeSessionId });
    if (result !== undefined) commandMessage = result.message;
  }

  async function sendInput() {
    if (activeSessionId === undefined || inputText.length === 0) return;
    const result = await sendCommand("/api/agent/input", { sessionId: activeSessionId, input: inputText });
    if (result === undefined) return;
    inputText = "";
    commandMessage = result.message;
  }

  async function sendCommand(url: string, body: Record<string, unknown>): Promise<AgentCommandResult | undefined> {
    commandBusy = true;
    try {
      const response = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      if (!response.ok) return reportCommandFailure(response.statusText);
      return parseCommandResult(await response.json());
    } catch {
      return reportCommandFailure("Agent command failed.");
    } finally {
      commandBusy = false;
    }
  }

  function reportCommandFailure(text: string): undefined {
    commandMessage = text;
    return undefined;
  }

  interface AgentCommandResult {
    accepted: boolean;
    sessionId: string;
    message: string;
  }

  function parseCommandResult(value: unknown): AgentCommandResult | undefined {
    const result = asRecord(value);
    if (result?.accepted !== true) return undefined;
    const sessionId = stringFrom(result.sessionId);
    const message = stringFrom(result.message);
    if (sessionId === undefined || message === undefined) return undefined;
    return { accepted: true, sessionId, message };
  }

  function toStatus(value: unknown): AgentStatus | undefined {
    if (value === "idle") return "empty";
    if (value === "running" || value === "completed" || value === "failed") return value;
    return undefined;
  }

  function defaultMessage(value: AgentStatus): string {
    if (value === "running") return "Agent session is running.";
    if (value === "completed") return "Agent session completed.";
    if (value === "failed") return "Agent session failed.";
    return "No agent session has reported activity yet.";
  }

  function stringFrom(value: unknown): string | undefined {
    return typeof value === "string" ? value : undefined;
  }

  function asRecord(value: unknown): Record<string, unknown> | undefined {
    return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : undefined;
  }
</script>

<section class="agent-panel" aria-label="Agent panel">
  <header>
    <div>
      <p class="eyebrow">Agent</p>
      <h2>Session activity</h2>
    </div>
    <span class:running={status === "running"} class:completed={status === "completed"} class:failed={status === "failed"}>{statusLabel}</span>
  </header>

  <p class="agent-message">{message}</p>

  <section class="agent-commands" aria-label="Agent commands">
    <button type="button" onclick={startSession} disabled={commandBusy}>Start session</button>
    <button type="button" onclick={stopSession} disabled={!canSendSessionCommand}>Stop session</button>
    <label>
      Input
      <textarea bind:value={inputText} disabled={!canSendSessionCommand} placeholder="Send input to the active agent session"></textarea>
    </label>
    <button type="button" onclick={sendInput} disabled={!canSendSessionCommand || inputText.length === 0}>Send input</button>
    <p>{commandMessage}</p>
  </section>

  {#if output.length > 0}
    <pre aria-label="Agent output">{output.join("\n")}</pre>
  {:else}
    <div class="agent-empty-state">Waiting for agent events from the app event stream. No runtime or commands are connected yet.</div>
  {/if}
</section>

<style>
  .agent-panel {
    display: grid;
    gap: 14px;
    padding: 16px 18px 24px;
  }

  header {
    align-items: center;
    display: flex;
    gap: 12px;
    justify-content: space-between;
  }

  .eyebrow {
    color: var(--dim);
    font-size: 10px;
    letter-spacing: 0.08em;
    margin: 0 0 4px;
    text-transform: uppercase;
  }

  h2 {
    color: var(--text);
    font-size: 15px;
    margin: 0;
  }

  span {
    border: 1px solid var(--dim);
    border-radius: 999px;
    color: var(--muted);
    font-size: 10px;
    padding: 2px 8px;
    text-transform: capitalize;
  }

  .running {
    border-color: var(--warning);
    color: var(--warning);
  }

  .completed {
    border-color: var(--success);
    color: var(--success);
  }

  .failed {
    border-color: var(--error);
    color: var(--error);
  }

  .agent-commands {
    border: 1px solid var(--dim);
    border-radius: 4px;
    display: grid;
    gap: 8px;
    padding: 12px;
  }

  .agent-commands button {
    justify-self: start;
  }

  .agent-commands label {
    color: var(--muted);
    display: grid;
    gap: 6px;
  }

  textarea {
    min-height: 72px;
  }

  .agent-message,
  .agent-empty-state,
  .agent-commands p {
    color: var(--muted);
    margin: 0;
  }

  .agent-empty-state,
  pre {
    border: 1px solid var(--dim);
    border-radius: 4px;
    padding: 12px;
  }

  pre {
    color: var(--text);
    margin: 0;
    overflow: auto;
    white-space: pre-wrap;
  }
</style>
