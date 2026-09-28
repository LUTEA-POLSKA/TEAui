---
name: tea-ui
description: Build any TEA product UI with TEA UI, the shared design system of the TEA ecosystem (HomeServerManager, LUTEA, TEAflow, TEAhost and future products). Use when creating, reviewing or changing any user interface in a TEA project — pages, forms, tables, dialogs, dashboards, navigation, status displays, loading and error states, theming, or accessibility. Also use when a task mentions TEA UI, design tokens, UX standards, or a design-system decision.
---

# TEA UI

TEA UI is the shared UI, UX and product platform of the TEA ecosystem. It exists
to end this cycle:

```
New requirement -> reinvent the UI -> reinvent the UX -> duplicate everything
```

**The goal: build once, generalize properly, reuse everywhere.**

This skill makes TEA UI the default source of truth for UI work in every TEA
project. Work through it in order. Do not skip to step 5.

---

## 1. Search before you build

The single most important rule. Before writing any UI code, look for what
already exists. **Look in `node_modules`, not in a checkout of TEA UI** — this
skill is used from inside other projects, where the source is not present:

```bash
# Are the packages installed at all?
ls node_modules/@tea-ui 2>/dev/null || npm ls @tea-ui/core

# What does a package actually export? Read the built .d.ts, it is the contract.
rg "^declare|^export" node_modules/@tea-ui/core/dist/index.d.ts | head -60

# Is there already a component for this? Search the package by name.
rg "StatusBadge|DataTable|ConfirmDialog|useConfirm" node_modules/@tea-ui/

# Has this been decided already?
rg -i "<dein Konzept>" node_modules/@tea-ui/ux-standards/dist/
```

If nothing is found under `node_modules/@tea-ui`, the packages are not installed
in this project. Install them before deciding that a component does not exist:

```bash
npm i @tea-ui/core @tea-ui/tokens @tea-ui/icons @tea-ui/ux-standards @tea-ui/utils
```

**Version matters.** `@tea-ui/core` is at `1.0.0` and stable. The four packages
`patterns`, `templates`, `blueprints` and `specialized` are at `0.1.0` and are
scaffolding — they export almost nothing. Do not plan around them, and do not
tell anyone they exist. Check what a package actually exports before relying on
it.

Then check the packages, in this order:

| Look in | For | State |
| --- | --- | --- |
| `@tea-ui/core` | layout, typography, inputs, feedback, overlays, navigation | `1.0.0` |
| `@tea-ui/admin` | application shell, metric tiles, data, product states | `1.0.0` |
| `@tea-ui/public` | marketing, website chrome, content, conversion | `1.0.0` |
| `@tea-ui/ux-standards` | the **rules**: status vocabulary, feedback model, destructive policy, terminology | `1.0.0` |
| `@tea-ui/tokens` | colour, spacing, radii, motion, density, themes | `1.0.0` |
| `@tea-ui/icons` | the icon set | `1.0.0` |
| `@tea-ui/patterns` | master/detail, CRUD, wizard, notification centre | `0.1.0` empty |
| `@tea-ui/templates` | complete page structures | `0.1.0` empty |
| `@tea-ui/blueprints` | authentication, billing, onboarding, settings | `0.1.0` empty |
| `@tea-ui/specialized` | charts, trees, virtual lists, diff viewers | `0.1.0` empty |

**If it exists, use it.** If it almost exists, extend it in TEA UI — never fork
it into the product.

## 2. If nothing fits: generalize, do not add

Adding a second thing that solves the same problem is how the ecosystem got here.
Before adding anything, ask in this order:

1. Can an existing component take a prop that expresses the difference?
2. Can it be composed from existing parts? (`Card` + `CardHeader` beats
   `Card title="…" description="…"`)
3. Is the difference real, or is it two appearances of one idea?
   - Two colour treatments of a status → one `StatusBadge` with a `tone`.
   - A centre spinner and a page spinner → one `LoadingState`.
   - A right drawer and a bottom sheet → one `Drawer` with a `side`.
4. Would another TEA product need this too? If not, it stays in the product.

Only when all four fail, add to TEA UI — as a change with a changeset, a test
and a doc comment explaining why.

## 3. Never violate these

These are mechanically enforced. Fighting them produces a build failure, and
working around them produces exactly the drift TEA UI was built to remove.

- **Never a raw hex.** Only semantic roles: `bg-surface`, `text-fg-muted`,
  `border-line`, `text-critical`. The default Tailwind palette is reset out of
  the build, so `text-red-300` does not compile.
- **Never a hard-coded control height.** Use the density scale — `control-h`,
  `cell-y`, `pad-card`, `text-ui` — so the component adapts to
  `data-density="compact|default|comfortable"`.
- **Never `focus:`** — only `focus-visible:`. A mouse click must not leave a
  focus ring.
- **Never `rounded-md`.** Radius is `none`, or `pill` for the five documented
  exceptions: avatars, status dots, switches, radio controls, media controls,
  loaders and progress.
- **Never `shadow-lg`.** Elevation is `raised`, `overlay` or `modal`.
- **Never `lucide-react` directly.** Import from `@tea-ui/icons`.
- **Never type 9px or 10px text.** The scale starts at 11px.
- **Never a control without an accessible name.** `IconButton.label` is
  required, by type.
- **Never application logic in a component.** No API calls, no store access, no
  knowledge of what a server is.

## 4. Render state the way the standards say

Every asynchronous surface is in one of seventeen named states
(`@tea-ui/ux-standards`). The affordance is decided, not chosen:

| Situation | Use |
| --- | --- |
| Nothing on screen yet | `Skeleton` / `LoadingState` |
| Content exists, data is refreshing | `RefreshingIndicator` over preserved content |
| A user-triggered action | `loading` on the `Button` that started it |
| A long blocking operation | `Progress` |
| No results because of a filter | `EmptyStateFiltered` |
| No results because nothing exists | `EmptyStateNew` |
| Something failed | `ErrorState` with an `ErrorAnatomy` |

**Never replace readable content with a spinner** for `refreshing`, `syncing`,
`stale` or `retrying`. That is the single most common defect in the ecosystem's
history.

Every status goes through the registry:

```tsx
<StatusBadge domain="health" status="degraded" />
```

Never hand-write the label, never pass a colour. A wire value without a label is
a type error.

## 5. Destructive actions scale with consequence

```tsx
const [confirm, ask] = useConfirm();

const onDelete = async () => {
  const ok = await ask({
    level: "irreversible",
    what: "Der Server",
    confirmWord: "srv-01",
  });
  if (ok) await remove();
};
```

- `reversible` → offer **undo**, ask nothing.
- `recoverable` → `ConfirmDialog`, consequence named.
- `irreversible` → `ConfirmDialog` **plus** a typed confirmation word.

Cancel is never the destructive button, and cancel is the default focus.

## 6. Forms are wired, not hand-assembled

```tsx
<Field required invalid={!!error}>
  <FieldLabel>E-Mail</FieldLabel>
  <Input type="email" autoComplete="email" />
  <FieldDescription>Wir senden keine Bestätigung.</FieldDescription>
  <FieldError>{error}</FieldError>
</Field>
```

`Field` provides the id wiring. Never write `htmlFor`/`aria-describedby` by hand
— four of the five field implementations in the ecosystem got it wrong, which is
why this component exists.

Validate on blur, re-validate after the first change, and never so eagerly that a
user cannot finish typing.

## 7. Accessibility is not a review step

Target **WCAG 2.2 AA**, and prove it:

```bash
npm test -- --run    # includes role, name, state, keyboard and focus assertions
```

Before declaring UI work done, confirm:

- [ ] every interactive element reachable and operable by keyboard
- [ ] Escape closes every overlay, focus returns to the trigger
- [ ] every icon-only control has an accessible name
- [ ] every field has an associated label; errors are associated **and** announced
- [ ] status is never conveyed by colour alone
- [ ] loading and error changes are perceivable
- [ ] it respects `prefers-reduced-motion`
- [ ] it works at `data-density="compact"` and below 1024px

## 8. Theming

Themes assign **values to roles**. A component never changes between themes.

```tsx
<html data-theme="lutea" data-density="compact">
```

To add a theme, that is a **TEA UI** change, not a project change: copy
`packages/tokens/src/themes.css` in the TEA UI repository and change role
*values*. Do not add a role, do not add a raw colour to a component, do not add a
`dark:` variant. If a role is missing, open an issue against TEA UI — a project
cannot invent one without breaking every other consumer.

## 9. Before you finish

```bash
npm run check:boundaries   # dependency direction
npm run typecheck
npm run lint
npm test
```

Then add a changeset describing the change and its rationale.

## Reference

Online, from anywhere:

- **Showcase** — https://landnevermore.github.io/TEAui/
- **Documentation** — https://landnevermore.github.io/TEAui/docs/
- **Packages** — https://www.npmjs.com/org/tea-ui

The documentation is the place to look for the contract, the token reference and
the reason behind a rule. In a consuming project, the built `.d.ts` files under
`node_modules/@tea-ui/*/dist/` are the exact exported surface — read those rather
than trusting any list, including this one.

In a checkout of TEA UI itself:

- `docs/architecture/COMPONENT-CONTRACT.md` — the authoring contract every
  component follows
- `packages/core/src/inputs/button.tsx` — the reference implementation
- `docs/audit/CONSOLIDATION.md` — the audit that produced these rules, and the
  reasoning behind each architectural decision
- `packages/ux-standards/src/` — the standards as code, not as prose
