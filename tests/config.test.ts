/// <reference types="bun" />

import path from "node:path";
import { afterEach, describe, expect, test } from "bun:test";
import { createConfigProvider } from "$lib/infrastructure/outbound/config";

const originalProjectPath = process.env.QUINCY_PROJECT_PATH;
const originalTicketDirectory = process.env.QUINCY_TICKET_DIRECTORY;

describe("createConfigProvider", () => {
  afterEach(() => {
    restoreEnv("QUINCY_PROJECT_PATH", originalProjectPath);
    restoreEnv("QUINCY_TICKET_DIRECTORY", originalTicketDirectory);
  });

  test("defaults to the process cwd and its .tickets directory", async () => {
    delete process.env.QUINCY_PROJECT_PATH;
    delete process.env.QUINCY_TICKET_DIRECTORY;

    await expect(createConfigProvider()()).resolves.toEqual({
      projectPath: path.resolve(process.cwd()),
      ticketDirectory: path.resolve(process.cwd(), ".tickets"),
    });
  });

  test("resolves relative ticket directories against the configured project path", async () => {
    process.env.QUINCY_PROJECT_PATH = "/tmp/quincy-project";
    process.env.QUINCY_TICKET_DIRECTORY = "project-tickets";

    await expect(createConfigProvider()()).resolves.toEqual({
      projectPath: "/tmp/quincy-project",
      ticketDirectory: "/tmp/quincy-project/project-tickets",
    });
  });

  test("keeps absolute ticket directories independent from the project path", async () => {
    process.env.QUINCY_PROJECT_PATH = "/tmp/quincy-project";
    process.env.QUINCY_TICKET_DIRECTORY = "/tmp/shared-tickets";

    await expect(createConfigProvider()()).resolves.toEqual({
      projectPath: "/tmp/quincy-project",
      ticketDirectory: "/tmp/shared-tickets",
    });
  });
});

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}
