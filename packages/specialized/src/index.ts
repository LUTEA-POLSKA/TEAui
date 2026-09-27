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
 *     German copy deck. "Specialized" describes the cost, never the quality.
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
    solves: "Zeitreihen und Vergleiche, in denen der Verlauf die Aussage trägt.",
    isolates: "eine Zeichenbibliothek",
    notInCore: "Kein Produkt braucht Diagramme, und eine Diagrambibliothek ist der teuerste Import der gesamten Bibliothek.",
    rules: [
      "Jede Reihe hat eine eigene Form oder Strichstärke zusätzlich zur Farbe.",
      "Fehlende Werte werden als Lücke gezeigt, nie still interpoliert.",
      "Achsen und Raster erreichen mindestens 3:1 Kontrast.",
      "Jedes Diagramm hat eine Textalternative oder eine Datentabelle.",
    ],
  },
  {
    id: "VirtualList",
    solves: "Listen, die länger werden als der Speicher erträgt — Logs, Ereignisse, Dateien.",
    notInCore: "Eine Virtualisierung ist eine Entscheidung, die man erst trifft, wenn man die Länge kennt.",
    rules: [
      "Die Zeilenhöhe ist bekannt und konstant, sonst wird gemessen und nicht geschätzt.",
      "Ein Element mit Fokus wird immer in den sichtbaren Bereich gescrollt.",
      "Die Gesamtzahl steht sichtbar da, nicht nur die Zahl der geladenen Zeilen.",
    ],
  },
  {
    id: "TreeView",
    solves: "Hierarchien mit Faltung, Auswahl und Tastaturnavigation.",
    notInCore: "Bäume brauchen eine klare fachliche Semantik, die Core nicht erfinden darf.",
    rules: [
      "Pfeiltasten bewegen, `*` faltet auf, `Enter` öffnet.",
      "Der Zustand eines Astes ist an Form und Text erkennbar, nicht nur an der Farbe.",
      "Eine Auswahl bleibt beim Umbenennen erhalten.",
    ],
  },
  {
    id: "DiffViewer",
    solves: "Der Unterschied zwischen zwei Fassungen — Code, Konfiguration, Text.",
    notInCore: "Ein Diff ist eine fachliche Ansicht, keine generische.",
    rules: [
      "Hinzugefügt und entfernt sind an Zeichen und Wort erkennbar, nicht nur an Grün und Rot.",
      "Zeilennummern und Position bleiben beim Scrollen sichtbar.",
    ],
  },
  {
    id: "CodeBlock",
    solves: "Quelltext mit Syntaxhervorhebung, Zeilennummern und Kopieren.",
    isolates: "ein Syntaxhervorheber",
    notInCore: "Ein Highlighter ist groß, und die meisten Produkte zeigen ihn nie.",
    rules: [
      "Der Text bleibt auch ohne Hervorhebung vollständig und kopierbar.",
      "Farbe hebt hervor, sie codiert nie ausschließlich.",
    ],
  },
  {
    id: "DatePicker",
    solves: "Ein einzelnes Datum oder ein Bereich, in einer Zeichneingabe.",
    notInCore: "Ein Datum ohne Kontext braucht die Format- und Zeitzonenregeln des Produkts.",
    rules: [
      "Die Eingabe ist immer tippbar; der Kalender ist eine Hilfe, keine Voraussetzung.",
      "Das Format steht sichtbar neben dem Feld, nicht nur im Placeholder.",
    ],
  },
  {
    id: "Kanban",
    solves: "Ein Workflow, in dem Elemente zwischen Spalten wechseln.",
    notInCore: "Ein Board ist eine fachliche Ansicht mit eigenen Regeln.",
    rules: [
      "Es gibt eine Tastatur-Alternative: eine Liste mit derselben Reihenfolge.",
      "Ein Wechsel wird rückgängig machenbar angeboten.",
    ],
  },
] as const;

export function specializedMeta(id: string): SpecializedMeta | undefined {
  return SPECIALIZED.find((entry) => entry.id === id);
}

export type SpecializedId = (typeof SPECIALIZED)[number]["id"];
