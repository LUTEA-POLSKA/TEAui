/**
 * TEA UI — tokens, TypeScript surface.
 *
 * The CSS in this package is the source of truth for every value. This module
 * exists so that *code* — not just styles — can read the same vocabulary:
 * theme names, density names, the closed tone set, breakpoints and motion
 * tokens. A component that hardcodes `h-8` instead of asking for a density
 * step is a bug, and having the step available here is what makes that
 * avoidable.
 */

/* -------------------------------------------------------------------------- */
/* Themes                                                                      */
/* -------------------------------------------------------------------------- */

/** Every theme TEA UI ships. Themes own roles, never raw component styles. */
export const THEMES = ["tea", "pop", "ton"] as const;

export type ThemeName = (typeof THEMES)[number];

/** The theme applied when nothing is specified. */
export const DEFAULT_THEME: ThemeName = "tea";

export function isThemeName(value: unknown): value is ThemeName {
  return typeof value === "string" && (THEMES as readonly string[]).includes(value);
}

/* -------------------------------------------------------------------------- */
/* Density                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Three information densities, per UX-Standards §16. Admin UI is allowed to be
 * dense; Public UI is not. Setting `data-density` on a container retunes every
 * control inside it through custom properties, so density composes instead of
 * multiplying into a `size` prop on every component.
 */
export const DENSITIES = ["compact", "dense", "default", "comfortable"] as const;

export type Density = (typeof DENSITIES)[number];

export const DEFAULT_DENSITY: Density = "default";

export function isDensity(value: unknown): value is Density {
  return typeof value === "string" && (DENSITIES as readonly string[]).includes(value);
}

/* -------------------------------------------------------------------------- */
/* Tones                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * The tone vocabulary is CLOSED and has five members. It is the only way status
 * reaches a colour — a component may not reach for a raw hex, and a product may
 * not invent a sixth tone. `destructive` is deliberately *not* a sixth tone: it
 * is a role that borrows the `critical` hue, because both mean "bad" and they
 * differ in use, not in colour.
 */
export const TONES = ["positive", "info", "caution", "critical", "neutral"] as const;

export type Tone = (typeof TONES)[number];

/* -------------------------------------------------------------------------- */
/* Semantic roles                                                              */
/* -------------------------------------------------------------------------- */

/**
 * The full role vocabulary a theme may assign. This union is the contract: a
 * theme that wants a new value changes a role, it does not add a role.
 */
export const TOKEN_ROLES = [
  "canvas",
  "surface",
  "surface-2",
  "surface-3",
  "overlay",
  "fg",
  "fg-muted",
  "fg-subtle",
  "fg-inverse",
  "line",
  "line-strong",
  "brand",
  "primary",
  "primary-fg",
  "primary-hover",
  "primary-subtle",
  "primary-border",
  "accent",
  "accent-fg",
  "accent-subtle",
  "ring",
  "ring-strong",
  "positive",
  "positive-fg",
  "positive-subtle",
  "positive-border",
  "info",
  "info-fg",
  "info-subtle",
  "info-border",
  "caution",
  "caution-fg",
  "caution-subtle",
  "caution-border",
  "critical",
  "critical-fg",
  "critical-subtle",
  "critical-border",
  "neutral",
  "neutral-fg",
  "neutral-subtle",
  "neutral-border",
  "destructive",
  "destructive-fg",
  "destructive-subtle",
  "destructive-border",
] as const;

export type TokenRole = (typeof TOKEN_ROLES)[number];

/* -------------------------------------------------------------------------- */
/* Breakpoints                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Mirrors `--breakpoint-*` in index.css. CSS cannot read a custom property
 * inside a media query, so the scale is declared in both places and these are
 * the values JavaScript must use.
 */
export const BREAKPOINTS = {
  sm: "40rem",
  md: "48rem",
  lg: "64rem",
  xl: "80rem",
  "2xl": "96rem",
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

export const BREAKPOINT_PX: Record<Breakpoint, number> = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
};

/* -------------------------------------------------------------------------- */
/* Motion                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Motion tokens, per UX-Standards §23. Motion exists to explain a change, not
 * to decorate a page. Durations are short on purpose: a UI that animates for
 * 300ms has already cost the user more attention than the state change was
 * worth.
 */
export const MOTION = {
  duration: {
    instant: 0,
    fast: 120,
    normal: 180,
    slow: 280,
  },
  ease: {
    standard: "cubic-bezier(0.2, 0, 0, 1)",
    entrance: "cubic-bezier(0.16, 1, 0.3, 1)",
    exit: "cubic-bezier(0.4, 0, 1, 1)",
    emphasized: "cubic-bezier(0.2, 0, 0, 1)",
  },
} as const;

/* -------------------------------------------------------------------------- */
/* Applying a theme                                                            */
/* -------------------------------------------------------------------------- */

export interface ApplyThemeOptions {
  /** Where to apply. Defaults to `document.documentElement`. */
  target?: HTMLElement | null;
  /** Density to set at the same time. Omit to leave the current value alone. */
  density?: Density;
}

function resolveTarget(target?: HTMLElement | null): HTMLElement | null {
  if (target) return target;
  if (typeof document === "undefined") return null;
  return document.documentElement;
}

/**
 * Apply a theme (and optionally a density) to an element.
 *
 * Themes are attribute-driven on purpose: `data-theme` and `data-density` are
 * inspectable from the DOM, survive SSR, and let a consumer override a single
 * region of the page without a re-render.
 */
export function applyTheme(theme: ThemeName, options: ApplyThemeOptions = {}): void {
  const el = resolveTarget(options.target);
  if (!el) return;
  el.setAttribute("data-theme", theme);
  if (options.density) el.setAttribute("data-density", options.density);
}

export function applyDensity(density: Density, options: { target?: HTMLElement | null } = {}): void {
  const el = resolveTarget(options.target);
  if (!el) return;
  el.setAttribute("data-density", density);
}

export function getTheme(target?: HTMLElement | null): ThemeName | null {
  const el = resolveTarget(target);
  const value = el?.getAttribute("data-theme");
  return isThemeName(value) ? value : null;
}

export function getDensity(target?: HTMLElement | null): Density | null {
  const el = resolveTarget(target);
  const value = el?.getAttribute("data-density");
  return isDensity(value) ? value : null;
}
