---
"@tea-ui/tokens": major
"@tea-ui/core": patch
---

Replace the `hsm` and `lutea` themes with `pop` and `ton`.

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
