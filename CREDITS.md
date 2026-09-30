# Credits

TEA UI is its own work. It is built on a small number of libraries, re-exports one
icon set, and ships three typefaces. This file says which, and under what terms.

## Libraries & dependencies

Runtime dependencies of the published packages. Every one of them is a package
that solves something TEA UI does not: accessible primitive behaviour, class
merging, and variant resolution.

| Package | Used for | License |
| --- | --- | --- |
| [radix-ui](https://www.radix-ui.com/) | Unstyled accessible primitives behind `Dialog`, `AlertDialog`, `Drawer`, `Popover`, `DropdownMenu`, `ToggleGroup` and `Select`. TEA UI owns the styling, the token mapping and the state contract; Radix owns focus management and keyboard semantics. | MIT |
| [lucide-react](https://lucide.dev/) | The icon set behind `@tea-ui/icons`, re-exported as named components so consumers never import an icon library directly. | ISC |
| [class-variance-authority](https://cva.style/) | The `cva` helper behind every component's variant table. | Apache-2.0 |
| [clsx](https://github.com/lukeed/clsx) | Conditional class names, via `cn`. | MIT |
| [tailwind-merge](https://github.com/dcastil/tailwind-merge) | Resolves conflicting Tailwind classes so a consumer's `className` can override a component's own. | MIT |
| [tailwindcss](https://tailwindcss.com/) | The build. Semantic tokens are exposed as CSS custom properties and consumed as utility classes; the default colour, type-size, radius and shadow namespaces are reset out of the build. | MIT |

Nothing in `@tea-ui/core` is a rendering or data library. Chart, virtual-list and
tree code belongs in `@tea-ui/specialized`, and the boundary check fails the build
if it appears in `core` instead.

## Icons / assets

| Asset | Source | License |
| --- | --- | --- |
| Icon set | [Lucide](https://lucide.dev/), via `lucide-react`. Re-exported by `@tea-ui/icons` under `tea-` prefixed names. | ISC |
| `tea-mark` | Drawn for this project. | MIT, this repository |
| Figma-to-code helpers | None. No component was copied from a design file. | — |

## Typefaces

Self-hosted through Fontsource, subset per script. No font is loaded from a
third-party CDN at runtime.

| Typeface | Use | License |
| --- | --- | --- |
| [Jost](https://fonts.google.com/specimen/Jost) (variable) | UI typeface | SIL Open Font License 1.1 |
| [JetBrains Mono](https://www.jetbrains.com/lp/mono/) (variable) | Code, identifiers, numeric columns | SIL Open Font License 1.1 |
| [Lilita One](https://fonts.google.com/specimen/Lilita+One) | Display, used sparingly | SIL Open Font License 1.1 |

The three are distributed by [Fontsource](https://fontsource.org) (MIT).

## Inspiration

The [WAI-ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/) set
the keyboard and role contracts TEA UI's overlays, comboboxes and data tables
follow. The expectations encoded in `@tea-ui/ux-standards` — that a destructive
action scales with its consequence, that a `radiogroup` moves selection with the
arrow keys — are that guide applied rather than invented here.

The library's own reasoning is documented in `docs/architecture/`, and the OpenCode
skill in `.opencode/skills/tea-ui/` is part of this repository rather than a
dependency on it.

## If something is missing here

Open an issue. A dependency that ships in the published packages and is not on
this page is an oversight, not a decision.
