import * as React from "react";

/**
 * TEA UI Patterns — scope registry.
 *
 * A pattern is a **configurable composition that solves a recurring interaction
 * problem**. It is not a component and not a feature: a component renders a
 * thing, a pattern arranges components and owns the interaction between them,
 * and a feature is a product's job.
 *
 * The distinction matters because the audit found the same interaction — a
 * resource list with filters, a table, a create dialog and an empty state —
 * implemented from scratch in every product, each time slightly differently. The
 * reusable part is not any one component in it; it is the arrangement and the
 * behaviour that comes with it.
 *
 * This module publishes the **contract** for that layer. The compositions
 * themselves follow, each landing here as it is built, so a product can ask
 * "what does TEA UI already know how to do?" and get an answer that is
 * type-checked rather than a paragraph in a document.
 */

/** The questions a pattern answers, and therefore the axis it is judged on. */
export interface PatternMeta {
  /** Stable name, and the export it will have. */
  readonly id: string;
  /** The interaction problem, phrased as a question the user is asking. */
  readonly solves: string;
  /** When *not* to use it. A pattern without a boundary is a component. */
  readonly avoidWhen: string;
  /** The components it composes. */
  readonly composes: readonly string[];
  /**
   * The interaction contract a product must honour if it builds its own
   * version. This is the part that stops a bespoke CRUD page from behaving
   * differently from a shared one.
   */
  readonly contract: readonly string[];
}

export const PATTERNS: readonly PatternMeta[] = [
  {
    id: "MasterDetail",
    solves: "Eine Liste und ein Detailbereich, in dem ein Eintrag gelesen oder bearbeitet wird.",
    avoidWhen: "Die Liste hat nie mehr als fünf Elemente — dann sind zwei Seiten besser.",
    composes: ["ScrollArea", "Tabs", "Field", "ButtonGroup"],
    contract: [
      "Auswahl und Detail synchronisieren die URL, damit der Zustand teilbar bleibt.",
      "Unten 1024px wird der Detailbereich zum Drawer, nicht zur zweiten Spalte.",
      "Beim Verlassen mit ungespeicherten Änderungen wird gefragt — siehe UNSAVED_CHANGES.",
    ],
  },
  {
    id: "Crud",
    solves: "Eine Ressourcenliste mit Anlegen, Lesen, Ändern und Löschen.",
    avoidWhen: "Nur eine dieser Operationen wird je Session gebraucht.",
    composes: ["Table", "Toolbar", "SearchInput", "Select", "ConfirmDialog", "EmptyState"],
    contract: [
      "Löschen ist nie die auffälligste Aktion einer Zeile.",
      "Ein Erfolg wird bestätigt; ein Fehler nennt Ursache und nächsten Schritt.",
      "Filter, Sortierung und Seite liegen in der URL.",
      "Ohne Treffer wird der Filter als Ursache genannt, nicht die Leere.",
    ],
  },
  {
    id: "Wizard",
    solves: "Eine Aufgabe in mehreren Schritten, deren Fortschritt und Rückweg sichtbar sind.",
    avoidWhen: "Die Aufgabe in einem Formular mit Absenden erledigt ist.",
    composes: ["Stepper", "Field", "Button", "Alert"],
    contract: [
      "Zurück behält die Eingaben.",
      "Ein Schritt ist nur weitergängig, wenn er valide ist — aber nie durch Wegklicken umgangen.",
      "Der aktuelle Schritt trägt aria-current=\"step\".",
    ],
  },
  {
    id: "NotificationCenter",
    solves: "Benachrichtigungen lesen, filtern und als gelesen markieren.",
    avoidWhen: "Höchstens eine Benachrichtigung pro Tag — dafür genügt ein Toast.",
    composes: ["ScrollArea", "StatusBadge", "Tabs", "Button"],
    contract: [
      "Ungelesen wird nie nur durch Farbe markiert.",
      "Nach dem Markieren bleibt der Eintrag sichtbar; er verschwindet nicht.",
      "Eine Live-Region meldet neue Einträge, nicht das Öffnen des Panels.",
    ],
  },
  {
    id: "FilterBar",
    solves: "Eine Liste filtern, ohne die Liste zu verlassen.",
    avoidWhen: "Es genau einen sinnvollen Filterwert gibt.",
    composes: ["SearchInput", "Select", "ToggleGroup", "Button"],
    contract: [
      "Die Anzahl der Treffer steht neben dem Filter, nicht im leeren Ergebnis.",
      "Zurücksetzen ist sichtbar, solange ein Filter aktiv ist.",
      "Filterzustand liegt in der URL.",
    ],
  },
  {
    id: "ActionBar",
    solves: "Mehrere Aktionen an einer Stelle — einzeilig oder als Kontextleiste.",
    avoidWhen: "Mehr als eine Aktion pro Kontext.",
    composes: ["Button", "ButtonGroup", "DropdownMenu", "Separator"],
    contract: [
      "Primär links, gefährlich rechts, nie umgekehrt.",
      "Mehr als fünf Aktionen werden gruppiert, nicht gestapelt.",
      "Jede Aktion hat einen Text, nicht nur ein Symbol.",
    ],
  },
] as const;

/** Look a pattern up by id, with a `undefined` for an unknown one. */
export function patternMeta(id: string): PatternMeta | undefined {
  return PATTERNS.find((pattern) => pattern.id === id);
}

/**
 * A pattern's id as a type, so a product can constrain a prop to the set TEA UI
 * actually knows — and so a new pattern is a type change, not a silent string.
 */
export type PatternId = (typeof PATTERNS)[number]["id"];

export type { React };
