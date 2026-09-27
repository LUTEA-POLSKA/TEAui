#!/usr/bin/env node
/**
 * TEA UI — ESM specifier fixup.
 *
 * Source imports are written extensionless, which is idiomatic TypeScript and
 * what every bundler resolves. The *published* output, however, has to be valid
 * Node ESM, and Node will not resolve `from "./layout"` — it needs
 * `from "./layout/index.js"`. Without this step the package installs cleanly and
 * then fails on `import`, which is the worst possible moment to find out.
 *
 * Rather than uglify every source import, the specifiers are rewritten in
 * `dist` after the build. Both `.js` and `.d.ts` are fixed, so the types resolve
 * under `moduleResolution: "nodenext"` too.
 */
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const SPECIFIER = /(\bfrom\s*|\bimport\s*\(\s*|\bexport\s*\*\s*from\s*)(["'])(\.[^"']*)\2/g;

async function exists(path) {
  return Boolean(await stat(path).catch(() => null));
}

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(path)));
    else if (/\.(js|d\.ts)$/.test(entry.name)) out.push(path);
  }
  return out;
}

/**
 * Join and collapse a `/`-separated path.
 *
 * `path.posix.resolve` cannot be used here: on Windows it treats `E:/…` as a
 * *relative* segment and prefixes the current working directory, so every lookup
 * missed and every specifier was silently left unfixed. This walks the segments
 * instead, which behaves identically on both platforms.
 */
function normalize(base, relative) {
  const segments = `${base}/${relative}`.split("/");
  const out = [];
  for (const segment of segments) {
    if (segment === "" || segment === ".") continue;
    if (segment === "..") {
      out.pop();
      continue;
    }
    out.push(segment);
  }
  return out.join("/");
}

/** Every built file as a normalised absolute path, for a sync lookup. */
function indexFiles(files) {
  const set = new Set();
  for (const file of files) {
    const normalized = file.replace(/\\/g, "/");
    set.add(normalized.replace(/\.d\.ts$/, ".js"));
    set.add(normalized.replace(/\.js\.map$/, ""));
  }
  return set;
}

/** Every relative specifier in `source` that still lacks a resolvable extension. */
function unresolved(source) {
  const out = [];
  for (const match of source.matchAll(SPECIFIER)) {
    const specifier = match[3];
    if (!/\.(js|mjs|cjs|json|css)$/.test(specifier)) out.push(specifier);
  }
  return out;
}

async function fixPackage(packageName, failures) {
  const dist = resolve(root, "packages", packageName, "dist");
  if (!(await exists(dist))) return 0;

  const files = await walk(dist);
  const available = indexFiles(files);

  for (const file of files) {
    const source = await readFile(file, "utf8");
    const dir = dirname(file).replace(/\\/g, "/");

    const fixed = source.replace(SPECIFIER, (match, keyword, quote, specifier) => {
      if (/\.(js|mjs|cjs|json|css)$/.test(specifier)) return match;
      const base = normalize(dir, specifier);
      if (available.has(`${base}.js`)) return `${keyword}${quote}${specifier}.js${quote}`;
      if (available.has(`${base}/index.js`)) {
        return `${keyword}${quote}${specifier.replace(/\/$/, "")}/index.js${quote}`;
      }
      return match;
    });

    if (fixed !== source) await writeFile(file, fixed, "utf8");
  }

  // Verify rather than trust. This step rewrites the published output, and a
  // partially-rewritten package installs cleanly and then throws on `import` in
  // the consumer — the worst moment to find out. An earlier version of this
  // script rewrote 86 files in one package while the directory went on to hold
  // 130, and the only symptom was a directory-import error several steps later
  // in a different job. So: re-read what was written, and name the survivors.
  for (const file of files) {
    const remaining = unresolved(await readFile(file, "utf8"));
    if (remaining.length > 0) {
      failures.push(
        `${file.replace(/\\/g, "/").replace(`${root}/`, "")}: ${[...new Set(remaining)].join(", ")}`,
      );
    }
  }

  return files.length;
}

const names = process.argv.slice(2);
const targets =
  names.length > 0
    ? names
    : (await readdir(resolve(root, "packages"), { withFileTypes: true }))
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name);

let touched = 0;
const failures = [];
for (const name of targets) {
  touched += await fixPackage(name, failures);
}
console.log(`[tea-ui] ESM specifiers normalised in ${touched} built files.`);

if (failures.length > 0) {
  console.error(`\n[tea-ui] ${failures.length} file(s) still carry an unresolvable specifier:`);
  for (const failure of failures) console.error(`  ${failure}`);
  console.error(
    "\nThe published output would fail on `import`. This is a bug in the build, not a warning.",
  );
  process.exit(1);
}
