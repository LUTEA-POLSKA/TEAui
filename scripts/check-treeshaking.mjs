#!/usr/bin/env node
/**
 * TEA UI — tree-shaking measurement.
 *
 * `sideEffects: false` in a manifest is a claim. This turns it into a
 * measurement, and it measures the case that actually matters: a product that
 * imports **one** component.
 *
 * Method: bundle three tiny entry points with esbuild and compare.
 *   1. `import { Button } from "@tea-ui/core"`  — the real-world case
 *   2. `import * as Core from "@tea-ui/core"`     — the pathological case
 *   3. the same Button import, with `minify: false`, for the raw count
 *
 * If (1) is not dramatically smaller than (2), the package is not actually
 * shakeable and `sideEffects: false` is a lie in a manifest.
 */
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { gzipSync } from "node:zlib";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const core = resolve(root, "packages/core/dist/index.js");

const work = await mkdtemp(join(tmpdir(), "tea-treeshake-"));

const ENTRIES = {
  "one component": `import { Button } from ${JSON.stringify(core)}; globalThis.x = Button;`,
  "two components": `import { Button, Field, Input } from ${JSON.stringify(core)}; globalThis.x = [Button, Field, Input];`,
  "the whole package": `import * as Core from ${JSON.stringify(core)}; globalThis.x = Core;`,
};

const results = {};

for (const [label, source] of Object.entries(ENTRIES)) {
  const entry = join(work, "entry.js");
  await writeFile(entry, source, "utf8");
  const out = await build({
    entryPoints: [entry],
    bundle: true,
    minify: true,
    format: "esm",
    write: false,
    target: "es2022",
    platform: "browser",
    external: ["react", "react-dom", "react/jsx-runtime"],
  });
  const code = out.outputFiles[0]?.contents ?? Buffer.alloc(0);
  results[label] = { raw: code.length, gzip: gzipSync(code).length };
}

await rm(work, { recursive: true, force: true });

const kb = (value) => `${(value / 1024).toFixed(1).padStart(6)} kB`;

console.log("[tea-ui] tree-shaking of @tea-ui/core (react externalised):\n");
for (const [label, { raw, gzip }] of Object.entries(results)) {
  console.log(`  ${label.padEnd(20)} ${kb(raw)} raw   ${kb(gzip)} gzip`);
}

const one = results["one component"].gzip;
const whole = results["the whole package"].gzip;
const ratio = one / whole;

console.log(
  `\n  one component costs ${(ratio * 100).toFixed(1)} % of the whole package, gzip.`,
);

if (ratio > 0.35) {
  console.error(
    "\n  FAIL: importing a single component retains more than a third of the package.\n" +
      "  `sideEffects: false` is not doing its job. Look for module-level side effects,\n" +
      "  a barrel that pulls in every component, or a package that is not ESM.",
  );
  process.exitCode = 1;
} else {
  console.log("  OK: the package is genuinely shakeable.");
}
