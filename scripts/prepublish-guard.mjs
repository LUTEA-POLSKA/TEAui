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
import { dirname, resolve } from "node:path";

/**
 * Which manifest to check.
 *
 * npm runs `prepublishOnly` with the package directory as the working directory
 * and passes no arguments, so that is the default — an earlier version read
 * `argv[2]` unconditionally and died with a TypeError the first time npm invoked
 * it. An explicit path still works, which is what makes this checkable from the
 * outside: a guard you can only run through the thing it guards is a guard
 * nobody runs until it is too late.
 */
const target = process.argv[2] ?? resolve(process.cwd(), "package.json");

// Editors and PowerShell's own `Set-Content` add a byte order mark, which
// JSON.parse rejects. Escaped, not written literally, so this file carries no
// invisible character of its own.
const manifest = JSON.parse((await readFile(target, "utf8")).replace(/^\uFEFF/, ""));
const directory = dirname(resolve(target));

/**
 * Packages that are declared but ship nothing.
 *
 * `templates`, `blueprints` and `specialized` are part of the architecture and
 * the boundary check knows about them, so they are not accidents: they describe
 * compositions that have not been written. What they must not be is
 * *installable*. A `@tea-ui/templates` that resolves on import and exports one
 * empty array teaches a consumer that the library has a template layer, and the
 * only way to undo that is a deprecation notice and a patch — a published
 * version number is spent the moment it goes out.
 *
 * So the refusal is here rather than in a checklist, because the guard is the
 * only thing that runs on every publish without anyone remembering.
 *
 * `private: true` in the manifest blocks the publish; this blocks it again with a
 * reason, and it holds even if that field is dropped in a later edit.
 *
 * `patterns` is **not** in this set any more. It used to be, and it shipped a
 * registry with no compositions behind it — a package whose `PATTERNS` array
 * named six patterns and exported none of them, which is worse than an empty
 * package because the array looks like an answer. It now exports `FilterBar` and
 * `ActionBar`, so it has something to install and the refusal no longer applies.
 * The remaining three still do.
 */
const NOT_IMPLEMENTED = new Set([
  "@tea-ui/templates",
  "@tea-ui/blueprints",
  "@tea-ui/specialized",
]);

if (NOT_IMPLEMENTED.has(manifest.name)) {
  console.error(
    `\n[tea-ui] refusing to publish ${manifest.name}.\n\n` +
      `It is declared in the architecture and checked by the boundary test, but it ` +
      `exports nothing yet. Publishing it would spend a version number on an empty ` +
      `package, and a consumer who installs it gets a module that resolves and ` +
      `contains no components.\n\n` +
      `Remove the package from the workspace when it has a real export, or leave it ` +
      `as \`private: true\`. It is already published at 0.1.0 and is still ` +
      `installable, so it also needs an explicit \`npm deprecate\` to say so.`,
  );
  process.exit(1);
}

/** The entry points `exports` promises. Each one is a promise, and a promise kept is not kept. */
const promised = [];
for (const entry of Object.values(manifest.exports ?? {})) {
  if (typeof entry === "string") promised.push(entry);
  else for (const value of Object.values(entry)) promised.push(value);
}

const missing = [];
for (const promise of promised) {
  if (promise === "./package.json") continue;
  try {
    await access(resolve(directory, promise));
  } catch {
    missing.push(promise);
  }
}

if (missing.length > 0) {
  console.error(
    `\n[tea-ui] ${manifest.name} is missing ${[...new Set(missing)].length} file(s) its exports map promises:\n` +
      [...new Set(missing)].map((promise) => `  ${promise}`).join("\n") +
      `\n\nRun \`npm run build:packages\` from the repository root, then publish again.`,
  );
  process.exit(1);
}

console.log(
  `[tea-ui] ${manifest.name} ${manifest.version} is ready to publish (${promised.length} entry points present).`,
);
