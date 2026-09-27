#!/usr/bin/env node
/**
 * TEA UI — per-package tsconfig generation.
 *
 * The root `tsconfig.json` is for type-checking and for the editor: it covers
 * every package *and* the tests. A build, though, has a different job — it must
 * emit declarations for the published surface only, without dragging
 * `@testing-library/jest-dom`'s matchers into a package's `.d.ts`.
 *
 * Generating the per-package config here keeps one source of truth (the root
 * config's paths) while giving each build its own `include`/`exclude`.
 */
import { readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const template = (name) => ({
  extends: "../../tsconfig.base.json",
  compilerOptions: {
    noEmit: true,
    baseUrl: "../..",
    types: [],
  },
  include: ["src"],
  exclude: ["src/**/__tests__/**", "src/**/*.test.ts", "src/**/*.test.tsx"],
  teaUiPackage: name,
});

const entries = (await readdir(resolve(root, "packages"), { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

for (const name of entries) {
  const target = resolve(root, "packages", name, "tsconfig.json");
  const manifest = JSON.parse(
    await readFile(resolve(root, "packages", name, "package.json"), "utf8"),
  );
  // tsup reads `tsconfig.json` for declaration generation, so the paths from the
  // root config are inherited rather than duplicated.
  const config = {
    ...template(manifest.name),
    compilerOptions: {
      ...template(manifest.name).compilerOptions,
      paths: {
        "@tea-ui/utils": ["./packages/utils/src/index.ts"],
        "@tea-ui/tokens": ["./packages/tokens/src/index.ts"],
        "@tea-ui/ux-standards": ["./packages/ux-standards/src/index.ts"],
        "@tea-ui/icons": ["./packages/icons/src/index.ts"],
        "@tea-ui/core": ["./packages/core/src/index.ts"],
        "@tea-ui/admin": ["./packages/admin/src/index.ts"],
        "@tea-ui/public": ["./packages/public/src/index.ts"],
        "@tea-ui/patterns": ["./packages/patterns/src/index.ts"],
        "@tea-ui/templates": ["./packages/templates/src/index.ts"],
        "@tea-ui/blueprints": ["./packages/blueprints/src/index.ts"],
        "@tea-ui/specialized": ["./packages/specialized/src/index.ts"],
      },
    },
  };
  delete config.teaUiPackage;
  await writeFile(target, `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

console.log(`[tea-ui] tsconfig generated for ${entries.length} packages.`);
