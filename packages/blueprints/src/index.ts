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
    answers: "Wer ist angemeldet, wie meldet er sich an, und wie kommt er wieder herein?",
    includes: [
      "Anmeldung",
      "Registrierung mit E-Mail-Bestätigung",
      "Passwort zurücksetzen",
      "Zwei-Faktor",
      "Sitzungsverwaltung und Abmeldung in allen Tabs",
      "Konto-Sperrung und Wiederherstellung",
    ],
    decisions: [
      "Abmeldung räumt den Sitzungsspeicher *und* den lokalen Zustand.",
      "Nach der Anmeldung wird zur ursprünglich angeforderten Seite zurückgeleitet — geprüft gegen Offene Weiterleitung.",
      "Fehlertexte nennen die Ursache, ohne zu verraten, ob ein Konto existiert.",
      "Ablaufende Sitzungen führen zu einer verständlichen Zwischenmeldung, nicht zu einem stillen Formularverlust.",
    ],
    provides: ["den Authentifizierungs-Endpunkt", "die Sitzungsdauer", "das Fehlschema"],
    schema: "session: { id, userId, issuedAt, expiresAt, mfa: boolean }",
  },
  {
    id: "Billing",
    answers: "Was kostet es, wer zahlt, und was passiert, wenn die Zahlung ausbleibt?",
    includes: [
      "Preise und Abrechnungsintervalle",
      "Zahlungsmittel",
      "Rechnungen",
      "Planwechsel mit Vorwarnung",
      "Zahlungsausfall und Sperrung",
      "Kündigung",
    ],
    decisions: [
      "Ein Planwechsel wird erst zum nächsten Abrechnungszeitpunkt wirksam — oder es wird beides sofort angezeigt.",
      "Kein Preisänderungsdialog ohne vollständige Kostenangabe vor dem Speichern.",
      "Der Zahlungsausfall ist ein erklärter Zustand, kein stilles Scheitern.",
    ],
    provides: ["den Zahlungsanbieter", "Preise und Steuern", "die Rechnungsgestaltung"],
  },
  {
    id: "Onboarding",
    answers: "Wie wird ein frisches System in den ersten Minuten benutzbar?",
    includes: [
      "Einrichtungsschritte",
      "Fortschritt, der survives einen Abbruch",
      "Leerzustände, die zur ersten Aktion führen",
      "Hinweise, die verschwinden, sobald sie erledigt sind",
    ],
    decisions: [
      "Ein Schritt gilt als erledigt, wenn er gespeichert ist — nicht wenn er besucht wurde.",
      "Ein unterbrochener Vorgang wird beim nächsten Besuch an der richtigen Stelle fortgesetzt.",
    ],
    provides: ["die Reihenfolge der Schritte", "welche Schritte ein Produkt braucht"],
  },
  {
    id: "Settings",
    answers: "Wo ändert ein Nutzer etwas dauerhaft, und wie merkt er, dass es gespeichert wurde?",
    includes: [
      "Abschnitte mit eigenen Feldern",
      "Speichern mit ungespeicherten Änderungen",
      "Zurücksetzen auf Standard",
      "Gefahrenzone mit Typ-Bestätigung",
    ],
    decisions: [
      "Ungespeicherte Änderungen blockieren das Verlassen — siehe UNSAVED_CHANGES.",
      "Ein Zurücksetzen ist immer bestätigungspflichtig und benennt den Verlust.",
      "Gespeichert wird mit einer Rückmeldung, die ausdrücklich von Ungespeichert unterscheidbar ist.",
    ],
    provides: ["die Einstellungen selbst", "wer sie ändern darf"],
  },
  {
    id: "Monitoring",
    answers: "Ist das System gesund, und wenn nicht: was ist kaputt?",
    includes: [
      "Dienststatus",
      "Ressourcenmetriken mit Schwellen",
      "Ereignis- und Alarmliste",
      "Zeitreihen mit Historie",
    ],
    decisions: [
      "Aktualisierung ersetzt vorhandenen Inhalt nie.",
      "Ein Alarm nennt Ursache und nächste Handlung, nicht nur einen Zustand.",
      "Veraltete Daten sind als veraltet gekennzeichnet, nicht als aktuelle.",
    ],
    provides: ["die Messwerte", "die Schwellen", "die Bedeutung eines Alarms"],
    schema: "metric: { key, value, unit, at, state: 'normal'|'elevated'|'high'|'critical' }",
  },
  {
    id: "Integrations",
    answers: "Wie verbindet sich ein Produkt mit etwas anderem, und was passiert, wenn es ausfällt?",
    includes: [
      "Verbindung einrichten",
      "Verbindungsstatus",
      "Testsendung",
      "Fehlerbehandlung mit Wiederholung",
    ],
    decisions: [
      "Zugangsdaten werden nie im Klartext angezeigt — nur einmal, nach dem Speichern.",
      "Ein fehlgeschlagener Test nennt den konkreten Fehler, nicht „Verbindung fehlgeschlagen“.",
    ],
    provides: ["die Gegenstelle", "die Zugangsdaten", "die Protokollwahl"],
  },
  {
    id: "ApiManagement",
    answers: "Wie bekommt ein Dritter Zugriff, und wie wird er wieder entzogen?",
    includes: [
      "Schlüssel und Token",
      "Gültigkeit und Umfang",
      "Nutzung und Kontingente",
      "Widerruf",
    ],
    decisions: [
      "Ein Schlüssel wird genau einmal im Klartext gezeigt.",
      "Widerruf ist sofort und wird bestätigt.",
      "Ein widerrufener Schlüssel erklärt den Ausfall bestehender Aufrufe.",
    ],
    provides: ["die Authentifizierung", "die Kontingente", "die Scopes"],
  },
  {
    id: "Notifications",
    answers: "Wie erfährt ein Nutzer, dass etwas passiert ist — und was darf ihn unterbrechen?",
    includes: [
      "Kanäle und Einstellungen",
      "Zentrale Liste mit Gelesen-Markierung",
      "Unterbrechungen nur für Dringendes",
    ],
    decisions: [
      "Toast für die laufende Arbeit, Zentrale Liste für alles andere.",
      "Standardmäßig unterbrechen nur Fehler und Sicherheitsereignisse.",
      "Eine Benachrichtigung nennt den Auslöser und den Ort, an dem man handelt.",
    ],
    provides: ["die Ereignisse", "die Kanäle", "die Dringlichkeit"],
  },
  {
    id: "Permissions",
    answers: "Wer darf was, und wie zeigt man das, ohne es zu verstecken?",
    includes: [
      "Rollen und Zuordnungen",
      "Prüfung im Client *und* im Server",
      "Erklärung bei fehlender Berechtigung",
    ],
    decisions: [
      "Eine ausgeblendete Aktion ist ein Fehler, wenn sie möglich wäre — lieber deaktiviert mit Begründung.",
      "Fehlende Berechtigung erklärt, was fehlt und an wen man sich wendet.",
    ],
    provides: ["das Berechtigungsmodell", "die Rollen", "die Zuordnung"],
  },
] as const;

export function blueprintMeta(id: string): BlueprintMeta | undefined {
  return BLUEPRINTS.find((blueprint) => blueprint.id === id);
}

export type BlueprintId = (typeof BLUEPRINTS)[number]["id"];
