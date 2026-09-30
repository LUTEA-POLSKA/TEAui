import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { MOTION } from "../index";

/**
 * TEA UI — the motion scale, in JS and in CSS.
 *
 * `MOTION.duration` and the `--tea-duration-*` values describe the same four
 * numbers, and they live in two files that cannot see each other: the first is
 * a TypeScript constant, the second a stylesheet. Nothing kept them in step.
 *
 * That gap is not abstract, and it shipped a bug. Because CSS could not name a
 * duration, components wrote `duration-[120ms]` by hand — while three others
 * (`Button`, `Select`, `Combobox`) had already adopted `duration-fast`, a class
 * that **did not exist in any build**. `--duration-*` is not a Tailwind v4 theme
 * namespace, so declaring it in `@theme` produced nothing. The arbitrary-value
 * form kept compiling, so the workaround masked the broken abstraction instead
 * of revealing it.
 *
 * Hence two checks: the numbers must match, and the utilities must actually be
 * declared. A duration that no stylesheet carries is not a token, it is a
 * comment.
 */
const css = readFileSync(resolve(import.meta.dirname, "../index.css"), "utf8");

describe("motion tokens", () => {
  it.each(["instant", "fast", "normal", "slow"] as const)(
    "--tea-duration-%s matches MOTION.duration.%s",
    (name) => {
      const match = new RegExp(`--tea-duration-${name}:\\s*(\\d+)ms;`).exec(css);
      expect(match, `--tea-duration-${name} is not declared in index.css`).not.toBeNull();
      expect(Number(match![1])).toBe(MOTION.duration[name]);
    },
  );

  it("names every duration the JS scale defines, and defines none it does not", () => {
    const declared = [...css.matchAll(/--tea-duration-([a-z]+):/g)].map((m) => m[1]);
    expect([...declared].sort()).toEqual([...Object.keys(MOTION.duration)].sort());
  });

  it("declares a real utility per duration, because --duration-* is not a namespace", () => {
    for (const name of ["instant", "fast", "normal", "slow"] as const) {
      const utility = new RegExp(`@utility duration-${name}\\s*\\{[^}]*\\}`).exec(css);
      expect(utility, `no @utility block for duration-${name}`).not.toBeNull();
      expect(utility![0]).toContain(`var(--tea-duration-${name})`);
    }

    // The failure this guards: the class was requested by three components and
    // produced nothing, because the declaration sat in `@theme` where Tailwind
    // has no duration namespace to generate it from.
    expect(css).not.toMatch(/@theme[^}]*--duration-(instant|fast|normal|slow)\s*:/);
  });

  it("resolves the default transition, which pointed at a variable that never existed", () => {
    const duration = /--default-transition-duration:\s*([^;]+);/.exec(css);
    const timing = /--default-transition-timing-function:\s*([^;]+);/.exec(css);
    expect(duration![1]).toBe("var(--tea-duration-normal)");
    expect(timing![1]).toBe("var(--tea-ease-standard)");

    // Both targets must be declared, or the default silently falls back.
    for (const reference of [duration![1]!, timing![1]!]) {
      const name = /var\((--[a-z-]+)\)/.exec(reference)![1]!;
      expect(css, `${name} is referenced but never declared`).toContain(`${name}:`);
    }
  });

  it("keeps a reduced-motion floor that outranks the utilities", () => {
    // The audit found zero `prefers-reduced-motion` handling across two
    // projects, so this floor is not optional. `!important` is required: the
    // enter/exit animation utilities are otherwise unconditional, and a
    // component that animates must be able to rely on the floor winning.
    const block = /@media \(prefers-reduced-motion: reduce\) \{([\s\S]*?)\n {2}\}/.exec(css);
    expect(block, "no prefers-reduced-motion block found").not.toBeNull();
    expect(block![1]).toContain("transition-duration: 0.01ms !important");
    expect(block![1]).toContain("animation-duration: 0.01ms !important");
  });
});
