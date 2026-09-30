/**
 * TEA UI — a local ESLint plugin.
 *
 * `no-restricted-syntax` matches a selector and a value pattern. That is enough
 * for a *ban*, and TEA UI uses it for the bans. Audit rule 2 is not a ban:
 *
 * > `outline-none` without a replacement ring in the same rule
 * > enforcement: custom AST rule — `outline-none` requires `focus-visible:ring`
 * > or `focus-visible:outline`
 *
 * "Without a replacement **in the same rule**" is a statement about two classes
 * that co-occur in one className string, which a value pattern cannot express.
 * Approximating it with a blanket ban on `outline-none` looks stricter and is
 * actually wrong: seven components in `core` pair it correctly with a
 * `focus-visible:` ring, and a rule that forces them to drop it would delete the
 * focus indicator from every checkbox, switch, slider thumb and menu link.
 *
 * So the rule is written properly. It is ~40 lines, it has no dependency beyond
 * ESLint itself, and it is the only place in the repository that knows what
 * "a replacement" means.
 */

/**
 * Anything that paints a focus indicator.
 *
 * Two forms count, and the second one needs its justification: in a Radix select
 * or listbox the item is focused *programmatically* while the user walks it with
 * the arrow keys, so `data-[highlighted]` is the focus state and
 * `data-[highlighted]:outline-2` is the indicator. Requiring `focus-visible:`
 * there would force a class that never fires, or — worse — a rule that gets
 * satisfied by removing the outline altogether. Everything else in the codebase
 * has to use `focus-visible:`.
 */
const REPLACEMENT = /(^|\s)(focus-visible|data-\[highlighted\]):(outline|ring)/;

/** The class that removes the browser default indicator. */
const REMOVAL = /(^|\s)outline-none/;

/** A word boundary that is not a hyphen, so `focus-visible:` survives. */
const BARE_FOCUS = /(^|[\s"'`])focus:(?!-)/;

/**
 * Collect every string literal inside a `className` value, joined by a space.
 *
 * This is the part that decides whether the rule works at all. Two details, and
 * the first version of this rule had both wrong:
 *
 * 1. `className={cn("a", "b")}` is a **`JSXExpressionContainer`**, not a
 *    `CallExpression`. Reading `node.value.arguments` therefore threw nothing and
 *    found nothing, and the SkipLink's `focus:` survived.
 * 2. Almost every `className` in this repository is a `cn()` call with *several*
 *    literals —
 *
 *    ```tsx
 *    className={cn("sr-only z-max focus:not-sr-only", "focus:fixed focus:start-3")}
 *    ```
 *
 *    — so a rule that reads only the attribute's direct value sees nothing. The
 *    literals are joined, which also finds a token sitting at the seam between
 *    two of them.
 *
 * Only literals are collected. An interpolated expression (`clsx(stable)`,
 * `` `h-${n}` ``) is opaque by nature; the honest answer is that a dynamic class
 * string cannot be checked, and a rule that pretended otherwise would report
 * failures nobody could act on.
 */
function classNameLiterals(node) {
  if (!node) return "";

  if (node.type === "JSXExpressionContainer") {
    return classNameLiterals(node.expression);
  }

  if (node.type === "Literal") return typeof node.value === "string" ? node.value : "";

  if (node.type === "TemplateLiteral") {
    return node.quasis.map((quasi) => quasi.value.cooked ?? quasi.value.raw).join(" ");
  }

  if (node.type === "ConditionalExpression") {
    return [classNameLiterals(node.consequent), classNameLiterals(node.alternate)].join(" ");
  }

  if (node.type === "LogicalExpression") {
    return [classNameLiterals(node.left), classNameLiterals(node.right)].join(" ");
  }

  if (node.type === "CallExpression") {
    return node.arguments.map((argument) => classNameLiterals(argument)).join(" ");
  }

  return "";
}

/** @type {import("eslint").Rule.RuleModule} */
const outlineNeedsReplacement = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require `outline-none` to be paired with a `focus-visible:` ring or outline in the same className string.",
      recommended: true,
    },
    schema: [],
    messages: {
      missingReplacement:
        "Audit-Befund 2: `outline-none` ohne Ersatz. Fokus ist ein strukturelles Signal, kein optionales — ohne `focus-visible:ring-*` oder `focus-visible:outline-*` in derselben Klasse hat ein Tastaturnutzer keinen Fokusring. Steht die Auswahl auf einem Native-Element, ist `outline-none` schlicht überflüssig, weil der Token-Layer den Ring bereits malt.",
    },
  },
  create(context) {
    return {
      JSXAttribute(node) {
        if (node.name.type !== "JSXIdentifier" || node.name.name !== "className") return;
        const classes = classNameLiterals(node.value);
        if (!classes) return;
        if (!REMOVAL.test(classes)) return;
        if (REPLACEMENT.test(classes)) return;

        context.report({ node, messageId: "missingReplacement" });
      },
    };
  },
};

/** @type {import("eslint").Rule.RuleModule} */
const focusNotFocusVisible = {
  meta: {
    type: "problem",
    docs: {
      description: "Forbid `focus:` in favour of `focus-visible:`.",
      recommended: true,
    },
    schema: [],
    messages: {
      bareFocus:
        "Audit-Befund 1: `focus:` feuert auch beim Mausklick. Nutze `focus-visible:` — ein Klick ist kein Fokus.",
    },
  },
  create(context) {
    return {
      JSXAttribute(node) {
        if (node.name.type !== "JSXIdentifier" || node.name.name !== "className") return;
        const classes = classNameLiterals(node.value);
        if (!BARE_FOCUS.test(classes)) return;
        context.report({ node, messageId: "bareFocus" });
      },
    };
  },
};

export const teaUi = {
  meta: { name: "tea-ui", version: "1.0.0" },
  rules: {
    "outline-needs-replacement": outlineNeedsReplacement,
    "focus-not-focus-visible": focusNotFocusVisible,
  },
};
