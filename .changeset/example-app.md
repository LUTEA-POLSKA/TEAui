---
"@tea-ui/admin": patch
---

Not a library change: an example application at #/app

`apps/showcase/src/apps/mlhsm/` is MLHSM — a small home-server console built the
way a product is built. Its own shell, its own navigation, its own screens, its
own state, and not one import from the Showcase around it.

It exists because a component sitting in a Showcase panel proves nothing about
whether TEA UI can carry an application: the panel supplies the padding, the
scroll, the frame and the layout, so the things a shell is actually responsible
for are exactly the things the panel was quietly providing. Every screen here
gets its own scroll inside `DesktopShell`'s `<main>` and nothing else.

`#/app` is the one route that escapes the Showcase's own header and footer,
because an application brings its own. That is also what makes it honest rather
than a screenshot: `#/app/servers` is a shareable URL, and so is `#/app/settings`.

Four screens, deliberately uneven so the demo shows different shapes rather than
one template four times:

- **Overview** — `StatGrid`, one shared threshold ladder across every `Meter`,
  a `Callout` per machine that names a cause and a next step, and a `Score`.
- **Servers** — `Table` with `TableSortButton` heads, one `RowActions` per row
  with a single visible action, and the `FilterBar` pattern doing the counting.
- **Storage** — the same ladder again, which is the point: two screens sharing
  one set of cut-offs is what stops a product inventing a second one.
- **Settings** — `SettingsTemplate` in real use, including the disabled section
  and the save cycle.

Nothing here is new library code, and the diff contains no component changes.
The value of the exercise is what it *cannot* do: `SettingsTemplate` owns no
routing, so the app brings a flat route table. Four screens do not need a router
package, and the workspace keeps its dependency count at React and Radix. The
table does not survive `/servers/:id`, and that limit is written down in the file
rather than left to be discovered.

Gate: 329 tests unchanged, boundaries, encoding, types, lint, both builds, the
export contract, tree-shaking and both app builds green.