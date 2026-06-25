import { browser } from "$app/environment";
import { readable, type Subscriber, type Unsubscriber } from "svelte/store";
import { viewportBreakpoints, type ViewportMode } from "$lib/infrastructure/inbound/browser/viewportModeCore";
export { viewportBreakpoints, viewportModeFromWidth, type ViewportMode } from "$lib/infrastructure/inbound/browser/viewportModeCore";

export const viewportMode = readable<ViewportMode>("desktop", (set) => {
  if (!browser) return;

  return listenForViewportMode(set);
});

function listenForViewportMode(set: Subscriber<ViewportMode>): Unsubscriber {
  const mobileQuery = window.matchMedia(`(max-width: ${viewportBreakpoints.mobileMax}px)`);
  const tabletQuery = window.matchMedia(tabletQueryText());
  const update = () => set(modeFromQueries(mobileQuery, tabletQuery));

  addViewportModeListeners(mobileQuery, tabletQuery, update);
  update();

  return () => removeViewportModeListeners(mobileQuery, tabletQuery, update);
}

function tabletQueryText(): string {
  return `(min-width: ${viewportBreakpoints.mobileMax + 1}px) and (max-width: ${viewportBreakpoints.tabletMax}px)`;
}

function modeFromQueries(mobileQuery: MediaQueryList, tabletQuery: MediaQueryList): ViewportMode {
  if (mobileQuery.matches) return "mobile";
  if (tabletQuery.matches) return "tablet";
  return "desktop";
}

function addViewportModeListeners(mobileQuery: MediaQueryList, tabletQuery: MediaQueryList, update: () => void) {
  mobileQuery.addEventListener("change", update);
  tabletQuery.addEventListener("change", update);
}

function removeViewportModeListeners(mobileQuery: MediaQueryList, tabletQuery: MediaQueryList, update: () => void) {
  mobileQuery.removeEventListener("change", update);
  tabletQuery.removeEventListener("change", update);
}
