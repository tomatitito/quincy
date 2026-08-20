/// <reference types="bun" />

import { statSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { describe, expect, test } from "bun:test";

const require = createRequire(import.meta.url);
const nodePtyRoot = path.resolve(path.dirname(require.resolve("node-pty")), "..");

describe("node-pty package", () => {
  test.each(["arm64", "x64"])("ships executable macOS %s spawn helper", (architecture) => {
    const mode = statSync(path.join(nodePtyRoot, "prebuilds", `darwin-${architecture}`, "spawn-helper")).mode;

    expect(mode & 0o111).not.toBe(0);
  });
});
