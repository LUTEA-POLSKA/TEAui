#!/usr/bin/env node
/**
 * TEA UI — prepublish guard.
 *
 * Refuses to publish a package whose build output is missing or incomplete.
 *
 * This is a one-line failure that costs a version number, because npm will not
 * let you reuse a version once it is public. A package published without `dist`
 * installs cleanly and then throws `ERR_MODULE_NOT_FOUND` on the first import,
 * and the only repair is to publish a patch and tell everyone to upgrade past
 * the broken one. Every `@tea-ui/*` package therefore checks itself first, and
 * the failure says exactly which file to look at rather than surfacing later as
 * a consumer's stack trace.
 */
import { access, readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

void fileURLToPath;
// Editors and PowerShell's own `Set-Content` add a byte order mark. JSON.parse
// rejects it, and a guard that dies with a stack trace instead of its message is
// a guard nobody reads. Escaped rather than written literally, so the file itself
// carries no invisible character.
const manifest = JSON.parse((await readFile(process.argv[2], "utf8")).replace(/^\\uFEFF/, ""));
const directory = dirname(resolve(process.argv[2]));

/** The entry points `exports` promises. Each one is a promise, and a promise kept is not kept. */
const promised = [];
for (const entry of Object.values(manifest.exports ?? {})) {
  if (typeof entry === "string") promised.push(entry);
  else for (const target of Object.values(entry)) promised.push(target);
}

const missing = [];
for (const target of promised) {
  if (target === "./package.json") continue;
  try {
    await access(resolve(directory, target));
  } catch {
    missing.push(target);
  }
}

if (missing.length > 0) {
  console.error(
    `\n[tea-ui] ${manifest.name} is missing ${missing.length} file(s) its exports map promises:\n` +
      missing.map((target) => `  ${target}`).join("\n") +
      `\n\nRun \`npm run build:packages\` from the repository root, then publish again.`,
  );
  process.exit(1);
}

console.log(`[tea-ui] ${manifest.name} ${manifest.version} is ready to publish (${promised.length} entry points present).`);
