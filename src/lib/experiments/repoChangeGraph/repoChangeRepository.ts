import { execFile } from "node:child_process";
import type { Dirent } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import type { ProjectPath } from "$lib/domain/ports";
import { deriveRepoChangeGraph, type RepoChangeGraphView } from "$lib/experiments/repoChangeGraph/repoChangeGraph";

const execFileAsync = promisify(execFile);
const IMPORT_PATTERN = /(?:import|export)\s+(?:[^"']*?\s+from\s+)?["']([^"']+)["']|import\s*\(\s*["']([^"']+)["']\s*\)/g;
const RESOLVABLE_EXTENSIONS = ["", ".ts", ".svelte", ".js", ".tsx", ".jsx"];
const IGNORED_DIRECTORIES = new Set([".git", ".svelte-kit", "node_modules", "dist", "build", "coverage"]);

export async function getRepoChangeGraph(projectPath: ProjectPath): Promise<RepoChangeGraphView> {
  const [changedFiles, sourceFiles] = await Promise.all([listChangedFiles(projectPath), listSourceFiles(projectPath, projectPath)]);
  const importsByFile = await readImportsByFile(projectPath, sourceFiles);
  return deriveRepoChangeGraph(changedFiles, importsByFile);
}

async function listChangedFiles(projectPath: ProjectPath): Promise<string[]> {
  const [tracked, untracked] = await Promise.all([gitLines(projectPath, ["diff", "--name-only", "HEAD"]), gitLines(projectPath, ["ls-files", "--others", "--exclude-standard"])]);
  return Array.from(new Set([...tracked, ...untracked])).filter(isSourceFile).sort((left, right) => left.localeCompare(right));
}

async function listSourceFiles(root: string, directory: string): Promise<string[]> {
  const files = await Promise.all((await sortedEntries(directory)).map((entry) => sourceFilesForEntry(root, directory, entry)));
  return files.flat().sort((left, right) => left.localeCompare(right));
}

async function sourceFilesForEntry(root: string, directory: string, entry: Dirent): Promise<string[]> {
  if (isIgnoredEntry(entry)) return [];
  const entryPath = path.join(directory, entry.name);
  if (entry.isDirectory()) return listSourceFiles(root, entryPath);
  if (entry.isFile() && isSourceFile(entry.name)) return [toProjectPath(root, entryPath)];
  return [];
}

async function sortedEntries(directory: string): Promise<Dirent[]> {
  return (await readdir(directory, { withFileTypes: true })).toSorted((left, right) => left.name.localeCompare(right.name));
}

async function gitLines(projectPath: ProjectPath, args: string[]): Promise<string[]> {
  try {
    const { stdout } = await execFileAsync("git", ["-C", projectPath, ...args]);
    return stdout.split("\n").map((line) => line.trim()).filter(Boolean);
  } catch {
    return [];
  }
}

async function readImportsByFile(projectPath: ProjectPath, files: string[]): Promise<Map<string, string[]>> {
  const knownFiles = new Set(files);
  const entries = await Promise.all(files.map(async (file) => [file, await readImports(projectPath, file, knownFiles)] as const));
  return new Map(entries);
}

async function readImports(projectPath: ProjectPath, file: string, knownFiles: Set<string>): Promise<string[]> {
  try {
    const source = await readFile(path.join(projectPath, file), "utf8");
    return resolveImports(file, source, knownFiles);
  } catch {
    return [];
  }
}

function resolveImports(file: string, source: string, knownFiles: Set<string>): string[] {
  return Array.from(source.matchAll(IMPORT_PATTERN), (match) => match[1] ?? match[2])
    .flatMap((specifier) => resolveSpecifier(file, specifier, knownFiles))
    .sort((left, right) => left.localeCompare(right));
}

function resolveSpecifier(file: string, specifier: string, knownFiles: Set<string>): string[] {
  const importPath = importPathForSpecifier(file, specifier);
  if (importPath === undefined) return [];
  return candidatePaths(importPath).filter((candidate) => knownFiles.has(candidate));
}

function importPathForSpecifier(file: string, specifier: string): string | undefined {
  if (specifier.startsWith("$lib/")) return normalizePath(path.join("src/lib", specifier.slice(5)));
  if (specifier.startsWith(".")) return normalizePath(path.join(path.dirname(file), specifier));
  return undefined;
}

function candidatePaths(importPath: string): string[] {
  return RESOLVABLE_EXTENSIONS.flatMap((extension) => [importPath + extension, `${importPath}/index${extension}`]);
}

function isIgnoredEntry(entry: Dirent): boolean {
  return entry.isDirectory() && (IGNORED_DIRECTORIES.has(entry.name) || entry.name.startsWith("."));
}

function toProjectPath(root: string, filePath: string): string {
  return path.relative(root, filePath).split(path.sep).join("/");
}

function normalizePath(filePath: string): string {
  return filePath.split(path.sep).join("/");
}

function isSourceFile(file: string): boolean {
  return /\.(ts|tsx|js|jsx|svelte)$/.test(file);
}
