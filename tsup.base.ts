import type { Options } from "tsup";

/**
 * Shared TEA UI build configuration.
 *
 * Every package produces ESM + type declarations, externalises React, and is
 * run through the Rollup treeshaking pass so that "sideEffects: false" in each
 * manifest is a measured claim rather than an assumption (UX-Standards §36).
 */
export const teaConfig = (extra: Partial<Options> = {}): Options => ({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "es2022",
  platform: "browser",
  dts: { resolve: false },
  sourcemap: true,
  clean: true,
  treeshake: true,
  splitting: true,
  external: ["react", "react-dom", "react/jsx-runtime"],
  ...extra,
});

export default teaConfig;
