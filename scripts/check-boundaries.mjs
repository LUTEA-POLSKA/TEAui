#!/usr/bin/env node
/**
 * TEA UI — package boundary check.
 *
 * The package graph is a DAG with exactly one direction: dependencies point
 * *down*. `@tea-ui/core` must not know that `@tea-ui/admin` exists; `@tea-ui/admin`
 * must not know that `@tea-ui/public` exists. Upward imports are how a design
 * system turns back into a shared-components folder with good manners.
 *
 * This runs in CI and in `npm run verify`. It is a plain graph walk, not a lint
 * heuristic, so the failure message can name the exact edge that must move.
 */
import { readFile, readdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** The allowed edges. Anything not listed here is a violation. */
const ALLOWED = {
  utils: [],
  tokens: [],
  "ux-standards": ["tokens"],
  icons: ["utils"],
  core: ["utils", "tokens", "icons", "ux-standards"],
  admin: ["core", "utils", "tokens", "icons", "ux-standards"],
  public: ["core", "utils", "tokens", "icons", "ux-standards"],
  patterns: ["core", "admin", "public", "utils", "tokens", "icons", "ux-standards"],
  templates: ["core", "admin", "public", "patterns", "utils", "tokens", "icons", "ux-standards"],
  blueprints: ["core", "admin", "public", "patterns", "templates", "utils", "tokens", "icons", "ux-standards"],
  specialized: ["core", "admin", "utils", "tokens", "icons", "ux-standards"],
};

/**
 * Packages whose *compositions* are not implemented yet.
 *
 * Each of these publishes a real scope registry — the contracts, the boundaries
 * and the decisions a product inherits — so it builds, type-checks and can be
 * read. What is missing is the React layer: the components, patterns and
 * templates themselves. The set is printed on every run, because a package that
 * sits in here for a long time is a claim the system is making without
 * evidence, and that should stay visible.
 *
 * `patterns` graduated out of this set when it shipped `FilterBar` and
 * `ActionBar`. Being listed here is a statement about code, so it has to be
 * removed when the code lands rather than when the plan is revisited — a set
 * that keeps a shipped package in it teaches everyone to ignore the output.
 */
const PLANNED = new Set(["templates", "blueprints", "specialized"]);

const violations = [];
const packages = Object.keys(ALLOWED).sort(
  (a, b) => (ALLOWED[a]?.length ?? 0) - (ALLOWED[b]?.length ?? 0),
);

for (const name of packages) {
  const manifestPath = resolve(root, "packages", name, "package.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const declared = new Set([
    ...Object.keys(manifest.dependencies ?? {}),
    ...Object.keys(manifest.peerDependencies ?? {}),
  ]);

  const allowed = new Set(ALLOWED[name] ?? []);
  for (const dependency of declared) {
    if (!dependency.startsWith("@tea-ui/")) continue;
    const target = dependency.replace("@tea-ui/", "");
    if (!allowed.has(target)) {
      violations.push(
        `@tea-ui/${name} -> @tea-ui/${target}: this edge is not in the architecture. ` +
          `Allowed from "${name}": ${[...allowed].join(", ") || "(nothing — the leaf layer)"}.`,
      );
    }
  }

  // A package that declares a TEA UI dependency it never imports is a stale
  // manifest, and a stale manifest is a boundary that quietly stops holding.
  const srcDir = resolve(root, "packages", name, "src");
  const files = await collect(srcDir);
  const source = files.length
    ? await Promise.all(files.map((file) => readFile(file, "utf8"))).then((parts) => parts.join("\n"))
    : "";
  for (const dependency of declared) {
    if (!dependency.startsWith("@tea-ui/")) continue;
    if (PLANNED.has(name)) continue;
    if (!source.includes(dependency)) {
      violations.push(
        `@tea-ui/${name} declares ${dependency} but never imports it. ` +
          `Remove the dependency, or the boundary is documented by accident.`,
      );
    }
  }
}

async function collect(dir) {
  const out = [];
  let entries = [];
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const path = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "dist") continue;
      out.push(...(await collect(path)));
    } else if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.includes(".test.")) {
      out.push(path);
    }
  }
  return out;
}

if (violations.length > 0) {
  console.error("[tea-ui] package boundary violations:\n");
  for (const violation of violations) console.error(`  - ${violation}`);
  console.error("\nThe package graph points down. If an edge is genuinely needed, add it to");
  console.error("scripts/check-boundaries.mjs with a reason — not to the code.");
  process.exitCode = 1;
} else {
  const built = packages.filter((name) => !PLANNED.has(name));
  const planned = packages.filter((name) => PLANNED.has(name));
  console.log(`[tea-ui] ${built.length} packages built, all edges point down.`);
  if (planned.length > 0) {
    console.log(`[tea-ui] declared but not yet implemented: ${planned.join(", ")}`);
  }
}
