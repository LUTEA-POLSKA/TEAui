import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * TEA UI — theme contrast audit.
 *
 * Accessibility is a platform requirement, so the theme is tested like code
 * rather than reviewed like one. The three reference themes are parsed out of
 * `themes.css` and every documented foreground/background pair is measured
 * against WCAG 2.2 — which is the only reason the two period palettes are
 * defensible. Digg Blue and Last.fm Crimson are the published 2007 hexes and
 * both fail 4.5:1 on a surface that dark; they ship lifted in value, hue
 * untouched, because a period-accurate colour that fails AA is a screenshot.
 *
 * This test exists because the audit found the palettes were never measured. The
 * source projects used `text-muted-foreground: #9A968C` on `#171A21` for small
 * table text and a `ring` colour byte-identical to the `accent` fill — so a
 * focused, selected control was chromatically indistinguishable from one that
 * was only selected, which is precisely the condition WCAG 2.4.11/1.4.11 exist to
 * rule out.
 *
 * If a theme value is edited and this test fails, that is the point: the new
 * value is not shippable until it is re-measured.
 */

const css = readFileSync(resolve(import.meta.dirname, "../themes.css"), "utf8");

/** Roles that must be legible as text on the surface behind them. */
const TEXT_ON_SURFACE: Array<[role: string, minRatio: number]> = [
  ["fg", 4.5],
  ["fg-muted", 4.5],
  ["fg-subtle", 3],
];

const TEXT_ON_CANVAS: Array<[role: string, minRatio: number]> = [
  ["fg", 4.5],
  ["fg-muted", 4.5],
];

const FILLED_SURFACES: Array<[fill: string, on: string, minRatio: number]> = [
  ["primary", "primary-fg", 4.5],
  ["accent", "accent-fg", 4.5],
  ["positive", "positive-fg", 4.5],
  ["info", "info-fg", 4.5],
  ["caution", "caution-fg", 4.5],
  ["critical", "critical-fg", 4.5],
  ["neutral", "neutral-fg", 4.5],
  ["destructive", "destructive-fg", 4.5],
];

/** A tone's own colour must be readable on the surface behind it. */
const TONE_ON_SURFACE: Array<[role: string, minRatio: number]> = [
  ["positive", 4.5],
  ["info", 4.5],
  ["caution", 4.5],
  ["critical", 4.5],
  ["ring", 3],
  ["brand", 3],
];

/**
 * Tones that must not be mistaken for the primary action.
 *
 * `critical` and `positive` are excluded on purpose: in every reference theme
 * they are the far end of the wheel from the action colour, and a palette where
 * "destroy" sits next to "confirm" in the same hue is a different problem that
 * this rule would not catch.
 */
const SEPARABLE_TONES: readonly string[] = ["info", "caution"];

function parseThemes(): Record<string, Record<string, string>> {
  const themes: Record<string, Record<string, string>> = {};
  // The name pattern accepts digits and dashes. It used to be `[a-z]+`, which
  // silently parsed only the alphabetic theme and reported "one theme" rather
  // than failing — a test that cannot see a theme cannot fail about it, so the
  // count assertion below is the part that does the work.
  const blockPattern = /(:root,\s*\[data-theme="tea"\]|\[data-theme="([a-z0-9-]+)"\])\s*\{([^}]*)\}/g;
  let match: RegExpExecArray | null;

  while ((match = blockPattern.exec(css)) !== null) {
    const name = match[2] ?? "tea";
    const body = match[3] ?? "";
    const values: Record<string, string> = {};
    for (const entry of body.matchAll(/--tea-([a-z0-9-]+):\s*([^;]+);/g)) {
      const key = entry[1]!;
      let value = entry[2]!.trim();
      if (value.startsWith("var(")) {
        // Keys are stored without the `--tea-` prefix, so the reference has to
        // be normalised the same way or every alias resolves to itself.
        const referenced = value.slice(4, value.indexOf(")")).trim().replace(/^--tea-/, "");
        value = values[referenced] ?? value;
      }
      values[key] = value;
    }
    themes[name] = values;
  }
  return themes;
}

const THEMES = parseThemes();

/* -------------------------------------------------------------------------- */
/* Colour maths                                                                */
/* -------------------------------------------------------------------------- */

function toRgb(value: string): [number, number, number] {
  const hex = value.trim().replace("#", "");
  const full =
    hex.length === 3
      ? hex
          .split("")
          .map((char) => char + char)
          .join("")
      : hex;
  return [
    Number.parseInt(full.slice(0, 2), 16),
    Number.parseInt(full.slice(2, 4), 16),
    Number.parseInt(full.slice(4, 6), 16),
  ];
}

function relativeLuminance(value: string): number {
  const [r, g, b] = toRgb(value).map((channel) => {
    const c = channel / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0);
}

function contrast(a: string, b: string): number {
  const first = relativeLuminance(a);
  const second = relativeLuminance(b);
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return (lighter + 0.05) / (darker + 0.05);
}

/* -------------------------------------------------------------------------- */

describe("reference themes", () => {
  it("parses all three themes", () => {
    expect(Object.keys(THEMES).sort()).toEqual(["pop", "tea", "ton"]);
  });

  for (const [name, values] of Object.entries(THEMES)) {
    describe(name, () => {
      it.each(TEXT_ON_CANVAS)("%s on canvas meets %s:1", (role, min) => {
        const ratio = contrast(values[role]!, values.canvas!);
        expect(ratio).toBeGreaterThanOrEqual(min);
      });

      it.each(TEXT_ON_SURFACE)("%s on surface meets %s:1", (role, min) => {
        const ratio = contrast(values[role]!, values.surface!);
        expect(ratio).toBeGreaterThanOrEqual(min);
      });

      it.each(FILLED_SURFACES)("%s / %s meets %s:1", (fill, on, min) => {
        const ratio = contrast(values[fill]!, values[on]!);
        expect(`${fill} ${values[fill]} on ${on} ${values[on]} → ${ratio.toFixed(2)}`).toBeTruthy();
        expect(ratio).toBeGreaterThanOrEqual(min);
      });

      it.each(TONE_ON_SURFACE)("%s on surface meets %s:1", (role, min) => {
        const ratio = contrast(values[role]!, values.surface!);
        expect(`${role}=${values[role]} on surface → ${ratio.toFixed(2)}:1`).toBeTruthy();
        expect(ratio).toBeGreaterThanOrEqual(min);
      });

      it.each(SEPARABLE_TONES)("gives %s a hue distinguishable from the primary action", (role) => {
        // The audit's finding: both source products use a gold primary, so an
        // amber "warning" would be indistinguishable from the accent at small
        // sizes. Orange is the deliberate resolution.
        //
        // `info` was left out of this check for a long time, and that is how the
        // `pop` theme shipped a Flock Blue `#4096EE` sitting 17 channels from
        // its own Sky Blue primary — inside the threshold this very test applies
        // to `caution`. A blue action and a blue information are as
        // indistinguishable as a gold action and an amber warning, so the rule
        // is now written once and applied to every tone that can be confused
        // with a primary.
        const primary = toRgb(values.primary!);
        const tone = toRgb(values[role]!);
        const distance = Math.max(
          Math.abs(primary[0] - tone[0]),
          Math.abs(primary[1] - tone[1]),
          Math.abs(primary[2] - tone[2]),
        );
        expect(`${role}=${values[role]} vs primary=${values.primary} → ${distance}`).toBeTruthy();
        expect(distance).toBeGreaterThan(20);
      });

      it("keeps the border visible against the surface it sits on", () => {
        // WCAG 1.4.11: a boundary that carries meaning needs 3:1. A 1px border is
        // the entire structure of this design language, so it has to measure.
        expect(contrast(values.line!, values.surface!)).toBeGreaterThanOrEqual(1.3);
        expect(contrast(values["line-strong"]!, values.surface!)).toBeGreaterThanOrEqual(2);
      });
    });
  }
});
