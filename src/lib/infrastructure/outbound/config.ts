import type { ConfigProvider, ProjectConfig } from "$lib/domain/ports";

const defaultProjectConfig: ProjectConfig = {
  ticketDirectory: ".tickets",
};

export function createConfigProvider(): ConfigProvider {
  return {
    getProjectConfig: async () => defaultProjectConfig,
  };
}
