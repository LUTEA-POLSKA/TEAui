import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

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
    plugins: { "react-hooks": reactHooks },
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

      // `focus:` fires on mouse click, so a click leaves a ring where a click
      // should not leave one. The audit found `focus:` on four controls, and on
      // a non-focusable `div` where it could never fire at all.
      "no-restricted-syntax": [
        "error",
        {
          selector: "JSXAttribute[name.name='className'] Literal",
          message:
            "Audit-Befund: Fokus nie über `focus:`, immer über `focus-visible:`. Eine Maus-Klick-Routine ist kein Fokus.",
        },
      ],
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
      // Raw hex in a component is how two products ended up with four different
      // "success greens". A theme owns values; a component may not.
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "JSXAttribute[name.name='className'] Literal[value=/#[0-9a-fA-F]{3,8}\\b/]",
          message:
            "Audit-Befund: keine Hexwerte in Komponenten. Nutze eine semantische Rolle (bg-surface, text-fg-muted, ...).",
        },
        {
          selector: "Literal[value=/^#[0-9a-fA-F]{3,8}$/]",
          message:
            "Audit-Befund: keine Hexwerte im TEA-UI-Code. Farben gehoeren in packages/tokens/src/themes.css.",
        },
        {
          selector: "Literal[value=/^z-\\[/]",
          message:
            "Audit-Befund: keine freien z-Index-Werte. Nutze die Skala (z-modal, z-popover, z-toast, ...).",
        },
        {
          selector: "Literal[value=/^text-\\[(\\d+)px\\]/]",
          message:
            "Audit-Befund: keine px-Schriftgroessen. Der Massstab beginnt bei 11px (text-label); darunter war in beiden Quellprodukten echter Text.",
        },
        {
          selector: "JSXExpressionContainer > Literal[value=/^rounded-(sm|md|lg|xl|2xl|3xl|full)$/]",
          message:
            "Audit-Befund: Radius ist 0 (rounded-none) oder pill. pill ist den fünf dokumentierten Semantiken vorbehalten.",
        },
        {
          selector: "Literal[value=/^shadow-(sm|md|lg|xl|2xl|inner)$/]",
          message:
            "Audit-Befund: Elevation hat drei Stufen (raised, overlay, modal). Keine freien Tailwind-Schatten.",
        },
        {
          selector: "JSXAttribute[name.name='className'] Literal[value=/(^|\\s)!\\w/]",
          message:
            "Audit-Befund: keine !-Overrides im Bibliothekscode. Sie verdecken eine falsche Variantenentscheidung.",
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
