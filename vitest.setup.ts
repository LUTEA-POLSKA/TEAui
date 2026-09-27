/**
 * TEA UI — test setup.
 *
 * `jest-dom` matchers give the assertions their teeth: `toHaveAccessibleName`
 * and `toHaveAccessibleDescription` are the ones that actually catch the class of
 * defect the audit found dozens of, and they are far more meaningful than
 * snapshotting a class string.
 *
 * This file is loaded for every test, including the ones that declare
 * `// @vitest-environment node` to test the build tooling. Those have no DOM, so
 * the DOM stubs below guard on it — a build-tooling test should not have to pay
 * for a browser, and should not fail merely for lacking one.
 */
import { afterEach } from "vitest";

if (typeof document !== "undefined") {
  await import("@testing-library/jest-dom/vitest");
  const { cleanup } = await import("@testing-library/react");
  afterEach(() => {
    cleanup();
  });
}

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

if (typeof Element !== "undefined" && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = function scrollIntoView() {};
}
