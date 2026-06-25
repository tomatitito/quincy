export const viewportBreakpoints = {
  mobileMax: 767,
  tabletMax: 1199,
} as const;

export type ViewportMode = "mobile" | "tablet" | "desktop";

export function viewportModeFromWidth(width: number): ViewportMode {
  if (width <= viewportBreakpoints.mobileMax) return "mobile";
  if (width <= viewportBreakpoints.tabletMax) return "tablet";
  return "desktop";
}
