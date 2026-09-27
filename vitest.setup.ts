/**
 * TEA UI — test setup.
 *
 * `jest-dom` matchers give the assertions their teeth: `toHaveAccessibleName`
 * and `toHaveAccessibleDescription` are the ones that actually catch the class of
 * defect the audit found dozens of, and they are far more meaningful than
 * snapshotting a class string.
 */
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
});

/**
 * jsdom implements neither of these, and several components observe them. A
 * missing stub produces a test that passes for the wrong reason, which is worse
 * than a test that fails.
 */
if (!globalThis.matchMedia) {
  globalThis.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as typeof globalThis.matchMedia;
}

if (!("ResizeObserver" in globalThis)) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}

if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = function scrollIntoView() {};
}
