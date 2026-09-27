#!/usr/bin/env node
/**
 * TEA UI — pending changeset probe.
 *
 * The release job must not create an empty version commit. A "no changes" bump
 * is noise in every consumer's changelog, and it trains people to ignore
 * changelogs.
 */
import { readdir, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const changesetDir = resolve(root, ".changeset");

const files = await readdir(changesetDir).catch(() => []);
const pending = files.filter((file) => file.endsWith(".md") && file !== "README.md");

if (pending.length === 0) {
  console.log("[tea-ui] no pending changesets");
} else {
  const packages = new Set();
  for (const file of pending) {
    const body = await readFile(resolve(changesetDir, file), "utf8");
    for (const match of body.matchAll(/"@tea-ui\/[a-z-]+"/g)) packages.add(match[0].replaceAll('"', ""));
  }
  console.log(`[tea-ui] ${pending.length} changeset(s) affecting ${packages.size} package(s)`);
}

console.log(`pending=${pending.length > 0}`);
