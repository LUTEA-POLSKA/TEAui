---
"@tea-ui/patterns": minor
"@tea-ui/templates": minor
"@tea-ui/ux-standards": minor
---

SettingsTemplate, and the two patterns it is assembled from

`@tea-ui/templates` published a registry naming eight page structures and
exported none of them. `SettingsTemplate` is the first, and it needed two
patterns that did not exist either.

**SaveBar** owns the three states every project implemented differently, and two
of the differences lose data. `saving` with Discard still enabled means a click
during an in-flight request gets written back by that request, so Discard is
disabled rather than merely greyed out. `error` with no cause says "Error" and
leaves the user nothing to act on, so `error` takes a string and Save stays
available, because retrying is usually the next step. `saved` is announced and
then gets out of the way — a confirmation that vanishes instantly is not a
confirmation, one that stays forever is noise. All four states are announced
through one live region that stays mounted, because a region created together
with its message is regularly missed.

**useUnsavedChanges** is separated from the bar on purpose: the bar says *what is
unsaved*, the guard asks *may you leave*, and a product navigating without the
bar still needs the second. `blocked` is derived from `dirty` rather than
mirrored into state, because the earlier version's mirror lagged the prop by a
render and only moved the double-dialog problem next door — the router, not the
hook, performs the navigation.

**SectionNavigation** is a `nav` with `aria-current="page"`, not a tablist. The
audit found settings rails built as `role="tablist"` with arrow-key handling
copied from a tab implementation and the panel wiring never added: a tab
promises `aria-controls` pointing at a real panel, and the user is told they can
switch panels with arrow keys when the page scrolls instead. Disabled sections
stay visible with their reason, because hidden means "broken" and disabled means
"not yet".

**SettingsTemplate** writes no design token of its own. `PageHeader`,
`SectionNavigation`, `Panel` and `SaveBar` arrive styled; the template
contributes the section list and two structural relations. There is a test that
reads this file's source and fails on the first `bg-` or `text-` token it finds,
because "the template writes no styles" is a claim that decays the first time
someone needs a gap.

Two mechanical findings along the way, both of which had been waiting for a
package that would expose them:

- `packages/patterns/src/index.tsx` was renamed to `index.ts`. It contains no
  JSX, it re-exports, and every other package entry is `index.ts`. The `.tsx`
  extension broke `resolveExternalModule` in templates' declaration build — a
  TypeScript `Debug Failure.` crash, not a diagnosable error, because the
  tsconfig path mappings point at `src/index.ts` for every package.
- A `useCallback` in `toggle.tsx` listed `indicator` as a dependency and never
  read it, so toggling that prop handed every item a new callback identity and
  re-registered the whole set for nothing.

`@tea-ui/ux-standards` adds `COPY.states.saved` and `COPY.actions.discard`.

Gate: 303 tests (26 new), boundaries, encoding, types, lint with no warnings,
both builds, the export contract, tree-shaking and both app builds green.