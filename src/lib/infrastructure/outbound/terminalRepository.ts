import * as pty from "node-pty";
import type { ProjectPath } from "$lib/domain/ports";

export type TerminalStatus = "opening" | "open" | "closed" | "error";

export interface TerminalState {
  sessionId: string;
  projectPath: ProjectPath;
  status: TerminalStatus;
  output: string;
  message: string;
  cols: number;
  rows: number;
}

export interface TerminalRepository {
  open(): TerminalState;
  state(sessionId: string): TerminalState | undefined;
  input(sessionId: string, input: string): TerminalState | undefined;
  resize(sessionId: string, cols: number, rows: number): TerminalState | undefined;
  close(sessionId: string): TerminalState | undefined;
  closeAll(): void;
}

interface TerminalRepositoryDependencies {
  cwd: ProjectPath;
  createSessionId: () => string;
  spawnPty?: SpawnPty;
  shell?: string;
}

type SpawnPty = (file: string, args: string[], options: pty.IPtyForkOptions) => PtyProcess;

type PtyExitEvent = { exitCode: number; signal?: number | string };

interface PtyProcess {
  write(data: string): void;
  resize(cols: number, rows: number): void;
  kill(signal?: string): void;
  onData(callback: (data: string) => void): PtySubscription;
  onExit(callback: (event: PtyExitEvent) => void): PtySubscription;
}

type Disposable = () => void;

type PtySubscription = { dispose(): void };

interface TerminalSession {
  state: TerminalState;
  process: PtyProcess;
  disposables: Disposable[];
}

const DEFAULT_COLS = 80;
const DEFAULT_ROWS = 24;
const OUTPUT_LIMIT = 200_000;

// eslint-disable-next-line sensors/max-function-lines
export function createTerminalRepository(dependencies: TerminalRepositoryDependencies): TerminalRepository {
  let session: TerminalSession | undefined;

  return {
    open: () => {
      if (session !== undefined && session.state.status === "open") return copyState(session.state);
      session = startSession(dependencies);
      return copyState(session.state);
    },
    state: (sessionId) => (session?.state.sessionId === sessionId ? copyState(session.state) : undefined),
    input: (sessionId, input) => {
      if (session?.state.sessionId !== sessionId || session.state.status !== "open") return undefined;
      session.process.write(input);
      return copyState(session.state);
    },
    resize: (sessionId, cols, rows) => {
      if (session?.state.sessionId !== sessionId || session.state.status === "closed") return undefined;
      session.state.cols = normalizeDimension(cols, DEFAULT_COLS);
      session.state.rows = normalizeDimension(rows, DEFAULT_ROWS);
      session.process.resize(session.state.cols, session.state.rows);
      return copyState(session.state);
    },
    close: (sessionId) => {
      if (session?.state.sessionId !== sessionId) return undefined;
      closeSession(session, "Terminal closed.");
      return copyState(session.state);
    },
    closeAll: () => {
      if (session !== undefined) closeSession(session, "Terminal closed.");
    },
  };
}

function startSession(dependencies: TerminalRepositoryDependencies): TerminalSession {
  const shell = dependencies.shell ?? process.env.SHELL ?? "/bin/sh";
  const initialState = createInitialState(dependencies);
  const ptyProcess = (dependencies.spawnPty ?? pty.spawn)(shell, [], ptyOptions(dependencies.cwd, initialState));
  return bindProcessEvents({ state: initialState, process: ptyProcess, disposables: [] });
}

function createInitialState(dependencies: TerminalRepositoryDependencies): TerminalState {
  return { sessionId: dependencies.createSessionId(), projectPath: dependencies.cwd, status: "open", output: "", message: `Terminal running in ${dependencies.cwd}`, cols: DEFAULT_COLS, rows: DEFAULT_ROWS };
}

function ptyOptions(cwd: ProjectPath, state: TerminalState): pty.IPtyForkOptions {
  return { cwd, env: { ...process.env, TERM: "xterm-256color" }, cols: state.cols, rows: state.rows, name: "xterm-256color" };
}

function bindProcessEvents(session: TerminalSession): TerminalSession {
  const dataSubscription = session.process.onData((chunk) => appendOutput(session.state, chunk));
  const exitSubscription = session.process.onExit((event) => markClosed(session.state, exitMessage(event)));
  session.disposables.push(() => dataSubscription.dispose(), () => exitSubscription.dispose());
  return session;
}

function appendOutput(state: TerminalState, chunk: string): TerminalState {
  state.output = (state.output + chunk).slice(-OUTPUT_LIMIT);
  return state;
}

function markClosed(state: TerminalState, message: string): TerminalState {
  if (state.status !== "error") state.status = "closed";
  state.message = message;
  return state;
}

function closeSession(session: TerminalSession, message: string): TerminalSession {
  if (session.state.status === "closed") return session;
  for (const disposable of session.disposables) disposable();
  session.process.kill();
  markClosed(session.state, message);
  return session;
}

function exitMessage(event: PtyExitEvent): string {
  if (event.signal !== undefined && event.signal !== 0) return `Terminal exited from ${event.signal}.`;
  return `Terminal exited with code ${event.exitCode}.`;
}

function normalizeDimension(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
}

function copyState(state: TerminalState): TerminalState {
  return { ...state };
}
