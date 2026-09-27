#!/usr/bin/env node
/**
 * TEA UI — static site build.
 *
 * Assembles the Showcase and the documentation into **one** static directory
 * that works on any host: a domain root, GitHub Pages, Vercel, a USB stick.
 *
 * Two things make that possible, and both were decided earlier rather than
 * retrofitted here:
 *
 *  - **Hash routing.** Every route lives in the URL fragment, so a static host
 *    never has to rewrite a path to `index.html`. No `404.html`, no SPA
 *    fallback, no host configuration. A host that only serves files is
 *    sufficient.
 *  - **A configurable `base`.** Asset URLs are emitted relative to `BASE_PATH`,
 *    so the same build serves `/` and `/TEAui/`.
 *
 * Usage:
 *   node scripts/build-site.mjs                     # domain root
 *   BASE_PATH=/TEAui/ node scripts/build-site.mjs   # GitHub Pages project
 */
import { spawnSync } from "node:child_process";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = resolve(root, "dist-site");

const base = process.env.BASE_PATH ?? "/";
const normalisedBase = base.endsWith("/") ? base : `${base}/`;
const siteRoot = normalisedBase === "/" ? "/" : normalisedBase;

console.log(`[tea-ui] building the static site with base "${normalisedBase}"`);

function run(command, args, env = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: { ...process.env, ...env },
  });
  if (result.status !== 0) {
    console.error(`[tea-ui] ${command} ${args.join(" ")} failed`);
    process.exit(result.status ?? 1);
  }
}

// The stylesheets are the compiled token layer, so they must exist before either
// app imports them by their published path.
run("npm", ["run", "build:css"]);

// The Showcase at the root, the documentation under /docs/.
run("npm", ["run", "build", "-w", "@tea-ui/showcase"], { BASE_PATH: siteRoot });
run("npm", ["run", "build", "-w", "@tea-ui/docs"], { BASE_PATH: `${siteRoot}docs/` });

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });

await cp(resolve(root, "apps/showcase/dist"), out, { recursive: true });
await cp(resolve(root, "apps/docs/dist"), resolve(out, "docs"), { recursive: true });

/**
 * A landing page at the root.
 *
 * GitHub Pages serves `index.html`, and the Showcase is the more useful of the
 * two entry points, so it takes that slot. A visitor who lands on a project
 * URL wants to see the system, not a table of contents — but the docs must be
 * one click away, or half the site is undiscoverable.
 */
const index = await readFile(resolve(out, "index.html"), "utf8");
const link = [
  '<link rel="prefetch" href="docs/">',
  '<link rel="canonical" href="./">',
].join("\n    ");
await writeFile(resolve(out, "index.html"), index.replace("</title>", `</title>\n    ${link}`), "utf8");

/**
 * `.nojekyll`.
 *
 * GitHub Pages runs Jekyll by default, and Jekyll ignores any path beginning
 * with an underscore. Vite emits `_`-prefixed chunks for shared code, so without
 * this file a deploy fails with 404s on exactly the chunks the bundler decided
 * to share. It is the single most common cause of "works locally, broken on
 * Pages".
 */
await writeFile(resolve(out, ".nojekyll"), "", "utf8");

// A redirect so the docs are reachable at a stable, typeable URL.
await writeFile(
  resolve(out, "docs/index.html").replace(/index\.html$/, "index.html"),
  await readFile(resolve(out, "docs/index.html"), "utf8"),
  "utf8",
);

console.log(`[tea-ui] static site written to dist-site/ (showcase at ${siteRoot}, docs at ${siteRoot}docs/)`);
