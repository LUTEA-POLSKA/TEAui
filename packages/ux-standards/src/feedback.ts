import type { Tone } from "@tea-ui/tokens";

/**
 * TEA UI — the feedback state model.
 *
 * Every asynchronous surface in a TEA product is in exactly one of these
 * states, and the states are named here so that two products handling the same
 * situation behave the same way. The audit found eight independent
 * "Lade …" loaders, ten empty states, nine error banners and four dialects of
 * each, with no shared naming and inconsistent live-region behaviour.
 *
 * The progression the model expects, and the reason for it:
 *
 *   action -> immediate acknowledgement -> progress -> result -> next action
 *
 * A user action must never be silent. It must never show a spinner over
 * content the user is already reading, either.
 */

export const FEEDBACK_STATES = [
  "idle",
  "loading",
  "refreshing",
  "processing",
  "success",
  "warning",
  "error",
  "empty",
  "disabled",
  "offline",
  "unauthorized",
  "forbidden",
  "notFound",
  "maintenance",
  "stale",
  "syncing",
  "retrying",
] as const;

export type FeedbackState = (typeof FEEDBACK_STATES)[number];

export type FeedbackKind = "initial" | "background" | "blocking";

export interface FeedbackMeta {
  /**
   * `initial`  — nothing to show yet, so a skeleton or a spinner replaces the
   *              content. Used once, on first load.
   * `background`— content exists and stays visible; the state is communicated
   *              without replacing anything. Used for refresh, sync, save.
   * `blocking`  — the user cannot proceed; a spinner or progress is required.
   */
  readonly kind: FeedbackKind;
  /** The tone this state should render in, where a colour applies. */
  readonly tone: Tone;
  /**
   * Whether this state is a problem the user must resolve, or merely
   * information. Drives whether the surface offers a recovery action.
   */
  readonly blocking: boolean;
  /** Whether a live region should announce a change into this state. */
  readonly announce: boolean;
  /** Default noun phrase for a progress line, e.g. "Loading". */
  readonly label: string;
}

export const FEEDBACK: Readonly<Record<FeedbackState, FeedbackMeta>> = {
  idle: {
    kind: "background",
    tone: "neutral",
    blocking: false,
    announce: false,
    label: "Ready",
  },
  loading: {
    kind: "initial",
    tone: "neutral",
    blocking: true,
    announce: true,
    label: "Loading",
  },
  refreshing: {
    kind: "background",
    tone: "neutral",
    blocking: false,
    announce: true,
    label: "Refreshing",
  },
  processing: {
    kind: "blocking",
    tone: "info",
    blocking: true,
    announce: true,
    label: "Processing",
  },
  success: {
    kind: "background",
    tone: "positive",
    blocking: false,
    announce: true,
    label: "Successful",
  },
  warning: {
    kind: "background",
    tone: "caution",
    blocking: false,
    announce: true,
    label: "Note",
  },
  error: {
    kind: "background",
    tone: "critical",
    blocking: false,
    announce: true,
    label: "Error",
  },
  empty: {
    kind: "initial",
    tone: "neutral",
    blocking: false,
    announce: true,
    label: "No entries",
  },
  disabled: {
    kind: "background",
    tone: "neutral",
    blocking: false,
    announce: false,
    label: "Unavailable",
  },
  offline: {
    kind: "background",
    tone: "caution",
    blocking: false,
    announce: true,
    label: "Offline",
  },
  unauthorized: {
    kind: "background",
    tone: "caution",
    blocking: true,
    announce: true,
    label: "Not signed in",
  },
  forbidden: {
    kind: "background",
    tone: "caution",
    blocking: true,
    announce: true,
    label: "No permission",
  },
  notFound: {
    kind: "background",
    tone: "neutral",
    blocking: false,
    announce: true,
    label: "Not found",
  },
  maintenance: {
    kind: "background",
    tone: "info",
    blocking: true,
    announce: true,
    label: "Maintenance",
  },
  stale: {
    kind: "background",
    tone: "caution",
    blocking: false,
    announce: true,
    label: "Stale data",
  },
  syncing: {
    kind: "background",
    tone: "info",
    blocking: false,
    announce: true,
    label: "Syncing",
  },
  retrying: {
    kind: "background",
    tone: "info",
    blocking: false,
    announce: true,
    label: "Retrying",
  },
};

/**
 * States that must never replace content that is already on screen.
 *
 * The audit's clearest single defect: both source projects replace a whole
 * region with a centred spinner on every poll, so a five-second auto-refresh
 * flashes the UI away from content the user was reading. `refreshing`,
 * `syncing`, `stale` and `retrying` must be communicated as an overlay or a
 * quiet indicator over preserved content.
 */
export const NON_DESTRUCTIVE_STATES = ["refreshing", "syncing", "stale", "retrying"] as const;

export type NonDestructiveState = (typeof NON_DESTRUCTIVE_STATES)[number];

export function isNonDestructive(state: FeedbackState): state is NonDestructiveState {
  return (NON_DESTRUCTIVE_STATES as readonly string[]).includes(state);
}

export function feedbackMeta(state: FeedbackState): FeedbackMeta {
  return FEEDBACK[state];
}

/**
 * Build a `data-tea-state` value for a surface, so a state is inspectable from
 * the DOM and assertable in a test rather than only visible.
 */
export function feedbackAttr(state: FeedbackState): { "data-tea-state": FeedbackState } {
  return { "data-tea-state": state };
}
