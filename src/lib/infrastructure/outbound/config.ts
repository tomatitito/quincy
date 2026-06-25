import type { ConfigProvider, ProjectConfig } from "$lib/domain/ports";

const defaultProjectConfig: ProjectConfig = {
  projectPath: process.cwd(),
  ticketDirectory: ".tickets",
};

export function createConfigProvider(): ConfigProvider {
  return async () => defaultProjectConfig;
}
