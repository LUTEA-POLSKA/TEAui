---
"@tea-ui/core": minor
"@tea-ui/admin": minor
"@tea-ui/public": minor
"@tea-ui/ux-standards": minor
"@tea-ui/tokens": minor
"@tea-ui/icons": minor
"@tea-ui/utils": minor
---

First published shape of TEA UI.

The initial release is derived from a read-only audit of HomeServerManager and
LUTEA Design (`docs/audit/`), and the public API is the set of decisions that
audit forced:

- **Tokens are roles, not colours.** Three reference themes (`tea`, `hsm`,
  `lutea`) own the same semantic roles and differ in hue temperature, brand
  identity and default density. A product ships a theme by assigning values, not
  by overriding components.
- **The default Tailwind colour, type-size, radius and shadow namespaces are
  reset out of the build.** `text-red-300`, `text-[9px]` and `rounded-md` do not
  compile. The defects the audit found dozens of are no longer expressible.
- **The status registry is keyed by wire value.** `statusMeta(domain, key)`
  returns `{ label, tone, description }`, so the five disagreeing status tables
  the audit found cannot be rewritten.
- **Fields are wired structurally.** Label, description and error association
  come from `Field`, so a control with no accessible name cannot be expressed.
- **Loading, refreshing, stale and retrying never replace content.** The four
  source-project poll loops that flashed a spinner over readable content are
  ruled out by the feedback model.
- **Destructive protection scales with consequence.** Undo where reversible, a
  confirm dialog where recoverable, a typed confirmation where irreversible — and
  cancel is never the destructive button.

Known limitation: `@tea-ui/patterns`, `@tea-ui/templates`, `@tea-ui/blueprints`
and `@tea-ui/specialized` publish their **scope registries** — the interaction
contracts, page contracts, feature contracts and per-component rules that a
product inherits — but not yet the React compositions themselves.
`npm run check:boundaries` prints this on every run so the gap stays visible.
