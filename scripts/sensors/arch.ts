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
  const violations: Violation[] = [];

  if (isAgentRelated(imported.specifier)) {
    violations.push(
      violation(file, imported.line, "no-agent-imports", "Agent-related imports are out of scope for the Quincy rebuild.", imported.specifier),
    );
  }

  if (layer === "domain") {
    if (["routes", "components", "application", "infrastructure"].includes(importedLayer)) {
      violations.push(
        violation(
          file,
          imported.line,
          "domain-isolation",
          "Domain code must not import routes, components, application use cases, or infrastructure adapters.",
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
          "Domain code must stay independent of UI frameworks, SvelteKit runtime modules, filesystem/process APIs, and HTTP/server modules.",
          imported.specifier,
        ),
      );
    }
  }

  if (layer === "application") {
    if (["routes", "components", "infrastructure"].includes(importedLayer)) {
      violations.push(
        violation(
          file,
          imported.line,
          "application-boundary",
          "Application use cases may depend on domain code and ports, but not routes, UI components, or concrete infrastructure.",
          imported.specifier,
        ),
      );
    }

    if (imported.specifier === "@sveltejs/kit" || isSvelteKitRuntimeImport(imported.specifier)) {
      violations.push(
        violation(file, imported.line, "application-no-route-runtime", "Application use cases must not depend on SvelteKit request/runtime objects directly.", imported.specifier),
      );
    }
  }

  if (layer === "components") {
    if (importsFromInfrastructureOutbound(imported.specifier, file)) {
      violations.push(
        violation(file, imported.line, "components-no-outbound-adapters", "Components must not import infrastructure outbound adapters directly.", imported.specifier),
      );
    }

    if (isNodeRuntimeImport(imported.specifier)) {
      violations.push(
        violation(file, imported.line, "components-browser-safe", "Components must not import filesystem/process/server runtime APIs.", imported.specifier),
      );
    }
  }

  if (layer === "routes" && importedLayer === "domain") {
    violations.push(
      violation(file, imported.line, "routes-stay-thin", "Routes should stay thin: call application use cases, the infrastructure inbound HTTP router, or components instead of importing domain directly.", imported.specifier),
    );
  }

  return violations;
}

function checkFilePath(file: string): Violation[] {
  if (!isAgentRelated(relativeFile(file))) return [];

  return [
    violation(file, 1, "no-agent-files", "Agent-related source files are out of scope for the Quincy rebuild."),
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
