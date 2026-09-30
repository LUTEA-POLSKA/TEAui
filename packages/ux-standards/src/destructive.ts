/**
 * TEA UI — destructive action policy.
 *
 * The rule that matters: choose the *weakest* protection that is sufficient
 * for the consequence. Every unnecessary confirmation dialog is a dialog the
 * user learns to dismiss without reading, and that habit is what makes the one
 * dialog they should have read get dismissed too. So confirmation is spent
 * where it buys something, and undo is used wherever it is available.
 *
 * The audit found the opposite at both source projects: a reversible two-step
 * inline confirmation sitting next to an irreversible `DELETE` with no
 * confirmation at all.
 */

export const CONSEQUENCE_LEVELS = ["reversible", "recoverable", "irreversible"] as const;

export type ConsequenceLevel = (typeof CONSEQUENCE_LEVELS)[number];

/** How a destructive action must be protected. */
export type Protection = "undo" | "confirm" | "confirm-typed" | "confirm-hold";

export interface DestructivePolicy {
  /** What the action destroys. */
  readonly level: ConsequenceLevel;
  /** The protection TEA UI requires. */
  readonly protection: Protection;
  /** Whether the consequence must be spelled out in the dialog body. */
  readonly explainConsequence: boolean;
  /** Whether the primary button may be the destructive one. */
  readonly destructivePrimary: boolean;
}

/**
 * The policy table.
 *
 * `reversible`   — undo is offered instead of a dialog. Nothing is asked.
 * `recoverable`  — a confirm dialog, because the data can be recovered but the
 *                  user would notice its absence. The primary button is NOT
 *                  destructive: cancelling must be the easy path.
 * `irreversible` — a confirm dialog that names the consequence, and for
 *                  anything that cannot be undone at all, requires typing the
 *                  resource name. Cancelling stays the default focus.
 */
export const DESTRUCTIVE_POLICY: Readonly<Record<ConsequenceLevel, DestructivePolicy>> = {
  reversible: {
    level: "reversible",
    protection: "undo",
    explainConsequence: false,
    destructivePrimary: false,
  },
  recoverable: {
    level: "recoverable",
    protection: "confirm",
    explainConsequence: true,
    destructivePrimary: false,
  },
  irreversible: {
    level: "irreversible",
    protection: "confirm-typed",
    explainConsequence: true,
    destructivePrimary: false,
  },
};

export function destructivePolicy(level: ConsequenceLevel): DestructivePolicy {
  return DESTRUCTIVE_POLICY[level];
}

/** The verb pair an alert dialog uses, per the content standard (§22). */
export const DESTRUCTIVE_VERBS = {
  confirm: {
    reversible: "Undo",
    recoverable: "Continue anyway",
    irreversible: "Delete permanently",
  },
  cancel: "Cancel",
} as const;

/**
 * The consequence sentence a dialog body must contain. Written as a function
 * rather than a template so the noun stays in one place — a dialog that says
 * "is being deleted" next to a button that says "Restore" is worse than
 * no dialog.
 */
export function consequenceSentence(what: string, level: ConsequenceLevel): string {
  switch (level) {
    case "reversible":
      return `${what} can be undone for a short time.`;
    case "recoverable":
      return `${what} is removed permanently. Restoring it is only possible from a backup.`;
    case "irreversible":
      return `${what} is removed permanently. This step cannot be undone.`;
  }
}
