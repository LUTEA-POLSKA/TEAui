---
"@tea-ui/core": minor
"@tea-ui/admin": minor
"@tea-ui/icons": minor
---

Kill-list entries 6, 10, 14 and 17, plus five lint rules that were never enforced.

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
table; `BadgeCheck` is a *verified* state that is neither the existing
`CircleCheck` (healthy) nor a tone; `Radar`/`Siren` are separate because
`TriangleAlert` says something is wrong now and `Siren` says something is wrong
across a fleet.

**Lint — five audit bans that had never fired.** `eslint.config.mjs` anchored
every className pattern with `^`, but the `value` of a `className` literal is the
*whole* class string: `Literal[value=/^z-\[/]` only matches a className that
*begins* with `z-[`, so `"flex gap-2 z-[9999]"` passed. Verified by probe before
and after. Repaired: `focus:`, `z-[N]`, `rounded-*`, `dark:`, `shadow-[…]`, raw
palette (`text-red-300`), and the Tailwind-v4 `(…)` form that emits nothing.

Rules 1 and 2 are not bans and cannot be value patterns — rule 2 is a *pair* of
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
