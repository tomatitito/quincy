/// <reference types="bun" />

import { describe, expect, test } from "bun:test";
import { containedFocusIndex, isBackdropPointerEvent } from "$lib/components/agentPanelMobileSheet";

describe("agent panel mobile sheet focus containment", () => {
  test("wraps Tab from last focusable item to first", () => {
    expect(containedFocusIndex(2, 3, false)).toBe(0);
  });

  test("wraps Shift+Tab from first focusable item to last", () => {
    expect(containedFocusIndex(0, 3, true)).toBe(2);
  });

  test("keeps normal tab order inside dialog", () => {
    expect(containedFocusIndex(1, 3, false)).toBeUndefined();
    expect(containedFocusIndex(1, 3, true)).toBeUndefined();
  });

  test("handles empty dialog without focusing outside", () => {
    expect(containedFocusIndex(-1, 0, false)).toBeUndefined();
  });

  test("treats only direct backdrop pointer events as dismissals", () => {
    const backdrop = new EventTarget();
    const sheet = new EventTarget();

    expect(isBackdropPointerEvent({ currentTarget: backdrop, target: backdrop } as PointerEvent)).toBe(true);
    expect(isBackdropPointerEvent({ currentTarget: backdrop, target: sheet } as PointerEvent)).toBe(false);
  });
});
