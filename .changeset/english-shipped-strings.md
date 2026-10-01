---
"@tea-ui/ux-standards": minor
"@tea-ui/core": minor
"@tea-ui/admin": minor
"@tea-ui/patterns": minor
"@tea-ui/templates": minor
"@tea-ui/public": patch
---

Get the shipped strings back to English, and separate the score from the meter

**140 German string values shipped across six packages.** `FEEDBACK.idle` said
"Bereit", `METER_BANDS` was `Gut`/`Mittel`/`Schwach`/`Unbekannt` in full, the
`WEBSITE.deploying` label said "Wird ausgerollt", and the four scope registries
shipped German in `PATTERNS`, `TEMPLATES`, `BLUEPRINTS` and `SPECIALIZED` --
which is worse, because those are read by a consumer's tooling, not rendered to
their users. Four `sr-only` announcements and two busy-labels were German too.

**The guard did not catch them, and the reason is the finding.** Of those 140, the
pre-existing ratchet would have stopped 16. All 16 carried an umlaut, a `ss`, or a
word already on its list. The registries ship *sentences*, and a German sentence is
mostly function words -- so the remaining 124 were invisible to a word list.
Measured, not estimated; both numbers are now written into the test's comment as
the receipt.

Widening the list with ~90 content words would mean adding a function-word rule,
and that would fire on `format/index.ts` and force an API break out of scope. So
the list records the nouns, and its header comment now says what it is: a receipt
of what has been found, not a detector. `KNOWN_GERMAN` ended **empty** -- it was
used as a holding pen for two strings during the work and both are now fixed, and
the test that bites a stale entry is armed for whoever parks the next one.

**`Score` no longer borrows `Meter`'s vocabulary, because it cannot.** `Meter`
reports a quantity against a limit, so higher is worse and the tone ladder is
right. `Score` reports achievement, so higher is better -- and the ladder reads
backwards: translating `METER_BANDS` turned a lead score of 62 into "62 Elevated"
and 44 into "44 Critical". The German had hidden the coupling, because "Mittel"
and "Schwach" read correctly for a score and would not have read correctly for a
meter. `SCORE_BANDS` is now a grade scale in admin; the *tones* stay shared,
because colour means the same thing in both places. Only the word follows the
direction of the number.

Also: `AdminShell` gained the `tagline` prop from the previous commit's sibling
work, and `@tea-ui/public` picks up the two busy-labels it was hardcoding.

Gate: 308 tests, boundaries, encoding, types, lint, both builds, the export
contract, tree-shaking and both app builds green.