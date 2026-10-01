/**
 * TEA UI Specialized — scope registry.
 *
 * Everything in TEA UI is deliberately cheap. The components in this package are
 * the exception: they are heavy enough that importing them from Core would tax
 * every product that will never use them, and they live behind their own entry
 * point so the cost is opt-in.
 *
 * Two rules govern that opt-in:
 *
 *  1. **A heavy dependency never enters Core.** A charting library, a syntax
 *     highlighter or a virtual scroller would be paid for by every product on
 *     every page load. The audit measured both source projects' bundles and
 *     found exactly this: a terminal emulator and a chart implementation loaded
 *     into a dashboard that rendered neither on most routes.
 *  2. **A specialized component is still a TEA UI component.** Same API
 *     conventions, same data-attribute vocabulary, same accessibility floor, same
 *     copy deck. "Specialized" describes the cost, never the quality.
 *
 * Everything here must additionally be readable without colour, because a chart
 * is the one place where colour is the default way of encoding data — and
 * therefore the one place where relying on it is the default mistake.
 */
export interface SpecializedMeta {
  readonly id: string;
  /** What it is for, and therefore whether a product needs it at all. */
  readonly solves: string;
  /** The heavy dependency it isolates, if any. */
  readonly isolates?: string;
  /** Why it is not in Core. */
  readonly notInCore: string;
  /** Rules a user of this component inherits. */
  readonly rules: readonly string[];
}

export const SPECIALIZED: readonly SpecializedMeta[] = [
  {
    id: "Chart",
    solves: "Time series and comparisons where the history carries the point.",
    isolates: "a drawing library",
    notInCore: "No product needs charts, and a charting library is the most expensive import in the whole library.",
    rules: [
      "Each series has its own shape or stroke width in addition to colour.",
      "Missing values are shown as a gap, never silently interpolated.",
      "Axes and gridlines reach at least 3:1 contrast.",
      "Every chart has a text alternative or a data table.",
    ],
  },
  {
    id: "VirtualList",
    solves: "Lists that grow beyond what memory can hold — logs, events, files.",
    notInCore: "Virtualising is a decision you only make once you know the length.",
    rules: [
      "Row height is known and constant, otherwise measure it rather than guess.",
      "A focused element is always scrolled into the visible area.",
      "The total is on screen, not just the number of loaded rows.",
    ],
  },
  {
    id: "TreeView",
    solves: "Hierarchies with collapsing, selection and keyboard navigation.",
    notInCore: "Trees need a clear domain semantics that Core must not invent.",
    rules: [
      "Arrow keys move, `*` collapses, `Enter` opens.",
      "The state of a branch is recognisable by shape and text, not by colour alone.",
      "A selection survives renaming.",
    ],
  },
  {
    id: "DiffViewer",
    solves: "The difference between two versions — code, configuration, text.",
    notInCore: "A diff is a domain view, not a generic one.",
    rules: [
      "Added and removed are recognisable by sign and word, not only by green and red.",
      "Line numbers and position stay visible while scrolling.",
    ],
  },
  {
    id: "CodeBlock",
    solves: "Source text with syntax highlighting, line numbers and copy.",
    isolates: "a syntax highlighter",
    notInCore: "A highlighter is large, and most products never show one.",
    rules: [
      "The text stays complete and copyable even without highlighting.",
      "Colour highlights; it never encodes alone.",
    ],
  },
  {
    id: "DatePicker",
    solves: "A single date or a range, in one input.",
    notInCore: "A date without context needs the formatting and timezone rules of the product.",
    rules: [
      "The input is always typeable; the calendar is a help, not a prerequisite.",
      "The format is visible next to the field, not only in the placeholder.",
    ],
  },
  {
    id: "Kanban",
    solves: "A workflow where items move between columns.",
    notInCore: "A board is a domain view with its own rules.",
    rules: [
      "There is a keyboard alternative: a list with the same order.",
      "A switch is offered with a way to undo it.",
    ],
  },
] as const;

export function specializedMeta(id: string): SpecializedMeta | undefined {
  return SPECIALIZED.find((entry) => entry.id === id);
}

export type SpecializedId = (typeof SPECIALIZED)[number]["id"];
