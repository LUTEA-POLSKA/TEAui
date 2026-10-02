# TEA UI — component authoring contract

This is the contract every TEA UI component follows. It is enforced by review, by
lint rules (`eslint.config.mjs`) and by tests. Read it before writing a component.

`packages/core/src/inputs/button.tsx` is the **reference implementation**. When
this document and the Button disagree, the Button is right and this document is
out of date.

---

## 1. Public surface

- One component per file, named after the component. Multi-part families
  (`Dialog` + `DialogTrigger` + `DialogContent`) live in one file named after the
  root.
- The file is exported from exactly one barrel. Nothing is exported from
  `@tea-ui/core` that is not intentional.
- `internal/` is not public and is not covered by semver.
- Every component's props interface is exported and named `<Component>Props`.

## 2. Styling

- `cva` for the variant surface, always with `className` passed **into** the
  call: `cn(variants({ variant, size, className }), className)`.
- `variant` and `size` are the only styling axes. There is no `color` prop, no
  `sx`, and no `styles` object.
- Only semantic utilities. `bg-canvas`, `text-fg-muted`, `border-line` — never
  `bg-red-300`, never `text-[9px]`, never a raw hex. The Tailwind default
  palettes are reset out of the build, so most violations **do not compile**.
- The one place that is not true is worth stating exactly. Tailwind extracts
  class candidates from a `@source` directory by scanning raw text, and raw
  text includes comments — so a class that is only ever *named in prose* is
  still emitted into the compiled stylesheet. The fully-rounded utility was
  banned here and by the lint rule, and shipped anyway, because two comments
  explaining the ban were the only places it was written down.
  `tokens/src/__tests__/banned-classes.test.ts` now fails if any scanned source
  names it, and it reads the `@source` roots from `index.css` so it cannot
  drift. Practical consequence: **do not write the name of a banned class in a
  comment.** Describe it instead.
- Only `rounded-none` (default) and `rounded-pill`. `pill` is reserved for
  avatars, status dots, switches, radio controls, media controls, loaders and
  progress.
- Density comes from CSS custom properties (`--tea-control-h`, `--tea-cell-py`,
  …) via the `control-h` / `cell-y` / `gap-ui` / `pad-card` / `text-ui`
  utilities, or from arbitrary values built on those variables. Never hardcode
  `h-8`.
- Elevation is one of `shadow-raised`, `shadow-overlay`, `shadow-modal`. Never
  `shadow-lg` or an arbitrary offset.
- Never `!`-prefixed utilities. Never `focus:` — only `focus-visible:`.
- Every interactive control carries `data-tea-touch`.

## 3. State

Expose state as data attributes, using the shared helper:

```ts
...stateAttributes({ disabled, loading, invalid, readOnly, selected, active, checked, open, empty })
```

The vocabulary is closed: `data-slot`, `data-disabled`, `data-loading`,
`data-invalid`, `data-readonly`, `data-selected`, `data-active`, `data-checked`,
`data-open`, `data-empty`, `data-orientation`. Do not invent new ones without
adding them to `internal/slot.tsx`.

Also set the matching **ARIA/HTML** attribute — `disabled`, `aria-busy`,
`aria-invalid`, `aria-pressed`, `aria-selected`, `aria-expanded`. Data attributes
are for styling and testing; the real attribute is for the accessibility tree.

## 4. Semantics and accessibility

- Native element first: `button`, `input`, `form`, `select`, `nav`, `main`,
  `header`, `footer`, `dialog`. Do not simulate one with a `div` plus ARIA when
  the native element works.
- `type="button"` is the default on every button.
- Every icon-only control takes an accessible name. A `title` attribute is not an
  accessible name.
- Decorative icons get `aria-hidden="true"`. An icon that *is* the label must
  not be hidden.
- Labels are associated with `htmlFor`. Descriptions and errors are associated
  with `aria-describedby`. Errors are also announced (`role="alert"` or a live
  region) — a colour change alone is not an error announcement.
- Refs are forwarded on every DOM-backed component, and an incoming prop `ref`
  is honoured.
- No keyboard traps. Escape closes every overlay. Focus is restored to the
  trigger on close.
- Respect `prefers-reduced-motion`. Motion tokens come from
  `TRANSITION_PATTERNS`; nothing longer than `--tea-duration-slow`.

## 5. Controlled and uncontrolled

Every stateful component supports all three:

```ts
const [value, setValue] = useControllableState({ value, defaultValue, onChange, name: "Select" });
```

Never implement the pattern by hand. Never emit an `onChange` for a value that
did not change.

Handler names are React conventions and are not negotiable:

| Handler | Fires when |
| --- | --- |
| `onValueChange` | a controlled value changed (`Select`, `Tabs`, `Checkbox`, `Switch`) |
| `onOpenChange` | an overlay opened or closed |
| `onOpenChangeComplete` | an overlay's enter/exit animation finished |
| `onChange` | a native form control's value changed |
| `onSelect` | a menu item was chosen |
| `onSubmit` | a form was submitted |
| `onFocus` / `onBlur` | focus moved, with the standard React focus event |

## 6. Composition

- Prefer composition to configuration. `Card` + `CardHeader` + `CardContent`
  beats `Card title="…" description="…"`.
- `asChild` on anything that renders an element, so native semantics survive.
  Implement with `Slot.Root` from `radix-ui`, following Button.
- Slot components take `className` and merge it. Never ignore it.
- Provide `…Parts` only where the composition is genuinely part of the API.

## 7. Content

- German copy comes from `COPY` in `@tea-ui/ux-standards`. A component does not
  type German strings when a term already exists.
- Register: **du**. Real umlauts. No `ae/oe/ue` transliteration.
- Buttons name the action. Status labels come from `statusMeta(domain, key)`.
- A component takes copy as props when the product might want different words.
  The default comes from `COPY`; the props win.

## 8. Business logic

None. A TEA UI component never calls an API, never reads application state, and
never knows what a "server", a "backup" or a "user" is. If a component needs to
know, it is an Admin or Specialized component, not Core — and even there the
knowledge arrives as props.

## 9. Documentation

Every exported component gets a TSDoc block that says, in this order:

1. What it is, in one sentence.
2. Why it exists the way it does, if the choice is non-obvious.
3. `@example` with real, copy-pasteable code.

If a decision was made because the audit found a defect, say so and cite it. The
reasoning is the part that stops the next person from "simplifying" it back.

## 10. Tests

Every exported component gets at least one test file covering:

- it renders and exposes an accessible role and name,
- every variant and size renders,
- `disabled` and `loading` set the right attributes,
- keyboard operation for anything interactive,
- the data-attribute vocabulary is correct.

A11y assertions use `axe`. A component that cannot be named is not done.
