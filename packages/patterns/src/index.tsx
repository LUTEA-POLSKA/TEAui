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
 * themselves land here as they are built, so a product can ask "what does TEA UI
 * already know how to do?" and get an answer that is type-checked rather than a
 * paragraph in a document.
 *
 * Two have landed: `FilterBar` and `ActionBar`. They are exported from this
 * module, so the registry above and the compositions below cannot drift apart —
 * a pattern that is declared but not exported is a promise nobody is kept to.
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
    avoidWhen: "The list never has more than five items — two pages are better than that.",
    composes: ["ScrollArea", "Tabs", "Field", "ButtonGroup"],
    contract: [
      "Selection and detail synchronise the URL, so the state stays shareable.",
      "Unten 1024px wird der Detailbereich zum Drawer, nicht zur zweiten Spalte.",
      "Leaving with unsaved changes asks first — see UNSAVED_CHANGES.",
    ],
  },
  {
    id: "Crud",
    solves: "A resource list with create, read, update and delete.",
    avoidWhen: "Nur eine dieser Operationen wird je Session gebraucht.",
    composes: ["Table", "Toolbar", "SearchInput", "Select", "ConfirmDialog", "EmptyState"],
    contract: [
      "Delete is never the most prominent action in a row.",
      "A success is confirmed; an error names the cause and the next step.",
      "Filter, Sortierung und Seite liegen in der URL.",
      "With no matches, the filter is named as the cause, not the emptiness.",
    ],
  },
  {
    id: "Wizard",
    solves: "A multi-step task whose progress and way back are visible.",
    avoidWhen: "The task is already done in a form with a submit button.",
    composes: ["Stepper", "Field", "Button", "Alert"],
    contract: [
      "Back keeps the input.",
      "A step is only passable when it is valid — and never bypassed by clicking away.",
      "The current step carries aria-current=\"step\".",
    ],
  },
  {
    id: "NotificationCenter",
    solves: "Benachrichtigungen lesen, filtern und als gelesen markieren.",
    avoidWhen: "At most one notification per day — a toast is enough for that.",
    composes: ["ScrollArea", "StatusBadge", "Tabs", "Button"],
    contract: [
      "Ungelesen wird nie nur durch Farbe markiert.",
      "Nach dem Markieren bleibt der Eintrag sichtbar; er verschwindet nicht.",
      "A live region announces new entries, not the opening of the panel.",
    ],
  },
  {
    id: "FilterBar",
    solves: "Eine Liste filtern, ohne die Liste zu verlassen.",
    avoidWhen: "Es genau einen sinnvollen Filterwert gibt.",
    composes: ["SearchInput", "Select", "ToggleGroup", "Button"],
    contract: [
      "The match count sits next to the filter, not inside the empty result.",
      "Reset stays visible as long as a filter is active.",
      "Filterzustand liegt in der URL.",
    ],
  },
  {
    id: "ActionBar",
    solves: "Several actions in one place — in a row or as a context bar.",
    avoidWhen: "More than one action per context.",
    composes: ["Button", "ButtonGroup", "DropdownMenu", "Separator"],
    contract: [
      "Primary on the left, dangerous on the right, never the other way round.",
      "More than five actions are grouped, not stacked.",
      "Every action has a text label, not just an icon.",
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

/* --- compositions ---------------------------------------------------------- */

export { FilterBar, type FilterBarProps } from "./filters/filter-bar";
export {
  ActionBar,
  type ActionBarAction,
  type ActionBarProps,
  type ActionBarTone,
} from "./actions/action-bar";
