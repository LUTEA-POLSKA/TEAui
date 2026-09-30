---
"@tea-ui/core": minor
"@tea-ui/admin": minor
---

Kill-list entry 13, three `ux-standards` rules that no component consulted, and
the encoding guard the audit asked for.

**`Nav` / `NavItem`** (kill-list 13: two byte-identical nav-item blocks in one
product, five hand-rolled ones in the other, six sites between them). The
duplication was never the styling — it was three decisions each site re-made.
`AdminShell` already had this logic but kept it **private**, so no product could
build a navigation; it now composes the shared one, and the ~100 lines it was
duplicating are gone.

Three guarantees the audit demanded and the source product failed:

- `label` is a **required** prop. The audit counted three `<nav>` elements with
  no `aria-label`, and the whole HSM frontend with three `role` assignments.
- `aria-current="page"` on the active item, beside the styling. Colour alone is
  invisible to a screen reader and ambiguous in a greyscale screenshot.
- The active marker is a **border on the inline-start edge plus a weight change**,
  never a solid fill. TEA UI deliberately sets `ring` and `accent` to the same
  gold, so a filled active item would obliterate the focus ring painted on it.

A real `<a>` when the item has an `href`, a real `<button>` when it does not —
the source product had eight `div onClick` nav targets, which are not focusable
and do nothing on Enter. `IA_LIMITS` is consulted in development only: a
fourteen-entry sidebar is a design problem, so it warns and names the limit, but
it does not throw. A library that crashes a product's dev server over navigation
taste has overstepped.

**`useUnsavedChanges`.** The `Crud` and `MasterDetail` pattern contracts both
end with *"on leaving with unsaved changes, ask — see `UNSAVED_CHANGES`"* — and
nothing implemented it. The standard was a paragraph and a constant, and a
paragraph is what a data-loss bug walks past.

Four exit paths, each with its own browser behaviour: the caller's `guard()` for
in-app navigation, `beforeunload` for the tab and for reload, and `popstate` for
back/forward — which cannot be cancelled, so the state is pushed back and a live
region says why the user did not move. `beforeunload` is documented as the one
path that cannot be styled and is ignored unless the user has interacted, which
is a platform fact and exactly why the in-app path carries the real design work.

`UNSAVED_CHANGES.preferSave` is `true`, so passing `save` renders a **three**
button dialog with *Speichern* as the primary action. Declaring the prop without
implementing it would be a control that lies — audit rule 38 — so it is
implemented, and discarding deliberately leaves the form dirty.

`AlertDialogContent`, `AlertDialogHeading` and `AlertDialogFooter` are now
exported parts, because a second dialog needed the same frame and copying the
class strings into it would be the exact defect the audit counted forty of.

**`LoadingState` renders nothing under `MIN_SKELETON_MS`.** A fetch that answers
in 120 ms is the common case, and a skeleton that appears and vanishes inside a
fifth of a second reads as a rendering glitch: it pulls the eye to a change,
announces itself to a screen reader, and takes it back. Below the floor the
correct affordance is no affordance.

**`scripts/check-encoding.mjs` — audit rule 21, wired into `verify` and CI.** The
audit asked for a CI grep and warned that *"this guard is needed before any
extraction, or the corruption moves with the strings."* It was not hypothetical
here: this repository shipped commit `0df5138`, "Repair mojibake in 40 files".
`scripts/repair-encoding.mjs` fixed them and is invoked by hand, once, and never
again — a repair tool that has already been run once is indistinguishable from one
that has been forgotten. This is the check half: fifteen mojibake signatures, and
it fails the build.

Two paths are exempt, each with its reason recorded: `docs/audit/**`, which
*quotes* mojibake because that is the evidence and "fixing" it would destroy the
finding, and the repair tool, which names the sequences it hunts. The patterns
are written as `\u` escapes so the checker cannot trip on its own source — a
first version spelled them out and matched itself, which is the fastest route to
a rule somebody switches off. Verified by injecting a real occurrence and
watching it fail.

**Note for anyone editing this repository from PowerShell:** `Get-Content`
without `-Encoding UTF8` reads as ANSI and `Set-Content -Encoding utf8` writes
back a double-encoded file. That is the exact vector rule 21 describes, and it
damaged this repository once already. Use the editor or a Node script.

---

No package API changes in this entry — the Showcase and the documentation are
where the new components are exercised.

**Showcase** (`apps/showcase`) gains live demos for every new element: the table
with a working sort, a toggleable empty state (`EmptyStateFiltered` inside
`TableEmptyRow`), `RowActions` in a real row, `Meter` at three sizes and
deliberately over its maximum, `Nav` in a sidebar frame, the unsaved-changes
guard driven by real state, `Score` in all three bands plus `indeterminate`,
`IconTile` in all five tones, `CardGrid`, and `RefreshButton` with a live
`RefreshingIndicator`.

Everything is driven by real values and real state — four servers with real
health wire values, a real `activeId`, a real `dirty` flag. The alternative is a
gallery of static images, which proves nothing about a library, and the audit's
most expensive finding was that both source products carried a private copy of
the UI they were supposed to be sharing.

**Documentation** gains a `data` page covering `Table`, `Meter`, `Nav` and
`useUnsavedChanges`, with API tables for the three that have a non-obvious
contract.

`ApiTable` in the documentation itself was a hand-written `<table>` with a
`min-w-[40rem]` and an `sr-only` caption — the exact shape the audit counted ten
of in one product. It now renders through `Table`, so the overflow region, the
caption and `scope="col"` cannot be forgotten at a call site. The documentation
is the first thing that should use its own components: if `Table` cannot render
an API table, it cannot render anyone's.

