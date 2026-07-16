<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import type { FitAddon } from "@xterm/addon-fit";
  import type { IDisposable, Terminal } from "@xterm/xterm";
  import "@xterm/xterm/css/xterm.css";

  interface Props {
    projectPath: string;
  }

  interface TerminalState {
    sessionId?: string;
    projectPath?: string;
    status: "opening" | "open" | "closed" | "error";
    output?: string;
    message: string;
    cols?: number;
    rows?: number;
  }

  let { projectPath }: Props = $props();
  let terminalElement = $state<HTMLElement>();
  let sessionId = $state<string>();
  let status = $state<TerminalState["status"]>("opening");
  let message = $state("Opening terminal…");
  let activeProjectPath = $state<string>();
  let terminal: Terminal | undefined;
  let fitAddon: FitAddon | undefined;
  let inputDisposable: IDisposable | undefined;
  let pollTimer: ReturnType<typeof setInterval> | undefined;
  let resizeObserver: ResizeObserver | undefined;
  let mounted = false;
  let latestOutput = "";

  $effect(() => {
    if (!mounted) return;
    if (activeProjectPath === undefined) {
      activeProjectPath = projectPath;
      return;
    }
    if (projectPath === activeProjectPath) return;
    void switchProject(projectPath);
  });

  onMount(() => {
    mounted = true;
    activeProjectPath = projectPath;
    void bootTerminal();
    pollTimer = setInterval(() => void refreshState(), 500);
    resizeObserver = new ResizeObserver(() => void resizeTerminal());
    if (terminalElement !== undefined) resizeObserver.observe(terminalElement);
  });

  onDestroy(() => {
    mounted = false;
    if (pollTimer !== undefined) clearInterval(pollTimer);
    resizeObserver?.disconnect();
    inputDisposable?.dispose();
    terminal?.dispose();
    void closeCurrentTerminal();
  });

  async function bootTerminal() {
    await createEmulator();
    await openTerminal();
  }

  async function createEmulator() {
    if (terminal !== undefined || terminalElement === undefined) return;
    const [{ Terminal }, { FitAddon }] = await Promise.all([import("@xterm/xterm"), import("@xterm/addon-fit")]);
    terminal = new Terminal({ cursorBlink: true, convertEol: true, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace', fontSize: 13, theme: { background: "#050505", foreground: "#f3f4f6" } });
    fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminal.open(terminalElement);
    inputDisposable = terminal.onData((input) => void sendInput(input));
  }

  async function switchProject(nextProjectPath: string) {
    await closeCurrentTerminal();
    activeProjectPath = nextProjectPath;
    sessionId = undefined;
    status = "opening";
    message = "Project changed. Opening terminal…";
    latestOutput = "";
    terminal?.reset();
    await openTerminal();
  }

  async function openTerminal() {
    const state = await sendCommand("/api/terminal/open", {});
    applyState(state);
    await resizeTerminal();
  }

  async function refreshState() {
    if (sessionId === undefined) return;
    const response = await fetch(`/api/terminal/state?sessionId=${encodeURIComponent(sessionId)}&projectPath=${encodeURIComponent(activeProjectPath ?? projectPath)}`);
    applyState(await parseStateResponse(response));
  }

  async function resizeTerminal() {
    if (sessionId === undefined || terminal === undefined || fitAddon === undefined) return;
    fitAddon.fit();
    applyState(await sendCommand("/api/terminal/resize", { sessionId, projectPath: activeProjectPath, cols: terminal.cols, rows: terminal.rows }));
  }

  async function sendInput(input: string) {
    if (sessionId === undefined || status !== "open") return;
    applyState(await sendCommand("/api/terminal/input", { sessionId, projectPath: activeProjectPath, input }));
  }

  async function closeCurrentTerminal() {
    if (sessionId === undefined) return;
    applyState(await sendCommand("/api/terminal/close", { sessionId, projectPath: activeProjectPath }));
  }

  async function sendCommand(url: string, body: Record<string, unknown>): Promise<TerminalState> {
    const response = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    return parseStateResponse(response);
  }

  async function parseStateResponse(response: Response): Promise<TerminalState> {
    if (!response.ok) return { status: "error", message: "Terminal request failed." };
    const value: unknown = await response.json();
    return parseTerminalState(value);
  }

  function parseTerminalState(value: unknown): TerminalState {
    const state = value as Partial<TerminalState> | undefined;
    const nextStatus = state?.status;
    if (nextStatus !== "opening" && nextStatus !== "open" && nextStatus !== "closed" && nextStatus !== "error") return { status: "error", message: "Terminal response invalid." };
    return { status: nextStatus, sessionId: stringFrom(state?.sessionId), projectPath: stringFrom(state?.projectPath), output: stringFrom(state?.output) ?? "", message: stringFrom(state?.message) ?? "Terminal state updated." };
  }

  function applyState(state: TerminalState) {
    sessionId = state.sessionId ?? sessionId;
    status = state.status;
    message = state.message;
    writeOutput(state.output ?? latestOutput);
  }

  function writeOutput(nextOutput: string) {
    if (terminal === undefined || nextOutput === latestOutput) return;
    if (nextOutput.startsWith(latestOutput)) {
      terminal.write(nextOutput.slice(latestOutput.length));
    } else {
      terminal.reset();
      terminal.write(nextOutput);
    }
    latestOutput = nextOutput;
  }

  function stringFrom(value: unknown): string | undefined {
    return typeof value === "string" ? value : undefined;
  }
</script>

<section class="terminal-panel" aria-label="Terminal view">
  <header class="terminal-toolbar">
    <div>
      <p class="eyebrow">Terminal</p>
      <p class="terminal-message">{message}</p>
    </div>
    <button type="button" onclick={closeCurrentTerminal} disabled={sessionId === undefined || status === "closed"}>Close</button>
  </header>
  <div bind:this={terminalElement} class="terminal-screen" aria-label="Interactive project terminal"></div>
</section>

<style>
  .terminal-panel {
    background: #050505;
    color: #f3f4f6;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    height: 100%;
    min-height: 0;
  }

  .terminal-toolbar {
    align-items: center;
    background: var(--container-bg);
    border-bottom: 1px solid var(--dim);
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 12px;
  }

  .terminal-toolbar button {
    background: transparent;
    border: 1px solid var(--dim);
    border-radius: 3px;
    color: var(--muted);
    cursor: pointer;
    font: inherit;
    padding: 4px 8px;
  }

  .eyebrow,
  .terminal-message {
    margin: 0;
  }

  .eyebrow {
    color: var(--muted);
    font-size: 12px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .terminal-message {
    color: var(--text);
    font-size: 13px;
  }

  .terminal-screen {
    min-height: 0;
    overflow: hidden;
    padding: 8px;
  }

  .terminal-screen :global(.xterm) {
    height: 100%;
  }
</style>
