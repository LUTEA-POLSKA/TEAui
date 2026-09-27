import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

/**
 * TEA UI — test configuration.
 *
 * Tests resolve workspace packages from SOURCE, not from `dist`. A component
 * test is a design-system test, and testing the built artefact would mean
 * rebuilding eleven packages before every run.
 *
 * `scripts/check-exports.mjs` covers the other half: that the built packages
 * actually export what they claim, and that importing them costs what we say it
 * costs. Source for tests, dist for the contract.
 */
const pkg = (name: string): string => resolve(import.meta.dirname, "packages", name, "src/index.ts");

export default defineConfig({
  resolve: {
    alias: {
      "@tea-ui/utils": pkg("utils"),
      "@tea-ui/tokens": pkg("tokens"),
      "@tea-ui/ux-standards": pkg("ux-standards"),
      "@tea-ui/icons": pkg("icons"),
      "@tea-ui/core": pkg("core"),
      "@tea-ui/admin": pkg("admin"),
      "@tea-ui/public": pkg("public"),
      "@tea-ui/patterns": pkg("patterns"),
      "@tea-ui/templates": pkg("templates"),
      "@tea-ui/blueprints": pkg("blueprints"),
      "@tea-ui/specialized": pkg("specialized"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: [resolve(import.meta.dirname, "vitest.setup.ts")],
    include: ["packages/*/src/**/*.test.{ts,tsx}", "packages/*/src/**/__tests__/**/*.{ts,tsx}"],
    exclude: ["**/node_modules/**", "**/dist/**"],
    css: false,
    restoreMocks: true,
    coverage: {
      provider: "v8",
      reportsDirectory: "reports/coverage",
      reporter: ["text-summary", "html"],
      exclude: ["**/dist/**", "**/*.test.*", "**/__tests__/**"],
    },
  },
});
