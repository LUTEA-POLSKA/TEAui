import type { Tone } from "@tea-ui/tokens";

/**
 * TEA UI — the status registry.
 *
 * This is the single place a wire value becomes a word and a tone. The audit of
 * the two source projects found, between them, five hand-written
 * status-to-label tables *per project*, none of which agreed — including for
 * the same wire value, where one project said "Online" and the other said
 * "Läuft" for the same state, and one used "Gültig" where the other used
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
    description: "Der Dienst antwortet normal und erfüllt seine Aufgabe.",
  },
  degraded: {
    label: "Eingeschränkt",
    tone: "caution",
    description: "Der Dienst antwortet, aber einzelne Funktionen sind nicht verfügbar.",
  },
  offline: {
    label: "Offline",
    tone: "critical",
    description: "Der Dienst ist nicht erreichbar.",
  },
  unknown: {
    label: "Unbekannt",
    tone: "neutral",
    description: "Es liegt keine aktuelle Messung vor.",
  },
  maintenance: {
    label: "Wartung",
    tone: "info",
    description: "Der Dienst wird geplant bearbeitet und ist möglicherweise nicht verfügbar.",
  },
});

const RESOURCE = domain<"normal" | "elevated" | "high" | "critical">({
  normal: {
    label: "Normal",
    tone: "positive",
    description: "Die Auslastung liegt im üblichen Bereich.",
  },
  elevated: {
    label: "Erhöht",
    tone: "caution",
    description: "Die Auslastung nähert sich dem Grenzwert.",
  },
  high: {
    label: "Hoch",
    tone: "caution",
    description: "Die Auslastung liegt über dem Zielwert und sollte beobachtet werden.",
  },
  critical: {
    label: "Kritisch",
    tone: "critical",
    description: "Die Auslastung hat den Grenzwert überschritten. Handeln ist erforderlich.",
  },
});

const BACKUP = domain<"succeeded" | "running" | "pending" | "failed" | "expired">({
  succeeded: {
    label: "Erfolgreich",
    tone: "positive",
    description: "Die Sicherung wurde vollständig geschrieben und geprüft.",
  },
  running: {
    label: "Läuft",
    tone: "info",
    description: "Die Sicherung wird gerade geschrieben.",
  },
  pending: {
    label: "Ausstehend",
    tone: "neutral",
    description: "Die Sicherung ist geplant, aber noch nicht gestartet.",
  },
  failed: {
    label: "Fehlgeschlagen",
    tone: "critical",
    description: "Die Sicherung wurde abgebrochen und ist nicht verwendbar.",
  },
  expired: {
    label: "Abgelaufen",
    tone: "caution",
    description: "Die Sicherung ist älter als die Aufbewahrungsfrist.",
  },
});

const CERTIFICATE = domain<"valid" | "expiring" | "expired" | "invalid" | "unknown">({
  valid: {
    label: "Gültig",
    tone: "positive",
    description: "Das Zertifikat ist gültig und wird automatisch erneuert.",
  },
  expiring: {
    label: "Läuft ab",
    tone: "caution",
    description: "Das Zertifikat läuft in Kürze ab und sollte erneuert werden.",
  },
  expired: {
    label: "Abgelaufen",
    tone: "critical",
    description: "Das Zertifikat ist abgelaufen. Die Verbindung ist nicht mehr vertrauenswürdig.",
  },
  invalid: {
    label: "Ungültig",
    tone: "critical",
    description: "Das Zertifikat konnte nicht geprüft werden.",
  },
  unknown: {
    label: "Unbekannt",
    tone: "neutral",
    description: "Es liegt keine aktuelle Prüfung vor.",
  },
});

const CONTAINER = domain<"running" | "created" | "paused" | "restarting" | "stopped" | "error">({
  running: {
    label: "Läuft",
    tone: "positive",
    description: "Der Container ist gestartet und wird ausgeführt.",
  },
  created: {
    label: "Erstellt",
    tone: "neutral",
    description: "Der Container ist angelegt, aber nicht gestartet.",
  },
  paused: {
    label: "Pausiert",
    tone: "info",
    description: "Der Container ist angehalten und speichert seinen Zustand.",
  },
  restarting: {
    label: "Startet neu",
    tone: "info",
    description: "Der Container wird gerade neu gestartet.",
  },
  stopped: {
    label: "Gestoppt",
    tone: "neutral",
    description: "Der Container ist gestoppt.",
  },
  error: {
    label: "Fehler",
    tone: "critical",
    description: "Der Container läuft nicht, weil ein Fehler aufgetreten ist.",
  },
});

const WEBSITE = domain<"online" | "deploying" | "degraded" | "offline" | "error" | "unknown">({
  online: {
    label: "Online",
    tone: "positive",
    description: "Die Website ist erreichbar und wird ausgeliefert.",
  },
  deploying: {
    label: "Wird ausgerollt",
    tone: "info",
    description: "Eine neue Version wird gerade veröffentlicht.",
  },
  degraded: {
    label: "Eingeschränkt",
    tone: "caution",
    description: "Die Website ist erreichbar, hat aber Performance- oder Zertifikatsprobleme.",
  },
  offline: {
    label: "Offline",
    tone: "critical",
    description: "Die Website ist nicht erreichbar.",
  },
  error: {
    label: "Fehler",
    tone: "critical",
    description: "Beim Ausliefern der Website ist ein Fehler aufgetreten.",
  },
  unknown: {
    label: "Unbekannt",
    tone: "neutral",
    description: "Es liegt keine aktuelle Prüfung vor.",
  },
});

const DEPENDENCY = domain<"ok" | "warning" | "missing" | "error">({
  ok: { label: "In Ordnung", tone: "positive", description: "Die Abhängigkeit ist vorhanden und aktuell." },
  warning: {
    label: "Warnung",
    tone: "caution",
    description: "Die Abhängigkeit ist veraltet oder auffällig.",
  },
  missing: {
    label: "Fehlt",
    tone: "critical",
    description: "Die Abhängigkeit wird benötigt, ist aber nicht installiert.",
  },
  error: {
    label: "Fehler",
    tone: "critical",
    description: "Die Abhängigkeit konnte nicht geprüft werden.",
  },
});

const SECURITY = domain<"ok" | "warning" | "critical">({
  ok: { label: "In Ordnung", tone: "positive", description: "Es wurde kein Problem gefunden." },
  warning: {
    label: "Warnung",
    tone: "caution",
    description: "Es wurde ein Problem mit geringer Risiko gefunden.",
  },
  critical: {
    label: "Kritisch",
    tone: "critical",
    description: "Es wurde ein Problem mit hohem Risiko gefunden, das sofort behoben werden sollte.",
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
    label: "Unbearbeitet",
    tone: "neutral",
    description: "Der Eintrag wurde erfasst, aber noch nicht bewertet.",
  },
  no_website: {
    label: "Ohne Website",
    tone: "neutral",
    description: "Für den Eintrag wurde keine Website gefunden.",
  },
  opportunity: {
    label: "Interesse",
    tone: "info",
    description: "Es gibt einen Hinweis auf Interesse, aber noch keinen Kontakt.",
  },
  contacted: {
    label: "Kontaktiert",
    tone: "info",
    description: "Erster Kontakt hergestellt, Antwort steht aus.",
  },
  conversation: {
    label: "Im Gespräch",
    tone: "info",
    description: "Es findet ein aktiver Austausch über das Angebot statt.",
  },
  offer: {
    label: "Angebot",
    tone: "caution",
    description: "Ein Angebot wurde erstellt und wartet auf eine Entscheidung.",
  },
  customer: {
    label: "Kunde",
    tone: "positive",
    description: "Der Einstieg ist abgeschlossen.",
  },
  archived: {
    label: "Archiviert",
    tone: "neutral",
    description: "Der Eintrag ist abgeschlossen und wird nicht weiter bearbeitet.",
  },
});

const PROJECT = domain<"planning" | "active" | "on_hold" | "review" | "delivered" | "cancelled">({
  planning: {
    label: "In Planung",
    tone: "neutral",
    description: "Das Projekt ist eingeplant, aber noch nicht gestartet.",
  },
  active: {
    label: "In Arbeit",
    tone: "info",
    description: "Das Projekt wird gerade umgesetzt.",
  },
  on_hold: {
    label: "Pausiert",
    tone: "caution",
    description: "Das Projekt ruht und wartet auf eine Entscheidung oder Zuarbeit.",
  },
  review: {
    label: "In Prüfung",
    tone: "caution",
    description: "Das Ergebnis wird geprüft und abgenommen.",
  },
  delivered: {
    label: "Abgeschlossen",
    tone: "positive",
    description: "Das Projekt ist abgenommen.",
  },
  cancelled: {
    label: "Abgebrochen",
    tone: "neutral",
    description: "Das Projekt wurde abgebrochen und wird nicht weiterverfolgt.",
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
