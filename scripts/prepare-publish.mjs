#!/usr/bin/env node
/**
 * TEA UI — prepare the packages for a public registry.
 *
 * Publishing is the one step in this repository that cannot be undone, so the
 * manifests are brought into shape by a script that can be read and re-run
 * rather than by an edit that leaves no trace of why the fields are what they
 * are.
 *
 * Four things had to change, and each is a thing a private monorepo does not
 * need but a public one must not skip:
 *
 *   - `private: true` and `license: "UNLICENSED"` mean npm refuses to publish
 *     and nobody else is permitted to use the code. The repository being public
 *     while every package is UNLICENSED is the inconsistency this resolves.
 *   - `publishConfig.access: "restricted"` only installs on paid organisation
 *     plans, so it has to become `public` for anyone to consume these at all.
 *   - Internal dependencies were declared as `"*"`, which resolves to whatever
 *     version happens to be newest. For a first public release that is a range
 *     with no floor, and it is why the versions are pinned to the current one.
 *   - `files` shipped `tokens/src`, tests included. The exports map only exposes
 *     `dist`, so nothing needed the source, and a test file is not something to
 *     hand to a consumer.
 *
 * It also adds the metadata npm needs to link a package back to its source, and
 * a `prepublishOnly` that refuses to publish a package whose `dist` is missing —
 * because a package that installs and then fails on `import` is the worst thing
 * to put on a registry under your name.
 */
import { copyFile, readFile, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const slug = "landnevermore/TEAui";
const pages = "https://landnevermore.github.io/TEAui/";
const docs = "https://landnevermore.github.io/TEAui/docs/";

/** What each package is for, in one line, and the words a searcher would use. */
const PACKAGES = {
  utils: ["Shared types, class-name composition and small helpers.", ["react", "typescript", "cn", "clsx", "utility"]],
  tokens: ["Design tokens: colour, spacing, radii, motion, density, and the themes.", ["design-tokens", "css", "theme", "dark-mode", "tailwind"]],
  "ux-standards": ["The written rules components are held to, as data rather than prose.", ["ux", "accessibility", "wcag", "standards", "guidelines"]],
  icons: ["The icon set, with a tea mark.", ["icons", "svg", "react", "logo"]],
  core: ["The primitive layer: layout, typography, inputs, feedback, overlays, navigation.", ["react", "components", "design-system", "wcag", "a11y"]],
  admin: ["The admin layer: shell, navigation, data display and product states.", ["react", "admin", "dashboard", "components", "data-display"]],
  public: ["The public layer: marketing sections, hero, pricing, FAQ, conversion forms.", ["react", "landing", "marketing", "components"]],
  patterns: ["Multi-component patterns that span more than one component.", ["patterns", "react", "design-system", "composition"]],
  templates: ["Page-level templates assembled from patterns.", ["templates", "react", "pages", "design-system"]],
  blueprints: ["Full screen blueprints, down to the layout and the states.", ["blueprints", "react", "screens", "design-system"]],
  specialized: ["Domain-specific components, kept apart from the product-agnostic core.", ["specialized", "domain", "react", "components"]],
};

const LICENSE = `MIT License

Copyright (c) 2026 landnevermore

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`;

function readme(name, description) {
  const stylesheet = name === "utils" || name === "ux-standards" ? "" : `
## Styles

The token layer ships its stylesheet as a separate export, so it is only
downloaded when it is asked for:

\`\`\`ts
import "@tea-ui/${name}/styles.css";
\`\`\`
`;

  return `# @tea-ui/${name}

${description}

Part of [TEA UI](${pages}) — a design system built once and reused across
products. The whole system is documented at ${docs}.

## Install

\`\`\`bash
npm install @tea-ui/${name}
\`\`\`

React 18.2 or 19 is expected as a peer dependency.

## Use

\`\`\`ts
import { ${name === "tokens" || name === "ux-standards" || name === "utils" ? "tokens" : "Button"} } from "@tea-ui/${name}";
\`\`\`
${stylesheet}
## Licence

MIT. See [LICENSE](./LICENSE).
`;
}

const names = (await readdir(resolve(root, "packages"), { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

/**
 * Which packages are the base, and which are still being built.
 *
 * The split is not cosmetic. A `1.0.0` is a promise, and the seven packages below
 * have been built, measured and imported from the registry; the four above them
 * are scaffolding that `check-boundaries` still reports as declared but not
 * implemented. Publishing them at `1.0.0` would make `npm i @tea-ui/blueprints`
 * claim a finished system and deliver 73 kB of frame. They stay at `0.1.0` and
 * reach `1.0.0` when they hold something, and a caret range on a `0.x` correctly
 * refuses to silently absorb a `1.0.0` that might break it.
 */
const STABLE = new Set([
  "utils",
  "tokens",
  "ux-standards",
  "icons",
  "core",
  "admin",
  "public",
]);
const STABLE_VERSION = "1.0.0";
const WIP_VERSION = "0.1.0";

/** The version each package will carry, resolved before any range is written. */
const versionOf = (name) => (STABLE.has(name) ? STABLE_VERSION : WIP_VERSION);

// Before the per-package copies, not after: the first run has nothing to copy from.
await writeFile(resolve(root, "LICENSE"), LICENSE, "utf8");

const changed = [];

for (const name of names) {
  const directory = resolve(root, "packages", name);
  const path = resolve(directory, "package.json");
  const manifest = JSON.parse(await readFile(path, "utf8"));

  const [description, keywords] = PACKAGES[name] ?? [manifest.description, ["react"]];

  delete manifest.private;
  manifest.license = "MIT";
  manifest.version = versionOf(name);
  manifest.description = description;
  manifest.keywords = [...new Set([...keywords, "tea-ui", "design-system"])];
  manifest.author = "landnevermore";
  manifest.repository = { type: "git", url: `git+https://github.com/${slug}.git`, directory: `packages/${name}` };
  manifest.homepage = docs;
  manifest.bugs = { url: `https://github.com/${slug}/issues` };
  manifest.files = ["dist", "README.md", "LICENSE"];
  manifest.publishConfig = { access: "public" };

  /**
   * Internal dependency ranges.
   *
   * Two things were wrong here. The range was taken from the *depending* package's
   * own version, so `patterns` at 0.1.0 would have declared `core@^0.1.0` — and
   * `^0.1.0` does not match `1.0.0`, so the install of a published `patterns`
   * would have failed against a released `core`. And the condition only rewrote
   * a range of `"*"`, so once a range was written it was never corrected again.
   *
   * So the range always comes from the dependency's own version, and it is
   * rewritten every time rather than only when it looks untouched.
   */
  for (const field of ["dependencies", "peerDependencies", "devDependencies"]) {
    for (const dependency of Object.keys(manifest[field] ?? {})) {
      if (!dependency.startsWith("@tea-ui/")) continue;
      const target = dependency.slice("@tea-ui/".length);
      if (!names.includes(target)) continue;
      const range = `^${versionOf(target)}`;
      if (manifest[field][dependency] !== range) changed.push(`${name} -> ${dependency}@${range}`);
      manifest[field][dependency] = range;
    }
  }

  manifest.scripts = {
    ...manifest.scripts,
    prepublishOnly: "node ../../scripts/prepublish-guard.mjs",
  };

  await writeFile(path, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  await writeFile(resolve(directory, "README.md"), readme(name, description), "utf8");
  await copyFile(resolve(root, "LICENSE"), resolve(directory, "LICENSE"));
}

const stable = names.filter((name) => STABLE.has(name));
const wip = names.filter((name) => !STABLE.has(name));

console.log(`[tea-ui] prepared ${names.length} packages: ${names.join(", ")}`);
console.log(`[tea-ui] ${STABLE_VERSION} (base rewrite): ${stable.join(", ")}`);
console.log(`[tea-ui] ${WIP_VERSION} (still being built): ${wip.join(", ")}`);
for (const line of changed) console.log(`[tea-ui] range ${line}`);
