import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { ConfigProvider, ConfigWarning, ProjectConfig, ProjectPath, SelectableProject } from "$lib/domain/ports";

const userConfigFileName = "config.json";

interface QuincyUserConfig {
  projects?: unknown;
}

interface ConfigDirOptions {
  platform?: NodeJS.Platform;
  env?: Record<string, string | undefined>;
  homeDir?: string;
}

interface DiscoveryOptions extends ConfigDirOptions {
  configDir?: string;
}

interface ParsedProjectEntry {
  project?: SelectableProject;
  warnings: ConfigWarning[];
}

export function createConfigProvider(): ConfigProvider {
  return async (request) => resolveProjectConfig(request?.selectedProjectPath);
}

export function getQuincyUserConfigDir(options?: ConfigDirOptions): string {
  const resolved = resolveConfigDirOptions(options);
  if (resolved.platform === "win32") return windowsConfigDir(resolved.env, resolved.homeDir);
  if (resolved.env.XDG_CONFIG_HOME) return path.join(resolved.env.XDG_CONFIG_HOME, "quincy");
  if (resolved.platform === "darwin") return path.join(resolved.homeDir, "Library", "Application Support", "quincy");
  return path.join(resolved.homeDir, ".config", "quincy");
}

export async function discoverSelectableProjects(options?: DiscoveryOptions) {
  const configPath = userConfigPath(options);
  const { config, warnings } = await readUserConfig(configPath);
  const projects = await parseProjectEntries(config.projects, warnings);
  return { configPath, projects: projects.projects, warnings: projects.warnings };
}

async function resolveProjectConfig(selectedProjectPath?: ProjectPath): Promise<ProjectConfig> {
  const discovery = await discoverSelectableProjects();
  const projectPath = activeProjectPath(selectProject(discovery.projects, selectedProjectPath));
  return projectConfigFromDiscovery(discovery, projectPath);
}

function projectConfigFromDiscovery(discovery: Awaited<ReturnType<typeof discoverSelectableProjects>>, projectPath: ProjectPath): ProjectConfig {
  return {
    projectPath,
    ticketDirectory: resolveTicketDirectory(projectPath, ticketDirectoryForProject(discovery.projects, projectPath)),
    selectableProjects: discovery.projects,
    configWarnings: discovery.warnings,
  };
}

function resolveConfigDirOptions(options?: ConfigDirOptions) {
  return {
    platform: options?.platform ?? process.platform,
    env: options?.env ?? process.env,
    homeDir: options?.homeDir ?? os.homedir(),
  };
}

function windowsConfigDir(env: Record<string, string | undefined>, homeDir: string): string {
  return env.APPDATA ? path.join(env.APPDATA, "quincy") : path.join(homeDir, "AppData", "Roaming", "quincy");
}

function userConfigPath(options?: DiscoveryOptions): string {
  const configDir = options?.configDir ?? getQuincyUserConfigDir(options);
  return path.join(configDir, userConfigFileName);
}

async function parseProjectEntries(projects: unknown, existingWarnings: ConfigWarning[]) {
  const entries = Array.isArray(projects) ? projects : [];
  const parsedEntries = await Promise.all(entries.map(parseProjectEntry));
  return collectProjectEntries(parsedEntries, existingWarnings);
}

async function parseProjectEntry(entry: unknown): Promise<ParsedProjectEntry> {
  if (!entry || typeof entry !== "object") return { warnings: ["Ignoring invalid project entry because it is not an object."] };
  const root = await parseProjectRoot(entry);
  if (root.warnings.length > 0 || root.root === undefined) return { warnings: root.warnings };
  return { project: createProjectEntry(entry, root.root), warnings: [] };
}

async function parseProjectRoot(entry: object): Promise<{ root?: ProjectPath; warnings: ConfigWarning[] }> {
  const rootValue = "root" in entry ? entry.root : undefined;
  if (typeof rootValue !== "string" || !rootValue.trim()) return { warnings: ["Ignoring project entry because root is missing or empty."] };

  const root = path.resolve(rootValue);
  if (!(await isDirectory(root))) return { warnings: [`Ignoring project entry because the directory does not exist: ${root}`] };
  return { root, warnings: [] };
}

function createProjectEntry(entry: object, root: ProjectPath): SelectableProject {
  const labelValue = "label" in entry ? entry.label : undefined;
  const ticketDirectoryValue = "ticketDirectory" in entry ? entry.ticketDirectory : undefined;
  const label = typeof labelValue === "string" && labelValue.trim() ? labelValue.trim() : undefined;
  const ticketDirectory = typeof ticketDirectoryValue === "string" && ticketDirectoryValue.trim() ? ticketDirectoryValue.trim() : undefined;
  return { root, ...(label ? { label } : {}), ...(ticketDirectory ? { ticketDirectory } : {}) };
}

function collectProjectEntries(entries: ParsedProjectEntry[], existingWarnings: ConfigWarning[]) {
  const initial = { projects: [] as SelectableProject[], warnings: [...existingWarnings], seenRoots: new Set<ProjectPath>() };
  const collected = entries.reduce(collectProjectEntry, initial);
  return { projects: collected.projects, warnings: collected.warnings };
}

function collectProjectEntry(collected: { projects: SelectableProject[]; warnings: ConfigWarning[]; seenRoots: Set<ProjectPath> }, entry: ParsedProjectEntry) {
  if (entry.project === undefined) return { ...collected, warnings: [...collected.warnings, ...entry.warnings] };
  if (collected.seenRoots.has(entry.project.root)) return collectDuplicateProject(collected, entry.project.root);
  return collectUniqueProject(collected, entry.project);
}

function collectDuplicateProject(collected: { projects: SelectableProject[]; warnings: ConfigWarning[]; seenRoots: Set<ProjectPath> }, root: ProjectPath) {
  return { ...collected, warnings: [...collected.warnings, `Ignoring duplicate project entry for ${root}.`] };
}

function collectUniqueProject(collected: { projects: SelectableProject[]; warnings: ConfigWarning[]; seenRoots: Set<ProjectPath> }, project: SelectableProject) {
  return { projects: [...collected.projects, project], warnings: collected.warnings, seenRoots: new Set([...collected.seenRoots, project.root]) };
}

function activeProjectPath(selectedProject?: SelectableProject): ProjectPath {
  return path.resolve(process.env.QUINCY_PROJECT_PATH || selectedProject?.root || process.cwd());
}

function ticketDirectoryForProject(projects: SelectableProject[], projectPath: ProjectPath): string | undefined {
  return projects.find((project) => project.root === projectPath)?.ticketDirectory;
}

function selectProject(projects: SelectableProject[], selectedProjectPath?: ProjectPath): SelectableProject | undefined {
  if (selectedProjectPath) return projects.find((project) => project.root === path.resolve(selectedProjectPath));
  return projects[0];
}

function resolveTicketDirectory(projectPath: string, projectTicketDirectory?: string): string {
  const ticketDirectory = process.env.QUINCY_TICKET_DIRECTORY || projectTicketDirectory || ".tickets";
  if (path.isAbsolute(ticketDirectory)) return path.normalize(ticketDirectory);
  return path.resolve(projectPath, ticketDirectory);
}

async function readUserConfig(configPath: string): Promise<{ config: QuincyUserConfig; warnings: ConfigWarning[] }> {
  try {
    return validateUserConfig(JSON.parse(await fs.readFile(configPath, "utf8")), configPath);
  } catch (error) {
    return readUserConfigError(error, configPath);
  }
}

function validateUserConfig(parsed: unknown, configPath: string): { config: QuincyUserConfig; warnings: ConfigWarning[] } {
  if (parsed && typeof parsed === "object") return { config: parsed as QuincyUserConfig, warnings: [] };
  return { config: {}, warnings: [`Ignoring ${configPath} because it does not contain a JSON object.`] };
}

function readUserConfigError(error: unknown, configPath: string): { config: QuincyUserConfig; warnings: ConfigWarning[] } {
  const code = typeof error === "object" && error && "code" in error ? (error as { code?: string }).code : undefined;
  if (code === "ENOENT") return { config: {}, warnings: [] };
  return { config: {}, warnings: [`Ignoring ${configPath} because it could not be parsed.`] };
}

async function isDirectory(directoryPath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(directoryPath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}
