import { RuleTester } from "eslint";
import { describe, expect, it } from "vitest";

import { teaUi } from "../scripts/eslint-plugin-tea-ui.mjs";

/**
 * The two TEA UI rules are the only rules in this repository that are not a
 * selector plus a value pattern, and that makes them the two most likely to rot.
 *
 * They already had one silent failure each: `className={cn("a", "b")}` is a
 * `JSXExpressionContainer`, so the first version read a property that was not
 * there and matched nothing in the entire codebase. A rule that matches nothing
 * and a rule that is absent report identically — green. These tests are what
 * makes the difference visible, and the "must be reported" cases are deliberately
 * written in the shapes the codebase actually uses rather than in the shape that
 * is easiest to type.
 */
const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2023,
    sourceType: "module",
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

describe("tea-ui/outline-needs-replacement", () => {
  ruleTester.run("outline-needs-replacement", teaUi.rules["outline-needs-replacement"], {
    valid: [
      {
        // A single literal with a replacement.
        name: "literal outline-none paired with focus-visible:outline",
        code: `<a className="outline-none focus-visible:outline-2" />`,
      },
      {
        // The shape the whole repository uses: several literals inside cn().
        name: "cn() with the replacement in a different literal",
        code: `<a className={cn("outline-none", "focus-visible:ring-2")} />`,
      },
      {
        name: "no outline-none at all",
        code: `<a className="focus-visible:ring-2" />`,
      },
      {
        name: "Radix listbox item, where highlighted *is* the focus state",
        code: `<li className="outline-none data-[highlighted]:outline-2" />`,
      },
      {
        name: "not a className",
        code: `<a data-x="outline-none" />`,
      },
      {
        name: "focus-visible alone is not an outline-none",
        code: `<a className="focus-visible:outline-none" />`,
      },
    ],
    invalid: [
      {
        name: "outline-none with no replacement in a single literal",
        code: `<a className="flex items-center outline-none" />`,
        errors: [{ messageId: "missingReplacement" }],
      },
      {
        // This is the case that used to pass silently.
        name: "outline-none in a cn() call with no replacement anywhere",
        code: `<a className={cn("fixed end-0 top-0 outline-none", "p-3")} />`,
        errors: [{ messageId: "missingReplacement" }],
      },
      {
        name: "outline-none in a ternary branch",
        code: `<a className={isOpen ? "outline-none" : ""} />`,
        errors: [{ messageId: "missingReplacement" }],
      },
      {
        name: "a ring on a non-focus variant does not count",
        code: `<a className="outline-none focus:ring-2" />`,
        errors: [{ messageId: "missingReplacement" }],
      },
    ],
  });

  it("registers both rules under the tea-ui namespace", () => {
    expect(Object.keys(teaUi.rules).sort()).toEqual(["focus-not-focus-visible", "outline-needs-replacement"]);
  });
});

describe("tea-ui/focus-not-focus-visible", () => {
  ruleTester.run("focus-not-focus-visible", teaUi.rules["focus-not-focus-visible"], {
    valid: [
      { name: "focus-visible only", code: `<a className="focus-visible:ring-2" />` },
      {
        name: "focus-visible at the seam between two cn() literals",
        code: `<a className={cn("sr-only", "focus-visible:not-sr-only")} />`,
      },
      { name: "a class called `focus` without a colon", code: `<a className="focus" />` },
      { name: "not a className", code: `<a data-x="focus:ring-2" />` },
    ],
    invalid: [
      {
        name: "bare focus: in a single literal",
        code: `<a className="focus:not-sr-only" />`,
        errors: [{ messageId: "bareFocus" }],
      },
      {
        // The SkipLink case: this is what survived the first version of the rule.
        name: "bare focus: inside a multi-literal cn() call",
        code: `<a className={cn("sr-only z-max focus:not-sr-only", "focus:fixed focus:start-3")} />`,
        errors: [{ messageId: "bareFocus" }],
      },
    ],
  });
});
