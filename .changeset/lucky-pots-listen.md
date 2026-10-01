---
"@tea-ui/patterns": minor
"@tea-ui/ux-standards": minor
---

Ship the first two real patterns: FilterBar and ActionBar

`@tea-ui/patterns` published a registry naming six patterns and exported none of
them. That is worse than an empty package, because `PATTERNS` reads like an
answer: a consumer importing it gets an array of names, a type-check, and no
compositions. Two land here.

**FilterBar** owns the three answers the controls cannot give: where the match
count sits, when Reset appears, and what the row does when it wraps. The count
lives in the bar rather than in the empty state, because a list filtered to zero
has an empty state and the count disappears exactly when the user needs it — and
because "no results" says nothing about the filter that just removed everything.
It is an `<output>`, so the announcement does not depend on the consumer
remembering `aria-live`. Reset is bound to `active` rather than to "the input is
non-empty", since empty input with a filter still applied leaves the user with no
way back.

**ActionBar** enforces the order instead of trusting it: primary leftmost,
destructive rightmost, whatever order the actions were passed in. The audit found
that order was whatever each project wrote first, which meant Delete landed left
of Save on a form — a silent claim about which action a user reaches for by
reflex. More than five actions move into a menu rather than wrapping, because a
wrapped row drops its right end below the fold and the right end is where the
destructive action now lives. Destructive actions are split out before the cap is
applied, so a full bar can never push Delete into the overflow. `label` is a
required string rather than an optional prop with an icon fallback, because an
action that can be declared without a text label is an icon the user has to
guess at.

`@tea-ui/ux-standards` adds `COPY.a11y.matchesOne` and `matchesMany`. Two keys
rather than one `"{count} matches"`, because "1 matches" is the sort of detail a
design system exists to remove, and a product with different plural rules
replaces two strings instead of shipping a grammar bug.