import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
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

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: "@tea-ui/tokens/styles.css", replacement: resolve(token(), "dist/styles.css") },
      { find: "@tea-ui/tokens/fonts.css", replacement: resolve(token(), "dist/fonts.css") },
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
});
