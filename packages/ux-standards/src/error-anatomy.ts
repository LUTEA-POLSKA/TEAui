/**
 * TEA UI — error anatomy.
 *
 * An error message is not a string, it is an answer to four questions. A
 * message that answers fewer than all four is not "brief" — it is
 * unactionable, and the user is forced to file a support request to find out
 * what happened.
 *
 *   1. What happened?
 *   2. Why did it happen?
 *   3. What can the user do?
 *   4. Can the system recover on its own?
 *
 * The audit found `"Error 500"`, `"Failed"` and `"IPC-Fehler"` in user-facing
 * positions, the last of which was not merely unhelpful but actively wrong: the
 * transport was HTTP, not IPC.
 *
 * {@link ErrorAnatomy} is the type every error surface in TEA UI accepts, and
 * {@link renderErrorMessage} produces the headline sentence from it. The
 * technical detail is optional and belongs behind a disclosure — it is for the
 * person filing the report, not for the person who hit the problem.
 */

export type ErrorRecovery =
  /** Nothing the user can do; the system will retry on its own. */
  | "automatic"
  /** A single obvious action, offered as the primary action. */
  | "action"
  /** Several possible causes, so the message must not guess. */
  | "choice"
  /** Nothing can be done here; the user must leave the screen. */
  | "none";

export interface ErrorAnatomy {
  /** Short, human summary of what failed. Never a status code alone. */
  readonly title: string;
  /** Why it failed, in one sentence. "The connection to the server timed out." */
  readonly detail: string;
  /** What the user can do next. Empty only when `recovery` is `automatic`. */
  readonly action?: string;
  /** Label for `action`, e.g. "Try again". */
  readonly actionLabel?: string;
  /** Whether the system can recover without the user. */
  readonly recovery: ErrorRecovery;
  /** Raw detail — stack, request id, upstream body. Disclosure material. */
  readonly technical?: string;
  /** A support or debug reference the user can quote. */
  readonly reference?: string;
}

export const ERROR_TITLES = {
  network: "Connection failed",
  timeout: "Timed out",
  unauthorized: "Not signed in",
  forbidden: "No permission",
  notFound: "Not found",
  validation: "Check the entry",
  conflict: "Conflict",
  rateLimit: "Too many requests",
  server: "Server error",
  unknown: "Unexpected error",
} as const;

export type ErrorKind = keyof typeof ERROR_TITLES;

/**
 * The headline a user reads: what happened, plus why, in one sentence.
 * Deliberately never a bare code, and deliberately never "Something went
 * wrong", which states nothing and asks the user to do the diagnosis.
 */
export function renderErrorMessage(error: ErrorAnatomy): string {
  const detail = error.detail.trim();
  if (!detail) return error.title;
  return `${error.title}. ${detail}`;
}

/**
 * Whether an error surface should expose a retry affordance. Only true when a
 * retry is a real, likely-to-succeed action — offering it for a validation
 * error teaches people that buttons do nothing.
 */
export function shouldOfferRetry(error: ErrorAnatomy): boolean {
  return error.recovery === "action" || error.recovery === "automatic";
}

/** Whether technical detail belongs behind a disclosure rather than inline. */
export function hasTechnicalDetail(error: ErrorAnatomy): boolean {
  return typeof error.technical === "string" && error.technical.trim().length > 0;
}

/**
 * Build an {@link ErrorAnatomy} from anything thrown, without inventing a
 * message. Unrecognised values produce a real title and a real next step, and
 * never leak `[object Object]`.
 */
export function toErrorAnatomy(cause: unknown, fallback: Partial<ErrorAnatomy> = {}): ErrorAnatomy {
  if (isErrorAnatomy(cause)) return cause;

  if (cause instanceof Error) {
    return {
      title: ERROR_TITLES.unknown,
      detail: cause.message || "The operation could not be completed.",
      recovery: "action",
      action: "This can be retried.",
      actionLabel: "Try again",
      // The stack is disclosure material, not a headline. It is attached here so
      // an error surface can offer it without the product having to remember.
      ...(isDevelopment() && cause.stack ? { technical: cause.stack } : {}),
      ...fallback,
    };
  }

  return {
    title: ERROR_TITLES.unknown,
    detail: "The operation could not be completed.",
    recovery: "action",
    action: "This can be retried.",
    actionLabel: "Try again",
    ...fallback,
  };
}

/**
 * Environment check that does not assume a bundler.
 *
 * This package is imported by browser bundles, by Node scripts and by tests, so
 * neither `process` nor `import.meta.env` is available everywhere it runs — which
 * is why both are behind a guard and why nothing here declares a Node type
 * dependency. A package that cannot say where it runs cannot be used everywhere.
 */
function isDevelopment(): boolean {
  try {
    const meta = import.meta as ImportMeta & { env?: Record<string, unknown> };
    const dev = meta.env?.DEV ?? meta.env?.MODE;
    if (typeof dev === "boolean") return dev;
    if (typeof dev === "string") return dev === "development";
  } catch {
    /* not a bundler context */
  }
  return false;
}

function isErrorAnatomy(value: unknown): value is ErrorAnatomy {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as ErrorAnatomy).title === "string" &&
    typeof (value as ErrorAnatomy).detail === "string"
  );
}
