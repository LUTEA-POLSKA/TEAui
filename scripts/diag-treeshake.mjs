import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const core = resolve(root, "packages/core/dist/index.js");
const work = await mkdtemp(join(tmpdir(), "tea-diag-"));
const entry = join(work, "entry.js");
await writeFile(entry, `import { Button } from ${JSON.stringify(core)}; globalThis.x = Button;`, "utf8");

const out = await build({
  entryPoints: [entry],
  bundle: true,
  minify: true,
  format: "esm",
  write: false,
  metafile: true,
  target: "es2022",
  platform: "browser",
  external: ["react", "react-dom", "react/jsx-runtime"],
});

const first = Object.values(out.metafile.outputs)[0];
const inputs = Object.entries(first.inputs)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 25);

console.log("largest contributors to a single-Button bundle:\n");
for (const [file, bytes] of inputs) {
  console.log(`  ${(bytes / 1024).toFixed(1).padStart(7)} kB  ${file.replace(root, ".")}`);
}
