import { readdir } from "node:fs/promises";
import path from "node:path";
import type { Dirent } from "node:fs";
import type { ProjectFileRepository, ProjectFileSuggestion, ProjectPath } from "$lib/domain/ports";

const IGNORED_DIRECTORIES = new Set([".git", ".svelte-kit", "node_modules", "dist", "build", "coverage"]);
const MAX_SCANNED_FILES = 5000;

export function createProjectFileRepository(projectPath: ProjectPath): ProjectFileRepository {
  return async ({ query, limit }) => {
    const normalizedQuery = query.trim().toLowerCase();
    const files = await listFiles(projectPath, projectPath, MAX_SCANNED_FILES);
    return files.filter((file) => matchesQuery(file, normalizedQuery)).slice(0, limit);
  };
}

async function listFiles(root: string, directory: string, limit: number): Promise<ProjectFileSuggestion[]> {
  if (limit <= 0) return [];
  const files: ProjectFileSuggestion[] = [];
  for (const entry of await sortedEntries(directory)) {
    if (files.length >= limit) break;
    files.push(...(await filesForEntry(root, directory, entry, limit - files.length)));
  }
  return files;
}

async function sortedEntries(directory: string): Promise<Dirent[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  return entries.toSorted((left, right) => left.name.localeCompare(right.name));
}

async function filesForEntry(root: string, directory: string, entry: Dirent, limit: number): Promise<ProjectFileSuggestion[]> {
  if (isIgnoredEntry(entry)) return [];
  const entryPath = path.join(directory, entry.name);
  if (entry.isDirectory()) return listFiles(root, entryPath, limit);
  if (entry.isFile()) return [{ path: toProjectPath(root, entryPath) }];
  return [];
}

function isIgnoredEntry(entry: Dirent): boolean {
  if (entry.name.startsWith(".") && entry.name !== ".env") return true;
  return entry.isDirectory() && IGNORED_DIRECTORIES.has(entry.name);
}

function toProjectPath(root: string, filePath: string): string {
  return path.relative(root, filePath).split(path.sep).join("/");
}

function matchesQuery(file: ProjectFileSuggestion, normalizedQuery: string): boolean {
  return normalizedQuery.length === 0 || file.path.toLowerCase().includes(normalizedQuery);
}
