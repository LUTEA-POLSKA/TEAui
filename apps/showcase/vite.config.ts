import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

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
const pkg = (name: string): string =>
  resolve(import.meta.dirname, "../../packages", name, "src/index.ts");

const token = (): string => resolve(import.meta.dirname, "../../packages/tokens");

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Order matters: the stylesheet specifier must be matched before the bare
    // package, or Vite resolves `@tea-ui/tokens/styles.css` to `index.ts/styles.css`.
    // Importing the *built* stylesheet here is exactly what a consumer does, so
    // the Showcase is proof that the published import path works.
    alias: [
      { find: "@tea-ui/tokens/styles.css", replacement: resolve(token(), "dist/styles.css") },
      { find: "@tea-ui/tokens/fonts.css", replacement: resolve(token(), "dist/fonts.css") },
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
});
