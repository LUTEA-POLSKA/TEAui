import type { Tone } from "@tea-ui/tokens";

/**
 * TEA UI — the status registry.
 *
 * This is the single place a wire value becomes a word and a tone. The audit of
 * the two source projects found, between them, five hand-written
 * status-to-label tables *per project*, none of which agreed — including for
 * the same wire value, where one project said "Online" and the other said
 * "Running" for the same state, and one used "Valid" where the other used
 * "Online" for a certificate.
 *
 * Here, that decision has been made once. A component asks
 * `statusMeta("health", "online")` and gets `{ label, tone, description }`.
 * There is no other supported way to render a status, which is what makes
 * cross-product consistency enforceable rather than aspirational.
 *
 * Rules this registry encodes:
 *  - `tone` is always one of the five semantic tones. Never a raw colour.
 *  - `label` is what the user reads. Short, nominal, no punctuation.
 *  - `description` exists for every entry so a tooltip or a help affordance is
 *    always available, and so nobody has to invent one at the call site.
 *  - A tone never depends on colour alone: {@link StatusDot} and
 *    `StatusBadge` always pair the tone with a label, and `Status` pairs it
 *    with a shape. Colour is the third signal, never the only one.
 */

export type { Tone };

export interface StatusMeta {
  /** The word a user reads. Nominal, no trailing punctuation. */
  readonly label: string;
  /** The closed semantic tone. The only way a status reaches a colour. */
  readonly tone: Tone;
  /** One sentence explaining the state, for a tooltip or help text. */
  readonly description: string;
}

type Domain<K extends string> = Readonly<Record<K, StatusMeta>>;

function domain<K extends string>(entries: Record<K, StatusMeta>): Domain<K> {
  return entries;
}

/* -------------------------------------------------------------------------- */
/* Domains                                                                     */
/* -------------------------------------------------------------------------- */

const HEALTH = domain<"online" | "degraded" | "offline" | "unknown" | "maintenance">({
  online: {
    label: "Online",
    tone: "positive",
    description: "The service responds normally and is doing its job.",
  },
  degraded: {
    label: "Degraded",
    tone: "caution",
    description: "The service responds, but some functions are unavailable.",
  },
  offline: {
    label: "Offline",
    tone: "critical",
    description: "The service is unreachable.",
  },
  unknown: {
    label: "Unknown",
    tone: "neutral",
    description: "There is no current measurement.",
  },
  maintenance: {
    label: "Maintenance",
    tone: "info",
    description: "The service is being worked on and may be unavailable.",
  },
});

const RESOURCE = domain<"normal" | "elevated" | "high" | "critical">({
  normal: {
    label: "Normal",
    tone: "positive",
    description: "Utilisation is within the usual range.",
  },
  elevated: {
    label: "Elevated",
    tone: "caution",
    description: "Utilisation is approaching the limit.",
  },
  high: {
    label: "High",
    tone: "caution",
    description: "Utilisation is above the target and should be watched.",
  },
  critical: {
    label: "Critical",
    tone: "critical",
    description: "Utilisation has exceeded the limit. Action is required.",
  },
});

const BACKUP = domain<"succeeded" | "running" | "pending" | "failed" | "expired">({
  succeeded: {
    label: "Successful",
    tone: "positive",
    description: "The backup was written completely and verified.",
  },
  running: {
    label: "Running",
    tone: "info",
    description: "The backup is being written.",
  },
  pending: {
    label: "Pending",
    tone: "neutral",
    description: "The backup is scheduled but has not started yet.",
  },
  failed: {
    label: "Failed",
    tone: "critical",
    description: "The backup was aborted and is not usable.",
  },
  expired: {
    label: "Expired",
    tone: "caution",
    description: "The backup is older than the retention period.",
  },
});

const CERTIFICATE = domain<"valid" | "expiring" | "expired" | "invalid" | "unknown">({
  valid: {
    label: "Valid",
    tone: "positive",
    description: "The certificate is valid and is renewed automatically.",
  },
  expiring: {
    label: "Expiring",
    tone: "caution",
    description: "The certificate expires soon and should be renewed.",
  },
  expired: {
    label: "Expired",
    tone: "critical",
    description: "The certificate has expired. The connection is no longer trustworthy.",
  },
  invalid: {
    label: "Invalid",
    tone: "critical",
    description: "The certificate could not be verified.",
  },
  unknown: {
    label: "Unknown",
    tone: "neutral",
    description: "There is no current measurement.",
  },
});

const CONTAINER = domain<"running" | "created" | "paused" | "restarting" | "stopped" | "error">({
  running: {
    label: "Running",
    tone: "positive",
    description: "The container is started and running.",
  },
  created: {
    label: "Created",
    tone: "neutral",
    description: "The container is created but not started.",
  },
  paused: {
    label: "Paused",
    tone: "info",
    description: "The container is paused and keeps its state.",
  },
  restarting: {
    label: "Restarting",
    tone: "info",
    description: "The container is being restarted.",
  },
  stopped: {
    label: "Stopped",
    tone: "neutral",
    description: "The container is stopped.",
  },
  error: {
    label: "Error",
    tone: "critical",
    description: "The container is not running because an error occurred.",
  },
});

const LIFECYCLE = domain<"none" | "provisioning" | "starting" | "stopping" | "updating">({
  none: {
    label: "Idle",
    tone: "neutral",
    description: "No operation is running. Whatever was happening has finished.",
  },
  provisioning: {
    label: "Being created",
    tone: "info",
    description: "The resource is being built and is not usable yet.",
  },
  starting: {
    label: "Starting",
    tone: "info",
    description: "The resource is starting and is not reachable yet.",
  },
  stopping: {
    label: "Stopping",
    tone: "neutral",
    description: "The resource is shutting down.",
  },
  updating: {
    label: "Updating",
    tone: "info",
    description: "A change is being applied. The resource may restart while it runs.",
  },
});

const AVAILABILITY = domain<"active" | "suspended">({
  active: {
    label: "Available",
    tone: "neutral",
    description: "The resource is available to its owner.",
  },
  suspended: {
    label: "Suspended",
    tone: "caution",
    description: "The resource is held by the operator. Its owner cannot reach it.",
  },
});

const WEBSITE = domain<"online" | "deploying" | "degraded" | "offline" | "error" | "unknown">({
  online: {
    label: "Online",
    tone: "positive",
    description: "The website is reachable and is being served.",
  },
  deploying: {
    label: "Deploying",
    tone: "info",
    description: "A new version is being rolled out.",
  },
  degraded: {
    label: "Degraded",
    tone: "caution",
    description: "The website is reachable but has performance or certificate problems.",
  },
  offline: {
    label: "Offline",
    tone: "critical",
    description: "The website is not reachable.",
  },
  error: {
    label: "Error",
    tone: "critical",
    description: "An error occurred while delivering the website.",
  },
  unknown: {
    label: "Unknown",
    tone: "neutral",
    description: "There is no current measurement.",
  },
});

const DEPENDENCY = domain<"ok" | "warning" | "missing" | "error">({
  ok: { label: "OK", tone: "positive", description: "The dependency is present and current." },
  warning: {
    label: "Warning",
    tone: "caution",
    description: "The dependency is outdated or worth a look.",
  },
  missing: {
    label: "Missing",
    tone: "critical",
    description: "The dependency is required but is not installed.",
  },
  error: {
    label: "Error",
    tone: "critical",
    description: "The dependency could not be verified.",
  },
});

const SECURITY = domain<"ok" | "warning" | "critical">({
  ok: { label: "OK", tone: "positive", description: "No problem was found." },
  warning: {
    label: "Warning",
    tone: "caution",
    description: "A problem with low severity was found.",
  },
  critical: {
    label: "Critical",
    tone: "critical",
    description: "A problem with high severity was found and should be fixed immediately.",
  },
});

const CRM = domain<
  | "unprocessed"
  | "no_website"
  | "opportunity"
  | "contacted"
  | "conversation"
  | "offer"
  | "customer"
  | "archived"
>({
  unprocessed: {
    label: "Unprocessed",
    tone: "neutral",
    description: "The entry was recorded but has not been assessed yet.",
  },
  no_website: {
    label: "No website",
    tone: "neutral",
    description: "No website was found for the entry.",
  },
  opportunity: {
    label: "Opportunity",
    tone: "info",
    description: "There is a sign of interest, but no contact yet.",
  },
  contacted: {
    label: "Contacted",
    tone: "info",
    description: "First contact made, awaiting a reply.",
  },
  conversation: {
    label: "In conversation",
    tone: "info",
    description: "There is an active exchange about the offer.",
  },
  offer: {
    label: "Offer",
    tone: "caution",
    description: "An offer was created and is waiting for a decision.",
  },
  customer: {
    label: "Customer",
    tone: "positive",
    description: "The onboarding is complete.",
  },
  archived: {
    label: "Archived",
    tone: "neutral",
    description: "The entry is closed and is not worked on further.",
  },
});

const PROJECT = domain<"planning" | "active" | "on_hold" | "review" | "delivered" | "cancelled">({
  planning: {
    label: "Planning",
    tone: "neutral",
    description: "The project is planned but has not started yet.",
  },
  active: {
    label: "In progress",
    tone: "info",
    description: "The project is being worked on.",
  },
  on_hold: {
    label: "On hold",
    tone: "caution",
    description: "The project is on hold and waits for a decision or a contribution.",
  },
  review: {
    label: "In review",
    tone: "caution",
    description: "The result is being reviewed and accepted.",
  },
  delivered: {
    label: "Delivered",
    tone: "positive",
    description: "The project has been accepted.",
  },
  cancelled: {
    label: "Cancelled",
    tone: "neutral",
    description: "The project was cancelled and is not pursued further.",
  },
});

/* -------------------------------------------------------------------------- */
/* The registry                                                                */
/* -------------------------------------------------------------------------- */

export const STATUS = {
  health: HEALTH,
  resource: RESOURCE,
  backup: BACKUP,
  certificate: CERTIFICATE,
  container: CONTAINER,
  lifecycle: LIFECYCLE,
  availability: AVAILABILITY,
  website: WEBSITE,
  dependency: DEPENDENCY,
  security: SECURITY,
  crm: CRM,
  project: PROJECT,
} as const;

export type StatusDomain = keyof typeof STATUS;

/** The wire values a given domain may take. */
export type StatusKey<D extends StatusDomain> = keyof (typeof STATUS)[D] & string;

/** Union of every wire value across every domain, for exhaustive switches. */
export type AnyStatusKey = { [D in StatusDomain]: StatusKey<D> }[StatusDomain];

/**
 * Look up the label, tone and description for a wire value.
 *
 * The key is `domain` + `key` rather than a flat string, because a flat string
 * cannot be checked: `statusMeta("healthy")` would compile even if no domain
 * ever produced "healthy". This signature makes a typo a type error, and
 * adding a wire value without a label is a type error too — which is exactly
 * the failure mode that produced five disagreeing tables.
 */
export function statusMeta<D extends StatusDomain>(domain: D, key: StatusKey<D>): StatusMeta {
  return STATUS[domain][key] as StatusMeta;
}

/** Every entry of a domain, as `[key, meta]` pairs. */
export function statusEntries<D extends StatusDomain>(domain: D): Array<[StatusKey<D>, StatusMeta]> {
  return Object.entries(STATUS[domain]) as Array<[StatusKey<D>, StatusMeta]>;
}

/**
 * The wire values of one domain that a given tone covers, in registry order.
 * Used by filter chips and legends, so a filter row can never invent a
 * category the registry does not know.
 */
export function statusKeysWithTone<D extends StatusDomain>(domain: D, tone: Tone): Array<StatusKey<D>> {
  return statusEntries(domain)
    .filter(([, meta]) => meta.tone === tone)
    .map(([key]) => key);
}

/* -------------------------------------------------------------------------- */
/* Resource status: three axes, and the rule that composes them                 */
/* -------------------------------------------------------------------------- */

/**
 * A resource that can be busy, reachable and locked at the same time.
 *
 * The audit of a hosting product found the opposite: one flat list of nine states,
 * in which `online`, `starting`, `provisioning` and `suspended` competed for the
 * same slot. A flat list cannot express the three states that actually co-occur,
 * and the two that matter most are the ones a customer is watching:
 *
 *   - a server that is **starting** is not **online**, and saying so is the
 *     difference between an honest interface and one that reports success before
 *     the backend has confirmed it;
 *   - a **suspended** server may well be running — it is held by the operator, so
 *     the owner cannot reach it. Collapsing that into the health axis loses the
 *     reason, and a customer who is told "offline" about a running server files
 *     the wrong support request.
 *
 * So the state is three fields, and {@link resourceStatusMeta} is the only
 * supported way to render it. A product that builds this itself will get it wrong
 * in one of exactly the two ways above.
 */
export interface ResourceStatus {
  /** Reachability, once nothing is in flight. */
  readonly health: StatusKey<"health">;
  /** The operation in flight, or `none`. */
  readonly lifecycle: StatusKey<"lifecycle">;
  /** Whether the owner may reach it. */
  readonly availability: StatusKey<"availability">;
}

/**
 * What a surface should actually render.
 *
 * `primary` is the one word in the badge. `suppressed` is the health state the
 * primary one is standing in for, so a detail row or a tooltip can still offer it
 * — silently dropping it would be the same loss as flattening the axes, just
 * quieter.
 *
 * **The wire keys come back alongside the metadata, and they are not redundant.**
 * A consumer rendering these labels in its own language needs the *key*, not the
 * English word. Without the key the only route is to look the English word up again,
 * which is a translation table that silently falls through to English the moment this
 * registry gains a state — and a status is exactly the thing a customer sees in their
 * own language. The key is what travels; the label is what is displayed.
 */
export interface ResourceStatusRender {
  /** Domain and wire key of the badge's word. */
  readonly primaryKey: { readonly domain: "health" | "lifecycle"; readonly key: string };
  readonly primary: StatusMeta;
  /** Domain and key of the state `primary` stands in for, when it stands in for one. */
  readonly suppressedKey: { readonly domain: "health"; readonly key: StatusKey<"health"> } | null;
  readonly suppressed: StatusMeta | null;
  /** `null` for `availability: "active"` — the absence of a badge is not a badge. */
  readonly availabilityKey: {
    readonly domain: "availability";
    readonly key: StatusKey<"availability">;
  } | null;
  readonly availability: StatusMeta | null;
}

/**
 * Compose the three axes into what a surface shows.
 *
 * The rule, in order:
 *
 *   1. `lifecycle !== "none"` wins. A resource in flight is described by what is
 *      happening to it, never by what it would be when idle.
 *   2. otherwise `health` is shown.
 *   3. `availability === "suspended"` is **additional**, never a replacement — so
 *      a suspended server that is also starting says both.
 *
 * `availability` returns `null` for `active`, and `lifecycle` returns `null` in
 * `suppressed` for `none`, so a caller cannot accidentally render a badge for the
 * absence of something.
 *
 * @example
 * ```ts
 * const shown = resourceStatusMeta({
 *   health: "online",
 *   lifecycle: "starting",
 *   availability: "active",
 * });
 * shown.primary.label;      // "Starting"
 * shown.primaryKey.key;     // "starting" — translate this, not the label
 * shown.suppressed?.label;  // "Online" — offered as detail, not as the headline
 * shown.availability;       // null
 * ```
 */
export function resourceStatusMeta(status: ResourceStatus): ResourceStatusRender {
  const inFlight = status.lifecycle !== "none";

  return {
    primaryKey: inFlight
      ? { domain: "lifecycle", key: status.lifecycle }
      : { domain: "health", key: status.health },
    primary: inFlight ? statusMeta("lifecycle", status.lifecycle) : statusMeta("health", status.health),
    suppressedKey: inFlight ? { domain: "health", key: status.health } : null,
    suppressed: inFlight ? statusMeta("health", status.health) : null,
    availabilityKey:
      status.availability === "active"
        ? null
        : { domain: "availability", key: status.availability },
    availability:
      status.availability === "active" ? null : statusMeta("availability", status.availability),
  };
}
