<script lang="ts">
  import type { BrowserAppEvent, BrowserAppEventStream } from "$lib/infrastructure/inbound/browser/appEvents";
  import { agentOutputEventTypes, agentOutputText, normalizeAgentOutputPayload } from "$lib/components/agentOutputEvents";
  import { containTabFocus, isBackdropPointerEvent, isVisibleElement } from "$lib/components/agentPanelMobileSheet";
  import type { AgentStartRequest } from "$lib/components/ticketAgentStartRequest";

  type AgentStatus = "empty" | "running" | "completed" | "failed" | "cancelled";

  interface Props {
    appEvents?: BrowserAppEventStream;
    projectPath: string;
    startRequest?: AgentStartRequest;
    onStartRequestHandled?: (requestId: string) => void;
  }

  let { appEvents, projectPath, startRequest, onStartRequestHandled }: Props = $props();

  let status = $state<AgentStatus>("empty");
  let message = $state("No agent session has reported activity yet.");
  let commandMessage = $state("No agent command has been sent yet.");
  let inputText = $state("");
  let inputElement = $state<HTMLTextAreaElement>();
  let fileSuggestions = $state<ProjectFileSuggestion[]>([]);
  let fileSuggestionIndex = $state(0);
  let fileMention = $state<FileMention>();
  let activeSessionId = $state<string>();
  let commandBusy = $state(false);
  let sessionListBusy = $state(false);
  let sessionListMessage = $state("Loading repository sessions…");
  let sessionSummaries = $state<AgentSessionSummary[]>([]);
  let output = $state<AgentOutput[]>([]);
  let lastSessionProjectPath = $state<string>();
  let panelElement = $state<HTMLElement>();
  let mobileSessionSheetOpen = $state(false);
  let mobileViewport = $state(false);
  let mobileSessionsButton = $state<HTMLButtonElement>();
  let mobileSessionSheet = $state<HTMLElement>();
  let handledStartRequestId = $state<string>();

  const statusLabel = $derived(status === "empty" ? "Not connected" : status);
  const canSubmitInput = $derived(inputText.trim().length > 0 && !commandBusy);

  $effect(() => {
    if (lastSessionProjectPath === projectPath) return;
    lastSessionProjectPath = projectPath;
    resetSessionState();
    void loadSessionSummaries(projectPath);
  });

  $effect(() => {
    if (startRequest === undefined || startRequest.id === handledStartRequestId) return;
    handledStartRequestId = startRequest.id;
    onStartRequestHandled?.(startRequest.id);
    void startSession(startRequest.prompt);
  });

  $effect(() => {
    if (appEvents === undefined) return;

    const unlistenStatus = appEvents.listen(["agent.status", "agent.status.changed"], handleStatusEvent);
    const unlistenOutput = appEvents.listen([...agentOutputEventTypes], handleOutputEvent);
    const unlistenTool = appEvents.listen(["agent.tool.started", "agent.tool.updated", "agent.tool.ended"], handleToolEvent);

    return () => {
      unlistenStatus();
      unlistenOutput();
      unlistenTool();
    };
  });

  $effect(() => {
    const query = window.matchMedia("(max-width: 760px)");
    syncMobileViewport(query);
    const handleChange = () => syncMobileViewport(query);
    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  });

  function handleStatusEvent(event: BrowserAppEvent) {
    const payload = asRecord(event.payload);
    const nextStatus = toStatus(payload?.status);
    if (nextStatus === undefined || !acceptAgentEvent(payload)) return;

    status = nextStatus;
    message = stringFrom(payload?.message) ?? defaultMessage(nextStatus);
    if (nextStatus === "completed" || nextStatus === "failed" || nextStatus === "cancelled") void loadSessionSummaries();
  }

  function handleOutputEvent(event: BrowserAppEvent) {
    const payload = normalizeAgentOutputPayload(event.type, asRecord(event.payload));
    const text = agentOutputText(payload);
    if (text === undefined || text.length === 0 || !acceptAgentEvent(payload)) return;

    output = updateOutput(output, payload, text, outputKindFrom(payload));
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

  async function loadSessionSummaries(requestProjectPath = projectPath) {
    sessionListBusy = true;
    try {
      const response = await fetch("/api/agent/sessions");
      if (requestProjectPath !== projectPath) return;
      if (!response.ok) {
        sessionListMessage = "Agent sessions could not be loaded.";
        return;
      }
      sessionSummaries = parseSessionSummaries(await response.json());
      sessionListMessage = sessionSummaries.length === 0 ? "No repository sessions found." : "";
    } catch {
      if (requestProjectPath === projectPath) sessionListMessage = "Agent sessions could not be loaded.";
    } finally {
      if (requestProjectPath === projectPath) sessionListBusy = false;
    }
  }

  function resetSessionState() {
    status = "empty";
    message = "No agent session has reported activity yet.";
    commandMessage = "No agent command has been sent yet.";
    inputText = "";
    activeSessionId = undefined;
    sessionSummaries = [];
    output = [];
    sessionListMessage = "Loading repository sessions…";
  }

  async function startSession(prompt?: string) {
    const result = await sendCommand("/api/agent/start", prompt === undefined ? {} : { prompt });
    if (result === undefined) return undefined;
    activeSessionId = result.sessionId;
    commandMessage = result.message;
    void loadSessionSummaries();
    return result;
  }

  async function resumeSession(sessionId: string) {
    const result = await sendCommand("/api/agent/resume", { sessionId });
    if (result === undefined) return;
    activeSessionId = result.sessionId;
    status = "running";
    message = "Agent session is running.";
    output = result.transcript.map(outputFromTranscript);
    commandMessage = result.message;
    closeMobileSessionSheet();
    panelElement?.dispatchEvent(new CustomEvent("agent-session-selected", { bubbles: true }));
  }

  async function sendInput() {
    const input = inputText.trim();
    if (input.length === 0) return;
    const sessionId = activeSessionId ?? (await startSession())?.sessionId;
    if (sessionId === undefined) return;
    output = [...output, { key: `user-${crypto.randomUUID()}`, role: "user", kind: "user", text: input }];
    const result = await sendCommand("/api/agent/input", { sessionId, input });
    if (result === undefined) return;
    inputText = "";
    closeFileSuggestions();
    commandMessage = result.message;
  }

  function handleInput(event: Event) {
    const target = event.currentTarget;
    if (!(target instanceof HTMLTextAreaElement)) return;
    inputText = target.value;
    void updateFileSuggestions(target.selectionStart);
  }

  function handleInputClick(event: MouseEvent) {
    const target = event.currentTarget;
    if (!(target instanceof HTMLTextAreaElement)) return;
    void updateFileSuggestions(target.selectionStart);
  }

  function handleInputKeydown(event: KeyboardEvent) {
    if (handleFileSuggestionKeydown(event)) return;
    if (event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    void sendInput();
  }

  async function stopActiveSession() {
    if (activeSessionId === undefined || commandBusy) return;
    const result = await sendCommand("/api/agent/stop", { sessionId: activeSessionId });
    if (result !== undefined) commandMessage = result.message;
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key !== "Escape") return;
    event.preventDefault();
    if (mobileSessionSheetOpen) {
      closeMobileSessionSheet();
      return;
    }
    void stopActiveSession();
  }

  function syncMobileViewport(query: MediaQueryList) {
    mobileViewport = query.matches;
    if (!query.matches) closeMobileSessionSheet(false);
  }

  function openMobileSessionSheet() {
    mobileSessionSheetOpen = true;
    queueMicrotask(() => mobileSessionSheet?.focus());
  }

  function closeMobileSessionSheet(restoreFocus = true) {
    if (!mobileSessionSheetOpen) return;
    mobileSessionSheetOpen = false;
    if (restoreFocus) queueMicrotask(() => {
      if (isVisibleElement(mobileSessionsButton)) mobileSessionsButton.focus();
    });
  }

  function handleMobileSessionSheetKeydown(event: KeyboardEvent) {
    containTabFocus(event, mobileSessionSheet);
  }

  function handleMobileSessionBackdropPointerdown(event: PointerEvent) {
    if (isBackdropPointerEvent(event)) closeMobileSessionSheet();
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
    transcript: AgentTranscriptEntry[];
  }

  interface AgentTranscriptEntry {
    messageId?: string;
    role: "user" | "assistant" | "tool";
    text: string;
    contentKind?: "text" | "thinking";
  }

  interface AgentSessionSummary {
    id: string;
    label: string;
    preview: string;
    lastUsedAt: string;
  }

  interface ProjectFileSuggestion {
    path: string;
  }

  interface FileMention {
    start: number;
    end: number;
    query: string;
  }

  type AgentOutputRole = "user" | "assistant" | "tool";
  type AgentOutputKind = "user" | "thinking" | "answer" | "tool" | "tool-error" | "edit";

  interface AgentOutput {
    key?: string;
    role: AgentOutputRole;
    kind: AgentOutputKind;
    text: string;
  }

  function handleToolEvent(event: BrowserAppEvent) {
    const payload = asRecord(event.payload);
    if (!acceptAgentEvent(payload)) return;
    const text = toolText(payload);
    if (text === undefined) return;
    output = updateOutput(output, { ...payload, messageId: stringFrom(payload?.toolCallId), strategy: "replace" }, text, toolKind(payload));
  }

  function updateOutput(currentOutput: AgentOutput[], payload: Record<string, unknown> | undefined, text: string, kind: AgentOutputKind): AgentOutput[] {
    const rawKey = stringFrom(payload?.messageId);
    const key = rawKey === undefined ? undefined : `${rawKey}:${kind}`;
    const role = roleFrom(payload?.role, kind);
    const strategy = payload?.strategy === "replace" ? "replace" : "append";
    const lastIndex = currentOutput.length - 1;
    const index = key === undefined ? (currentOutput[lastIndex]?.kind === kind ? lastIndex : -1) : currentOutput.findIndex((entry) => entry.key === key);
    if (index === -1) return [...currentOutput, { key, role, kind, text }];

    return currentOutput.map((entry, entryIndex) => (entryIndex === index ? { key: entry.key ?? key, role, kind, text: strategy === "replace" ? text : entry.text + text } : entry));
  }

  function outputKindFrom(payload: Record<string, unknown> | undefined): AgentOutputKind {
    if (payload?.role === "user") return "user";
    return payload?.contentKind === "thinking" ? "thinking" : "answer";
  }

  function toolKind(payload: Record<string, unknown> | undefined): AgentOutputKind {
    if (payload?.status === "failed" || stringFrom(payload?.error) !== undefined) return "tool-error";
    if (isEditTool(stringFrom(payload?.name))) return "edit";
    return "tool";
  }

  function isEditTool(name: string | undefined): boolean {
    return name === "edit" || name === "write" || name === "multi_tool_use.parallel";
  }

  function toolText(payload: Record<string, unknown> | undefined): string | undefined {
    const name = stringFrom(payload?.name) ?? "tool";
    const body = stringFrom(payload?.error) ?? stringFrom(payload?.output) ?? stringFrom(payload?.message) ?? stringFrom(payload?.input);
    const status = stringFrom(payload?.status);
    const heading = status === undefined ? name : `${name} ${status}`;
    return body === undefined ? heading : `${heading}\n\n${body}`;
  }

  function parseCommandResult(value: unknown): AgentCommandResult | undefined {
    const result = asRecord(value);
    if (result?.accepted !== true) return reportCommandFailure(stringFrom(result?.message) ?? "Agent command failed.");
    const sessionId = stringFrom(result.sessionId);
    const message = stringFrom(result.message);
    if (sessionId === undefined || message === undefined) return reportCommandFailure("Agent command failed.");
    return { accepted: true, sessionId, message, transcript: parseTranscript(result.transcript) };
  }

  function parseTranscript(value: unknown): AgentTranscriptEntry[] {
    if (!Array.isArray(value)) return [];
    return value.map(parseTranscriptEntry).filter((entry): entry is AgentTranscriptEntry => entry !== undefined);
  }

  function parseTranscriptEntry(value: unknown): AgentTranscriptEntry | undefined {
    const entry = asRecord(value);
    const role = transcriptRole(entry?.role);
    const text = stringFrom(entry?.text);
    if (role === undefined || text === undefined) return undefined;
    return { messageId: stringFrom(entry?.messageId), role, text, contentKind: transcriptContentKind(entry?.contentKind) };
  }

  function transcriptRole(value: unknown): AgentTranscriptEntry["role"] | undefined {
    return value === "user" || value === "assistant" || value === "tool" ? value : undefined;
  }

  function transcriptContentKind(value: unknown): AgentTranscriptEntry["contentKind"] | undefined {
    return value === "text" || value === "thinking" ? value : undefined;
  }

  function outputFromTranscript(entry: AgentTranscriptEntry, index: number): AgentOutput {
    const kind = entry.role === "tool" ? "tool" : entry.contentKind === "thinking" ? "thinking" : entry.role === "user" ? "user" : "answer";
    return { key: entry.messageId ?? `transcript-${index}`, role: entry.role, kind, text: entry.text };
  }

  async function updateFileSuggestions(caretPosition = inputText.length) {
    const mention = findFileMention(inputText, caretPosition);
    fileMention = mention;
    fileSuggestionIndex = 0;
    if (mention === undefined) {
      closeFileSuggestions();
      return;
    }

    try {
      const response = await fetch(`/api/project-files?query=${encodeURIComponent(mention.query)}`);
      if (!response.ok) {
        closeFileSuggestions();
        return;
      }
      if (fileMention?.start !== mention.start || fileMention.end !== mention.end || fileMention.query !== mention.query) return;
      fileSuggestions = parseProjectFileSuggestions(await response.json());
    } catch {
      closeFileSuggestions();
    }
  }

  function findFileMention(text: string, caretPosition: number): FileMention | undefined {
    const beforeCaret = text.slice(0, caretPosition);
    const start = beforeCaret.lastIndexOf("@");
    if (start === -1) return undefined;
    const query = beforeCaret.slice(start + 1);
    if (/\s/.test(query)) return undefined;
    if (start > 0 && /\S/.test(beforeCaret[start - 1])) return undefined;
    return { start, end: caretPosition, query };
  }

  function handleFileSuggestionKeydown(event: KeyboardEvent): boolean {
    if (fileMention === undefined || fileSuggestions.length === 0) return false;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      fileSuggestionIndex = (fileSuggestionIndex + 1) % fileSuggestions.length;
      return true;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      fileSuggestionIndex = (fileSuggestionIndex - 1 + fileSuggestions.length) % fileSuggestions.length;
      return true;
    }
    if (event.key === "Enter" || event.key === "Tab") {
      event.preventDefault();
      insertFileSuggestion(fileSuggestions[fileSuggestionIndex]);
      return true;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      closeFileSuggestions();
      return true;
    }
    return false;
  }

  function insertFileSuggestion(suggestion: ProjectFileSuggestion) {
    if (fileMention === undefined) return;
    const replacement = `@${suggestion.path}`;
    inputText = inputText.slice(0, fileMention.start) + replacement + inputText.slice(fileMention.end);
    const caretPosition = fileMention.start + replacement.length;
    closeFileSuggestions();
    queueMicrotask(() => {
      inputElement?.focus();
      inputElement?.setSelectionRange(caretPosition, caretPosition);
    });
  }

  function closeFileSuggestions() {
    fileMention = undefined;
    fileSuggestions = [];
    fileSuggestionIndex = 0;
  }

  function parseProjectFileSuggestions(value: unknown): ProjectFileSuggestion[] {
    if (!Array.isArray(value)) return [];
    return value.map(parseProjectFileSuggestion).filter((suggestion): suggestion is ProjectFileSuggestion => suggestion !== undefined);
  }

  function parseProjectFileSuggestion(value: unknown): ProjectFileSuggestion | undefined {
    const suggestion = asRecord(value);
    const path = stringFrom(suggestion?.path);
    return path === undefined ? undefined : { path };
  }

  function parseSessionSummaries(value: unknown): AgentSessionSummary[] {
    if (!Array.isArray(value)) return [];
    return value.map(parseSessionSummary).filter((summary): summary is AgentSessionSummary => summary !== undefined);
  }

  function parseSessionSummary(value: unknown): AgentSessionSummary | undefined {
    const summary = asRecord(value);
    const id = stringFrom(summary?.id);
    const label = stringFrom(summary?.label);
    const preview = stringFrom(summary?.preview);
    const lastUsedAt = stringFrom(summary?.lastUsedAt);
    if (id === undefined || label === undefined || preview === undefined || lastUsedAt === undefined) return undefined;
    return { id, label, preview, lastUsedAt };
  }

  function formatLastUsed(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.valueOf())) return value;
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
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

  function roleFrom(value: unknown, kind: AgentOutputKind): AgentOutputRole {
    if (kind === "tool" || kind === "tool-error" || kind === "edit") return "tool";
    return value === "user" ? "user" : "assistant";
  }

  function outputLabel(entry: AgentOutput): string {
    if (entry.kind === "user") return "You";
    if (entry.kind === "thinking") return "Thinking";
    if (entry.kind === "tool-error") return "Tool error";
    if (entry.kind === "edit") return "Edit";
    if (entry.kind === "tool") return "Tool";
    return "Pi";
  }

  function stringFrom(value: unknown): string | undefined {
    return typeof value === "string" ? value : undefined;
  }

  function asRecord(value: unknown): Record<string, unknown> | undefined {
    return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : undefined;
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#snippet sessionList()}
  {#if sessionSummaries.length > 0}
    <div class="agent-session-list">
      {#each sessionSummaries as session (session.id)}
        <button type="button" class="agent-session-row" class:active={session.id === activeSessionId} aria-current={session.id === activeSessionId ? "true" : undefined} onclick={() => resumeSession(session.id)} disabled={commandBusy}>
          <span class="session-label">{session.label}</span>
          {#if session.preview.length > 0 && session.preview !== session.label}
            <span class="session-preview">{session.preview}</span>
          {/if}
          <time datetime={session.lastUsedAt}>{formatLastUsed(session.lastUsedAt)}</time>
        </button>
      {/each}
    </div>
  {:else}
    <p class="agent-session-message">{sessionListMessage}</p>
  {/if}
{/snippet}

<section bind:this={panelElement} class="agent-panel" aria-label="Agent panel">
  <aside class="agent-session-sidebar" aria-label="Repository agent sessions" inert={mobileSessionSheetOpen && mobileViewport}>
    <div class="sidebar-header">
      <p class="eyebrow">Sessions</p>
      <button type="button" onclick={() => loadSessionSummaries()} disabled={sessionListBusy}>Refresh</button>
    </div>

    {@render sessionList()}
  </aside>

  <div class="agent-session-activity" inert={mobileSessionSheetOpen && mobileViewport}>
    <header>
      <div>
        <p class="eyebrow">Agent</p>
        <h2>Session activity</h2>
      </div>
      <div class="agent-header-actions">
        <button bind:this={mobileSessionsButton} type="button" class="mobile-sessions-button" aria-haspopup="dialog" aria-expanded={mobileSessionSheetOpen} onclick={openMobileSessionSheet}>Sessions</button>
        <button type="button" onclick={() => startSession()} disabled={commandBusy}>Start session</button>
        <span class="agent-status" class:running={status === "running"} class:completed={status === "completed"} class:failed={status === "failed"} class:cancelled={status === "cancelled"}>{statusLabel}</span>
      </div>
    </header>

    <p class="agent-message">{message}</p>

    <div class="agent-transcript" data-agent-transcript-scroll>
      {#if output.length > 0}
        <div class="agent-output-list" aria-label="Agent output">
          {#each output as entry (entry.key ?? entry.text)}
            <article class="agent-output-message" class:user-message={entry.kind === "user"} class:thinking-message={entry.kind === "thinking"} class:answer-message={entry.kind === "answer"} class:tool-message={entry.kind === "tool"} class:tool-error-message={entry.kind === "tool-error"} class:edit-message={entry.kind === "edit"}>
              <p>{outputLabel(entry)}</p>
              <pre>{entry.text}</pre>
            </article>
          {/each}
        </div>
      {:else}
        <div class="agent-empty-state">Waiting for agent events from the app event stream. No runtime or commands are connected yet.</div>
      {/if}
    </div>

    <section class="agent-commands" aria-label="Agent commands">
      <p>{commandMessage}</p>
      <div class="agent-chat-input">
        <label>
          <span class="visually-hidden">Input</span>
          <textarea bind:this={inputElement} bind:value={inputText} disabled={commandBusy} placeholder="Send input to the active agent session" oninput={handleInput} onclick={handleInputClick} onkeydown={handleInputKeydown}></textarea>
        </label>
        <button type="button" onclick={sendInput} disabled={!canSubmitInput} aria-label="Send input">↑</button>
        {#if fileMention !== undefined && fileSuggestions.length > 0}
          <div class="file-suggestions" role="listbox" aria-label="Project files">
            {#each fileSuggestions as suggestion, index (suggestion.path)}
              <button type="button" role="option" aria-selected={index === fileSuggestionIndex} class:active={index === fileSuggestionIndex} onmousedown={(event) => event.preventDefault()} onclick={() => insertFileSuggestion(suggestion)}>
                {suggestion.path}
              </button>
            {/each}
          </div>
        {/if}
      </div>
    </section>
  </div>

  {#if mobileSessionSheetOpen}
    <div class="session-sheet-backdrop" aria-hidden="true" onpointerdown={handleMobileSessionBackdropPointerdown}></div>
    <div bind:this={mobileSessionSheet} class="session-bottom-sheet" role="dialog" aria-modal="true" aria-labelledby="mobile-session-sheet-title" tabindex="-1" onkeydown={handleMobileSessionSheetKeydown}>
      <div class="sidebar-header">
        <div>
          <p class="eyebrow">Sessions</p>
          <h2 id="mobile-session-sheet-title">Repository sessions</h2>
        </div>
        <div class="session-sheet-actions">
          <button type="button" onclick={() => loadSessionSummaries()} disabled={sessionListBusy}>Refresh</button>
          <button type="button" onclick={() => closeMobileSessionSheet()}>Close</button>
        </div>
      </div>

      {@render sessionList()}
    </div>
  {/if}
</section>

<style>
  .agent-panel {
    background: var(--container-bg);
    display: grid;
    font-size: 13px;
    grid-template-columns: minmax(220px, 280px) minmax(0, 1fr);
    height: 100%;
    line-height: 1.45;
    min-height: 0;
    overflow: hidden;
  }

  .agent-session-activity {
    display: grid;
    grid-template-rows: auto auto minmax(0, 1fr) auto;
    min-height: 0;
    overflow: hidden;
  }

  .agent-session-sidebar {
    border-right: 1px solid rgba(255, 255, 255, 0.08);
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    min-height: 0;
    overflow: hidden;
  }

  .sidebar-header {
    align-items: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    display: flex;
    gap: 10px;
    justify-content: space-between;
    padding: 12px 14px;
  }

  .agent-session-list {
    display: grid;
    gap: 8px;
    overflow-y: auto;
    padding: 12px;
  }

  .agent-session-row {
    background: rgb(45, 47, 58);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    color: inherit;
    cursor: pointer;
    display: grid;
    gap: 6px;
    padding: 10px;
    text-align: left;
  }

  .agent-session-row.active {
    border-color: var(--accent);
  }

  .session-label {
    color: var(--text);
    font-size: 13px;
    font-weight: 700;
  }

  .session-preview,
  .agent-session-row time,
  .agent-session-message {
    color: var(--muted);
    margin: 0;
  }

  .session-preview {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .agent-session-row time {
    font-size: 11px;
  }

  .agent-session-message {
    padding: 12px;
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

  .agent-status {
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

  .mobile-sessions-button,
  .session-sheet-backdrop,
  .session-bottom-sheet {
    display: none;
  }

  .agent-chat-input {
    background: var(--body-bg);
    border: 1px solid var(--dim);
    border-radius: 22px;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    min-height: 96px;
    padding: 12px;
    position: relative;
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

  .file-suggestions {
    background: rgb(36, 43, 49);
    border: 1px solid var(--dim);
    border-radius: 10px;
    bottom: calc(100% + 8px);
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.35);
    display: grid;
    left: 12px;
    max-height: 220px;
    overflow-y: auto;
    padding: 6px;
    position: absolute;
    right: 12px;
    z-index: 5;
  }

  .file-suggestions button {
    align-self: auto;
    border: 0;
    border-radius: 6px;
    font-size: 12px;
    height: auto;
    justify-self: stretch;
    line-height: 1.4;
    overflow: hidden;
    padding: 6px 8px;
    text-align: left;
    text-overflow: ellipsis;
    white-space: nowrap;
    width: auto;
  }

  .file-suggestions button.active,
  .file-suggestions button:hover {
    background: var(--accent);
    color: var(--body-bg);
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
    --agent-transcript-bg: rgb(27, 34, 38);
    --agent-user-bg: rgb(58, 57, 73);
    --agent-thinking-bg: transparent;
    --agent-answer-bg: rgb(36, 43, 49);
    --agent-tool-bg: rgb(34, 49, 36);
    --agent-tool-error-bg: rgb(59, 38, 38);
    --agent-edit-bg: rgb(34, 49, 36);
    background: var(--agent-transcript-bg);
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

  .agent-output-list {
    display: grid;
    gap: 12px;
  }

  .agent-output-message {
    background: var(--agent-answer-bg);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 2px;
    padding: 12px;
  }

  .agent-output-message.user-message {
    background: var(--agent-user-bg);
  }

  .agent-output-message.thinking-message {
    background: var(--agent-thinking-bg);
    border-color: transparent;
    padding-block: 6px;
  }

  .agent-output-message.tool-message {
    background: var(--agent-tool-bg);
  }

  .agent-output-message.tool-error-message {
    background: var(--agent-tool-error-bg);
  }

  .agent-output-message.edit-message {
    background: var(--agent-edit-bg);
  }

  .agent-output-message p {
    color: var(--muted);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    margin: 0 0 8px;
    text-transform: uppercase;
  }

  .agent-output-message.thinking-message p {
    font-style: italic;
    text-transform: none;
  }

  pre {
    color: var(--text);
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
    margin: 0;
    max-width: 100%;
    overflow: visible;
    white-space: pre-wrap;
  }

  .thinking-message pre {
    color: var(--muted);
    font-style: italic;
  }

  .tool-message pre,
  .tool-error-message pre,
  .edit-message pre {
    color: rgb(224, 226, 218);
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
    .agent-panel {
      grid-template-columns: 1fr;
    }

    .agent-session-sidebar {
      display: none;
    }

    .mobile-sessions-button {
      display: inline-block;
    }

    .session-sheet-backdrop {
      background: rgba(0, 0, 0, 0.5);
      border: 0;
      border-radius: 0;
      display: block;
      inset: 0;
      padding: 0;
      position: fixed;
      z-index: 20;
    }

    .session-bottom-sheet {
      background: var(--container-bg);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 18px 18px 0 0;
      bottom: 0;
      box-shadow: 0 -18px 48px rgba(0, 0, 0, 0.45);
      display: grid;
      grid-template-rows: auto minmax(0, 1fr);
      left: 0;
      max-height: min(72vh, 560px);
      min-height: 240px;
      outline: none;
      overflow: hidden;
      position: fixed;
      right: 0;
      z-index: 21;
    }

    .session-sheet-actions {
      display: flex;
      gap: 8px;
    }

    header {
      padding: 10px 12px;
    }

    .agent-message {
      padding: 8px 12px;
    }

    .agent-transcript {
      padding: 12px;
    }

    .agent-output-message pre {
      overflow-x: auto;
      overflow-y: hidden;
      -webkit-overflow-scrolling: touch;
      white-space: pre;
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
