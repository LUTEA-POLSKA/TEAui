---
"@tea-ui/ux-standards": major
"@tea-ui/tokens": major
"@tea-ui/core": major
---

Resource status as three axes, a fourth density, and an honest stylesheet

**`ux-standards` gains `lifecycle` and `availability`, and `resourceStatusMeta`.**

A flat list of nine server states cannot express the two situations a customer is
actually watching. A server that is **starting** is not **online**, and saying so is
the difference between an interface that reports success before the backend confirmed
it and one that does not. A **suspended** server may well be running — it is held by
the operator, so its owner cannot reach it — and collapsing that into the health axis
loses the reason, leaving a customer who is told "offline" about a running server to
file the wrong support request.

So the state is three fields: `health`, `lifecycle` (`none`, `provisioning`,
`starting`, `stopping`, `updating`) and `availability` (`active`, `suspended`).
`resourceStatusMeta` composes them and is the only supported way to render the result,
because a consumer that builds it itself will get it wrong in one of exactly those two
ways. In flight beats health; suspension is additional and never a replacement; the
health state is returned as `suppressed` rather than dropped, so a detail row can
still offer it — discarding it is the same loss as flattening the axes, only quieter.
`availability` is named for reachability rather than permission on purpose:
`unauthorized` and `forbidden` already exist as feedback states, and a domain called
`access` would sit one word away from them. `suspended` is `caution`, not `critical`:
a hold is not a failure.

Provisioning *steps* are deliberately not statuses. A creation pipeline has as many
states as there are pipelines, and the registry would need a domain for each.

**`tokens` gains `dense`, and `DENSITIES` grows from three to four.** For logs, event
streams and technical tables. It buys vertical rhythm, not legibility: `--tea-text-ui`
stays at 13px and `--tea-touch-min` stays at 44px. The second is the more important of
the two, because WCAG 2.5.8 is a floor and a density setting is not an accessibility
control — a dense table on a phone still gets 44px targets. A 12px step was measured
and rejected: the audit found 9px and 10px carrying real UI text, and 11px is the
documented floor.

`DENSITIES` is exported from `ux-standards` as well, and a value added to a union is a
breaking change for exactly the consumers that switch on it exhaustively. Hence major
rather than minor, in the same spirit as this repository's own rule that a version
number is a promise.

**`core`'s formatters stop shipping German, and can be told what language to use.**

`DEFAULT_LOCALE` was `de-DE` in a package whose entire copy deck is English — changed
from German deliberately, for the reason `terminology.ts` spells out. The result was
`1.234` in an English interface. Worse, `formatBytes` had no `locale` at all: it called
`formatNumber` without forwarding one, so a byte value was *always* German. Storage is
the single value a customer reads most often.

`locale` is now threaded through `formatBytes` and `formatRelativeTime` rather than
worked around. The default is the language the documentation is written in, which is
the rule the copy deck already follows.

Worse still, and found only because the locale pass touched the file: `formatDuration`
returned `2 Std. 14 Min.` and the exported `TIME_FORMAT_TOKENS` returned `Nie`,
`Gerade eben` and `Vor 3 Min.` Hard German, in the tree the language guard watches, and
the guard reported green. This is the same shape as the three findings that test
documents about itself — German without an umlaut that the word list does not carry —
and the reason it survived is structural rather than accidental: the earlier sweeps
counted registry *labels*, an enumerable category, and a formatter was in none of them.
The class being swept was never the class that shipped. The German is translated, the
words are on the list, and a German relative string next to a German absolute date in
the same cell is no longer possible.

`FormatRelativeTimeOptions.absolute` was documented, typed, and never read. It is now
honoured, which is what a caller passing it already assumed.

**The stylesheet stops containing a class the repository bans.**

`rounded-full` was in the compiled stylesheet, in a package whose contract says the
radius is 0 or `pill` and whose lint rule bans it by name. The lint rule worked. The
class was not in a component either — it was in two *comments*: one explaining that
the utility is an anti-pattern, one calling it a documented exception in `StatusDot`.
Tailwind extracts class candidates from a `@source` directory by scanning raw text, and
raw text includes comments, so the documentation of the ban was the only reason the
banned class existed. It shipped to every consumer.

A build-time ban and a review-time ban protect against different things. The lint rule
stops a component from using the class; `banned-classes.test.ts` stops the prohibition
from pulling it in, which no review of the components could catch, because the
components are clean. It reads the `@source` roots out of `index.css` rather than
restating them, and it failed against itself first — it lives inside a scanned
directory, so it assembles the name from parts. The rule applies to the rule.

`COMPONENT-CONTRACT.md` now says what is true: the namespace resets stop palettes and
radius *steps* from compiling, a class named only in prose does not stop compiling, and
the practical consequence is never to write the name of a banned class in a comment.
