/// <reference types="bun" />

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { createConfigProvider, discoverSelectableProjects, getQuincyUserConfigDir } from "$lib/infrastructure/outbound/config";

const originalProjectPath = process.env.QUINCY_PROJECT_PATH;
const originalTicketDirectory = process.env.QUINCY_TICKET_DIRECTORY;
const originalXdgConfigHome = process.env.XDG_CONFIG_HOME;

let configHome: string;

describe("createConfigProvider", () => {
  beforeEach(async () => {
    configHome = await fs.mkdtemp(path.join(os.tmpdir(), "quincy-config-test-"));
    process.env.XDG_CONFIG_HOME = configHome;
  });

  afterEach(async () => {
    restoreEnv("QUINCY_PROJECT_PATH", originalProjectPath);
    restoreEnv("QUINCY_TICKET_DIRECTORY", originalTicketDirectory);
    restoreEnv("XDG_CONFIG_HOME", originalXdgConfigHome);
    await fs.rm(configHome, { force: true, recursive: true });
  });

  test("defaults to the process cwd and its .tickets directory", async () => {
    delete process.env.QUINCY_PROJECT_PATH;
    delete process.env.QUINCY_TICKET_DIRECTORY;

    await expect(createConfigProvider()()).resolves.toEqual({
      projectPath: path.resolve(process.cwd()),
      ticketDirectory: path.resolve(process.cwd(), ".tickets"),
      selectableProjects: [],
      configWarnings: [],
    });
  });

  test("resolves relative ticket directories against the configured project path", async () => {
    process.env.QUINCY_PROJECT_PATH = "/tmp/quincy-project";
    process.env.QUINCY_TICKET_DIRECTORY = "project-tickets";

    await expect(createConfigProvider()()).resolves.toEqual({
      projectPath: "/tmp/quincy-project",
      ticketDirectory: "/tmp/quincy-project/project-tickets",
      selectableProjects: [],
      configWarnings: [],
    });
  });

  test("keeps absolute ticket directories independent from the project path", async () => {
    process.env.QUINCY_PROJECT_PATH = "/tmp/quincy-project";
    process.env.QUINCY_TICKET_DIRECTORY = "/tmp/shared-tickets";

    await expect(createConfigProvider()()).resolves.toEqual({
      projectPath: "/tmp/quincy-project",
      ticketDirectory: "/tmp/shared-tickets",
      selectableProjects: [],
      configWarnings: [],
    });
  });

  test("uses first configured project when no env or selection exists", async () => {
    delete process.env.QUINCY_PROJECT_PATH;
    delete process.env.QUINCY_TICKET_DIRECTORY;
    const project = await fs.mkdtemp(path.join(os.tmpdir(), "quincy-project-"));
    await writeUserConfig({ projects: [{ root: project, label: "Quincy", ticketDirectory: "tickets" }] });

    await expect(createConfigProvider()()).resolves.toEqual({
      projectPath: project,
      ticketDirectory: path.join(project, "tickets"),
      selectableProjects: [{ root: project, label: "Quincy", ticketDirectory: "tickets" }],
      configWarnings: [],
    });

    await fs.rm(project, { force: true, recursive: true });
  });

  test("uses selected configured project", async () => {
    delete process.env.QUINCY_PROJECT_PATH;
    delete process.env.QUINCY_TICKET_DIRECTORY;
    const first = await fs.mkdtemp(path.join(os.tmpdir(), "quincy-first-"));
    const second = await fs.mkdtemp(path.join(os.tmpdir(), "quincy-second-"));
    await writeUserConfig({ projects: [{ root: first }, { root: second, ticketDirectory: ".todo" }] });

    await expect(createConfigProvider()({ selectedProjectPath: second })).resolves.toMatchObject({
      projectPath: second,
      ticketDirectory: path.join(second, ".todo"),
    });

    await fs.rm(first, { force: true, recursive: true });
    await fs.rm(second, { force: true, recursive: true });
  });

  test("env project path overrides selected project", async () => {
    const selected = await fs.mkdtemp(path.join(os.tmpdir(), "quincy-selected-"));
    process.env.QUINCY_PROJECT_PATH = "/tmp/env-project";
    await writeUserConfig({ projects: [{ root: selected }] });

    await expect(createConfigProvider()({ selectedProjectPath: selected })).resolves.toMatchObject({
      projectPath: "/tmp/env-project",
      ticketDirectory: "/tmp/env-project/.tickets",
    });

    await fs.rm(selected, { force: true, recursive: true });
  });
});

describe("discoverSelectableProjects", () => {
  test("uses platform-specific Quincy config dirs", () => {
    expect(getQuincyUserConfigDir({ platform: "linux", env: {}, homeDir: "/home/me" })).toBe("/home/me/.config/quincy");
    expect(getQuincyUserConfigDir({ platform: "darwin", env: {}, homeDir: "/Users/me" })).toBe("/Users/me/Library/Application Support/quincy");
    expect(getQuincyUserConfigDir({ platform: "win32", env: { APPDATA: "C:/Users/me/AppData/Roaming" }, homeDir: "C:/Users/me" })).toBe(
      "C:/Users/me/AppData/Roaming/quincy",
    );
  });

  test("normalizes valid projects and warns about invalid entries", async () => {
    const configDir = await fs.mkdtemp(path.join(os.tmpdir(), "quincy-discovery-"));
    const project = await fs.mkdtemp(path.join(os.tmpdir(), "quincy-valid-"));
    await fs.writeFile(
      path.join(configDir, "config.json"),
      JSON.stringify({ projects: [{ root: project, label: "Valid" }, { root: project }, { root: "/missing" }, null, { label: "No root" }] }),
    );

    await expect(discoverSelectableProjects({ configDir })).resolves.toEqual({
      configPath: path.join(configDir, "config.json"),
      projects: [{ root: project, label: "Valid" }],
      warnings: [
        `Ignoring duplicate project entry for ${project}.`,
        "Ignoring project entry because the directory does not exist: /missing",
        "Ignoring invalid project entry because it is not an object.",
        "Ignoring project entry because root is missing or empty.",
      ],
    });

    await fs.rm(configDir, { force: true, recursive: true });
    await fs.rm(project, { force: true, recursive: true });
  });
});

async function writeUserConfig(config: unknown) {
  const dir = path.join(configHome, "quincy");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, "config.json"), JSON.stringify(config));
}

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}
