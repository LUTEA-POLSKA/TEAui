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

/**
 * Packages this run must not touch.
 *
 * `patterns`, `templates`, `blueprints` and `specialized` are declared in the
 * architecture and checked by the boundary test, but they export nothing. They are
 * marked `private: true`, which is the declaration, and npm would refuse them —
 * so without an explicit skip the run would publish every real package and *then*
 * die on the first empty one, exiting non-zero with a version already spent and
 * four packages unpublished for a reason that has nothing to do with them.
 *
 * Skipping them here means the decision is visible in the order the run prints,
 * rather than inferred from where it stopped.
 */
const skipped = names.filter((name) => manifests.get(name).private === true);
const publishable = names.filter((name) => manifests.get(name).private !== true);

if (skipped.length > 0) {
  console.log(
    `[tea-ui] skipping ${skipped.length} private package(s): ${skipped.map((n) => `@tea-ui/${n}`).join(", ")}`,
  );
  console.log(`[tea-ui] these are declared but ship nothing; they carry a deprecation notice on npm.`);
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

for (const name of publishable) visit(name);

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

/**
 * Has this exact version already been published?
 *
 * A run is resumed by re-running it, not by editing a list. Without this, a run
 * that stopped at package seven would fail on package one the second time, and
 * the obvious fix — remembering where it got to — is state that lives in someone's
 * head and is wrong the first time it is.
 */
function isPublished(name, version) {
  const result = spawnSync("npm", ["view", `${name}@${version}`, "version"], {
    cwd: root,
    encoding: "utf8",
    shell: process.platform === "win32",
  });
  return result.status === 0 && (result.stdout ?? "").trim() === version;
}

const published = [];
const skippedExisting = [];
for (const name of ordered) {
  const label = `@tea-ui/${name}`;
  const version = manifests.get(name).version;

  if (isPublished(label, version)) {
    console.log(`\n[tea-ui] ${label} ${version} is already published — skipping`);
    /*
     * Tracked apart from `published` on purpose. A package that was already on
     * npm was not published by this run, and listing it as such made a failed run
     * report "Published so far: @tea-ui/utils" when the run had uploaded
     * nothing at all. On a resumed run that line is the only record of where the
     * run got to, so it has to mean what it says.
     */
    skippedExisting.push(label);
    continue;
  }

  console.log(`\n[tea-ui] publishing ${label} ${version}`);
  if (!run("npm", ["publish", "--workspace", label, "--access", "public"], `publishing ${label}`)) {
    console.error(`\n[tea-ui] stopped at ${label}. Uploaded by this run: ${published.join(", ") || "none"}`);
    if (skippedExisting.length > 0) {
      console.error(`[tea-ui] Already on npm, untouched by this run: ${skippedExisting.join(", ")}`);
    }
    console.error(`[tea-ui] ${label} has not been published. Fix and re-run; the rest will be skipped.`);
    process.exit(1);
  }
  published.push(label);
}

console.log(`\n[tea-ui] published ${published.length} packages: ${published.join(", ")}`);
if (skippedExisting.length > 0) {
  console.log(`[tea-ui] ${skippedExisting.length} already published and left alone: ${skippedExisting.join(", ")}`);
}
