/// <reference types="bun" />

import { describe, expect, test } from "bun:test";
import { createTerminalRepository } from "$lib/infrastructure/outbound/terminalRepository";

interface FakePty {
  writes: string[];
  resizes: { cols: number; rows: number }[];
  killed: boolean;
  dataHandlers: ((data: string) => void)[];
  exitHandlers: ((event: { exitCode: number; signal?: string }) => void)[];
  write: (input: string) => void;
  resize: (cols: number, rows: number) => void;
  kill: () => void;
  onData: (callback: (data: string) => void) => { dispose: () => void };
  onExit: (callback: (event: { exitCode: number; signal?: string }) => void) => { dispose: () => void };
}

describe("terminal repository", () => {
  test("opens genuine PTY in project cwd and records ANSI output", () => {
    const spawned: { file: string; args: string[]; cwd: string; cols: number; rows: number; name: string }[] = [];
    const fakePty = createFakePty();
    const repository = createTerminalRepository({
      cwd: "/repo/project",
      createSessionId: () => "terminal-1",
      shell: "/bin/zsh",
      spawnPty: (file, args, options) => {
        spawned.push({ file, args, cwd: String(options.cwd), cols: Number(options.cols), rows: Number(options.rows), name: String(options.name) });
        return fakePty;
      },
    });

    const opened = repository.open();
    fakePty.dataHandlers.forEach((handler) => handler("\u001b[32mready\u001b[0m"));

    expect(opened).toMatchObject({ sessionId: "terminal-1", projectPath: "/repo/project", status: "open", cols: 80, rows: 24 });
    expect(spawned).toEqual([{ file: "/bin/zsh", args: [], cwd: "/repo/project", cols: 80, rows: 24, name: "xterm-256color" }]);
    expect(repository.state("terminal-1")?.output).toBe("\u001b[32mready\u001b[0m");
  });

  test("writes input, resizes PTY dimensions, and closes active terminal only", () => {
    const fakePty = createFakePty();
    const repository = createTerminalRepository({ cwd: "/repo/project", createSessionId: () => "terminal-1", spawnPty: () => fakePty });
    repository.open();

    expect(repository.input("missing", "ls\r")).toBeUndefined();
    repository.input("terminal-1", "ls\r");
    const resized = repository.resize("terminal-1", 120.8, 30.2);
    const closed = repository.close("terminal-1");

    expect(fakePty.writes).toEqual(["ls\r"]);
    expect(fakePty.resizes).toEqual([{ cols: 120, rows: 30 }]);
    expect(fakePty.killed).toBe(true);
    expect(closed).toMatchObject({ status: "closed", message: "Terminal closed." });
  });

  test("closeAll disposes handlers before killing PTY", () => {
    const fakePty = createFakePty();
    const repository = createTerminalRepository({ cwd: "/repo/project", createSessionId: () => "terminal-1", spawnPty: () => fakePty });
    repository.open();

    repository.closeAll();
    fakePty.dataHandlers.forEach((handler) => handler("late output"));

    expect(fakePty.killed).toBe(true);
    expect(repository.state("terminal-1")?.output).toBe("");
  });
});

function createFakePty(): FakePty {
  const fake: FakePty = {
    writes: [],
    resizes: [],
    killed: false,
    dataHandlers: [],
    exitHandlers: [],
    write: (input) => fake.writes.push(input),
    resize: (cols, rows) => fake.resizes.push({ cols, rows }),
    kill: () => {
      fake.killed = true;
    },
    onData: (callback) => {
      fake.dataHandlers.push(callback);
      return { dispose: () => (fake.dataHandlers = fake.dataHandlers.filter((handler) => handler !== callback)) };
    },
    onExit: (callback) => {
      fake.exitHandlers.push(callback);
      return { dispose: () => (fake.exitHandlers = fake.exitHandlers.filter((handler) => handler !== callback)) };
    },
  };
  return fake;
}
