---
"@tea-ui/core": minor
---

Add `ToggleGroupItem`, and fix `ToggleGroup`, which never worked.

`ToggleGroup` rendered Radix's root, so the container announced `role="radiogroup"` — but its documented children were `Toggle`s, and `Toggle` is built on Radix's *standalone* `Toggle`, which knows nothing about a group. It renders `aria-pressed` and never registers a value.

Two things followed, and both were silent:

- A radiogroup was shipping with plain pressed-buttons inside it. No `aria-checked`, no roving focus, no arrow keys, and the group was three tab stops rather than one.
- The group's own `value`, `defaultValue` and `onValueChange` went nowhere, because nothing inside ever reported a value. The Showcase's theme switcher highlighted on click and changed no theme; the grid/list switch in the Showcase's own component gallery did the same.

A control that renders as switched and is not is the same defect as a table that reorders its glyph without reordering its rows. Both were found by asserting behaviour rather than by reading the markup, and the Showcase had been shipping the broken version throughout.

`ToggleGroupItem` is a Radix `ToggleGroup.Item`: it reports its value to the group, carries `role="radio"` and `aria-checked` in a single-select group, and takes part in the roving tabindex. It reads the same style context as `Toggle`, so `variant` and `size` set once on the group still reach items wrapped in a consumer's own component.

`Toggle` is unchanged and keeps its meaning: a standalone toggle button with `aria-pressed`, for "a lone toggle is usually a checkbox that got the wrong component" reasons.
