---
"@tea-ui/core": minor
---

Add `useTableSort` — the sorting state machine for `Table`, and fix the three places that were already broken.

`Table` is presentational by design: the head carries the semantic claim (`<th scope>`, `aria-sort`), `TableSortButton` is the action, and neither knows what the data looks like. That division is correct, and it has a cost. The audit's table line records that *"sorting exists end-to-end in the API and is simply not wired up"*, and the kit's own answer listed **"no sorting"** as a capability it did not provide — so every product hand-wrote the same state, and all three copies got it wrong:

- a sort button that moved a glyph while the rows stayed in their original order, because the state was never connected to a comparator;
- one column hard-coding `active direction="ascending"`, so clicking a second column produced two heads claiming to be sorted;
- no `aria-sort` anywhere, so a screen-reader user got no sort state from any of it;
- a documentation example shipping a `TableSortButton` with no `onClick` — an inert button, in the one place people copy from.

None of those are styling mistakes and none of them are fixed by a lint rule. They are the same state machine, written again, so it now exists once:

- `columns` declares how each sortable column reads its value. A column without an entry therefore has no `toggle`, so a button that does nothing cannot be created in the first place.
- `toggle` cycles ascending → descending → **unsorted**. The third state is what lets `TableHead` omit `aria-sort` again instead of announcing "not sorted" on every head of every table.
- `ariaSortFor`, `directionFor` and `activeFor` keep the head, the button and the announced state from drifting apart — which is precisely how the Showcase table ended up claiming two sorted columns at once.
- `sorted(rows)` is the difference between sorting and looking sorted. It never mutates or aliases the caller's array.
- String columns compare with numeric collation, so `srv-2` sorts before `srv-10`; the default collation reverses them and reads as a bug in every product with padded ids.
- The comparison stays with the caller, because it is domain knowledge: a status column sorts by severity, not alphabetically.
