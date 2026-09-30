import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "node:path";

/**
 * Workspace packages resolve from source, for the same reason the Showcase does:
 * the docs must be able to change and show the change without rebuilding eleven
 * packages first.
 *
 * The alias target is the `src` *directory*, not `src/index.ts`, because a
 * package may name its entry `index.ts` or `index.tsx` and Vite resolves
 * whichever exists. Pointing at a fixed extension means the config breaks the
 * first time a package is written in the other language.
 *
 * The published import paths are still exercised — `@tea-ui/tokens/styles.css`
 * and `@tea-ui/tokens/fonts.css` resolve to the real built files — so the
 * documentation is also a test that those paths work.
 */
const pkg = (name: string): string => resolve(import.meta.dirname, "../../packages", name, "src");

const token = (): string => resolve(import.meta.dirname, "../../packages/tokens");

/**
 * The documentation is deployed under a subpath (`/docs/`) of the same host as
 * the Showcase, so `base` is read from `BASE_PATH` exactly as the Showcase reads
 * it. See the Showcase's config for the reasoning.
 */
const base = process.env.BASE_PATH ?? "/";

export default defineConfig(({ command }) => {
  /**
   * Dev compiles the tokens from source; the production build keeps reading the
   * built stylesheet. The reasoning is in the Showcase's config — the short
   * version is that `tsup` cleans `dist` on every build, so a dev server reading
   * `dist/styles.css` serves a *missing* stylesheet for the length of that
   * window and the page renders unstyled with no error to be found.
   */
  const isDev = command === "serve";
  const stylesheet = isDev ? resolve(token(), "src/index.css") : resolve(token(), "dist/styles.css");
  // `fonts.css` is generated into `dist` by `scripts/build-fonts.mjs` and has no
  // source form, so it stays a `dist` read in both modes.
  const fonts = resolve(token(), "dist/fonts.css");

  return {
    base,
    plugins: isDev ? [react(), tailwindcss()] : [react()],
    resolve: {
      alias: [
        { find: "@tea-ui/tokens/styles.css", replacement: stylesheet },
        { find: "@tea-ui/tokens/fonts.css", replacement: fonts },
        { find: "@tea-ui/utils", replacement: pkg("utils") },
        { find: "@tea-ui/tokens", replacement: pkg("tokens") },
        { find: "@tea-ui/ux-standards", replacement: pkg("ux-standards") },
        { find: "@tea-ui/icons", replacement: pkg("icons") },
        { find: "@tea-ui/core", replacement: pkg("core") },
        { find: "@tea-ui/admin", replacement: pkg("admin") },
        { find: "@tea-ui/public", replacement: pkg("public") },
      ],
    },
    build: {
      outDir: "dist",
      sourcemap: true,
      target: "es2022",
      rollupOptions: {
        output: { manualChunks: { radix: ["radix-ui"], icons: ["lucide-react"] } },
      },
    },
    server: { port: 4174, strictPort: false },
    preview: { port: 4174 },
  };
});
