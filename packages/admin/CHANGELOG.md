# @tea-ui/admin

## 1.1.0

### Minor Changes

- 71759d4: Three P0 defects in components a public package hands to strangers, plus the default language they all spoke.

  **The Combobox announced itself as a search box.** `role="combobox"` sat on a `div` with no tabindex, no focus and no value, while the focusable input carried `role="searchbox"`. Assistive technology therefore described the element the user was actually on as a search field, and every piece of combobox state — `aria-expanded`, `aria-activedescendant` — lived one element away from the focus that should own it. WAI-ARIA 1.2 is explicit that for an editable combobox the input _is_ the combobox. `aria-owns` was also present alongside `aria-controls`, pointing at the same list; it is an ARIA 1.1 relic for a relationship `aria-controls` already covers, and two attributes claiming one relationship is how they drift.

  **The multi-select callback threw away the selection.** With `multiple`, committing an option called `onValueChange` with `next[next.length - 1]` — the value just toggled. A consumer could not reconstruct what was selected: it never learned about the earlier choices, and on a _removal_ it was handed a value that was no longer selected at all. `aria-multiselectable` was on the listbox the entire time, so the control claimed a capability its own callback refused to report.

  `ComboboxProps` is now a union instead of one flat interface with a `multiple` flag beside it: with `multiple`, `value` is `string[]` and `onValueChange` reports the whole selection. A single-select group now rejects an array **in the type system**, which the previous shape accepted silently. `combobox.test.tsx` asserts this with three `@ts-expect-error` markers — if the split were reverted, the file would stop compiling.

  **The Dialog's accessible name depended on a child-type comparison.** `React.Children.toArray(children).some(child => child.type === DialogTitle)` looks one level deep, but the composition `DialogContent > DialogHeader > DialogTitle` puts the title one level too deep — so the idiomatic usage failed the check, a visually hidden fallback title rendered next to the real one, and the dialog carried two headings. Fragments and any wrapper failed the same way. The search now recurses. The honest remaining limit is documented: a `DialogTitle` rendered by a consumer _component_ has no children to inspect, and `fallbackTitle` is the escape hatch for it.

  **The default interface language is now English.** `@tea-ui/ux-standards` exports a `COPY` deck, and every component that imported a word from it shipped German text to every consumer of the npm packages — buttons labelled "Speichern", dialogs titled "Ungespeicherte Änderungen", a clear button whose `aria-label` was hardcoded to `"Suche leeren"`. A public package cannot know whether it renders for an operator in Hamburg or a screen-reader user in São Paulo, so the default is the language the package documents itself in, and the _rules_ are kept separate from the _words_: buttons name the action not the object, no politeness filler, no "OK", a status code is not an error message, real orthography always.

  `DESTRUCTIVE_VERBS`, `UNSAVED_CHANGES`, `EMPTY_STATE_TITLES`, `ERROR_TITLES`, the feedback-model labels and `ErrorState`'s retry labels were German outside the deck, hardcoded where the deck was never used — which is how the unsaved-changes dialog ended up rendering "Verwerfen und verlassen" next to "Save". Components that render text take it as a prop (`closeLabel`, `fallbackTitle`, `emptyMessage`, and now `clearLabel`), so a product localises at the call site. `REGISTER.product` was `"du"`; it is now `neutral`, because choosing between an informal and a formal register is a decision about the product's users that the library cannot make.

  The `STATUS` vocabulary keeps its six domains — `backup`, `certificate`, `container`, `dependency`, `project`, `website` — and only the German labels and descriptions move to English. The domain keys are a deliberate decision rather than an oversight: they are the wire values a product maps its own statuses onto, and renaming them would break every consumer that does so without making the library more general. Translating the strings around them is what removes the assumption that the library's users speak German; the domain model is a separate question, and the honest answer there is that it belongs to whoever owns those statuses.

  `language.test.ts` now enforces the result: it fails the build on new hardcoded German in any shipped package, and it fails again if an entry in its list of known German stops existing, so the debt can only shrink. A lint rule is a floor rather than proof — it matches the characters `ä ö ü ß` and a short list of umlaut-free German words, which is why the review still has to look.

  The Combobox's default filter was `toLocaleLowerCase("de")` on both sides. German `ß` does not lowercase to `ss`, so searching for `ss` missed a label ending in `ß`, and every non-German user got German case rules — including the Turkish dotless-i problem, which is a visible bug rather than a subtle one. Folding is now NFD plus combining-mark removal with the runtime's own locale rules, so `cafe` finds `Café Größe`, and a new `locale` prop exists for the consumer who needs to pin it.

  This is **major** for `@tea-ui/ux-standards`: every value in `COPY`, `DESTRUCTIVE_VERBS` and `UNSAVED_CHANGES` changes, and a German consumer that relied on the defaults must now pass its own strings. That is the point of the change, and it is cheaper now than after a product has shipped around it.

- 71759d4: Kill-list entries 6, 10, 14 and 17, plus five lint rules that were never enforced.

  **Table** (`@tea-ui/core`). The audit's merged component inventory listed `Table`
  as `P0` and it did not exist — no `Table`, no `TableHead`, no caption, no
  overflow container, in a repository that ships a `patterns` registry whose
  `Crud` entry already names `Table` in its `composes` array. Ten raw tables in one
  product and a pseudo-list in the other each re-decided the head height, the cell
  padding and the scroll container; one of them styled its head `h-12 px-4` against
  cells at `p-4`, so column one was misaligned because `px-4` is not `p-4`.

  Head and cell now draw from the same `cell-x`/`cell-y` density steps, so they
  cannot drift. `TableHeader` is a real `<thead>`, every `TableHead` carries
  `scope="col"`, and `aria-sort` lives on the head and nowhere else — a permanently
  present `aria-sort="none"` announces on every cell of every table. The scroll
  region is `role="region"` with a required `label` and `tabIndex={0}`, because a
  scrollable region a keyboard user cannot reach is a trap.

  `TableSortButton` is a separate component rather than an `asChild` on
  `TableHead`: replacing the `<th>` with a `<button>` gives a `<tr>` a button child
  and loses the column the cell belongs to. The head is the semantic claim, the
  button is the action.

  **Row actions** (`@tea-ui/admin`). The standard "destructive is never the most
  prominent action of a row" was a contract in a document, which is the kind that
  survives three quarters. `RowActions` decides the ordering once — primary action
  first and labelled, everything else in an overflow menu — and `overflowLabel` is
  **required**, because forty rows with forty buttons all named "Mehr" give a
  screen-reader user forty identical entries and no way to tell them apart.
  `useRowAction` runs a destructive action through the `reversible` /
  `recoverable` / `irreversible` ladder without deciding which level applies: that
  is a fact about the caller's backend, and a component that guesses wrong about a
  deletion is worse than one that asks.

  **`RefreshButton`** (kill-list 10: fifteen sites, thirteen hand-written `RefreshCw`
  spin swaps). `refreshing` rather than `busy`, because the audit counted twelve
  different busy prop names across one app. The glyph is removed rather than dimmed
  while refreshing — `Button`'s spinner takes its place, so the width holds.

  **`IconTile`, `CardGrid`, `CardGridItem`**. `aria-label` and `aria-hidden` are
  omitted from `IconTileProps` on purpose: a tile that can be named is a tile that
  will be, and the screen reader then announces "Server" immediately before the
  product name. `CardGrid` is a `<ul>`, because a grid of resources is a list and a
  list is what a screen reader can count; its columns auto-fit, because a grid with
  a fixed column count per breakpoint is a grid that is wrong at some width.

  **Icons** (+64). Derived from what the kill-list components need, not from what
  lucide ships. `ArrowUpDown`, `ListFilter`, `Funnel` are the three affordances of a
  table; `BadgeCheck` is a _verified_ state that is neither the existing
  `CircleCheck` (healthy) nor a tone; `Radar`/`Siren` are separate because
  `TriangleAlert` says something is wrong now and `Siren` says something is wrong
  across a fleet.

  **Lint — five audit bans that had never fired.** `eslint.config.mjs` anchored
  every className pattern with `^`, but the `value` of a `className` literal is the
  _whole_ class string: `Literal[value=/^z-\[/]` only matches a className that
  _begins_ with `z-[`, so `"flex gap-2 z-[9999]"` passed. Verified by probe before
  and after. Repaired: `focus:`, `z-[N]`, `rounded-*`, `dark:`, `shadow-[…]`, raw
  palette (`text-red-300`), and the Tailwind-v4 `(…)` form that emits nothing.

  Rules 1 and 2 are not bans and cannot be value patterns — rule 2 is a _pair_ of
  classes that must co-occur in one className string — so they are implemented as
  `scripts/eslint-plugin-tea-ui.mjs`. The first version of that plugin read
  `node.value.arguments` on a `className={cn("a","b")}`, which is a
  `JSXExpressionContainer`, matched nothing in the entire codebase, and reported
  green; 17 tests in `tests/eslint-plugin-tea-ui.test.ts` cover the shapes the
  codebase actually uses.

  With the rules live, five real violations surfaced **in TEA UI's own code** and
  are fixed here: the `SkipLink` used `focus:`; the toast viewport, the combobox
  input, the `SelectItem` and the `NavigationMenuLink` each removed a focus
  indicator without replacing it.

- 71759d4: `Meter` and `Score`: kill-list entries 8 and 12.

  **`Meter`** (`@tea-ui/core`). The audit found three hand-built meters in one
  product — `h-1.5 … bg-muted` plus an inline width — and **none of them had a
  role**: no `aria-valuenow`, no accessible name, so a screen reader read them as
  three empty divs. `MetricCard` in the admin layer had a hand-rolled
  `role="meter"`; this is its extraction, and `MetricCard` now composes it, so the
  role, `aria-valuenow` and the `valueText` live in one place.

  `valueText` is the part that makes the number usable: a raw `87` on a range of
  `0…100` is announced as a bare figure, and "18,4 GB von 25 GB belegt" is the
  sentence the user needed. Thresholds are drawn onto the track on request — a
  band the user cannot see the edge of is a band they cannot reason about before
  they reach it.

  `Meter` is a scalar measurement; `Progress` is task completion. They look alike
  and mean different things, which is why they are two components and not one with
  a prop.

  ### On `role="meter"` rather than `role="progressbar"` — a deliberate deviation

  `CONSOLIDATION.md` §6 S1c prescribes `role="progressbar"` here. That is followed
  for `Progress` and deliberately **not** for `Meter`. WAI-ARIA 1.2 defines
  `progressbar` as progress toward _task completion_ and `meter` as a _scalar
  measurement within a known range_, and notes the latter is specifically not about
  loading. A disk at 87 % is a measurement; announcing it as "87 % finished" is a
  different and usually wrong claim.

  The audit's own goal is the reason to depart: the rule exists so that the real
  attribute is what lands in the accessibility tree. Deviating from the letter of
  the audit in order to honour its purpose is recorded here rather than left for
  the next reader to find as an inconsistency.

  **`Score`** (`@tea-ui/admin`). The audit counted **four renderings of one score**
  in one product, with two threshold sets, four hard-coded hexes duplicating a
  status table that was itself broken, and one bare `font-mono` number that got the
  accessibility right by giving up the meaning. A value of 42 read as _neutral_ on
  the dashboard and as _warning_ in the auditor.

  The two products differed in **two** ways, and only one survives review:

  | divergence              | dashboard | auditor    | kept?                                                             |
  | ----------------------- | --------- | ---------- | ----------------------------------------------------------------- |
  | the middle threshold    | `>= 40`   | `>= 45`    | **yes** — a lead score and an audit score are different questions |
  | the tone of a low score | `neutral` | `critical` | **no**                                                            |

  The second is a defect in both rather than a domain difference: grey says "no
  measurement", and a score of 0 measured and found wanting is not the same fact as
  no score at all. So `DEFAULT_SCORE_BANDS` keeps the auditor's tone and
  `LEAD_SCORE_BANDS` offers the softer _threshold_ — the tone of a low score is
  `critical` in both, and no table offers `neutral`, because "no measurement" is not
  a band. It is `indeterminate`, which renders **no bar**: a bar at zero is a claim
  about a reading that was never taken.

  A score is the number, the band word and the tone — three signals. Greyscale, a
  screen reader and a colour-blind user get the same answer, and the number beside an
  explicit label is `aria-hidden` so it is not announced twice.

- 71759d4: Kill-list entry 13, three `ux-standards` rules that no component consulted, and
  the encoding guard the audit asked for.

  **`Nav` / `NavItem`** (kill-list 13: two byte-identical nav-item blocks in one
  product, five hand-rolled ones in the other, six sites between them). The
  duplication was never the styling — it was three decisions each site re-made.
  `AdminShell` already had this logic but kept it **private**, so no product could
  build a navigation; it now composes the shared one, and the ~100 lines it was
  duplicating are gone.

  Three guarantees the audit demanded and the source product failed:

  - `label` is a **required** prop. The audit counted three `<nav>` elements with
    no `aria-label`, and the whole HSM frontend with three `role` assignments.
  - `aria-current="page"` on the active item, beside the styling. Colour alone is
    invisible to a screen reader and ambiguous in a greyscale screenshot.
  - The active marker is a **border on the inline-start edge plus a weight change**,
    never a solid fill. TEA UI deliberately sets `ring` and `accent` to the same
    gold, so a filled active item would obliterate the focus ring painted on it.

  A real `<a>` when the item has an `href`, a real `<button>` when it does not —
  the source product had eight `div onClick` nav targets, which are not focusable
  and do nothing on Enter. `IA_LIMITS` is consulted in development only: a
  fourteen-entry sidebar is a design problem, so it warns and names the limit, but
  it does not throw. A library that crashes a product's dev server over navigation
  taste has overstepped.

  **`useUnsavedChanges`.** The `Crud` and `MasterDetail` pattern contracts both
  end with _"on leaving with unsaved changes, ask — see `UNSAVED_CHANGES`"_ — and
  nothing implemented it. The standard was a paragraph and a constant, and a
  paragraph is what a data-loss bug walks past.

  Four exit paths, each with its own browser behaviour: the caller's `guard()` for
  in-app navigation, `beforeunload` for the tab and for reload, and `popstate` for
  back/forward — which cannot be cancelled, so the state is pushed back and a live
  region says why the user did not move. `beforeunload` is documented as the one
  path that cannot be styled and is ignored unless the user has interacted, which
  is a platform fact and exactly why the in-app path carries the real design work.

  `UNSAVED_CHANGES.preferSave` is `true`, so passing `save` renders a **three**
  button dialog with _Speichern_ as the primary action. Declaring the prop without
  implementing it would be a control that lies — audit rule 38 — so it is
  implemented, and discarding deliberately leaves the form dirty.

  `AlertDialogContent`, `AlertDialogHeading` and `AlertDialogFooter` are now
  exported parts, because a second dialog needed the same frame and copying the
  class strings into it would be the exact defect the audit counted forty of.

  **`LoadingState` renders nothing under `MIN_SKELETON_MS`.** A fetch that answers
  in 120 ms is the common case, and a skeleton that appears and vanishes inside a
  fifth of a second reads as a rendering glitch: it pulls the eye to a change,
  announces itself to a screen reader, and takes it back. Below the floor the
  correct affordance is no affordance.

  **`scripts/check-encoding.mjs` — audit rule 21, wired into `verify` and CI.** The
  audit asked for a CI grep and warned that _"this guard is needed before any
  extraction, or the corruption moves with the strings."_ It was not hypothetical
  here: this repository shipped commit `0df5138`, "Repair mojibake in 40 files".
  `scripts/repair-encoding.mjs` fixed them and is invoked by hand, once, and never
  again — a repair tool that has already been run once is indistinguishable from one
  that has been forgotten. This is the check half: fifteen mojibake signatures, and
  it fails the build.

  Two paths are exempt, each with its reason recorded: `docs/audit/**`, which
  _quotes_ mojibake because that is the evidence and "fixing" it would destroy the
  finding, and the repair tool, which names the sequences it hunts. The patterns
  are written as `\u` escapes so the checker cannot trip on its own source — a
  first version spelled them out and matched itself, which is the fastest route to
  a rule somebody switches off. Verified by injecting a real occurrence and
  watching it fail.

  **Note for anyone editing this repository from PowerShell:** `Get-Content`
  without `-Encoding UTF8` reads as ANSI and `Set-Content -Encoding utf8` writes
  back a double-encoded file. That is the exact vector rule 21 describes, and it
  damaged this repository once already. Use the editor or a Node script.

  ***

  No package API changes in this entry — the Showcase and the documentation are
  where the new components are exercised.

  **Showcase** (`apps/showcase`) gains live demos for every new element: the table
  with a working sort, a toggleable empty state (`EmptyStateFiltered` inside
  `TableEmptyRow`), `RowActions` in a real row, `Meter` at three sizes and
  deliberately over its maximum, `Nav` in a sidebar frame, the unsaved-changes
  guard driven by real state, `Score` in all three bands plus `indeterminate`,
  `IconTile` in all five tones, `CardGrid`, and `RefreshButton` with a live
  `RefreshingIndicator`.

  Everything is driven by real values and real state — four servers with real
  health wire values, a real `activeId`, a real `dirty` flag. The alternative is a
  gallery of static images, which proves nothing about a library, and the audit's
  most expensive finding was that both source products carried a private copy of
  the UI they were supposed to be sharing.

  **Documentation** gains a `data` page covering `Table`, `Meter`, `Nav` and
  `useUnsavedChanges`, with API tables for the three that have a non-obvious
  contract.

  `ApiTable` in the documentation itself was a hand-written `<table>` with a
  `min-w-[40rem]` and an `sr-only` caption — the exact shape the audit counted ten
  of in one product. It now renders through `Table`, so the overflow region, the
  caption and `scope="col"` cannot be forgotten at a call site. The documentation
  is the first thing that should use its own components: if `Table` cannot render
  an API table, it cannot render anyone's.

### Patch Changes

- 71759d4: Bring the showcase, the documentation and the public JSDoc onto the English defaults the components now ship with, and remove the internal audit and product narrative from all three.

  **The showcase and docs were still describing a product that no longer exists in the code.** `COPY` and every runtime default became English earlier in this release; 109 lines of showcase prose and 127 lines of documentation prose had not followed. A visitor therefore read a library whose components render English copy being demonstrated with German labels, German accessibility copy and German API tables — the two halves of the same artifact contradicting each other. All of it is English now, and the check for it is a sweep for `äöüß` across `apps/`, which is how the count was arrived at rather than by eye.

  **Three claims in the showcase were false, and one of them was the kind that erodes trust.** The package table read `—` in a column headed "Status" for `@tea-ui/ux-standards`, `@tea-ui/admin` and `@tea-ui/public`, with a badge reading `geplant` — _planned_ — for all three. They ship 15, 8 and 10 named exports respectively. The table also mixed three incompatible metrics in one column, so `icons` read 90 and `core` read 120+ while the export contract said 1 and 62: component counts, icon counts and named-export counts, none of which is comparable to the others. The column is now the count `npm run check:exports` verifies, per row, with the gzip cost beside it, because a consumer pays for the second number and can check the first.

  **The home page claimed packages that do not exist.** "Components, patterns, templates, blueprints and UX standards live in one place" — `patterns`, `templates` and `blueprints` are declared in the boundary check and export nothing. That sentence is now what is true, and the four unimplemented packages carry `declared, not implemented` as a distinct value rather than a dash in a column that also holds real counts. A dash in a table cannot be distinguished from a rendering bug, and the difference between "we ship this" and "we planned this" is the whole point of the column.

  **The internal narrative was still in the prose.** The Architecture section had been cleaned; the other seven sections had not. "When two TEA products solve the same interaction problem", "the audit counted eight sites in the source product", "in both source products the primary colour is a gold", "both source products replaced the whole region with a spinner on every five-second poll". The technical claims underneath are good and are kept — 980px of minimum width against a 1024px breakpoint is a real unresolved tension, and a five-second poll genuinely is not a reason to blank a region. What is gone is the part that addressed an internal reader. A published design system has no source product to refer to, and a reader who notices is right to stop trusting the numbers next to it.

  **Public JSDoc was German too**, which is where it hurts most: `<FieldDescription>Wir senden keine Bestätigung.</FieldDescription>`, `<DialogTitle>Server löschen</DialogTitle>` and `overflowLabel={`Aktionen für ${server.name}`}` ship in the `.d.ts` files and land in the consumer's editor. All examples are English now. The two remaining German mentions in the source are deliberate: the comment in `combobox.tsx` explaining why `ß` does not lowercase to `ss` has to name `ß`, and `terminology.ts` uses `Gespräch` to make the point that transliteration is not real orthography.

  **One test fixture changed deliberately.** The combobox diacritic-folding test used `Café Größe` to prove that typing `cafe` finds `Café Größe`. The German word was incidental, and it is now `Café Crème` — which is a slightly stronger test, because it carries two distinct diacritics rather than one, and it removes the last German string from a test that was never about German.

  **Also fixed while sweeping:** `chrome.tsx` had `description: "Die Regeln, nicht die-theory"` — a German sentence with an English fragment spliced onto the end, which is the kind of thing that survives because no reader reports a nav tooltip. And `DENSITY_LABEL` in the showcase's density switcher was `Kompakt`/`Standard`/`Komfortabel`, so the control that sets the system's spacing was labelled in a different language from every component it affected.

- Updated dependencies [71759d4]
- Updated dependencies [71759d4]
- Updated dependencies [71759d4]
- Updated dependencies [71759d4]
- Updated dependencies [71759d4]
- Updated dependencies [71759d4]
- Updated dependencies [71759d4]
- Updated dependencies [71759d4]
- Updated dependencies [71759d4]
- Updated dependencies [71759d4]
- Updated dependencies [71759d4]
- Updated dependencies [71759d4]
  - @tea-ui/core@1.1.0
  - @tea-ui/ux-standards@2.0.0
  - @tea-ui/icons@1.1.0
  - @tea-ui/tokens@2.0.0
