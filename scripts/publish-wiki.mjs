#!/usr/bin/env node
/**
 * TEA UI — wiki publisher.
 *
 * The wiki content lives in `wiki/`, versioned in the repository, and is pushed
 * to `TEAui.wiki.git`. That direction is deliberate: content that lives only on
 * GitHub is not versioned, and when the code is refactored the wiki does not move
 * with it. The repository is the source; the wiki is the readable surface.
 *
 * The GitHub wiki repository does not exist until the first page is created, and
 * GitHub exposes no API for that — it is the one step that has to happen in the
 * web UI. This script therefore *fails loudly and specifically* rather than
 * silently doing nothing, because "the wiki is empty and nobody knows why" is a
 * much worse outcome than one clear sentence.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = resolve(root, "wiki");
const work = resolve(root, "node_modules/.tea-wiki");

/**
 * The wiki repository is `<owner>/<repo>.wiki.git`, and the owner is rarely
 * guessable — a hard-coded slug publishes to the wrong place, or nowhere. It is
 * read from the origin remote instead, and overridable for forks.
 */
function remoteSlug() {
  if (process.env.WIKI_SLUG) return process.env.WIKI_SLUG;
  const remote = spawnSync("git", ["remote", "get-url", "origin"], {
    cwd: root,
    encoding: "utf8",
    shell: process.platform === "win32",
  });
  const url = (remote.stdout ?? "").trim();
  const match = url.match(/[:/]([^/:]+)\/([^/\s]+?)(?:\.git)?$/);
  return match ? `${match[1]}/${match[2]}` : "landnevermore/TEAui";
}

const slug = remoteSlug();
const target = process.env.WIKI_TARGET ?? `https://github.com/${slug}.wiki.git`;

/* -------------------------------------------------------------------------- */
/* A sidebar, so the wiki is navigable rather than a folder of pages           */
/* -------------------------------------------------------------------------- */

const PAGES = [
  ["Home", "Home"],
  ["Architektur", "Architektur"],
  ["UX-Standards", "UX Standards"],
  ["Komponenten", "Komponenten"],
  ["Themes", "Themes"],
  ["Accessibility", "Accessibility"],
  ["Audit", "Audit"],
  ["Deployment", "Deployment"],
  ["Beitragen", "Beitragen"],
  ["OpenCode-Skill", "OpenCode Skill"],
];

/* -------------------------------------------------------------------------- */

function git(args, cwd) {
  return spawnSync("git", args, {
    cwd,
    encoding: "utf8",
    shell: process.platform === "win32",
  });
}

const probe = git(["ls-remote", target], root);
const initialised = probe.status === 0;

if (!initialised) {
  console.error(`
[tea-ui] The wiki repository does not exist yet.

  ${target}

  GitHub creates it with the first page, and there is no API for that step —
  it has to happen once in the web UI:

    1. Open   https://github.com/${slug}/wiki
    2. Click  "Create the first page"
    3. Title it  Home  and save

  The content is already written and lives in this repository under wiki/.
  After that one step, this command publishes it and every later change is
  automatic:

    node scripts/publish-wiki.mjs
`);
  process.exit(1);
}

const files = (await readdir(source)).filter((file) => file.endsWith(".md"));

// Clone, replace, commit, push. The wiki has no branches worth preserving and no
// pull requests, so the whole history is not interesting.
const fresh = git(["clone", "--depth", "1", target, work], root);
if (fresh.status !== 0 && !existsSync(work)) {
  console.error(fresh.stderr);
  process.exit(fresh.status ?? 1);
}

for (const file of files) {
  const body = await readFile(resolve(source, file), "utf8");
  // GitHub renders the first `# Heading` as the page title, and a second H1
  // fights with the surrounding chrome. Drop it.
  const cleaned = body.replace(/^#\s+.*\n+/, "");
  await (await import("node:fs/promises")).writeFile(resolve(work, file), cleaned, "utf8");
}

const sidebar = ["# TEA UI", ""]
  .concat(PAGES.map(([, label]) => `* [[${label}]]`))
  .concat(["", "* [↩ Kurzregister](README)"])
  .join("\n");
await (await import("node:fs/promises")).writeFile(resolve(work, "_Sidebar.md"), `${sidebar}\n`, "utf8");

git(["add", "-A"], work);
const commit = git(["commit", "-m", "Sync wiki from wiki/ in the repository"], work);
if (commit.status !== 0 && !/nothing to commit/.test(commit.stdout ?? "")) {
  console.error(commit.stdout, commit.stderr);
  process.exit(commit.status ?? 1);
}

const push = git(["push", target, "HEAD:master"], work);
if (push.status !== 0) {
  console.error(push.stdout, push.stderr);
  process.exit(push.status ?? 1);
}

console.log(`[tea-ui] ${files.length + 1} wiki pages published to ${target}`);
