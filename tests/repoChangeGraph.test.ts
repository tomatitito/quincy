/// <reference types="bun" />

import { describe, expect, test } from "bun:test";
import { deriveRepoChangeGraph } from "$lib/experiments/repoChangeGraph/repoChangeGraph";

describe("repo change graph", () => {
  test("derives dependency edges only between graph files", () => {
    const view = deriveRepoChangeGraph(
      ["src/app.ts", "src/domain.ts", "src/unchanged-consumer.ts"],
      new Map([
        ["src/app.ts", ["src/domain.ts", "src/external.ts"]],
        ["src/unchanged-consumer.ts", ["src/external.ts"]],
      ]),
    );

    expect(view.nodes).toEqual([
      { id: "src/app.ts", path: "src/app.ts", deps: ["src/domain.ts"], changed: true },
      { id: "src/domain.ts", path: "src/domain.ts", deps: [], changed: true },
      { id: "src/unchanged-consumer.ts", path: "src/unchanged-consumer.ts", deps: [], changed: true },
    ]);
    expect(view.graph.dependencyEdges).toEqual([{ id: "src/domain.ts->src/app.ts", source: "src/domain.ts", target: "src/app.ts" }]);
  });

  test("includes unchanged connectors between changed files", () => {
    const view = deriveRepoChangeGraph(
      ["src/feature.ts", "src/core.ts"],
      new Map([
        ["src/feature.ts", ["src/facade.ts"]],
        ["src/facade.ts", ["src/core.ts"]],
        ["src/noise.ts", ["src/core.ts"]],
      ]),
    );

    expect(view.nodes).toEqual([
      { id: "src/core.ts", path: "src/core.ts", deps: [], changed: true },
      { id: "src/feature.ts", path: "src/feature.ts", deps: ["src/facade.ts"], changed: true },
      { id: "src/facade.ts", path: "src/facade.ts", deps: ["src/core.ts"], changed: false },
    ]);
    expect(view.graph.dependencyEdges).toEqual([
      { id: "src/core.ts->src/facade.ts", source: "src/core.ts", target: "src/facade.ts" },
      { id: "src/facade.ts->src/feature.ts", source: "src/facade.ts", target: "src/feature.ts" },
    ]);
  });
});
