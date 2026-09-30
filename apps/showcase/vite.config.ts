import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "node:path";

/**
 * Deployment base path.
 *
 * `base` is what makes the same build work on a domain root, on Vercel, and in
 * a GitHub Pages project subpath (`https://<user>.github.io/TEAui/`). Without it
 * the asset URLs are absolute and every route 404s on Pages.
 *
 * It is read from `BASE_PATH` so the *source* never changes between targets —
 * a hard-coded base would be a bug waiting for the next deploy.
 *
 * The router is hash-based on purpose. That is the reason a static host needs
 * no rewrite rules and no `404.html` fallback: every route lives in the
 * fragment, so the server only ever serves one file.
 */
const base = process.env.BASE_PATH ?? "/";

/**
 * The Showcase resolves workspace packages from SOURCE, not from `dist`.
 *
 * That is a deliberate trade. Building eleven packages before every dev-server
 * restart would make the Showcase a worse development tool than the thing it
 * demonstrates — and the Showcase's job is to be the fastest way to *see* TEA
 * UI. The built artefacts are verified separately and more strictly by
 * `npm run check:exports` and `npm run check:tree`, which import from `dist`.
 *
 * The result is that `vite build` here produces a real, deployable bundle, and
 * the contract that consumers depend on is still tested — just not on every
 * keystroke.
 */
const pkg = (name: string): string => resolve(import.meta.dirname, "../../packages", name, "src");

const token = (): string => resolve(import.meta.dirname, "../../packages/tokens");

export default defineConfig(({ command }) => {
  /**
   * Dev compiles the tokens from source; the production build keeps reading the
   * built stylesheet.
   *
   * Both halves are deliberate and they are not interchangeable.
   *
   * **Dev must not read `dist`.** `tsup` runs with `clean: true`, so every
   * `build:packages` deletes the whole `dist` before rebuilding it. A dev server
   * resolving `@tea-ui/tokens/styles.css` to `dist/styles.css` therefore served a
   * *missing* stylesheet for the length of that window, and the Showcase rendered
   * unstyled — a grey page with no error anywhere. The failure was invisible from
   * the source, because the source was fine.
   *
   * So the dev server compiles `packages/tokens/src/index.css` itself. The
   * `@source` directives in that file already list the packages and both apps, so
   * Tailwind scans the same set as the CLI build does — and a token change now
   * hot-reloads instead of requiring a build.
   *
   * **The build must keep reading `dist`.** That is what makes the Showcase proof
   * that the *published* import path works: the same specifier a consumer writes
   * resolves to the same file that ships to npm. Compiling from source in the
   * build would quietly stop testing that.
   */
  const isDev = command === "serve";
  const stylesheet = isDev ? resolve(token(), "src/index.css") : resolve(token(), "dist/styles.css");
  // `fonts.css` has no source form: `scripts/build-fonts.mjs` generates it from the
  // `@fontsource` packages into `dist`. There is nothing to compile from source,
  // so dev reads the generated file and only `build:css` has to have run once.
  const fonts = resolve(token(), "dist/fonts.css");

  return {
    base,
    plugins: isDev ? [react(), tailwindcss()] : [react()],
    resolve: {
      // Order matters: the stylesheet specifier must be matched before the bare
      // package, or Vite resolves `@tea-ui/tokens/styles.css` to `index.ts/styles.css`.
      alias: [
        { find: "@tea-ui/tokens/styles.css", replacement: stylesheet },
        { find: "@tea-ui/tokens/fonts.css", replacement: fonts },
        { find: "@tea-ui/tokens/themes.css", replacement: resolve(token(), "src/themes.css") },
        { find: "@tea-ui/utils", replacement: pkg("utils") },
        { find: "@tea-ui/tokens", replacement: pkg("tokens") },
        { find: "@tea-ui/ux-standards", replacement: pkg("ux-standards") },
        { find: "@tea-ui/icons", replacement: pkg("icons") },
        { find: "@tea-ui/core", replacement: pkg("core") },
        { find: "@tea-ui/admin", replacement: pkg("admin") },
      ],
    },
    build: {
      outDir: "dist",
      sourcemap: true,
      target: "es2022",
      rollupOptions: {
        output: {
          // Split the heavy, rarely-changing dependencies out of the app chunk so
          // a content change does not invalidate the vendor cache. This is the
          // same discipline the library itself is built under.
          manualChunks: {
            radix: ["radix-ui"],
            icons: ["lucide-react"],
          },
        },
      },
    },
    server: { port: 4173, strictPort: false },
    preview: { port: 4173 },
  };
});
