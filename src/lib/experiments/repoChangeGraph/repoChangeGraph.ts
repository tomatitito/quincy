import { deriveGraph, type GraphDerivation } from "$lib/domain/graph";

export interface RepoChangeNode {
  id: string;
  path: string;
  deps: string[];
  changed: boolean;
}

export interface RepoChangeGraphView {
  nodes: RepoChangeNode[];
  graph: GraphDerivation;
}

export function deriveRepoChangeGraph(changedFiles: string[], importsByFile: Map<string, string[]>): RepoChangeGraphView {
  const changed = new Set(changedFiles.toSorted((left, right) => left.localeCompare(right)));
  const included = connectedChangedFiles(changed, importsByFile);
  const nodes = Array.from(included, (file) => ({ id: file, path: file, deps: includedImports(file, included, importsByFile), changed: changed.has(file) }));
  return { nodes, graph: deriveGraph(nodes) };
}

function connectedChangedFiles(changed: Set<string>, importsByFile: Map<string, string[]>): Set<string> {
  const included = new Set(changed);
  for (const file of changed) includeConnectingPaths(file, changed, importsByFile, included, new Set([file]));
  return included;
}

function includeConnectingPaths(file: string, changed: Set<string>, importsByFile: Map<string, string[]>, included: Set<string>, path: Set<string>): boolean {
  let connectsToChangedFile = false;
  for (const dependency of importsByFile.get(file) ?? []) {
    if (!dependencyConnects(dependency, changed, importsByFile, included, path)) continue;
    included.add(dependency);
    connectsToChangedFile = true;
  }
  return connectsToChangedFile;
}

function dependencyConnects(dependency: string, changed: Set<string>, importsByFile: Map<string, string[]>, included: Set<string>, path: Set<string>): boolean {
  if (path.has(dependency)) return false;
  return changed.has(dependency) || includeConnectingPaths(dependency, changed, importsByFile, included, new Set([...path, dependency]));
}

function includedImports(file: string, included: Set<string>, importsByFile: Map<string, string[]>): string[] {
  return Array.from(new Set(importsByFile.get(file) ?? []))
    .filter((dependency) => included.has(dependency))
    .sort((left, right) => left.localeCompare(right));
}
