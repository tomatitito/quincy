<script lang="ts">
  import type { BrowserAppEvent, BrowserAppEventStream } from "$lib/infrastructure/inbound/browser/appEvents";

  type AgentStatus = "empty" | "running" | "completed" | "failed" | "cancelled";

  let { appEvents }: { appEvents?: BrowserAppEventStream } = $props();

  let status = $state<AgentStatus>("empty");
  let message = $state("No agent session has reported activity yet.");
  let commandMessage = $state("No agent command has been sent yet.");
  let inputText = $state("");
  let activeSessionId = $state<string>();
  let commandBusy = $state(false);
  let output = $state<string[]>([]);

  const statusLabel = $derived(status === "empty" ? "Not connected" : status);
  const canSubmitInput = $derived(inputText.length > 0 && !commandBusy);

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
    if (nextStatus === undefined || !acceptAgentEvent(payload)) return;

    status = nextStatus;
    message = stringFrom(payload?.message) ?? defaultMessage(nextStatus);
  }

  function handleOutputEvent(event: BrowserAppEvent) {
    const payload = asRecord(event.payload);
    const text = stringFrom(payload?.text) ?? stringFrom(payload?.output) ?? stringFrom(payload?.chunk) ?? stringFrom(payload?.line);
    if (text === undefined || text.length === 0 || !acceptAgentEvent(payload)) return;

    output = [...output, text];
    if (status === "empty") {
      status = "running";
      message = defaultMessage("running");
    }
  }

  function acceptAgentEvent(payload: Record<string, unknown> | undefined): boolean {
    const sessionId = stringFrom(payload?.sessionId);
    if (sessionId === undefined) return activeSessionId === undefined;
    if (activeSessionId !== undefined) return sessionId === activeSessionId;
    activeSessionId = sessionId;
    return true;
  }

  async function startSession() {
    const result = await sendCommand("/api/agent/start", {});
    if (result === undefined) return undefined;
    activeSessionId = result.sessionId;
    commandMessage = result.message;
    return result;
  }

  async function sendInput() {
    if (inputText.length === 0) return;
    const sessionId = activeSessionId ?? (await startSession())?.sessionId;
    if (sessionId === undefined) return;
    const result = await sendCommand("/api/agent/input", { sessionId, input: inputText });
    if (result === undefined) return;
    inputText = "";
    commandMessage = result.message;
  }

  async function stopActiveSession() {
    if (activeSessionId === undefined || commandBusy) return;
    const result = await sendCommand("/api/agent/stop", { sessionId: activeSessionId });
    if (result !== undefined) commandMessage = result.message;
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key !== "Escape") return;
    event.preventDefault();
    void stopActiveSession();
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
    if (value === "running" || value === "completed" || value === "failed" || value === "cancelled") return value;
    return undefined;
  }

  function defaultMessage(value: AgentStatus): string {
    if (value === "running") return "Agent session is running.";
    if (value === "completed") return "Agent session completed.";
    if (value === "failed") return "Agent session failed.";
    if (value === "cancelled") return "Agent session cancelled.";
    return "No agent session has reported activity yet.";
  }

  function stringFrom(value: unknown): string | undefined {
    return typeof value === "string" ? value : undefined;
  }

  function asRecord(value: unknown): Record<string, unknown> | undefined {
    return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : undefined;
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<section class="agent-panel" aria-label="Agent panel">
  <header>
    <div>
      <p class="eyebrow">Agent</p>
      <h2>Session activity</h2>
    </div>
    <div class="agent-header-actions">
      <button type="button" onclick={startSession} disabled={commandBusy}>Start session</button>
      <span class:running={status === "running"} class:completed={status === "completed"} class:failed={status === "failed"} class:cancelled={status === "cancelled"}>{statusLabel}</span>
    </div>
  </header>

  <p class="agent-message">{message}</p>

  <div class="agent-transcript" data-agent-transcript-scroll>
    {#if output.length > 0}
      <pre aria-label="Agent output">{output.join("\n")}</pre>
    {:else}
      <div class="agent-empty-state">Waiting for agent events from the app event stream. No runtime or commands are connected yet.</div>
    {/if}
  </div>

  <section class="agent-commands" aria-label="Agent commands">
    <p>{commandMessage}</p>
    <div class="agent-chat-input">
      <label>
        <span class="visually-hidden">Input</span>
        <textarea bind:value={inputText} disabled={commandBusy} placeholder="Send input to the active agent session"></textarea>
      </label>
      <button type="button" onclick={sendInput} disabled={!canSubmitInput} aria-label="Send input">↑</button>
    </div>
  </section>
</section>

<style>
  .agent-panel {
    background: var(--container-bg);
    display: grid;
    font-size: 13px;
    grid-template-rows: auto auto minmax(0, 1fr) auto;
    height: 100%;
    line-height: 1.45;
    min-height: 0;
    overflow: hidden;
  }

  header {
    align-items: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    display: flex;
    gap: 12px;
    justify-content: space-between;
    padding: 12px 18px;
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

  .cancelled {
    border-color: var(--muted);
    color: var(--muted);
  }

  .agent-commands {
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    display: grid;
    gap: 10px;
    justify-self: center;
    padding: 12px 18px 16px;
    width: 50%;
  }

  .agent-header-actions {
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: flex-end;
  }

  .agent-chat-input {
    background: var(--body-bg);
    border: 1px solid var(--dim);
    border-radius: 22px;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    min-height: 96px;
    padding: 12px;
  }

  .agent-chat-input:focus-within {
    border-color: var(--accent);
    box-shadow: 0 0 0 1px var(--accent);
  }

  .agent-chat-input label {
    min-width: 0;
  }

  .agent-chat-input button {
    align-self: end;
    border-radius: 999px;
    font-size: 18px;
    height: 38px;
    justify-self: end;
    line-height: 1;
    padding: 0;
    width: 38px;
  }

  button,
  textarea {
    background: var(--body-bg);
    border: 1px solid var(--dim);
    border-radius: 3px;
    color: var(--text);
    font: inherit;
  }

  button {
    cursor: pointer;
    padding: 4px 8px;
  }

  button:disabled,
  textarea:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  textarea {
    border: 0;
    min-height: 72px;
    outline: none;
    padding: 0 10px 0 0;
    resize: none;
    width: 100%;
  }

  .visually-hidden {
    clip: rect(0 0 0 0);
    clip-path: inset(50%);
    height: 1px;
    overflow: hidden;
    position: absolute;
    white-space: nowrap;
    width: 1px;
  }

  .agent-message,
  .agent-empty-state,
  .agent-commands p {
    color: var(--muted);
    margin: 0;
  }

  .agent-message {
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    padding: 10px 18px;
  }

  .agent-transcript {
    background: rgb(31, 32, 40);
    min-height: 0;
    overflow-x: clip;
    overflow-y: auto;
    overscroll-behavior-y: contain;
    padding: 18px;
    scrollbar-gutter: stable;
  }

  .agent-empty-state {
    align-items: center;
    display: flex;
    min-height: 100%;
    padding: 12px 0;
  }

  pre {
    color: var(--text);
    margin: 0;
    overflow: visible;
    white-space: pre-wrap;
  }

  @media (max-width: 1200px) {
    .agent-commands {
      width: 65%;
    }
  }

  @media (max-width: 900px) {
    .agent-commands {
      width: 80%;
    }
  }

  @media (max-width: 760px) {
    header {
      padding: 10px 12px;
    }

    .agent-message {
      padding: 8px 12px;
    }

    .agent-transcript {
      padding: 12px;
    }

    .agent-commands {
      gap: 8px;
      padding: 10px 12px 12px;
      width: 100%;
    }

    .agent-header-actions button {
      min-height: 36px;
    }

    .agent-chat-input {
      border-radius: 18px;
      min-height: 84px;
      padding: 10px;
    }

    .agent-chat-input button {
      height: 40px;
      width: 40px;
    }
  }

  @media (max-width: 420px) {
    .agent-panel {
      font-size: 12px;
    }

    header {
      align-items: flex-start;
      gap: 8px;
      padding: 8px 10px;
    }

    h2 {
      font-size: 14px;
    }

    .agent-message {
      padding: 8px 10px;
    }

    .agent-transcript {
      padding: 10px;
    }

    .agent-commands {
      padding: 8px 10px 10px;
    }

    .agent-header-actions {
      align-items: flex-end;
      flex-direction: column;
    }

    .agent-chat-input {
      min-height: 78px;
    }

    textarea {
      min-height: 56px;
    }
  }
</style>
