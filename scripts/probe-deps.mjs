import { mkdtemp, writeFile } from "node:fs/promises";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { build } from "esbuild";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
// The scratch entry must live inside the repository, or bare specifiers cannot
// be resolved from it.
const work = await mkdtemp(resolve(root, "node_modules/.tea-probe-"));

const CASES = {
  "baseline (empty)": `globalThis.x = 1;`,
  'radix-ui barrel, 1 primitive': `import { Slot } from "radix-ui"; globalThis.x = Slot;`,
  'radix-ui subpath, 1 primitive': `import { Slot } from "radix-ui/Slot"; globalThis.x = Slot;`,
  'lucide-react barrel, 1 icon': `import { Check } from "lucide-react"; globalThis.x = Check;`,
  'lucide-react subpath, 1 icon': `import { Check } from "lucide-react/dist/esm/icons/check"; globalThis.x = Check;`,
  "@tea-ui/icons barrel": `import { Check } from ${JSON.stringify(resolve(root, "packages/icons/dist/index.js"))}; globalThis.x = Check;`,
  "@tea-ui/core Button": `import { Button } from ${JSON.stringify(resolve(root, "packages/core/dist/index.js"))}; globalThis.x = Button;`,
};

for (const [label, source] of Object.entries(CASES)) {
  const entry = join(work, "e.js");
  await writeFile(entry, source, "utf8");
  const out = await build({
    entryPoints: [entry],
    bundle: true,
    minify: true,
    format: "esm",
    write: false,
    target: "es2022",
    platform: "browser",
    external: ["react", "react-dom", "react/jsx-runtime"],
  });
  const code = out.outputFiles[0]?.contents ?? Buffer.alloc(0);
  console.log(
    `  ${(gzipSync(code).length / 1024).toFixed(1).padStart(7)} kB gzip  ${label}`,
  );
}
