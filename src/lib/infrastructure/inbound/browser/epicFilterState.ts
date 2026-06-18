import { writable } from "svelte/store";

export type EpicFilterScope = "all" | "epics" | "selected";
export type EpicFilterStatusVisibility = "open" | "all";

export interface EpicFilterState {
  scope: EpicFilterScope;
  selectedEpicIds: string[];
  statusVisibility: EpicFilterStatusVisibility;
}

export const defaultEpicFilterState: EpicFilterState = {
  scope: "all",
  selectedEpicIds: [],
  statusVisibility: "open",
};

const storageKey = "quincy.epicFilterState";
const scopeValues = new Set<EpicFilterScope>(["all", "epics", "selected"]);
const statusVisibilityValues = new Set<EpicFilterStatusVisibility>(["open", "all"]);

export const epicFilterState = writable<EpicFilterState>(readPersistedEpicFilterState());

if (hasLocalStorage()) {
  epicFilterState.subscribe(persistEpicFilterState);
}

export function setEpicFilterScope(scope: EpicFilterScope) {
  epicFilterState.update((state) => ({ ...state, scope }));
}

export function setEpicFilterStatusVisibility(statusVisibility: EpicFilterStatusVisibility) {
  epicFilterState.update((state) => ({ ...state, statusVisibility }));
}

export function setSelectedEpicIds(selectedEpicIds: string[]) {
  epicFilterState.update((state) => ({ ...state, selectedEpicIds: normalizedSelectedEpicIds(selectedEpicIds) }));
}

export function parsePersistedEpicFilterState(value: string | null): EpicFilterState {
  if (value === null) return defaultEpicFilterState;

  try {
    return normalizeEpicFilterState(JSON.parse(value));
  } catch {
    return defaultEpicFilterState;
  }
}

export function normalizeEpicFilterState(value: unknown): EpicFilterState {
  if (!isRecord(value)) return defaultEpicFilterState;

  return {
    scope: isEpicFilterScope(value.scope) ? value.scope : defaultEpicFilterState.scope,
    selectedEpicIds: Array.isArray(value.selectedEpicIds) ? normalizedSelectedEpicIds(value.selectedEpicIds) : defaultEpicFilterState.selectedEpicIds,
    statusVisibility: isEpicFilterStatusVisibility(value.statusVisibility) ? value.statusVisibility : defaultEpicFilterState.statusVisibility,
  };
}

export function readPersistedEpicFilterState(): EpicFilterState {
  if (!hasLocalStorage()) return defaultEpicFilterState;

  try {
    return parsePersistedEpicFilterState(localStorage.getItem(storageKey));
  } catch {
    return defaultEpicFilterState;
  }
}

export function persistEpicFilterState(state: EpicFilterState) {
  if (!hasLocalStorage()) return;

  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
  } catch {
    // Ignore persistence failures so browser storage issues do not break app state.
  }
}

function normalizedSelectedEpicIds(values: unknown[]): string[] {
  return Array.from(new Set(values.filter((value): value is string => typeof value === "string" && value.length > 0))).sort();
}

function isEpicFilterScope(value: unknown): value is EpicFilterScope {
  return typeof value === "string" && scopeValues.has(value as EpicFilterScope);
}

function isEpicFilterStatusVisibility(value: unknown): value is EpicFilterStatusVisibility {
  return typeof value === "string" && statusVisibilityValues.has(value as EpicFilterStatusVisibility);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function hasLocalStorage() {
  try {
    return typeof localStorage !== "undefined";
  } catch {
    return false;
  }
}
