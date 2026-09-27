/**
 * TEA UI — the terminology deck.
 *
 * One language across the whole ecosystem. The audit found two orthographies
 * (one project transliterating every umlaut), two registers of address, and
 * several different German words for the same state — including "Online" and
 * "Läuft" used interchangeably for the same wire value. Copy is treated here
 * as a token: a component imports the word rather than typing it, so a change
 * of vocabulary is one edit and not a search across eleven packages.
 *
 * Decisions encoded below:
 *  - Register: **du**. TEA's internal products address the operator directly.
 *    Public marketing pages may use a neutral voice, but never a third one.
 *  - Orthography: **real umlauts**. The transliteration pipeline that produced
 *    "Gespraech" also produced Chinese and Portuguese inside German sentences,
 *    which is evidence of a broken pipeline rather than a style.
 *  - Buttons name the *action*, not the object. "Server starten", not "Start".
 */

export const COPY = {
  /* --- actions: verb-first, concrete, no "Bitte" ------------------------- */
  actions: {
    save: "Speichern",
    cancel: "Abbrechen",
    close: "Schließen",
    confirm: "Bestätigen",
    delete: "Löschen",
    remove: "Entfernen",
    create: "Erstellen",
    add: "Hinzufügen",
    edit: "Bearbeiten",
    duplicate: "Duplizieren",
    rename: "Umbenennen",
    move: "Verschieben",
    copy: "Kopieren",
    copied: "Kopiert",
    download: "Herunterladen",
    upload: "Hochladen",
    import: "Importieren",
    export: "Exportieren",
    refresh: "Aktualisieren",
    retry: "Erneut versuchen",
    search: "Suchen",
    filter: "Filtern",
    reset: "Zurücksetzen",
    apply: "Anwenden",
    back: "Zurück",
    next: "Weiter",
    finish: "Fertigstellen",
    start: "Starten",
    stop: "Stoppen",
    restart: "Neu starten",
    pause: "Pausieren",
    resume: "Fortsetzen",
    open: "Öffnen",
    preview: "Vorschau",
    details: "Details",
    settings: "Einstellungen",
    signIn: "Anmelden",
    signOut: "Abmelden",
    undo: "Rückgängig",
    redo: "Wiederholen",
  },

  /* --- states ------------------------------------------------------------ */
  states: {
    loading: "Wird geladen",
    refreshing: "Wird aktualisiert",
    processing: "Wird verarbeitet",
    saving: "Wird gespeichert",
    empty: "Keine Einträge",
    error: "Fehler",
    success: "Erfolgreich",
    offline: "Offline",
    stale: "Veraltete Daten",
    readOnly: "Nur lesbar",
    required: "Pflichtfeld",
    optional: "Optional",
  },

  /* --- navigation -------------------------------------------------------- */
  navigation: {
    main: "Hauptnavigation",
    breadcrumb: "Brotkrümelnavigation",
    pagination: "Seitennavigation",
    toolbar: "Werkzeugleiste",
    skipToContent: "Zum Inhalt springen",
    openMenu: "Menü öffnen",
    closeMenu: "Menü schließen",
    toggleSidebar: "Navigation ein-/ausblenden",
    commandPalette: "Befehlspalette",
    search: "Suche",
  },

  /* --- destructive ------------------------------------------------------- */
  destructive: {
    undoTitle: "Rückgängig gemacht",
    confirmTitle: "Wirklich fortfahren?",
    typeToConfirm: "Zum Bestätigen {name} eingeben",
    irreversibleNote: "Das kann nicht rückgängig gemacht werden.",
  },

  /* --- a11y -------------------------------------------------------------- */
  a11y: {
    close: "Schließen",
    open: "Öffnen",
    loading: "Wird geladen",
    requiredField: "Pflichtfeld",
    invalidField: "Eingabe ungültig",
    more: "Mehr",
    less: "Weniger",
    selected: "Ausgewählt",
    expand: "Ausklappen",
    collapse: "Einklappen",
    page: "Seite",
    of: "von",
    rowsPerPage: "Zeilen pro Seite",
    selectedRows: "{count} ausgewählt",
  },

  /* --- formatting -------------------------------------------------------- */
  formatting: {
    lastUpdated: "Zuletzt aktualisiert",
    never: "Nie",
    justNow: "Gerade eben",
    minutesAgo: "Vor {n} Min.",
    hoursAgo: "Vor {n} Std.",
    daysAgo: "Vor {n} Tg.",
    andMore: "und {n} weitere",
  },
} as const;

/** Substitute `{name}` placeholders. Kept here so every surface does it once. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}

/**
 * Words TEA UI does not use, and what it uses instead. A short list, because a
 * deck nobody reads is a deck nobody follows.
 */
export const FORBIDDEN_COPY: ReadonlyArray<{ avoid: string; use: string; why: string }> = [
  {
    avoid: "Bitte",
    use: "the verb, directly",
    why: "Polite filler that hides the action and lengthens every label.",
  },
  {
    avoid: "Okay / OK",
    use: "the specific action, or nothing",
    why: "A button labelled OK is a button nobody can find by reading.",
  },
  {
    avoid: "Etwas ist schiefgelaufen",
    use: "the error title plus the reason",
    why: "States that nothing, and asks the user to do the diagnosis.",
  },
  {
    avoid: "Fehler 500",
    use: "Serverfehler plus a next step",
    why: "A status code is for logs, not for the person who hit the problem.",
  },
  {
    avoid: "Klicken Sie hier",
    use: "a named control: „Speichern“",
    why: "Describes a mouse gesture instead of the outcome.",
  },
  {
    avoid: "Start / Stop as a bare label",
    use: "Server starten / Server stoppen",
    why: "A bare verb is ambiguous when several actions share a row.",
  },
  {
    avoid: "IP-Adresse (text as label)",
    use: "IPv4-Adresse",
    why: "Confusing two protocols under one name.",
  },
];

/**
 * Interpersonal register. Public marketing may use this, and it is the only
 * alternative permitted; the informal form is the product default.
 */
export const REGISTER = {
  product: "du",
  publicNeutral: "neutral",
} as const;

export type Register = (typeof REGISTER)[keyof typeof REGISTER];
