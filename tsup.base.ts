import type { Options } from "tsup";

/**
 * Shared TEA UI build configuration.
 *
 * Every package produces ESM plus type declarations, externalises React, and
 * **preserves its module graph**. That last part is the decision that makes TEA
 * UI genuinely tree-shakeable, and it was found by measuring rather than
 * assuming — which is the only way it could have been found.
 *
 * Bundling flattens every component into one module whose top level contains
 * dozens of `createContext()` calls. Those are side effects, and a downstream
 * bundler is not allowed to drop a module that has one. Measured with
 * `npm run check:tree`: a product importing a single component retained
 * **93 %** of the package. With the module graph intact, each component is its
 * own file, each file's top level is inert unless it really has a side effect,
 * and the same import shakes down to what it needs.
 *
 * The cost is more files in `dist`. That is not a cost.
 */
export const teaConfig = (extra: Partial<Options> = {}): Options => ({
  // Every source file is its own entry. With `bundle: false` that means tsup
  // transpiles each one in place, so `dist/` mirrors `src/` and the relative
  // imports between them keep working. The entry is a glob so a package may use
  // `.ts` or `.tsx` without its build config diverging from everyone else's.
  //
  // Tests are excluded: a published package has no business shipping them, and
  // compiling them would drag the test-runner's types into the declaration
  // output of the package that contains them.
  entry: [
    "src/**/*.{ts,tsx}",
    "!src/**/__tests__/**",
    "!src/**/*.test.{ts,tsx}",
    "!src/**/*.spec.{ts,tsx}",
  ],
  format: ["esm"],
  target: "es2022",
  platform: "browser",

  bundle: false,
  splitting: false,
  dts: { resolve: false },
  sourcemap: true,
  clean: true,

  external: ["react", "react-dom", "react/jsx-runtime"],
  ...extra,
});

export default teaConfig;
