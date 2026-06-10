#!/usr/bin/env bun

import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const SRC_ROOT = path.join(ROOT, "src");
const CHECKED_EXTENSIONS = new Set([".js", ".jsx", ".ts", ".tsx", ".svelte"]);

type Layer = "routes" | "components" | "application" | "domain" | "infrastructure" | "other";

type ImportRecord = {
  specifier: string;
  line: number;
};

type Violation = {
  file: string;
  line: number;
  importSpecifier?: string;
  rule: string;
  message: string;
};

const nodeRuntimeModules = new Set([
  "node:fs",
  "node:fs/promises",
  "fs",
  "fs/promises",
  "node:path",
  "path",
  "node:process",
  "process",
  "node:os",
  "os",
  "node:http",
  "node:https",
  "http",
  "https",
  "node:net",
  "net",
  "node:tls",
  "tls",
  "node:child_process",
  "child_process",
]);

const uiFrameworkModules = ["svelte", "@sveltejs/kit", "react", "react-dom"];
const svelteKitRuntimePrefixes = ["$app/", "$env/"];

function toPosix(value: string): string {
  return value.split(path.sep).join("/");
}

function relativeFile(file: string): string {
  return toPosix(path.relative(ROOT, file));
}

function layerForFile(file: string): Layer {
  const rel = relativeFile(file);

  if (rel === "src/routes.ts" || rel.startsWith("src/routes/")) return "routes";
  if (rel.startsWith("src/lib/components/")) return "components";
  if (rel.startsWith("src/lib/application/")) return "application";
  if (rel.startsWith("src/lib/domain/")) return "domain";
  if (rel.startsWith("src/lib/infrastructure/")) return "infrastructure";

  return "other";
}

function layerForImport(specifier: string, importerFile: string): Layer | "external" {
  const normalized = normalizeImportPath(specifier, importerFile);

  if (normalized === undefined) return "external";
  if (normalized === "src/routes.ts" || normalized.startsWith("src/routes/")) return "routes";
  if (normalized.startsWith("src/lib/components/")) return "components";
  if (normalized.startsWith("src/lib/application/")) return "application";
  if (normalized.startsWith("src/lib/domain/")) return "domain";
  if (normalized.startsWith("src/lib/infrastructure/")) return "infrastructure";

  return "other";
}

function normalizeImportPath(specifier: string, importerFile: string): string | undefined {
  if (specifier.startsWith("$lib/")) return `src/lib/${specifier.slice("$lib/".length)}`;
  if (specifier.startsWith("src/")) return specifier;
  if (specifier.startsWith("/src/")) return specifier.slice(1);

  if (specifier.startsWith(".")) {
    const resolved = path.normalize(path.join(path.dirname(importerFile), specifier));
    const relative = relativeFile(resolved);
    return relative.startsWith("src/") ? relative : undefined;
  }

  return undefined;
}

function importsFromInfrastructureOutbound(specifier: string, importerFile: string): boolean {
  const normalized = normalizeImportPath(specifier, importerFile);
  return normalized?.startsWith("src/lib/infrastructure/outbound/") === true;
}

function isUiFrameworkImport(specifier: string): boolean {
  return uiFrameworkModules.some((moduleName) => specifier === moduleName || specifier.startsWith(`${moduleName}/`));
}

function isSvelteKitRuntimeImport(specifier: string): boolean {
  return svelteKitRuntimePrefixes.some((prefix) => specifier.startsWith(prefix));
}

function isNodeRuntimeImport(specifier: string): boolean {
  return nodeRuntimeModules.has(specifier) || specifier.startsWith("node:");
}

function isAgentRelated(value: string): boolean {
  return /(^|[/_-])agents?($|[/_.-])/i.test(value);
}

function isAllowedAgentPanelPath(value: string): boolean {
  return value === "src/lib/components/AgentPanel.svelte";
}

function isAllowedAgentPanelImport(specifier: string, importerFile: string): boolean {
  const normalized = normalizeImportPath(specifier, importerFile);
  return normalized !== undefined && isAllowedAgentPanelPath(normalized);
}

function featureForPath(value: string): "agent" | "details" | "epic" | "graph" | "kanban" | undefined {
  const normalized = value.toLowerCase();
  if (/(^|[/_-])agents?($|[/_.-])/.test(normalized)) return "agent";
  if (/(^|[/_-])details?($|[/_.-])/.test(normalized)) return "details";
  if (/(^|[/_-])epics?($|[/_.-])/.test(normalized)) return "epic";
  if (/(^|[/_-])graph($|[/_.-])/.test(normalized)) return "graph";
  if (/(^|[/_-])kanban($|[/_.-])/.test(normalized)) return "kanban";
  return undefined;
}

function applicationUseCaseName(file: string): string | undefined {
  const rel = relativeFile(file);
  if (!rel.startsWith("src/lib/application/")) return undefined;
  return path.basename(rel, path.extname(rel));
}

async function listSourceFiles(directory: string): Promise<string[]> {
  if (!existsSync(directory)) return [];

  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);

      if (entry.isDirectory()) return listSourceFiles(entryPath);
      if (entry.isFile() && CHECKED_EXTENSIONS.has(path.extname(entry.name))) return [entryPath];
      return [];
    }),
  );

  return files.flat();
}

function importsInSource(source: string): ImportRecord[] {
  const imports: ImportRecord[] = [];
  const importPattern = /(?:import|export)\s+(?:type\s+)?(?:[\s\S]*?\s+from\s+)?["']([^"']+)["']|import\s*\(\s*["']([^"']+)["']\s*\)/g;

  for (const match of source.matchAll(importPattern)) {
    const specifier = match[1] ?? match[2];
    const offset = match.index ?? 0;
    const line = source.slice(0, offset).split("\n").length;
    imports.push({ specifier, line });
  }

  return imports;
}

function violation(file: string, line: number, rule: string, message: string, importSpecifier?: string): Violation {
  return { file: relativeFile(file), line, rule, message, importSpecifier };
}

function checkImport(file: string, layer: Layer, imported: ImportRecord): Violation[] {
  const importedLayer = layerForImport(imported.specifier, file);
  const normalizedImport = normalizeImportPath(imported.specifier, file);
  const violations: Violation[] = [];

  if (isAgentRelated(imported.specifier) && !isAllowedAgentPanelImport(imported.specifier, file)) {
    violations.push(
      violation(file, imported.line, "no-agent-imports", "Quincy only allows the bounded Agent panel shell at this stage. Do not import agent runtime or unrelated agent code; create a neutral app-event adapter instead if this behavior is still needed.", imported.specifier),
    );
  }

  if (layer === "domain") {
    if (["routes", "components", "application", "infrastructure"].includes(importedLayer)) {
      violations.push(
        violation(
          file,
          imported.line,
          "domain-isolation",
          "We want the domain to contain the stable business rules without knowing how they are delivered, displayed, or persisted. Domain code must not import routes, components, application use cases, or infrastructure adapters. Move orchestration outward into an application use case, and keep only pure domain types/rules here.",
          imported.specifier,
        ),
      );
    }

    if (isUiFrameworkImport(imported.specifier) || isSvelteKitRuntimeImport(imported.specifier) || isNodeRuntimeImport(imported.specifier)) {
      violations.push(
        violation(
          file,
          imported.line,
          "domain-runtime-independence",
          "We want domain code to run anywhere and be testable without SvelteKit, the browser, Node filesystem APIs, or HTTP. Keep runtime details at the edges; pass plain values into pure domain functions instead of importing framework or server modules here.",
          imported.specifier,
        ),
      );
    }
  }

  if (layer === "application") {
    if (importedLayer === "application") {
      violations.push(
        violation(
          file,
          imported.line,
          "application-use-cases-do-not-compose-use-cases",
          "We want each application file to represent one clear use case. Do not compose application use cases from another application use case; compose multiple use cases in an inbound adapter or route loader instead.",
          imported.specifier,
        ),
      );
    }

    const importerFeature = featureForPath(applicationUseCaseName(file) ?? "");
    const importedFeature = featureForPath(normalizedImport ?? imported.specifier);
    if (importerFeature !== undefined && importedFeature !== undefined && importerFeature !== importedFeature) {
      violations.push(
        violation(
          file,
          imported.line,
          "application-feature-boundary",
          `We want use cases to stay focused on their feature. A ${importerFeature} use case must not import ${importedFeature} feature code; move shared logic into neutral domain code or compose separate use cases in inbound infrastructure.`,
          imported.specifier,
        ),
      );
    }

    if (["routes", "components", "infrastructure"].includes(importedLayer)) {
      violations.push(
        violation(
          file,
          imported.line,
          "application-boundary",
          "We want application use cases to orchestrate domain behavior through ports without depending on delivery mechanisms or concrete adapters. Do not import routes, UI components, or infrastructure here; define/use a domain port and inject the concrete adapter from an inbound composition point.",
          imported.specifier,
        ),
      );
    }

    if (imported.specifier === "@sveltejs/kit" || isSvelteKitRuntimeImport(imported.specifier)) {
      violations.push(
        violation(file, imported.line, "application-no-route-runtime", "We want application use cases to be callable from SvelteKit, tests, CLI tools, or future adapters. Do not depend on SvelteKit request/runtime objects directly; translate framework objects into plain inputs before calling the use case.", imported.specifier),
      );
    }
  }

  if (layer === "components") {
    if (importsFromInfrastructureOutbound(imported.specifier, file)) {
      violations.push(
        violation(file, imported.line, "components-no-outbound-adapters", "We want Svelte components to render state and emit user intent, not perform persistence or filesystem work. Do not import outbound infrastructure adapters directly; load or mutate data through a route/inbound adapter and pass plain props/state into the component.", imported.specifier),
      );
    }

    if (isNodeRuntimeImport(imported.specifier)) {
      violations.push(
        violation(file, imported.line, "components-browser-safe", "We want components to stay browser-safe and reusable. Filesystem, process, and server runtime APIs belong behind server routes or infrastructure adapters; pass the resulting data into the component instead.", imported.specifier),
      );
    }
  }

  if (layer === "routes" && importedLayer === "domain") {
    violations.push(
      violation(file, imported.line, "routes-stay-thin", "We want SvelteKit routes to stay thin composition roots, not places where domain decisions accumulate. Do not import domain directly from routes; call an application use case or an inbound infrastructure adapter that performs the composition.", imported.specifier),
    );
  }

  if (layer === "routes" && importsFromInfrastructureOutbound(imported.specifier, file)) {
    violations.push(
      violation(file, imported.line, "routes-no-outbound-adapters", "We want routes to describe SvelteKit delivery concerns while adapter wiring lives in inbound infrastructure. Do not import outbound adapters directly from routes; create an inbound page/API adapter that wires config, repositories, and application use cases, then call that adapter from the route.", imported.specifier),
    );
  }

  return violations;
}

function checkFilePath(file: string): Violation[] {
  const rel = relativeFile(file);
  if (!isAgentRelated(rel) || isAllowedAgentPanelPath(rel)) return [];

  return [
    violation(file, 1, "no-agent-files", "Quincy only allows the bounded Agent panel shell at this stage. Agent-related source files expand the scope and blur the architecture; keep this code out of src unless a ticket explicitly introduces the boundary."),
  ];
}

async function run(): Promise<number> {
  const files = await listSourceFiles(SRC_ROOT);
  const violations: Violation[] = [];

  for (const file of files) {
    const layer = layerForFile(file);
    const source = await readFile(file, "utf8");

    violations.push(...checkFilePath(file));

    for (const imported of importsInSource(source)) {
      violations.push(...checkImport(file, layer, imported));
    }
  }

  if (violations.length === 0) {
    console.log(`Architecture sensors passed (${files.length} source file${files.length === 1 ? "" : "s"} checked).`);
    return 0;
  }

  console.error(`Architecture sensors found ${violations.length} violation${violations.length === 1 ? "" : "s"}:`);

  for (const item of violations) {
    const imported = item.importSpecifier === undefined ? "" : ` import ${JSON.stringify(item.importSpecifier)}`;
    console.error(`- ${item.file}:${item.line}${imported} [${item.rule}] ${item.message}`);
  }

  return 1;
}

process.exit(await run());
