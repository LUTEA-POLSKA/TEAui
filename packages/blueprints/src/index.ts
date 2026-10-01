/**
 * TEA UI Blueprints — scope registry.
 *
 * A blueprint is a **feature system**: a set of components, patterns and
 * templates that together answer one whole product question. Authentication is
 * the clearest example — it is not a login form, it is a session, a redirect, a
 * password reset, a verification, a two-factor step and an account recovery, and
 * every product that has one has to decide all of them.
 *
 * The value of a blueprint is the decision, not the code. The audit's clearest
 * cross-product finding was that two projects solved login and logout with
 * different behaviour: one used `window.location.href` for sign-out and the other
 * a router push, so one lost in-app state and the other did not. A blueprint
 * makes that the first thing a product inherits and the last thing it re-decides.
 *
 * A blueprint may also publish a schema or a configuration shape. It never
 * contains a backend, and it never calls an API.
 */
export interface BlueprintMeta {
  readonly id: string;
  /** The product question this blueprint answers. */
  readonly answers: string;
  /** The capabilities it must include to count as complete. */
  readonly includes: readonly string[];
  /** The decisions a product gets for free by adopting it. */
  readonly decisions: readonly string[];
  /** What the product must still provide. */
  readonly provides: readonly string[];
  /** The wire-level contract, when the blueprint has one. */
  readonly schema?: string;
}

export const BLUEPRINTS: readonly BlueprintMeta[] = [
  {
    id: "Authentication",
    answers: "Who is signed in, how do they sign in, and how do they get back in?",
    includes: [
      "Sign-in",
      "Registration with email confirmation",
      "Password reset",
      "Two-factor",
      "Session handling and sign-out across all tabs",
      "Account lockout and recovery",
    ],
    decisions: [
      "Signing out clears the session store *and* the local state.",
      "After signing in, the originally requested page is restored — checked against open redirect.",
      "Error messages name the cause without revealing whether an account exists.",
      "Expired sessions lead to an understandable message, not a silent loss of form input.",
    ],
    provides: ["the authentication endpoint", "the session duration", "the failure schema"],
    schema: "session: { id, userId, issuedAt, expiresAt, mfa: boolean }",
  },
  {
    id: "Billing",
    answers: "What does it cost, who pays, and what happens when the payment does not arrive?",
    includes: [
      "Prices and billing intervals",
      "Payment methods",
      "Invoices",
      "Plan changes with advance notice",
      "Payment failure and lockout",
      "Cancellation",
    ],
    decisions: [
      "A plan change takes effect at the next billing date — or both are shown at once.",
      "No price-change dialog without a full cost breakdown before saving.",
      "A payment failure is an explained state, not a silent failure.",
    ],
    provides: ["the payment provider", "prices and taxes", "the invoicing setup"],
  },
  {
    id: "Onboarding",
    answers: "How does a fresh system become usable in the first minutes?",
    includes: [
      "Setup steps",
      "Progress that survives a cancellation",
      "Empty states that lead to the first action",
      "Hints that disappear once they are done",
    ],
    decisions: [
      "A step counts as done once it is saved — not once it has been visited.",
      "An interrupted task resumes in the right place on the next visit.",
    ],
    provides: ["the order of the steps", "which steps a product needs"],
  },
  {
    id: "Settings",
    answers: "Where does a user change something permanently, and how do they know it was saved?",
    includes: [
      "Sections with their own fields",
      "Saving with unsaved changes",
      "Reset to defaults",
      "Danger zone with typed confirmation",
    ],
    decisions: [
      "Unsaved changes block leaving — see UNSAVED_CHANGES.",
      "A reset always requires confirmation and names the loss.",
      "Saving is confirmed with feedback that is explicitly distinguishable from 'unsaved'.",
    ],
    provides: ["the settings themselves", "who may change them"],
  },
  {
    id: "Monitoring",
    answers: "Is the system healthy, and if not: what is broken?",
    includes: [
      "Service status",
      "Resource metrics with thresholds",
      "Event and alert list",
      "Time series with history",
    ],
    decisions: [
      "A refresh never replaces existing content.",
      "An alarm names the cause and the next action, not just a state.",
      "Stale data is marked as stale, not presented as current.",
    ],
    provides: ["the measurements", "the thresholds", "what an alert means"],
    schema: "metric: { key, value, unit, at, state: 'normal'|'elevated'|'high'|'critical' }",
  },
  {
    id: "Integrations",
    answers: "How does a product connect to something else, and what happens when it fails?",
    includes: [
      "Set up a connection",
      "Connection status",
      "Test message",
      "Error handling with retry",
    ],
    decisions: [
      "Credentials are never shown in plain text — only once, after saving.",
      "A failed test names the concrete error, not 'connection failed'.",
    ],
    provides: ["the remote system", "the credentials", "the protocol choice"],
  },
  {
    id: "ApiManagement",
    answers: "How does a third party get access, and how is it revoked?",
    includes: [
      "Keys and tokens",
      "Validity and scope",
      "Usage and quotas",
      "Revocation",
    ],
    decisions: [
      "A key is shown in plain text exactly once.",
      "Revocation is immediate and confirmed.",
      "A revoked key explains the failure of existing calls.",
    ],
    provides: ["the authentication", "the quotas", "the scopes"],
  },
  {
    id: "Notifications",
    answers: "How does a user learn that something happened — and what may interrupt them?",
    includes: [
      "Channels and settings",
      "A central list with a read marker",
      "Interruptions only for urgent things",
    ],
    decisions: [
      "A toast for work in progress, a central list for everything else.",
      "By default, only errors and security events interrupt.",
      "A notification names the trigger and the place where the action happens.",
    ],
    provides: ["the events", "the channels", "the urgency"],
  },
  {
    id: "Permissions",
    answers: "Who may do what, and how is that shown without hiding it?",
    includes: [
      "Roles and assignments",
      "Checked in the client *and* on the server",
      "An explanation when permission is missing",
    ],
    decisions: [
      "A hidden action is a bug when it would be possible — prefer disabled with a reason.",
      "A missing permission explains what is missing and who to contact.",
    ],
    provides: ["the permission model", "the roles", "the assignment"],
  },
] as const;

export function blueprintMeta(id: string): BlueprintMeta | undefined {
  return BLUEPRINTS.find((blueprint) => blueprint.id === id);
}

export type BlueprintId = (typeof BLUEPRINTS)[number]["id"];
