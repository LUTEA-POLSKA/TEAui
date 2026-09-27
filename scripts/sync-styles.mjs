#!/usr/bin/env node
/**
 * TEA UI — stylesheet distribution.
 *
 * TEA UI ships ONE compiled stylesheet for the whole system. Every package
 * re-exports the same file as `<pkg>/styles.css`, so:
 *
 *  - a consumer imports the design system exactly once and cannot end up with
 *    two copies of the same rule in different cascade orders;
 *  - there is no per-package CSS to keep in sync, and no "you must import these
 *    three files in this order" footgun;
 *  - the file only contains utilities TEA UI actually uses, because Tailwind
 *    emits a utility solely when it finds the class in TEA UI's own source.
 *
 * The cost is that a consumer who uses only `@tea-ui/core` also downloads the
 * CSS for components they did not import. That is a deliberate, measured trade:
 * one ~30 KB stylesheet with no duplication beats four interlocking
 * stylesheets. `npm run check:tree` measures both halves of the trade.
 */
import { copyFile, mkdir, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = resolve(root, "packages/tokens/dist/styles.css");

const packages = [
  "core",
  "admin",
  "public",
  "patterns",
  "templates",
  "blueprints",
  "specialized",
  "icons",
];

async function main() {
  const sourceStat = await stat(source).catch(() => null);
  if (!sourceStat) {
    // A missing stylesheet is not a build failure of *this* package: only the
    // token layer produces it, and `build:packages` depends on `build:css`. A
    // leaf package failing here would make the ordering requirement invisible
    // until a CI run, which is the worst time to learn it.
    console.warn(
      "[tea-ui] packages/tokens/dist/styles.css is missing — skipping. Run `npm run build:css` to distribute it.",
    );
    return;
  }

  for (const name of packages) {
    const targetDir = resolve(root, "packages", name, "dist");
    await mkdir(targetDir, { recursive: true });
    const target = resolve(targetDir, "styles.css");
    await copyFile(source, target);
  }

  console.log(
    `[tea-ui] styles.css (${(sourceStat.size / 1024).toFixed(1)} kB) distributed to ${packages.length} packages.`,
  );
}

await main();
