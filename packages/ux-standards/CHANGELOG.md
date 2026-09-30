# @tea-ui/ux-standards

## 2.0.0

### Major Changes

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

### Minor Changes

- 71759d4: Remove a dead live region from the toast surface, name the dismiss-all control for what it does, and stop the module comment claiming a feature that does not exist.

  **The toast surface rendered a live region that could never announce anything.** `<span className="sr-only" aria-live="polite" data-toast-count={0} />` was fed by a local `const overflow = 0`, so the region never changed and never announced. A live region is a promise made to a screen-reader user; one that is added on every mount and stays silent is worse than none, because it is indistinguishable from a region that is working. Radix's `Toast.Root` registers with the provider and keeps its own `aria-live` region — confirmed in the rendered DOM, which carries `<span aria-live="assertive" role="status">Notification …</span>` appended outside the React tree — so this surface now renders no region of its own.

  **The dismiss-all control read "Reset".** Nothing on a toast is a form, and nothing about closing three notifications puts anything back the way it was; the verb promised a different action than the one it performed. `COPY.actions.dismissAll` is new, which is a minor on `@tea-ui/ux-standards`.

  **The module comment documented an overflow counter that was never built.** It claimed the limit was three "counted and shown rather than swallowed", and that a user who triggered four operations "is told that three are running and one is queued". The code does `slice(-TOAST_LIMIT)` and has no counter, no queue and no notice. The comment is now what the code does: three at once, oldest dropped, drop silent, and the reason that silence is the honest one — a surface that claims to report a queue has to report one.

  **The audit of this file was wrong twice, and the tests are what caught it.** The first pass asserted from the JSX that toasts rendered as siblings of the viewport, which would have put every toast in normal document flow while the `fixed end-0 top-0` classes sat on an empty element. They do not: `ToastPrimitive.Root` is rendered _through_ the viewport, so the sibling relationship in the source says nothing about the DOM. The second pass reported that `dismiss(id)` left its timer armed, on the strength of a test that compared `toast.dismiss` to `toast.dismiss` and therefore could not fail. `dismiss` has called `clearTimer(id)` all along. Both claims are recorded in the test file as the reason those tests assert the rendered DOM and a subscriber's render count rather than the shape of the source.

  The suite also needed a test-environment fix rather than a product fix. The viewport is swipe-dismissible, so a click anywhere inside a toast reaches a handler that calls `hasPointerCapture`, which jsdom does not implement; the resulting `TypeError` surfaced as an unhandled error that failed runs whose assertions all passed. `vitest.setup.ts` now stubs the pointer-capture trio, with `hasPointerCapture` answering `false` because capture is never actually held under jsdom.

  **Known sharp edge, still documented rather than fixed:** the store is module-level, so a second `Toaster` renders every toast a second time _and_ has the primitive announce it a second time. The source says mount this once; `toast.test.tsx` now pins that behaviour so the advice cannot rot silently, and a follow-up should make a second `Toaster` render nothing instead.

### Patch Changes

- Updated dependencies [71759d4]
- Updated dependencies [71759d4]
  - @tea-ui/tokens@2.0.0
