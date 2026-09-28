# TEA UI

**Build once. Generalize properly. Reuse everywhere.**

TEA UI is the shared UI, UX and product platform of the TEA ecosystem. It is the
foundation for HomeServerManager, LUTEA, TEAflow, TEAhost and every TEA product
that comes after them — so that a UI decision is made once, in one place, and
every product inherits it.

```text
Components → Patterns → Templates → Blueprints → Product UX → Design System → Docs → Workflow
```

It is more than a component library. It is the UI foundation, the UX foundation,
the design system, the product patterns, the accessibility system and the
developer workflow, shared.

---

## Status

| Area | State |
| --- | --- |
| Audit (HSM + LUTEA, read-only) | done — `docs/audit/` |
| Tokens, themes, density, motion, fonts | done |
| UX Standards as code | done |
| Icons | done — 90 curated icons |
| Core (layout, typography, inputs, feedback, overlays, navigation, formatting) | done |
| Admin (shell, metric tiles, product states) | done — Shell, Metriken, Zustände, Seitenkopf |
| Public (marketing, website, content, conversion) | done — Sections, Hero, Features, Nav, Footer, Preise, FAQ, Formulare |
| Patterns, Templates, Blueprints, Specialized | scope registries published; React layer pending |
| Docs site, Showcase, CI, Changesets, Skill | done |

The gap is printed on every run of `npm run check:boundaries`, so it stays
visible rather than quietly accepted.

### Measured, not claimed

```text
@tea-ui/core          12.8 kB gzip for one imported component   (13.2 % of the package)
@tea-ui/core          97.1  kB gzip if you import all of it
@tea-ui/styles.css    9.7   kB gzip, one stylesheet for the whole system
74 tests, incl. a WCAG 2.2 contrast audit of all three themes
```

Run `npm run verify` to reproduce every number.

---

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

export function LoginForm() {
  return (
    <form>
      <Field required invalid={!!error}>
        <FieldLabel>E-Mail</FieldLabel>
        <Input type="email" autoComplete="email" />
        <FieldError>{error}</FieldError>
      </Field>
      <Button type="submit">Anmelden</Button>
    </form>
  );
}
```

Two stylesheet imports, one per concern: the faces, and the system. There is no
third import to remember.

---

## Architecture

Dependencies point **down**, and that is checked in CI:

```
utils ──▶ tokens ──▶ ux-standards
                 │           │
                 ▼           ▼
              icons ──▶  core  ──▶  admin ──▶ patterns ──▶ templates ──▶ blueprints
                             └────▶ public ──┘        specialized (opt-in, heavy)
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
| `@tea-ui/patterns` | interaction contracts for master/detail, CRUD, wizard, filter bar *(compositions pending)* |
| `@tea-ui/templates` | page contracts: what a dashboard, settings or resource page contains *(compositions pending)* |
| `@tea-ui/blueprints` | feature systems: auth, billing, onboarding, monitoring, permissions *(compositions pending)* |
| `@tea-ui/specialized` | scope registry for charts, trees, virtual lists, diff *(components pending)* |

---

## The design, in one page

**Roles, not colours.** A theme assigns values to semantic roles. A component
never contains a colour. The default Tailwind colour, type-size, radius and
shadow namespaces are **reset out of the build**, so `text-red-300`,
`text-[9px]` and `rounded-md` do not compile. The anti-patterns the audit found
dozens of are no longer expressible.

**Angular by default, circular where it means something.** Surfaces are square.
A pill is a semantic signal — avatar, status dot, switch, radio, media control,
loader, progress — and is reserved for exactly those.

**Dark, deliberately.** Both source products were dark-only while advertising a
light strategy they never used. A second untested palette is a second untested
palette. The token architecture is colour-scheme ready; a light theme is a new
reference with its own contrast audit.

**Density is an attribute, not a prop.** `data-density="compact|default|comfortable"`
retunes every control inside it through custom properties, so a compact table can
sit inside a comfortable page and neither container knows about the other.

**One stylesheet.** 9.7 kB gzip for the whole system. Every package re-exports
it as `<pkg>/styles.css`, so a consumer imports it once and no component can
ship CSS that drifts from the system.

---

## Commands

```bash
npm run verify            # the whole gate: boundaries, types, lint, tests, build, bundle
npm run check:boundaries  # dependency direction + declared-but-unused dependencies
npm run check:exports     # the public API contract, with per-package cost
npm run check:tree        # measure tree-shaking, do not assume it
npm run build:css         # compile tokens + fonts
npm run build:packages    # build the library
npm run showcase:dev      # the Showcase
npm run docs:dev          # the documentation
npm test                  # unit, component, keyboard, a11y, contrast
npm run release           # publish
```

## Repository layout

```text
packages/       the library, one package per boundary
apps/           showcase/ and docs/
skills/tea-ui/  the OpenCode skill that makes TEA UI the default for UI work
docs/audit/     the HSM and LUTEA audits, and their consolidation
docs/architecture/COMPONENT-CONTRACT.md   how a TEA UI component is written
scripts/        the verification scripts CI runs
```

## Why it looks like this

Every decision above answers a specific finding in the audit of HomeServerManager
and LUTEA Design. The three documents in `docs/audit/` are in the repository,
including the consolidation that resolved the seven architectural decisions the
audits left open. Read that before proposing a change to the architecture.

## Contributing

Before adding a component:

- Does it already exist? Can an existing one solve it with a prop?
- Is it composition, or is it a new component?
- Would a second TEA product need it?
- Which layer does it belong in?

Before adding a dependency:

- Is it necessary? What is the bundle cost? Does it break a package boundary?
- Is it accessible? Is it maintained?

Before adding a UX behaviour:

- Does a UX Standard already decide this?
- Would another TEA product behave differently? Is there a documented reason?

Add a changeset describing the change and its rationale. Public APIs are
contracts: a breaking change requires a major bump, a migration note and a
changelog entry — never a silent change.

## Status

The base rewrite is complete and published. [docs/STATUS.md](./docs/STATUS.md)
records what is at `1.0.0`, what is still scaffolding, and how a consuming
project finds out that a newer version exists.

## License

MIT. See [LICENSE](./LICENSE).
