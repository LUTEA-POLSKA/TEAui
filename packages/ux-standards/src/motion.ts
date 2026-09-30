/**
 * TEA UI — motion, density, performance UX and data-visualisation standards.
 *
 * These four are grouped because they are the same question asked about time
 * and space: how much of the user's attention does the interface get to spend?
 */

import { MOTION } from "@tea-ui/tokens";

export { MOTION };

/**
 * Motion is only justified when it answers one of these questions. Anything
 * else is decoration, and decoration in a working UI is a cost the user pays
 * every time they open the page.
 */
export const MOTION_PURPOSE = ["feedback", "spatial-relationship", "state-change", "loading", "attention"] as const;

export type MotionPurpose = (typeof MOTION_PURPOSE)[number];

/** The permitted transition patterns, per UX-Standards §23. */
export const TRANSITION_PATTERNS = {
  /** Hover, press, colour change. Short. */
  feedback: { duration: MOTION.duration.fast, ease: MOTION.ease.standard },
  /** Panel, popover, dropdown appearing in place. */
  entrance: { duration: MOTION.duration.normal, ease: MOTION.ease.entrance },
  /** Dismissal. Faster than entrance, because the user asked for it to go. */
  exit: { duration: MOTION.duration.fast, ease: MOTION.ease.exit },
  /** A value changing in place — width, position, colour. */
  stateChange: { duration: MOTION.duration.normal, ease: MOTION.ease.standard },
  /** Layout shift after content arrives. Deliberately minimal. */
  reflow: { duration: MOTION.duration.slow, ease: MOTION.ease.standard },
} as const;

/**
 * Reduced motion is a floor, not an option. The audit found zero
 * `prefers-reduced-motion` handling across two projects: 13 unguarded spinners
 * and every overlay animation unconditional. The CSS floor lives in
 * `tokens/src/index.css`; these are the rules about what remains.
 */
export const REDUCED_MOTION = {
  /** Essential, non-motion progress indicators must stay, as designed. */
  preserveEssential: true,
  /** Data attributes: add `data-tea-motion="essential"` to opt out. */
  attribute: "data-tea-motion",
  values: ["essential", "decorative"] as const,
  /** An animation that carries meaning must have a non-motion equivalent. */
  requireNonMotionEquivalent: true,
} as const;

/* -------------------------------------------------------------------------- */
/* Performance UX                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Which loading affordance to use. The audit's clearest defect was treating
 * these as interchangeable and replacing readable content with a spinner on
 * every poll.
 */
export const LOADING_AFFORDANCE = {
  /** Nothing on screen yet, first load. A skeleton matching the real layout. */
  initial: "skeleton",
  /** Content exists and stays. A quiet indicator; never replace the content. */
  refresh: "inline-indicator",
  /** A user-triggered operation. Inline progress on the control that started it. */
  processing: "control-progress",
  /** A long operation the user must wait for. Determinate progress if possible. */
  blocking: "progress",
  /** A background operation the user may leave. Announce on completion. */
  background: "toast-on-complete",
} as const;

/** Minimum time a skeleton stays up, so it never flashes. */
export const MIN_SKELETON_MS = 250;

/** Never block the UI for a background operation. */
export const BACKGROUND_OPERATION = {
  blockUI: false,
  announceOnComplete: true,
  allowCancel: true,
} as const;

/* -------------------------------------------------------------------------- */
/* Data visualisation                                                          */
/* -------------------------------------------------------------------------- */

/**
 * A chart must be readable with no colour perception at all. That is a hard
 * requirement, not a preference: it is the difference between a dashboard that
 * survives a monochrome printout and one that does not.
 */
export interface DataVizRules {
  /** Every series also carries a distinct mark, dash pattern or label. */
  readonly requireNonColourEncoding: boolean;
  /** Axes and gridlines must meet text contrast, not "looks fine" contrast. */
  readonly minimumAxisContrast: number;
  /** Missing data is drawn as a gap or a marker, never interpolated silently. */
  readonly showMissingData: boolean;
  /** Every chart ships a text alternative or a data table. */
  readonly requireTextAlternative: boolean;
  /** Legends label series; tooltips give exact values. */
  readonly requireLegendForMultipleSeries: boolean;
}

export const DATA_VIZ: DataVizRules = {
  requireNonColourEncoding: true,
  minimumAxisContrast: 3,
  showMissingData: true,
  requireTextAlternative: true,
  requireLegendForMultipleSeries: true,
};

/* -------------------------------------------------------------------------- */
/* Empty state                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Every meaningful empty state answers three questions. "No entries." on
 * its own answers none of them, and the audit found ten of them.
 */
export interface EmptyStateAnatomy {
  /** What is empty, named specifically. "No servers", not "No entries". */
  readonly what: string;
  /** Why it is empty, when the reason is not obvious. */
  readonly why?: string;
  /** The primary next action, when there is one. */
  readonly action?: string;
  /** A secondary escape hatch, e.g. clearing a filter. */
  readonly secondaryAction?: string;
}

/**
 * Titles for the five empty states.
 *
 * English, like every other default in this package. A product renders these to
 * whoever is looking at an empty list, which is not a reader who necessarily
 * wants German.
 */
export const EMPTY_STATE_TITLES = {
  neverCreated: "Nothing here yet",
  noResults: "No matches",
  filtered: "Everything is filtered out",
  noAccess: "No access",
  error: "Not loaded",
} as const;

export type EmptyStateTitle = (typeof EMPTY_STATE_TITLES)[keyof typeof EMPTY_STATE_TITLES];
