#!/usr/bin/env node
/**
 * TEA UI — build artefact inspector.
 *
 * `check-exports.mjs` reports *that* a package's entry point is missing. This
 * reports *what is actually on disk*, so a CI failure names the cause instead
 * of leaving it to be reconstructed from log archaeology.
 *
 * It exists because a real CI failure could not be diagnosed from the check's own
 * output: five packages reported broken, all eleven had logged a successful
 * build. The two facts are only reconcilable by looking at the filesystem.
 */
import { readdir, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const packages = (await readdir(resolve(root, "packages"), { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

async function walk(dir, prefix = "", depth = 0) {
  if (depth > 2) return [];
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  const out = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walk(path, `${prefix}${entry.name}/`, depth + 1)));
    } else {
      const info = await stat(path);
      out.push(`${prefix}${entry.name} (${info.size})`);
    }
  }
  return out;
}

console.log("[tea-ui] build artefacts on disk:\n");

let total = 0;
for (const name of packages) {
  const dist = resolve(root, "packages", name, "dist");
  const info = await stat(dist).catch(() => null);
  if (!info) {
    console.log(`  ${name.padEnd(14)} NO dist/ DIRECTORY`);
    continue;
  }
  const files = await walk(dist);
  total += files.length;
  const hasEntry = files.some((file) => file === "index.js (0)" || file.startsWith("index.js ("));
  const marker = hasEntry ? "ok " : "!! ";
  console.log(`  ${marker}${name.padEnd(14)} ${String(files.length).padStart(3)} files`);
  for (const file of files.slice(0, 8)) console.log(`        ${file}`);
  if (files.length > 8) console.log(`        … ${files.length - 8} more`);
}

console.log(`\n[tea-ui] ${total} files across ${packages.length} packages`);
