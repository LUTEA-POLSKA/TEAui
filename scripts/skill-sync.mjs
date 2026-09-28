#!/usr/bin/env node
/**
 * TEA UI — install and verify the skill.
 *
 * The skill lived in two byte-identical copies inside the repository, which is a
 * promise that they stay identical, kept by hand. It also was not installed
 * anywhere, so it only ever applied when working inside TEA UI itself — while
 * its whole purpose is to apply in the *other* projects.
 *
 * So: one source of truth in this repository, copied to the global skill
 * directory, and a check that fails when the two have drifted. The check is the
 * important part. A copy maintained by discipline is a copy that silently rots,
 * and a skill that has rotted still reads as authoritative.
 */
import { copyFile, mkdir, readFile, stat } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = resolve(root, ".opencode/skills/tea-ui/SKILL.md");
const installed = join(homedir(), ".config/opencode/skills/tea-ui/SKILL.md");
const duplicate = resolve(root, "skills/tea-ui/SKILL.md");
const check = process.argv.includes("--check");

/** What a consumer actually needs, and what a stale skill breaks. */
const REQUIRED = [
  "node_modules/@tea-ui",
  "https://landnevermore.github.io/TEAui/",
  "1.0.0",
];

/** Paths that only exist in a checkout of TEA UI, and mislead a consumer. */
const REPO_ONLY = /^\s*rg .*packages\//m;

const text = async (path) => (await readFile(path, "utf8")).replace(/^\uFEFF/, "");

const problems = [];
const body = await text(source);

// Does the copy in the repository's skills/ directory still match?
if (await stat(duplicate).catch(() => null)) {
  const twin = await text(duplicate);
  if (twin !== body) {
    problems.push(
      "skills/tea-ui/SKILL.md has drifted from .opencode/skills/tea-ui/SKILL.md. " +
        "There is one source of truth; the second copy is a duplicate, delete it.",
    );
  }
}

// Would this skill work outside TEA UI?
for (const needle of REQUIRED) {
  if (!body.includes(needle)) {
    problems.push(`the skill never mentions ${needle} — a consuming project would not find it`);
  }
}

if (REPO_ONLY.test(body)) {
  problems.push(
    "the skill still searches packages/ directly, which does not exist in a project " +
      "that installed TEA UI from npm. Search node_modules/@tea-ui instead.",
  );
}

// Is the global copy present and current?
const globalBody = await text(installed).catch(() => null);
if (globalBody === null) {
  problems.push("the skill is not installed globally, so it does not apply in other projects");
} else if (globalBody !== body) {
  problems.push("the global copy is older than the source — run `npm run skill:install`");
}

if (check) {
  if (problems.length > 0) {
    console.error(`\n[tea-ui] the skill is not in a state other projects can rely on:\n`);
    for (const problem of problems) console.error(`  - ${problem}`);
    console.error("");
    process.exit(1);
  }
  const exists = (await stat(duplicate).catch(() => null)) !== null;
  console.log(
    exists
      ? "[tea-ui] skill is consistent: the source, the repository copy and the global copy agree."
      : "[tea-ui] skill is consistent: the source and the global copy agree, and there is no duplicate in the repository.",
  );
  console.log(`[tea-ui] installed at ${installed}.`);
  process.exit(0);
}

await mkdir(dirname(installed), { recursive: true });
await copyFile(source, installed);
console.log(`[tea-ui] installed ${source}`);
console.log(`[tea-ui]      -> ${installed}`);
if (problems.length > 0) {
  console.error("\n[tea-ui] note before trusting this skill:");
  for (const problem of problems) console.error(`  - ${problem}`);
}
