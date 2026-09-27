import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * TEA UI — typography dependency check.
 *
 * The three families are declared by `packages/tokens` and resolved by the
 * font build. This script exists so a missing family fails the build with a
 * sentence that says what to do, instead of a bundler error that says
 * "ENOENT ... @fontsource-variable/jost".
 */
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const REQUIRED = [
  "@fontsource-variable/jost",
  "@fontsource-variable/jetbrains-mono",
  "@fontsource/lilita-one",
];

const manifest = JSON.parse(await readFile(resolve(root, "packages/tokens/package.json"), "utf8"));
const declared = new Set([
  ...Object.keys(manifest.dependencies ?? {}),
  ...Object.keys(manifest.devDependencies ?? {}),
]);

const missing = REQUIRED.filter((name) => !declared.has(name));

if (missing.length > 0) {
  console.error(
    `[tea-ui] packages/tokens is missing a typeface dependency:\n  ${missing.join("\n  ")}\n` +
      `Run: npm install -w @tea-ui/tokens ${missing.join(" ")}`,
  );
  process.exitCode = 1;
} else {
  const target = resolve(root, "packages/tokens/package.json");
  const next = {
    ...manifest,
    exports: {
      ...manifest.exports,
      "./fonts.css": "./dist/fonts.css",
    },
    scripts: {
      ...manifest.scripts,
      "build:css":
        "tailwindcss -i ./src/index.css -o ./dist/styles.css --minify && tailwindcss -i ./src/fonts.css -o ./dist/fonts.css --minify",
    },
  };
  await writeFile(target, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  console.log("[tea-ui] typefaces declared; fonts.css export added.");
}
