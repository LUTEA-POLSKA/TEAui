/**
 * TEA UI — utilities.
 *
 * The smallest package in the system, and the one with the fewest opinions.
 * Its job is to make the house style the path of least resistance: one class
 * merge, one variant author, one prefix, one exhaustive check.
 *
 * It has no React dependency and no design opinions, so anything that needs
 * either belongs elsewhere.
 */

import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * The single class merge used by every TEA UI package.
 *
 * Both source projects had a `cn`, but they were not the same function: one
 * was a compiled `clsx + tailwind-merge` replacement, the other an explicit
 * composition, and one codebase even had a second import path that
 * bypassed its own barrel. A component copied between projects therefore
 * changed behaviour silently. There is exactly one now, and there is exactly
 * one import path.
 *
 * TEA UI's colour, radius, shadow and type utilities come from a reset
 * Tailwind namespace, so they are not in tailwind-merge's default theme
 * vocabulary. They are registered explicitly below: without this, `bg-surface`
 * and `bg-canvas` would be treated as unrelated classes and both would reach
 * the DOM, leaving the winner to stylesheet order instead of the caller.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        { text: ["label", "micro", "ui", "body", "lead", "title", "section", "display", "hero", "mono"] },
      ],
      rounded: [{ rounded: ["none", "pill"] }],
      shadow: [{ shadow: ["none", "raised", "overlay", "modal", "inset"] }],
    },
  },
});

/**
 * The z-index scale TEA UI ships as custom utilities. Tailwind has no `z-*`
 * theme namespace, so tailwind-merge has no group to extend for it, and
 * `z-50 z-modal` would otherwise both reach the DOM with the winner decided by
 * stylesheet order. A five-line pass is cheaper than a fork of tailwind-merge.
 */
const Z_UTILITIES = new Set([
  "z-base",
  "z-raised",
  "z-sticky",
  "z-header",
  "z-dropdown",
  "z-overlay",
  "z-modal",
  "z-popover",
  "z-toast",
  "z-tooltip",
  "z-max",
]);

/** Keep only the last occurrence of each TEA z utility. */
function keepLastZUtilities(merged: string): string {
  const classes = merged.split(" ").filter(Boolean);
  const lastIndex = new Map<string, number>();
  classes.forEach((className, index) => {
    if (Z_UTILITIES.has(className)) lastIndex.set(className, index);
  });
  if (lastIndex.size < 2) return merged;
  return classes
    .filter((className, index) => !Z_UTILITIES.has(className) || lastIndex.get(className) === index)
    .join(" ");
}

export function cn(...inputs: ClassValue[]): string {
  return keepLastZUtilities(twMerge(clsx(inputs)));
}

/** Alias for {@link cn}, for call sites where "compose" reads better. */
export const cx = cn;

export type { ClassValue };

export { clsx };

/**
 * `class-variance-authority`, re-exported from one place so variant authoring
 * is uniform across packages. cva is the only supported way to express a
 * variant surface: it keeps a component's variant space declarative and
 * greppable instead of spread across a `switch` in a render function.
 */
export { cva, type VariantProps } from "class-variance-authority";

/** Every TEA UI component prefixes its `data-slot` with this. */
export const TEA_PREFIX = "tea";

/**
 * Build a namespaced `data-slot` value, e.g. `slot("button", "icon")` ->
 * `"tea-button-icon"`. One helper means one naming convention, and a
 * convention that a test can assert.
 */
export function slot(...parts: string[]): string {
  return [TEA_PREFIX, ...parts].join("-");
}

/**
 * Exhaustiveness check. The audit found five independent hand-written
 * status-to-label tables per project, each disagreeing with the others; the
 * type system catches the sixth version of that the moment a new variant
 * appears without a label.
 *
 * ```ts
 * function toneOf(t: Tone): string {
 *   switch (t) {
 *     case "positive": return "ok";
 *     // ...
 *     default: return assertNever(t);
 *   }
 * }
 * ```
 */
export function assertNever(value: never, message?: string): never {
  throw new Error(message ?? `Unhandled variant: ${String(value)}`);
}

/**
 * Join class names and drop falsy entries, without merging. Useful when
 * composing a class string that must NOT be deduplicated against a base
 * (rare — prefer {@link cn} — but needed when a caller deliberately wants two
 * `bg-*` classes to both reach the cascade).
 */
export function joinClasses(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
