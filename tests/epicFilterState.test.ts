/// <reference types="bun" />

import { afterEach, describe, expect, test } from "bun:test";
import {
  defaultEpicFilterState,
  normalizeEpicFilterState,
  parsePersistedEpicFilterState,
  persistEpicFilterState,
  readPersistedEpicFilterState,
} from "$lib/infrastructure/inbound/browser/epicFilterState";

describe("epic filter state persistence", () => {
  afterEach(() => {
    Reflect.deleteProperty(globalThis, "localStorage");
  });

  test("uses defaults when no persisted state exists", () => {
    expect(parsePersistedEpicFilterState(null)).toEqual(defaultEpicFilterState);
  });

  test("normalizes persisted state", () => {
    const state = normalizeEpicFilterState({
      scope: "selected",
      selectedEpicIds: ["qui-b", "", "qui-a", "qui-b"],
      statusVisibility: "all",
    });

    expect(state).toEqual({ scope: "selected", selectedEpicIds: ["qui-a", "qui-b"], statusVisibility: "all" });
  });

  test("falls back to defaults for invalid persisted state", () => {
    const state = parsePersistedEpicFilterState(JSON.stringify({
      scope: "missing",
      selectedEpicIds: ["qui-a"],
      statusVisibility: "bad",
    }));

    expect(state).toEqual({ ...defaultEpicFilterState, selectedEpicIds: ["qui-a"] });
  });

  test("falls back to defaults when persisted state cannot be read", () => {
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: { getItem: () => { throw new Error("storage unavailable"); } },
    });

    expect(readPersistedEpicFilterState()).toEqual(defaultEpicFilterState);
  });

  test("ignores storage write failures", () => {
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: { setItem: () => { throw new Error("quota exceeded"); } },
    });

    expect(() => persistEpicFilterState({ scope: "selected", selectedEpicIds: ["qui-a"], statusVisibility: "all" })).not.toThrow();
  });
});
