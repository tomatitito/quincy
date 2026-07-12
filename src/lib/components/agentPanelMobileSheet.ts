export function isVisibleElement(element: HTMLElement | undefined): element is HTMLElement {
  if (element === undefined) return false;
  const style = getComputedStyle(element);
  if (style.display === "none" || style.visibility === "hidden") return false;
  return element.getClientRects().length > 0;
}

export function focusableElements(container: HTMLElement | undefined): HTMLElement[] {
  if (container === undefined) return [];
  return Array.from(container.querySelectorAll<HTMLElement>(focusableSelector())).filter(isFocusableElement);
}

export function containedFocusIndex(currentIndex: number, count: number, shiftKey: boolean): number | undefined {
  if (count === 0) return undefined;
  if (shiftKey && currentIndex <= 0) return count - 1;
  if (!shiftKey && (currentIndex === -1 || currentIndex >= count - 1)) return 0;
  return undefined;
}

export function containTabFocus(event: KeyboardEvent, container: HTMLElement | undefined) {
  if (event.key !== "Tab") return;
  const focusable = focusableElements(container);
  const nextIndex = containedFocusIndex(focusable.indexOf(document.activeElement as HTMLElement), focusable.length, event.shiftKey);
  if (nextIndex === undefined) return;
  event.preventDefault();
  focusable[nextIndex]?.focus();
}

export function isBackdropPointerEvent(event: Pick<PointerEvent, "currentTarget" | "target">): boolean {
  return event.currentTarget === event.target;
}

function focusableSelector(): string {
  return [
    "a[href]",
    "button:not([disabled])",
    "textarea:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "[tabindex]:not([tabindex='-1'])",
  ].join(",");
}

function isFocusableElement(element: HTMLElement): boolean {
  if (element.hasAttribute("disabled") || element.getAttribute("aria-hidden") === "true") return false;
  return isVisibleElement(element);
}
