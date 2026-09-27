#!/usr/bin/env node
/**
 * TEA UI — publish every package, in dependency order.
 *
 * Publishing is the only step in this repository that cannot be undone: a version
 * that has been used cannot be reused, even after the package is deleted. So this
 * does the reversible half first — the whole build, then the export contract, then
 * a dry run per package — and only then starts uploading, and it stops at the
 * first failure rather than pushing eleven versions and reporting at the end.
 *
 * The order is the dependency order, not alphabetical. npm does not require a
 * dependency to exist before its dependent is published, but publishing bottom-up
 * means that anything which installs a package while the run is in progress gets
 * a resolvable graph, and a failure halfway leaves the foundation in place rather
 * than the dependents.
 */
import { spawnSync } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dryRun = process.argv.includes("--dry-run");

function run(command, args, label) {
  process.stdout.write(`\n[tea-ui] ${label}\n`);
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit", shell: process.platform === "win32" });
  return result.status === 0;
}

/** Topological order over the packages' declared workspace dependencies. */
const names = (await readdir(resolve(root, "packages"), { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

const manifests = new Map();
for (const name of names) {
  manifests.set(name, JSON.parse(await readFile(resolve(root, "packages", name, "package.json"), "utf8")));
}

const ordered = [];
const seen = new Set();
const visiting = new Set();

function visit(name) {
  if (seen.has(name)) return;
  if (visiting.has(name)) throw new Error(`Cyclic workspace dependency at ${name}`);
  visiting.add(name);
  for (const dependency of Object.keys(manifests.get(name).dependencies ?? {})) {
    if (!dependency.startsWith("@tea-ui/")) continue;
    const target = dependency.slice("@tea-ui/".length);
    if (manifests.has(target)) visit(target);
  }
  visiting.delete(name);
  seen.add(name);
  ordered.push(name);
}

for (const name of names) visit(name);

/* -------------------------------------------------------------------------- */

if (!run("npm", ["run", "build:packages"], "building every package")) process.exit(1);
if (!run("node", ["scripts/check-exports.mjs"], "verifying the export contract")) process.exit(1);
if (!run("node", ["scripts/inspect-dist.mjs"], "inspecting the artefacts")) process.exit(1);

// Every package is proven to pack before any package is uploaded.
for (const name of ordered) {
  if (!run("npm", ["pack", "--dry-run", "--workspace", `@tea-ui/${name}`], `packing @tea-ui/${name}`)) {
    process.exit(1);
  }
}

console.log(`\n[tea-ui] ${ordered.length} packages verified. Order: ${ordered.join(" -> ")}`);

if (dryRun) {
  console.log("\n[tea-ui] --dry-run: nothing was uploaded.");
  process.exit(0);
}

const published = [];
for (const name of ordered) {
  const label = `@tea-ui/${name}`;
  console.log(`\n[tea-ui] publishing ${label} ${manifests.get(name).version}`);
  if (!run("npm", ["publish", "--workspace", label, "--access", "public"], `publishing ${label}`)) {
    console.error(`\n[tea-ui] stopped at ${label}. Published so far: ${published.join(", ") || "none"}`);
    console.error(`[tea-ui] ${label} has not been published. Fix and re-run; the rest will be skipped.`);
    process.exit(1);
  }
  published.push(label);
}

console.log(`\n[tea-ui] published ${published.length} packages: ${published.join(", ")}`);
