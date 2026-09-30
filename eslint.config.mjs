import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

import { teaUi } from "./scripts/eslint-plugin-tea-ui.mjs";

/**
 * TEA UI — lint configuration.
 *
 * Most of the rules below are not style. Each one is a defect the audit found in
 * the two source projects, turned into something a machine refuses rather than
 * something a reviewer has to remember. A rule that only exists in a document is
 * a suggestion; a rule that fails a build is a standard.
 */
export default tseslint.config(
  {
    // Build output is never linted. `dist-site/` in particular contains bundled
    // third-party code, and linting it produces thousands of errors in files
    // nobody wrote and nobody can change.
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/reports/**",
      "**/dist-site/**",
      "**/screenshots/**",
      "docs/audit/**",
      "apps/*/dist/**",
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // The plugin has to be registered in the same config object as its rules.
    plugins: { "react-hooks": reactHooks, "tea-ui": teaUi },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  },

  {
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      globals: { ...globals.browser, ...globals.es2023 },
    },
    rules: {
      /* -- the TEA UI house style ------------------------------------------ */

      // A hook in a condition is a hook-order bug that only shows up on the
      // render where it happens.
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // The audit found 190 uses of `destructive` and, separately, `text-red-300`
      // in the same product — two ways to say one thing, and the two never
      // agreed. Only the token may say it.
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@tea-ui/*/internal", "@tea-ui/*/src/*"],
              message: "Interne Pfade sind kein oeffentlicher API. Importiere ueber das Paket-Wurzel.",
            },
            {
              group: ["lucide-react"],
              message:
                "Nutze @tea-ui/icons. Das Icon-Set ist kuratiert, versioniert und tree-shakebar; lucide-react bringt ~1600 Icons in den Modulgraphen.",
            },
          ],
        },
      ],
    },
  },

  /* -- the bans, as file-scoped rules ------------------------------------- */
  {
    files: ["packages/*/src/**/*.{ts,tsx}"],
    rules: {
      /*
       * Rules 1 and 2 are not bans and therefore not expressible as a value
       * pattern: rule 1 is a single class, rule 2 is a *pair* of classes that must
       * co-occur in one className string. They live in the local plugin, which is
       * the only place in the repository that knows what "a replacement" means.
       *
       * Everything below is a genuine ban, and every pattern is anchored with
       * `(?:^|\s)`. That is not a detail: the `value` of a `className` literal is
       * the *whole* class string, so a selector like `Literal[value=/^z-\[/]`
       * only ever matches a className that *begins* with `z-[` — and
       * `"flex gap-2 z-[9999]"` sails straight through. Several of these rules
       * were written that way and had never fired.
       */
      "tea-ui/focus-not-focus-visible": "error",
      "tea-ui/outline-needs-replacement": "error",
      "no-restricted-syntax": [
        "error",
        {
          // Rule 3 — radius is 0, or `pill` for the five documented semantics.
          selector:
            "JSXAttribute[name.name='className'] Literal[value=/(?:^|\\s)rounded-(sm|md|lg|xl|2xl|3xl|full)\\b/]",
          message:
            "Audit-Befund 3: Radius ist 0 (rounded-none) oder pill. pill ist den fünf dokumentierten Semantiken vorbehalten (Avatar, Statuspunkt, Schalter, Radio, Mediensteuerung, Ladeindikator, Fortschritt).",
        },
        {
          // Rule 4 — a theme owns values; a component may not carry a hex.
          selector: "JSXAttribute[name.name='className'] Literal[value=/#[0-9a-fA-F]{3,8}\\b/]",
          message:
            "Audit-Befund 4: keine Hexwerte in Komponenten. Nutze eine semantische Rolle (bg-surface, text-fg-muted, ...).",
        },
        {
          selector: "Literal[value=/^#[0-9a-fA-F]{3,8}$/]",
          message:
            "Audit-Befund 4: keine Hexwerte im TEA-UI-Code. Farben gehoeren in packages/tokens/src/themes.css.",
        },
        {
          // Rule 5 — elevation has three named steps and no free offsets, neither
          // as a Tailwind size step nor as an arbitrary `shadow-[…]`.
          selector: "JSXAttribute[name.name='className'] Literal[value=/(?:^|\\s)shadow-\\[/]",
          message:
            "Audit-Befund 5: keine freien Schattenwerte. Nutze shadow-raised, shadow-overlay oder shadow-modal.",
        },
        {
          selector:
            "JSXAttribute[name.name='className'] Literal[value=/(?:^|\\s)shadow-(sm|md|lg|xl|2xl|inner|DEFAULT)\\b/]",
          message:
            "Audit-Befund 5: Elevation hat drei Stufen (raised, overlay, modal). Keine freien Tailwind-Schatten.",
        },
        {
          // The audit found 9px and 10px carrying real UI text in both source
          // projects. The scale starts at 11px, and `text-label` is reserved for
          // uppercase micro-labels.
          selector:
            "JSXAttribute[name.name='className'] Literal[value=/(?:^|\\s)text-\\[(\\d+)px\\]/]",
          message:
            "Audit-Befund 7: keine px-Schriftgroessen. Der Massstab beginnt bei 11px (text-label); darunter war in beiden Quellprodukten echter Text.",
        },
        {
          // Rule 11 — the z scale is eleven named steps.
          selector: "JSXAttribute[name.name='className'] Literal[value=/(?:^|\\s)z-\\[/]",
          message:
            "Audit-Befund 11: keine freien z-Index-Werte. Nutze die Skala (z-modal, z-popover, z-toast, ...).",
        },
        {
          // Rule 10 — TEA UI is dark-only. A `dark:` variant is a dead class
          // here, and the audit found exactly that in one source product.
          selector: "JSXAttribute[name.name='className'] Literal[value=/(?:^|\\s)dark:/]",
          message:
            "Audit-Befund 10: keine `dark:`-Utilities. TEA UI liefert ein dunkles Theme; eine zweite, ungetestete Palette ist eine zweite ungetestete Palette.",
        },
        {
          // Rule 26 — `!` is banned in library code; it hides a wrong variant.
          selector: "JSXAttribute[name.name='className'] Literal[value=/(?:^|\\s)!\\w/]",
          message:
            "Audit-Befund 26: keine !-Overrides im Bibliothekscode. Sie verdecken eine falsche Variantenentscheidung.",
        },
        {
          // Rule 7 — one word for "bad": the destructive role, never a raw
          // palette entry. The palette is reset from the build so these emit
          // nothing; banning them says so at review time as well.
          selector:
            "JSXAttribute[name.name='className'] Literal[value=/(?:^|\\s)text-(red|emerald|green|teal|amber|yellow|orange|rose|pink|purple|indigo|blue|slate|gray|zinc|neutral|stone)-/]",
          message:
            "Audit-Befund 7: keine Rohpaletten. Nutze eine Rolle — text-critical / text-positive / text-destructive.",
        },
        {
          // Rule 25 — a Tailwind v4 arbitrary-value form in this build emits
          // nothing at all and still looks correct in review.
          selector: "JSXAttribute[name.name='className'] Literal[value=/(?:^|\\s)[a-z-]+-\\(/]",
          message:
            "Audit-Befund 25: Tailwind-v4-Syntax (`max-h-(--x)`) in diesem Build. Nutze die eckige Form mit `var()`.",
        },
      ],

      // `asChild` is how native semantics survive styling. Reaching for `as`
      // instead makes the element opaque to the consumer's router and tests.
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "no-console": ["error", { allow: ["warn", "error"] }],
    },
  },

  /* -- tests may be looser; they assert on the details --------------------- */
  {
    files: ["**/__tests__/**/*.{ts,tsx}", "**/*.test.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "no-console": "off",
    },
  },

  /* -- the icon surface is the one place lucide-react is allowed ----------- */
  {
    files: ["packages/icons/src/**/*.{ts,tsx}"],
    rules: { "no-restricted-imports": "off" },
  },

  /* -- apps are products, not the library ---------------------------------- */
  {
    files: ["apps/**/*.{ts,tsx}", "scripts/**/*.mjs"],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
    rules: {
      "no-restricted-syntax": "off",
      "no-restricted-imports": "off",
      "no-console": "off",
    },
  },
);
