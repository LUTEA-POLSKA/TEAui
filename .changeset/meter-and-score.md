---
"@tea-ui/core": minor
"@tea-ui/admin": minor
---

`Meter` and `Score`: kill-list entries 8 and 12.

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
`progressbar` as progress toward *task completion* and `meter` as a *scalar
measurement within a known range*, and notes the latter is specifically not about
loading. A disk at 87 % is a measurement; announcing it as "87 % finished" is a
different and usually wrong claim.

The audit's own goal is the reason to depart: the rule exists so that the real
attribute is what lands in the accessibility tree. Deviating from the letter of
the audit in order to honour its purpose is recorded here rather than left for
the next reader to find as an inconsistency.

**`Score`** (`@tea-ui/admin`). The audit counted **four renderings of one score**
in one product, with two threshold sets, four hard-coded hexes duplicating a
status table that was itself broken, and one bare `font-mono` number that got the
accessibility right by giving up the meaning. A value of 42 read as *neutral* on
the dashboard and as *warning* in the auditor.

The two products differed in **two** ways, and only one survives review:

| divergence | dashboard | auditor | kept? |
|---|---|---|---|
| the middle threshold | `>= 40` | `>= 45` | **yes** — a lead score and an audit score are different questions |
| the tone of a low score | `neutral` | `critical` | **no** |

The second is a defect in both rather than a domain difference: grey says "no
measurement", and a score of 0 measured and found wanting is not the same fact as
no score at all. So `DEFAULT_SCORE_BANDS` keeps the auditor's tone and
`LEAD_SCORE_BANDS` offers the softer *threshold* — the tone of a low score is
`critical` in both, and no table offers `neutral`, because "no measurement" is not
a band. It is `indeterminate`, which renders **no bar**: a bar at zero is a claim
about a reading that was never taken.

A score is the number, the band word and the tone — three signals. Greyscale, a
screen reader and a colour-blind user get the same answer, and the number beside an
explicit label is `aria-hidden` so it is not announced twice.
