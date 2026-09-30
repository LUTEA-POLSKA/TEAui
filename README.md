# TEA UI

A React component library and design system: semantic design tokens, a primitive
component layer, and the UX rules those components follow — written down as
code rather than as a convention people have to remember.

```text
Components → Patterns → Templates → Blueprints → UX Standards → Documentation
```

## Status

| Area | State |
| --- | --- |
| Tokens, themes, density, motion, fonts | implemented |
| UX Standards as code | implemented |
| Icons | implemented — 90 curated icons |
| Core (layout, typography, inputs, feedback, overlays, navigation, formatting) | implemented |
| Admin (shell, metric tiles, product states) | implemented |
| Public (marketing, website chrome, content, conversion) | implemented |
| Patterns, Templates, Blueprints, Specialized | **scope registries only — no React layer yet** |
| Docs site, Showcase, CI, Changesets, OpenCode skill | implemented |

The last row is published because the boundaries are useful to reason about, not
because there is anything to import. `npm run check:boundaries` prints that gap
on every run, so it stays visible rather than quietly accepted.

### Measured, not claimed

```text
@tea-ui/core    12.6 kB gzip for one imported component   (12.3 % of the package)
@tea-ui/core   101.9 kB gzip if you import all of it
tokens/styles.css   11.3 kB gzip — one stylesheet for the whole system
256 tests
```

Run `npm run verify` to reproduce every number. None of them are estimates.

## Getting started

```bash
npm install
npm run build:css     # compiles the token layer to CSS
npm run build         # builds every package
npm run showcase:dev  # the interactive Showcase, on :4173
```

### Using it in a product

```bash
npm install @tea-ui/core @tea-ui/tokens @tea-ui/ux-standards @tea-ui/utils
```

```tsx
import { Button, Field, FieldError, FieldLabel, Input } from "@tea-ui/core";
import "@tea-ui/tokens/fonts.css";
import "@tea-ui/tokens/styles.css";

export function LoginForm({ error, onSubmit }) {
  return (
    <form onSubmit={onSubmit}>
      <Field required invalid={!!error}>
        <FieldLabel>Email</FieldLabel>
        <Input type="email" autoComplete="email" />
        <FieldError>{error}</FieldError>
      </Field>
      <Button type="submit">Sign in</Button>
    </form>
  );
}
```

Two stylesheet imports, one per concern: the faces, and the system. There is no
third import to remember.

**The interface language is yours.** TEA UI ships English defaults, because a
public package cannot know whether it is being rendered for an operator in
Hamburg or a screen-reader user in São Paulo. Every component that renders text
takes it as a prop — `closeLabel`, `emptyMessage`, `clearLabel`, `fallbackTitle` —
and the copy deck in `@tea-ui/ux-standards` is a single module a product can
mirror rather than fork.

## Architecture

Dependencies point **down**, and that is checked in CI:

```text
utils → tokens → ux-standards
                 ↘        ↙
              icons → core → admin → patterns → templates → blueprints
                         ↘
                       public          specialized (opt-in, heavy)
```

| Package | Role |
| --- | --- |
| `@tea-ui/utils` | `cn`, `cva`, the `tea-` prefix, exhaustive checks |
| `@tea-ui/tokens` | semantic roles, three themes, density, motion, breakpoints |
| `@tea-ui/ux-standards` | status registry, tones, feedback model, destructive policy, terminology |
| `@tea-ui/icons` | a curated, named, tree-shakeable icon surface |
| `@tea-ui/core` | the product-agnostic primitive layer |
| `@tea-ui/admin` | information-dense UI: shell, tiles, product states |
| `@tea-ui/public` | marketing, website chrome, content, conversion |
| `@tea-ui/patterns` | interaction contracts for master/detail, CRUD, wizard, filter bar *(no React layer yet)* |
| `@tea-ui/templates` | page contracts: what a dashboard, settings or resource page contains *(no React layer yet)* |
| `@tea-ui/blueprints` | feature systems: auth, billing, onboarding, monitoring, permissions *(no React layer yet)* |
| `@tea-ui/specialized` | scope registry for charts, trees, virtual lists, diff *(no components yet)* |

A component that belongs to no consumer is not ready to publish. `@tea-ui/core`
stays free of heavy dependencies on purpose: chart and virtual-list code belongs
in `@tea-ui/specialized`, and the boundary checker fails the build if it drifts.

## The design, in one page

**Roles, not colours.** A theme assigns values to semantic roles. A component
never contains a colour. The default Tailwind colour, type-size, radius and
shadow namespaces are **reset out of the build**, so `text-red-300`,
`text-[9px]` and `rounded-md` do not compile — the anti-patterns are no longer
expressible rather than merely discouraged.

**Angular by default, circular where it means something.** Surfaces are square.
A pill is a semantic signal — avatar, status dot, switch, radio, media control,
loader, progress — and is reserved for exactly those.

**Dark by default, honestly.** There is one theme family, not two, and the second
palette is not stubbed in and called ready. The token architecture is
colour-scheme ready; a light theme is a new reference with its own contrast audit,
because a second untested palette is a second untested palette.

**Density is an attribute, not a prop.** `data-density="compact|default|comfortable"`
retunes every control inside it through custom properties, so a compact table can
sit inside a comfortable page and neither container knows about the other.

**One stylesheet.** 11.3 kB gzip for the whole system. Every package re-exports
it as `<pkg>/styles.css`, so a consumer imports it once and no component can
ship CSS that drifts from the system.

**Announce a pattern only if you implement it.** A role is a promise.
`role="radiogroup"` promises that arrow keys move focus *and* selection together.
Half a pattern is worse than a different role, because the user is told something
the control is not doing. Where the underlying library announces a pattern it
does not implement, TEA UI implements it — and there are tests, because a role
assertion passes on the broken version too.

## Commands

```bash
npm run verify            # the whole gate: boundaries, encoding, types, lint, tests, build, exports, bundle
npm run check:boundaries  # dependency direction + declared-but-unused dependencies
npm run check:exports     # the public API contract, with per-package cost
npm run check:tree        # measure tree-shaking, do not assume it
npm run build:css         # compile tokens + fonts
npm run build:packages    # build the library
npm run showcase:dev      # the Showcase
npm run docs:dev          # the documentation
npm test                  # unit, component, keyboard, a11y, contrast, language
npm run release           # publish
```

## Repository layout

```text
packages/            the library, one package per boundary
apps/                showcase/ and docs/
.opencode/skills/    the OpenCode skill that makes TEA UI the default for UI work
docs/architecture/   how a component is written, and the rules behind it
docs/audit/          audits of two other codebases; internal provenance, not public documentation
scripts/             the verification scripts CI runs
```

## Contributing

Before adding a component:

- Does it already exist? Can an existing one solve it with a prop?
- Is it composition, or is it a new component?
- Would another product need it, or is it scaffolding for one?
- Which layer does it belong in?

Before adding a dependency:

- Is it necessary? What is the bundle cost? Does it break a package boundary?
- Is it accessible? Is it maintained?

Before adding a UX behaviour:

- Does a UX Standard already decide this?
- Would a second product behave differently? Is there a documented reason?

Before adding user-facing text:

- English, because that is what the library documents itself in. A component
  takes its own text as a prop. `language.test.ts` fails the build on new
  hardcoded strings in the shipped packages.

Add a changeset describing the change and its rationale. Public APIs are
contracts: a breaking change requires a major bump, a migration note and a
changelog entry — never a silent change.

## License

MIT. See [LICENSE](./LICENSE). Third-party work is listed in
[CREDITS.md](./CREDITS.md).
