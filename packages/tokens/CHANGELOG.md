# @tea-ui/tokens

## 2.0.0

### Major Changes

- 71759d4: Replace the `hsm` and `lutea` themes with `pop` and `ton`.

  **Breaking:** `ThemeName` is now `"tea" | "pop" | "ton"`. A consumer passing `"hsm"` or `"lutea"` to `applyTheme`/`useTheme` will get a type error rather than a silent fallback, which is the intended way for this to surface. The Showcase's own theme switcher had the same two values and is updated.

  The old pair was not two themes. Measured across all 46 colour tokens:

  - `primary`, `primary-hover`, `primary-subtle`, `primary-border`, `accent`, `accent-subtle`, `ring` and `ring-strong` were byte-identical in all three. The entire action identity — every button, every link, every focus ring — was one gold.
  - `positive`, `info` and `caution` were identical between `tea` and `hsm`; `critical` differed by `#ff6b5e` vs `#f87171`.
  - The neutrals differed by one to four units per channel (`#111318` vs `#0e1116`), which is not a palette, it is noise.
  - The one genuinely distinct value was HomeServerManager's brand red — on `brand`, a token no component reads, while `primary` stayed gold in every theme. So the identity a product was meant to carry was a dead token.

  The Showcase never applied `data-theme` to its theme cards either, so the section titled "Drei Identitäten" rendered three pixel-identical cards under three different headings.

  `tea` is unchanged and remains the default. The new pair replaces the old one rather than extending the set, because the set's job is to make one claim checkable: a theme is a **palette** and nothing else.

  - **`pop`** — the Web 2.0 peak, early 2007, in the colours that were actually published that spring: Sky Blue `#4DA6FF`, Flickr Pink `#FF0084`, Flock Blue `#4096EE`, Fresh Green, Amber, Coral. It deliberately does not reproduce the gloss: gradients, specular highlights and rounded corners are the shape language, which TEA UI fixes in `index.css` and which a theme has no business touching. A 2007 palette on squared, shadow-hard TEA chrome is a theme; the same palette under a gloss is a different design system wearing TEA's name.
  - **`ton`** — late 2007, when the consensus had already turned: "richer colours, rougher textures, fewer rounded corners", the neon dialled back to earthy hues, burgundy and brown on the dark grey that had become the default. Etsy Vermillion, Ruby on Rails Red, Basecamp Green, 43 Things Gold.

  Two hexes are not the published ones: Digg Blue `#356AA0` and Last.fm Crimson `#D01F3C` cannot reach 4.5:1 against a surface that dark, so their value was raised and their hue left alone. A period-accurate colour that fails WCAG AA is a screenshot, not a reference.

  All 21 contrast checks per theme are enforced by `contrast.test.ts`. That test was also silently under-testing: its parser matched theme names with `[a-z]+`, so it could not see a theme whose name contained a digit, and it reported "one theme" instead of failing. Its name pattern is now `[a-z0-9-]+` and it measures 64 pairs rather than 21.

### Minor Changes

- 71759d4: Add a `selection` prop to `ToggleGroup`/`ToggleGroupItem`, an opt-in sliding indicator, and the motion durations as real tokens.

  **`selection="primary" | "secondary" | "outline"`** chooses which emphasis the pressed state uses. Each value is a Button variant's own recipe, applied to the pressed state, so a selected segment reads as the variant it is instead of as a component with its own idea of "selected". There is no new colour anywhere in the type: the palette is five tones, closed, and a sixth colour is not a decision this system makes. "Secondary" in TEA is not a hue at all — it is the Secondary button's neutral surface one step up.

  The rejected alternative is recorded in the code because it looks reasonable: an `accent`-coloured selection. In the default theme `brand`, `primary`, `accent` and `ring` are all the same gold, so it would have been a word with no visible effect — the same defect as the three themes that shipped one palette under three names. It only differs in `pop` and `ton`, and a control whose appearance depends on the theme is a control whose appearance cannot be reasoned about.

  The choice is a typed prop rather than a `className` because the classes have to be complete literals for Tailwind to extract them. This session produced two silent failures of exactly that kind — a `` `bg-${tone}` `` and a `calc()` arbitrary value — and both read as styling decisions while not existing in the stylesheet at all.

  **`indicator`** draws a surface behind the selected item and moves it, so a segmented control reads as one control with a position in it rather than as one button among several that happens to be pressed. Opt-in, because it is a visible change. It re-measures on selection change, on a `ResizeObserver` of the group, and before the first paint it declares no transition, so nothing animates in from nothing. `aria-hidden` and `pointer-events-none`, because the item already announces itself. Reduced motion needs no work: the stylesheet already collapses every `transition-duration` under `prefers-reduced-motion: reduce`, so the indicator jumps instead of sliding.

  **`ToggleGroup` takes a `label` now.** It did not, and the absence was invisible until the documentation had to be written: `IconButton.label`, `Combobox.label` and `FieldLabel` all take `label`, so a group of radio items silently required `aria-label` instead — a difference nobody finds until they look for it, and one that produces an unnamed `radiogroup` when it is missed. An explicit `aria-label` still wins, because a prop is a convenience and the attribute is the contract.

  The same exercise found that `DialogClose` is a bare `DialogPrimitive.Close` with no `variant` and no styling, which is correct but undocumented. The docs now show `<DialogClose asChild><Button variant="destructive">`, which is the composition that works, and say why.

  **Motion durations are now tokens.** `--duration-*` is not a Tailwind v4 theme namespace, so declaring it produced nothing and `duration-fast` was silently absent from every built stylesheet — including in `Button`, `Select` and `Combobox`, which had already adopted the class name. `duration-[120ms]` kept working, which is exactly how a broken abstraction stays invisible: the workaround compiles, so nothing reports the class that does not. The four durations are now real `@utility` blocks over `--tea-duration-*`, and `motion.test.ts` compares them against `MOTION.duration` and fails the build if the two drift. The same test caught that `--default-transition-timing-function` pointed at `--tea-ease-standard`, which was never defined, and that `MOTION.duration.instant` had no CSS counterpart at all.

  **The arrow keys now carry the selection.** `ToggleGroup` announces `role="radiogroup"`, and Radix's implementation is a button group wearing that name: Space and Enter fire a click and therefore select, but `ArrowRight` only moved the focus. Measured in a browser, `ArrowRight` produced no click at all, `aria-checked` stayed on the previous option, and the theme did not change — a screen-reader user was told they were on "pop" while the group still said "tea". That is an ARIA conformance failure, and it is the same defect this component had once before, when it wrapped hand-written `role="radio"` buttons: announcing a pattern without implementing it. `ArrowLeft`, `ArrowRight`, `Home` and `End` now move value, focus and indicator together; the cross-axis arrows stay inert so they cannot fight the `orientation` prop, and a move that lands on the current value is a no-op rather than a deselect, because a single-select group has no "no theme" state.

  Three ways of getting that wrong are recorded in the code because each of them looked correct. Bailing on `event.defaultPrevented` disabled the behaviour entirely, since Radix prevents the default on every arrow key to stop the page scrolling — the feature was present in every run that did not happen to pass a key handler. Reading the destination from `document.activeElement` a frame later clicked the _old_ item, because Radix moves the focus after the handler, and in jsdom it moves it before, so the same code was correct in the browser and off by one step under test; the destination is now computed from `data-state`, which is correct in both. And `{...props}` spread after the handler silently replaced it, so a consumer passing their own `onKeyDown` lost the behaviour — their handler is now composed rather than overwritten. The registry those arrows read from is filled whether or not an `indicator` is present, because a presentational prop must not be able to switch off an ARIA guarantee.

  **The indicator is measured, not stretched.** It used `inset-y-0`, which resolves against the containing block's padding box, so a group with `p-1` produced an indicator 8px taller than its item — 4px above and 4px below, sitting 1px from the group's own border, cancelling out the inner spacing the group exists to provide. Two further pixel errors survived a first fix that only corrected the vertical axis: `top` and `transform` resolve against different origins, because without an explicit `left` an absolutely positioned flex child keeps its _static_ position — already on the first item's edge — which added a constant 4px in every theme. Asymmetric correctness is worse than symmetric breakage, because it hides behind the half that works. The group border is now subtracted via `clientLeft`/`clientTop`, and the item's own `top` and `height` are used, so the indicator covers the item exactly in all three themes.
