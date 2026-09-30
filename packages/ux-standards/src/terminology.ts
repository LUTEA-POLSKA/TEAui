/**
 * TEA UI — the terminology deck.
 *
 * One language across the whole library. Copy is treated here as a token: a
 * component imports the word rather than typing it, so a change of vocabulary
 * is one edit and not a search across every package.
 *
 * ## The defaults are English
 *
 * The values below used to be German, and every component that imported a word
 * from this deck shipped German interface text to every consumer of the npm
 * packages. That is a library deciding its users' language. A public package
 * cannot know whether it is being rendered for an operator in Hamburg or a
 * screen-reader user in São Paulo, so the default has to be the language its
 * own documentation is written in, and the *rules* have to be separable from
 * the *words*.
 *
 * The rules are the part worth keeping, and they hold in any language:
 *
 *  - **Buttons name the action, not the object.** "Start server", not "Start".
 *    A bare verb is ambiguous the moment two actions share a row.
 *  - **No politeness filler.** "Please" hides the action and lengthens the label.
 *  - **No "OK".** A button labelled OK is a button nobody can find by reading.
 *    Name the outcome, or leave the button out.
 *  - **A status code is not an error message.** It belongs in the log, not in
 *    the sentence shown to the person who hit the problem.
 *  - **Real orthography, always.** A pipeline that transliterates "Gespräch"
 *    to "Gespraech" is a broken pipeline, not a style.
 *
 * ## Supplying another language
 *
 * There is deliberately no runtime deck-switching mechanism here. Threading a
 * deck through every component would put a locale provider in the middle of a
 * token layer for a decision most products make once, at their own entry point.
 * Instead, components that render text accept it as a prop (`closeLabel`,
 * `fallbackTitle`, `emptyMessage`, `clearLabel`), and a product that needs a
 * different language sets it at the call site. A product that wants the whole
 * deck translated should keep its own copy of this file rather than a fork of
 * the components — the deck is a single module for exactly that reason.
 */

export const COPY = {
  /* --- actions: verb-first, concrete, no filler ---------------------------- */
  actions: {
    save: "Save",
    cancel: "Cancel",
    close: "Close",
    dismissAll: "Dismiss all",
    confirm: "Confirm",
    delete: "Delete",
    remove: "Remove",
    create: "Create",
    add: "Add",
    edit: "Edit",
    duplicate: "Duplicate",
    rename: "Rename",
    move: "Move",
    copy: "Copy",
    copied: "Copied",
    download: "Download",
    upload: "Upload",
    import: "Import",
    export: "Export",
    refresh: "Refresh",
    retry: "Try again",
    search: "Search",
    filter: "Filter",
    reset: "Reset",
    apply: "Apply",
    back: "Back",
    next: "Next",
    finish: "Finish",
    start: "Start",
    stop: "Stop",
    restart: "Restart",
    pause: "Pause",
    resume: "Resume",
    open: "Open",
    preview: "Preview",
    details: "Details",
    settings: "Settings",
    signIn: "Sign in",
    signOut: "Sign out",
    undo: "Undo",
    redo: "Redo",
  },

  /* --- states -------------------------------------------------------------- */
  states: {
    loading: "Loading",
    refreshing: "Refreshing",
    processing: "Processing",
    saving: "Saving",
    empty: "No entries",
    error: "Error",
    success: "Success",
    offline: "Offline",
    stale: "Out of date",
    readOnly: "Read-only",
    required: "Required",
    optional: "Optional",
  },

  /* --- navigation ---------------------------------------------------------- */
  navigation: {
    main: "Main navigation",
    breadcrumb: "Breadcrumb",
    pagination: "Pagination",
    toolbar: "Toolbar",
    skipToContent: "Skip to content",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    toggleSidebar: "Toggle navigation",
    commandPalette: "Command palette",
    search: "Search",
  },

  /* --- destructive --------------------------------------------------------- */
  destructive: {
    undoTitle: "Undone",
    confirmTitle: "Continue anyway?",
    typeToConfirm: "Type {name} to confirm",
    irreversibleNote: "This cannot be undone.",
  },

  /* --- a11y ---------------------------------------------------------------- */
  a11y: {
    close: "Close",
    open: "Open",
    loading: "Loading",
    requiredField: "Required",
    invalidField: "Invalid entry",
    more: "More",
    less: "Less",
    selected: "Selected",
    expand: "Expand",
    collapse: "Collapse",
    page: "Page",
    of: "of",
    rowsPerPage: "Rows per page",
    selectedRows: "{count} selected",
  },

  /* --- formatting ---------------------------------------------------------- */
  formatting: {
    lastUpdated: "Last updated",
    never: "Never",
    justNow: "Just now",
    minutesAgo: "{n} min ago",
    hoursAgo: "{n} h ago",
    daysAgo: "{n} d ago",
    andMore: "and {n} more",
  },
} as const;

/** Substitute `{name}` placeholders. Kept here so every surface does it once. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}

/**
 * Words that are hard to defend, and what to use instead. A short list, because
 * a deck nobody reads is a deck nobody follows.
 *
 * `avoid` holds words from more than one language on purpose. The rules are
 * language-independent; the examples are the two languages this library is used
 * in, and a product writing a third will recognise the shape faster than the
 * string.
 */
export const FORBIDDEN_COPY: ReadonlyArray<{ avoid: string; use: string; why: string }> = [
  {
    avoid: "Bitte / Please",
    use: "the verb, directly",
    why: "Politeness filler that hides the action and lengthens every label.",
  },
  {
    avoid: "Okay / OK",
    use: "the specific action, or nothing",
    why: "A button labelled OK is a button nobody can find by reading.",
  },
  {
    avoid: "Etwas ist schiefgelaufen / Something went wrong",
    use: "the error title plus the reason",
    why: "States that nothing, and asks the user to do the diagnosis.",
  },
  {
    avoid: "Fehler 500 / Error 500",
    use: "a plain title plus a next step",
    why: "A status code is for logs, not for the person who hit the problem.",
  },
  {
    avoid: "Klicken Sie hier / Click here",
    use: "a named control: “Save”",
    why: "Describes a mouse gesture instead of the outcome.",
  },
  {
    avoid: "Start / Stop as a bare label",
    use: "Start server / Stop server",
    why: "A bare verb is ambiguous when several actions share a row.",
  },
  {
    avoid: "IP-Adresse (used as a field label)",
    use: "IPv4 address",
    why: "Confusing two protocols under one name.",
  },
];

/**
 * Register of address.
 *
 * The default is `neutral`, because picking between an informal and a formal
 * register is a decision about the *product's* users and the library cannot
 * make it. Products that address the operator directly may declare `informal`
 * (German "du"), and a public marketing surface may declare `formal` (German
 * "Sie") — but that choice is theirs, and it is made once, in their own code.
 */
export const REGISTER = {
  product: "neutral",
  publicNeutral: "neutral",
} as const;

export type Register = (typeof REGISTER)[keyof typeof REGISTER];
