# LUTEA Design Dashboard — Design & Architecture Audit

**Target repository:** `E:\Lukas\CODING\LUTEADESIGNDASHBOARD`
**HEAD:** `a486f92 FIRST` (single commit) · 108 files under `src/` · 20 `.tsx` files carry `"use client"`

**Scope read in full:** `package.json`, `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.mjs`, `README.md`, `src/app/globals.css`, `src/app/layout.tsx`, `src/app/(public)/layout.tsx`, all `src/app/**/page.tsx` (13), all 20 `src/components/kit/*`, all 19 `src/components/dashboard/*`, all 3 `src/components/public/*`, `src/hooks/use-toast.ts`, `src/lib/{utils,status,rbac,auth,policy,score,paths,anti-spam}.ts`, `src/middleware.ts`, `src/instrumentation.ts`, `src/app/api/contact/route.ts`, `src/db/database.ts` (`Company` type only).

**Not read (no claims made):** `src/app/api/**` (24 other routes), `src/lib/{ai,config,gate-executor,geocode,lighthouse,obscura,overpass,overseer}.ts`, `src/db/{companies,seed,seed-data,extended-migrations}.ts`, `scripts/**`, `config/**`, `backups/**`, `data/**`, `public/**`, `vendor/**`, `node_modules/**`, `.next/**`.

> **Working-tree note.** The target repo was being modified during the audit. `git status` showed 10 kit files as untracked (`??`): `confirm-dialog.tsx`, `dropdown-menu.tsx`, `label.tsx`, `scroll-area.tsx`, `select.tsx`, `separator.tsx`, `skeleton.tsx`, `switch.tsx`, `tabs.tsx`, `tooltip.tsx`. An early directory listing returned 10 kit files, a later one 17, and the final `rg --files` returned 20. **All 20 are included in this report.** If a reader sees a different count, this report reflects the 20-file state.

---

## 1. Stack

Installed versions read from `node_modules/*/package.json`; declared range from `package.json`.

| Group | Package | Declared | Installed |
|---|---|---|---|
| **Framework** | `next` | `^15.5.4` | **15.5.26** |
| | `react` / `react-dom` | `^19.2.0` | **19.3.0** |
| | `typescript` | `^5.9.3` | 5.9.x |
| **UI primitives** | `@radix-ui/react-dialog` | `^1.1.15` | 1.1.23 |
| | `@radix-ui/react-slot` | `^1.2.3` | used — `button.tsx:2` |
| | `@radix-ui/react-select` | `^2.2.6` | installed; `select.tsx` **never imported** |
| | `@radix-ui/react-dropdown-menu` | `^2.1.16` | installed; `dropdown-menu.tsx` **never imported** |
| | `@radix-ui/react-label` | `^2.1.7` | installed; `label.tsx` **never imported** |
| | `@radix-ui/react-scroll-area` | `^1.2.10` | installed; **never imported** |
| | `@radix-ui/react-separator` | `^1.1.7` | installed; **never imported** |
| | `@radix-ui/react-switch` | `^1.2.6` | installed; **never imported** |
| | `@radix-ui/react-tabs` | `^1.1.13` | installed; **never imported** |
| | `@radix-ui/react-toast` | `^1.2.23` | imported but **functionally dead** (see 10.2) |
| | `@radix-ui/react-tooltip` | `^1.2.8` | installed; **never imported** |
| | `class-variance-authority` | `^0.7.1` | 0.7.1 |
| **Styling** | `tailwindcss` | `^3.4.18` | **3.4.19** (major v3) |
| | `tailwind-merge` | `^3.3.1` | 3.7.0 |
| | `clsx` | `^2.1.1` | used |
| | `tailwindcss-animate` | `^1.0.7` | 1.0.7 — `tailwind.config.ts:54` |
| | `postcss` / `autoprefixer` | `^8.5.6` / `^10.4.21` | devDependencies |
| **Animation** | *only* `tailwindcss-animate` + `animate-spin` / `animate-pulse` | — | no framer-motion / motion |
| **Icons** | `lucide-react` | `^0.545.0` | 0.545.0 |
| **Fonts** | `@fontsource-variable/jost` | `^5.2.8` | 5.3.0 |
| | `@fontsource-variable/jetbrains-mono` | `^5.2.8` | installed |
| | `@fontsource/lilita-one` | `^5.2.8` | installed (non-variable) |
| **Data** | `better-sqlite3` | `^12.4.1` | 12.11.1 — `next.config.ts:6` |
| | `zod` | `^4.1.12` | 4.6.5 |
| | `osm-pbf` | `^0.0.2` | in **dependencies** |
| | `lighthouse` | `^13.5.0` | in **dependencies**, not dev |
| | `playwright-core` | `^1.63.0` | in **dependencies**, not dev |
| **Auth** | hand-rolled on `node:crypto` | — | `src/lib/auth.ts` |
| **Build** | `next build` | `package.json:7` | |
| **Lint** | *none installed* — `next.config.ts:5` sets `eslint.ignoreDuringBuilds: true` but `node_modules/eslint` does not exist | **no lint gate at all** |
| **Typecheck** | `tsc --noEmit` (`package.json:9`) plus `typescript.ignoreBuildErrors: false` (`next.config.ts:4`) | real gate, enforced at build |
| **Test** | **none** — 0 `*.test.*` / `*.spec.*` files; no vitest/jest/playwright test script | |

- **Next.js version + App Router:** Next 15.5.26, App Router. Evidence: `src/app/(public)/` route group, 25 `route.ts` handlers, `src/middleware.ts`, `src/instrumentation.ts`, per-route `export const metadata` and `export const dynamic = "force-dynamic"`.
- **React version:** 19.3.0.
- **Tailwind major version:** **3** (3.4.19), PostCSS pipeline. No Tailwind v4 features are used *correctly* — see 11.2 for four v4-only utilities that slipped into `select.tsx`.
- **`shadcn` CLI:** **not used.** No `components.json` exists (`Test-Path components.json` returned `False`). The kit is a hand-copied, shadcn-v4-derived set. **10 of 20 kit files carry the literal comment `Herkunft: MLHSM-KIT (HomeServerManager) src/components/kit/<name>.tsx`** — `label.tsx:6`, `separator.tsx:8`, `switch.tsx:8`, `tabs.tsx:6`, `tooltip.tsx:8`, `skeleton.tsx:5`, `scroll-area.tsx:6`, `select.tsx:9`, `dropdown-menu.tsx:2`, `confirm-dialog.tsx:16`. Each also documents a `LUTEA-Delta:`. **The shared library already exists as copy-paste; the work is promotion, not authorship.**
- **Dark-mode strategy:** `darkMode: "class"` (`tailwind.config.ts:5`) with `<html lang="de" className="dark">` hardcoded at `layout.tsx:21`. **There is no light theme** — every colour is a single dark hex and `class="dark"` is never toggled. The `darkMode` strategy and the `dark` class are both decorative. This matters for extraction: a shared design system must not assume these hexes are a *dark instance of a token pair* — they are simply the only values that exist.

---

## 2. Design tokens

### 2.1 The critical structural fact

**There are no CSS custom properties for colour.** `src/app/globals.css` `:root` (`globals.css:9-13`) contains **only**:

```css
:root {
  --radius-sm: 0;
  --radius-md: 0;
  --radius-lg: 0;
}
```

`rg 'var\(--' src` returns **zero matches** across the whole source tree. Therefore:

- `--radius-sm` / `--radius-md` / `--radius-lg` are **declared and never consumed**. `theme.extend.borderRadius` is not defined in `tailwind.config.ts`, so there is no `rounded-sm` / `rounded-md` / `rounded-lg` token to reference them from.
- The design system uses shadcn's **semantic naming scheme** (`--background`, `--card`, `--muted-foreground` shape) but resolves it as **literal hex values inside `theme.extend.colors`** — not as CSS custom properties.

This is the single most important thing to standardise. Theming is impossible without editing TypeScript, the `dark` class does nothing, and the semantically-named-but-hardcoded `.bg-card` override at `globals.css:16-18` is a symptom of the missing token layer.

### 2.2 Colour — `tailwind.config.ts:13-47` (single dark palette, no light counterpart)

| Token | Hex | Role |
|---|---|---|
| `lutea.gold` | `#F2C012` | **never referenced in any `.tsx`** |
| `lutea.green` | `#4CAF6D` | **never referenced** |
| `lutea.blue` | `#2F6FEB` | **never referenced** |
| `background` | `#111318` | page base |
| `foreground` | `#E8E6E0` | body text |
| `card` | `#171A21` | surfaces |
| `card-foreground` | `#E8E6E0` | |
| `popover` | `#1E222B` | dialogs, search dropdown, toasts |
| `popover-foreground` | `#E8E6E0` | |
| `primary` | `#F2C012` | gold — **byte-identical to `accent`** |
| `primary-foreground` | `#111318` | |
| `secondary` | `#232733` | |
| `secondary-foreground` | `#D4D2CA` | |
| `muted` | `#1B1F27` | hover fills |
| `muted-foreground` | `#9A968C` | secondary text; **the workhorse label colour** |
| `accent` | `#F2C012` | **byte-identical to `primary`** |
| `accent-foreground` | `#111318` | |
| `destructive` | `#B3261E` | |
| `border` | `#343A46` | |
| `input` | `#1B1F27` | **byte-identical to `muted`** |
| `ring` | `#F2C012` | focus ring = gold |
| `status.unprocessed` | `#6B7280` | |
| `status.noWebsite` | `#E0332E` | key mismatch — see 11.1 |
| `status.opportunity` | `#F2921E` | |
| `status.contacted` | `#F2C012` | |
| `status.conversation` | `#2F6FEB` | |
| `status.offer` | `#9B59F5` | |
| `status.customer` | `#4CAF6D` | |
| `status.archived` | `#1A1D24` | |

**Three aliased pairs** mean the API has three names for one gold and two for one surface: `lutea.gold` = `primary` = `accent` = `ring`; `muted` = `input`. Callers mix them freely: `bg-accent` in `switch.tsx:17`, `bg-primary` in `badge.tsx:10`, `text-primary` in `button.tsx:11`, `focus-visible:ring-ring` in `input.tsx:9`, `text-accent` in `agentur/page.tsx:44`. A shared system must either collapse these to one name or give each a genuinely distinct role.

**The whole `colors.status.*` scale is unreachable.** The canonical status keys live in `src/lib/status.ts:1-10` as snake_case (`no_website`, not `noWebsite`), so `colors.status.noWebsite` can never be addressed by a real status value, and `colors.status` as a whole is dead. The same eight hexes are duplicated in `src/lib/status.ts:25-34` as `STATUS_COLORS`. **Two sources of truth for status colour; one is broken and neither is used.**

### 2.3 `globals.css` extras

| What | Where | Value |
|---|---|---|
| Font imports | `globals.css:1-3` | `@import "@fontsource-variable/jost"`, `.../jetbrains-mono`, `@fontsource/lilita-one` |
| `.bg-card` **override** | `globals.css:16-18` | `background-color: #171a21;` — a hand-written duplicate of the Tailwind class, inside `@layer utilities`, declared *after* `@tailwind utilities`. Wins on source order, hardcodes the value, blocks theming, and is a latent cascade bug. |
| `.glass-grid` | `globals.css:19-26` | 48px grid, `rgba(255,255,255,0.03)` lines, `radial-gradient(ellipse 85% 70% at 50% 0%, black 30%, transparent 75%)` mask. Used at `page.tsx:6` and `agentur/page.tsx:36`. |
| Global border colour | `globals.css:30-34` | `*, *::before, *::after { border-color: theme("colors.border") }` |
| Body | `globals.css:44-53` | `Jost Variable, Jost, Futura, system-ui, sans-serif` plus a **second** 48px grid at `rgba(255,255,255,0.02)` with `background-attachment: fixed`. This doubles up with `.glass-grid`, so `/` and `/agentur` render two overlapping 48px grids. |
| `::selection` | `globals.css:55-58` | `#f2c012` background / `#111318` foreground |
| Scrollbar | `globals.css:60-73` | 10px, track `#111318`, thumb `#343a46`, hover `#f2c012`. **`::-webkit-scrollbar` only** — no `scrollbar-width` / `scrollbar-color`, so Firefox gets the UA default. |
| `#root` | `globals.css:37-42` | **dead selector** — a Vite-ism. App Router has no `#root`. |

### 2.4 Radii, shadows, spacing, density

**Radii are not a token axis — they are a hardcoded constraint.** The design rule is "no rounded elements":

- `rounded-none` is hardcoded in `card.tsx:9`, `badge.tsx:6`, `input.tsx:9,23`, `toast.tsx:21,46`, `skeleton.tsx:12`, `select.tsx:72,115,129,135`, `dropdown-menu.tsx:33,53,71,89,105,129,153`, and `switch.tsx:17` — whose own header comment records the change: *"LUTEA-Delta: rounded-full -> rounded-none (Designregel: keine runden Elemente)"* (`switch.tsx:9`).
- `rounded-full` survives only for dots, pills and avatars: `crm-status-badge.tsx:51`, `company-list.tsx:184,252`, `agentur/page.tsx:40,61,85,151`, `auditor-client.tsx:151,190`, `global-search.tsx:60,118`, `settings-panel.tsx:222,225`.

This is a *good* constraint, but it is currently enforced by memory. It should be a lint rule or a default in the shared system, otherwise every new component will eventually reintroduce `rounded-md`.

**Shadows — three hardcoded hard-shadow values, no token:**

| Value | Where |
|---|---|
| `shadow-[8px_8px_0_0_rgba(0,0,0,0.5)]` | `dialog.tsx:37`, `global-search.tsx:64` |
| `shadow-[6px_6px_0_0_rgba(0,0,0,0.5)]` | `toast.tsx:21`, `select.tsx:72`, `dropdown-menu.tsx:53,71` |
| `shadow-[4px_4px_0_0_rgba(0,0,0,0.5)]` | `tooltip.tsx:23` |
| `shadow-card: "0 1px 3px rgba(0,0,0,0.3)"` (`tailwind.config.ts:49`) | **never used**; `card.tsx:9` sets `shadow-none` |
| `shadow-sidebar: "1px 0 0 #30363d"` (`tailwind.config.ts:50`) | used once, `dashboard-sidebar.tsx:42` |
| `shadow-xl` | `crm-page-client.tsx:141` (the one soft shadow in the app) |

Three offsets (4/6/8px) of the same hard-shadow idiom, plus one `shadow-card` that nothing uses and one `shadow-xl` that breaks the idiom entirely.

**Spacing:** Tailwind default scale only; `theme.extend` adds nothing. Density is achieved by hand-picking `p-3` / `p-4` / `p-5` / `p-6` and `text-[10px]` / `text-[11px]` / `text-xs`. 82 padding utilities and 115 `gap-*` utilities across the tree.

**Control density is the real de-facto token set**, expressed in component code rather than as variables:

| Control | Height | Where |
|---|---|---|
| Button | `h-8` default, `h-7` sm, `h-10` lg, `h-11` xl, `size-8` / `size-7` icon | `button.tsx:22-27` |
| Input | `h-8` | `input.tsx:9` |
| Table head | `h-9` | `table.tsx:36` |
| Select trigger | `h-8` | `select.tsx:23` — *"LUTEA-Delta: Trigger auf h-8 (Dashboard-Informationsdichte statt h-10 Form-Dichte)"* |
| Switch | `h-5 w-9` | `switch.tsx:17` |
| Tabs list | `h-9` | `tabs.tsx:18` |
| Dialog | `max-h-[85vh]` | `settings-overlay.tsx:33` |
| Sidebar / header | `w-64`, `min-h-[69px]` | `dashboard-sidebar.tsx:42,43` |

**Type scale (the actual hierarchy):**

| Token | Usage |
|---|---|
| `text-[10px]` | micro-labels, score-cat captions |
| `text-[11px]` | **the dominant label size** — `uppercase tracking-wider`, 17+ occurrences |
| `text-xs` | badges, secondary meta |
| `text-sm` | body / default UI size |
| `text-lg` / `text-xl` | card titles, dialog titles |
| `text-2xl` / `text-3xl` | section `h2` |
| `text-4xl` / `text-5xl` / `text-6xl` | display / hero / big score |

### 2.5 Fonts

```
sans:    ["Jost Variable", "Jost", "Futura", "sans-serif"]   // tailwind.config.ts:9
mono:    ["JetBrains Mono", "monospace"]                     // :10
display: ["Lilita One", "Jost", "sans-serif"]                // :11
```

- **Loading strategy: self-hosted via `@fontsource*` CSS `@import`** in `globals.css:1-3`. **No `next/font` anywhere.**
- Consequences: no automatic `font-display: swap` control, no metric-matched fallback (`size-adjust` / `adjustFontFallback`) and therefore CLS on the `Lilita One` `h1`s, no subsetting configuration, and all three families are requested on every route — including the public marketing pages that never use `mono`.
- `font-display` is used in exactly 4 places: `public-page-header.tsx:10`, `agentur/page.tsx:43`, `login-form.tsx:46`, `portal-client.tsx:59`.
- `font-mono` is used at `crm-page-client.tsx:124`, `auditor-client.tsx:78,163`, `settings-panel.tsx:188,299`.

### 2.6 Z-index

| Value | Where | Note |
|---|---|---|
| `z-40` | `public-header.tsx:19` | sticky header |
| `z-50` | `dialog.tsx:20,37`, `tooltip.tsx:23`, `select.tsx:72`, `dropdown-menu.tsx:53,71` | overlay band |
| `z-30` | `crm-page-client.tsx:141` | CRM detail panel |
| `z-[100]` | `toast.tsx:13` (`ToastViewport`) | **dead** |
| `z-[9999]` | `toaster.tsx:17` | actual toast layer |

Two competing scales for the same overlay band, with `z-[9999]` an arbitrary outlier. A shared system needs a named scale (e.g. `--z-header: 40; --z-overlay: 50; --z-toast: 60; --z-drawer: 70`).

### 2.7 Breakpoints

Tailwind defaults only. Actual usage:

- `sm:` — 1 occurrence (`public-header.tsx:36`)
- `md:` — the workhorse, 16 files: layout collapse, `md:grid-cols-2` / `-3` / `-5`
- `lg:` — **the admin/dashboard breakpoint**: `dashboard-sidebar.tsx:42` (`hidden ... lg:flex`), `shell.tsx:23` (`hidden ... lg:flex`), `shell.tsx:33` (`p-4 md:p-6`), `crm-page-client.tsx:97-100,141`
- `xl:` — 1 occurrence (`overseer-dashboard.tsx:263`, `sm:grid-cols-2 xl:grid-cols-4`)

Containers: `max-w-6xl` on public (`agentur` x6, `public-header:20`, `public-footer:34`, `public-page-header:9`), `max-w-2xl` on forms (`kontakt:49`), `max-w-3xl` on check/faq, `max-w-md` on dialogs. No container component and no container queries.

### 2.8 Motion

- **Keyframes: none authored.** Only `tailwindcss-animate` defaults (`animate-in`, `animate-out`, `fade-in-0`, `zoom-in-95`, `slide-in-from-*`) plus `animate-spin` and `animate-pulse`.
- **Durations / easings: `rg 'duration-|ease-' src` returns zero matches.** All motion therefore runs at Tailwind defaults (150ms, `cubic-bezier(0.4,0,0.2,1)`), entirely unconfigured. There is no motion token axis at all.
- **`prefers-reduced-motion`: zero matches in the entire repository.** Every `animate-spin` (13 files), every `animate-pulse` (`global-search.tsx:60`, `skeleton.tsx:12`), and every slide/fade/zoom on Radix content is unguarded. For a project whose own `/website-check` sells accessibility audits to paying customers, this is an awkward gap.
- **Focus ring — four different recipes:**

| Recipe | Where |
|---|---|
| `focus-visible:ring-3 focus-visible:ring-ring/50` plus `focus-visible:border-ring` on inputs | `button.tsx:7`, `input.tsx:9,23` |
| `focus-visible:ring-3 focus-visible:ring-ring/40` | `global-search.tsx:48` — applied to a **`<div>`**, not a focusable control |
| `focus-visible:ring-2 ring-ring/40 ring-offset-2 ring-offset-background` | `switch.tsx:17` |
| `focus-visible:ring-2 ring-ring/50 ring-offset-2 ring-offset-background` | `tabs.tsx:33,48` |
| `focus:outline-none` with **no replacement** | `dialog.tsx:44`, `toast.tsx:46` |

- **Density variables: none exist.** Density is implicit in per-component height classes (see 2.4).

---

## 3. Component inventory

### 3.1 Components

`Ref` = forwarded to DOM. `Slots` = composition children. Local (non-exported) sub-components are listed in the Notes column.

#### Layer: `kit` — 20 files, 34 exports

| Component | File | Layer | Underlying primitive | Variants | State props | data-* | Slots | Ref | a11y notes | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| `Badge` | `kit/badge.tsx:21` | kit | custom `div` + cva | variant: `default` `secondary` `destructive` `outline` `muted` | none | — | — | no | none — no `role`; text content is the only signal | cva exported as `badgeVariants`. `outline` variant has no border/bg, only `text-foreground`. |
| `Button` | `kit/button.tsx:39` | kit | `@radix-ui/react-slot` | variant: `default outline secondary ghost destructive link` · size: `default sm lg xl icon iconSm` | `asChild` (default `false`) | `data-slot="button"` (`:49`) | — | no (Slot only) | GOOD `focus-visible:ring-3 ring-ring/50`; `disabled:pointer-events-none`; `[&_svg:not([class*='size-'])]:size-4` auto-sizes icons; `select-none` | Only kit component with `data-slot` + exported variants + `asChild`. **The reference implementation for the whole kit.** |
| `Card` + 5 parts | `kit/card.tsx:4,17,21,30,34,38` | kit | custom `div` | none | none | `data-slot="card"` on `Card` only (`:7`) | `CardHeader` `CardTitle` `CardDescription` `CardContent` `CardFooter` | no | BAD **none of the 6 render a heading element** — `CardTitle` is a `div` | `CardHeader` is `p-6` while every real use overrides to `p-4`/`p-5`. **`CardFooter` is used nowhere.** `rounded-none` + `shadow-none` hardcoded (`:9`). |
| `CrmStatusBadge` | `kit/crm-status-badge.tsx:23` | kit | custom `span` + cva (locally named `sectionVariants`) | `tone: solid \| outline` (default `outline`) | `status: CrmStatus \| null`, `tone`, `className` | — | — | no | WARN not `<span role="status">`; no `title`; the `null` branch renders `"Unbearbeitet"` with a border but **no dot** (`:33-40`) — asymmetric with the populated branch | Colour applied via **inline `style`** (`:47-48`) from `STATUS_COLORS`, not via Tailwind, so it is unthemeable and not `twMerge`-able. Hardcodes `color: "#111318"`. |
| `Dialog` family (10) | `kit/dialog.tsx:8-89` | kit | `@radix-ui/react-dialog` | none | Radix-controlled `open` / `onOpenChange` | — | `DialogHeader` `DialogTitle` `DialogDescription` `DialogFooter` | yes on `Overlay` + `Content` | GOOD Radix focus trap + focus return; GOOD `aria-label="Schließen"` on close (`:45`); BAD `DialogHeader` / `DialogFooter` are plain `div` | `DialogOverlay` (`:13`) and `DialogPortal` (`:10`) are exported but used only inside `dialog.tsx`. Close button sets `focus:outline-none` with no ring (`:44`). Content uses a hardcoded `8px` hard-shadow (`:37`). `DialogFooter` adds a `border-t` + `pt-4` most call sites do not want. |
| `ConfirmDialog`, `useConfirm` | `kit/confirm-dialog.tsx:32,82` | kit | `kit/dialog` + `kit/button` | `destructive?: boolean` | `open` `title` `description?` `confirmLabel?` `cancelLabel?` `destructive?` `onConfirm` `onCancel` | — | — | no | GOOD Title + Description always present; GOOD Escape routes to `onCancel` (`:43`) | **The only reusable destructive-confirm primitive in the repo, and it is used nowhere.** Its own docstring (`:17-19`) states it exists to replace `window.confirm` — yet the codebase ships a bespoke two-step inline confirm instead (`settings-panel.tsx:335-345`). German default labels `Bestätigen` / `Abbrechen` (`:36-37`). |
| `DropdownMenu` family (15) | `kit/dropdown-menu.tsx:12-202` | kit | `@radix-ui/react-dropdown-menu` | none | Radix | — | `Content Item CheckboxItem RadioItem Label Separator Shortcut Group Portal Sub SubContent SubTrigger RadioGroup` | yes (all but `Shortcut`) | GOOD Radix a11y | **Entirely unused.** BAD missing `"use client"` despite wrapping `DropdownMenuPrimitive.Portal`. BAD broken indentation at `:70` (`className={cn(` at column 0). Comment at `:3` claims `ms-auto -> ms-auto` — a no-op edit. |
| `Input` | `kit/input.tsx:4` | kit | native `<input>` | none | all native + `type` | — | — | yes | GOOD `aria-invalid:border-destructive aria-invalid:ring-destructive/20`; GOOD `focus-visible:border-ring focus-visible:ring-3`; `disabled:cursor-not-allowed` | Uses `React.ComponentProps<"input">` (TS 5.1 intrinsic-element syntax) — the only file in the kit to do so. |
| `Textarea` | `kit/input.tsx:19` | kit | native `<textarea>` | none | native | — | — | yes | BAD **missing `aria-invalid:*`** (present on `Input`, absent here) — validation styling is inconsistent between the two controls in the same file | `min-h-20`; consumers override to `min-h-28` (`crm-page-client.tsx:288`). |
| `Label` | `kit/label.tsx:9` | kit | `@radix-ui/react-label` | none | Radix | — | — | yes | GOOD `peer-disabled:cursor-not-allowed peer-disabled:opacity-70` | **Unused.** Annotated *"LUTEA-Delta: keine."* Its non-adoption is the direct cause of the 11 unassociated `<label>` elements in 6.2. |
| `LuteaLogo` | `kit/logo.tsx:4` | kit | `next/image` | none | `className` | — | — | no | GOOD `alt="LUTEA DESIGN"` | `aspect-[2/1]` wrapper + `fill` + `object-contain` + `priority` (`:12`). |
| `LuteaLogoSmall` | `kit/logo.tsx:18` | kit | `next/image` | none | `className` | — | — | no | GOOD `alt="LUTEA DESIGN"` | Fixed `h-10 w-20` box. WARN `priority` on **every** instance (`:26`) — up to 3 preloads of the same PNG per page. `dashboard-sidebar.tsx:90` overrides with `h-8 w-16`. |
| `ScrollArea`, `ScrollBar` | `kit/scroll-area.tsx:29,9` | kit | `@radix-ui/react-scroll-area` | none | Radix | — | — | yes | GOOD Radix (keyboard-scrollable overflow) | **Unused.** Annotated *"LUTEA-Delta: Scrollbar auf LUTEA-Scrollbar-Design (eckig, Akzent-Farbe bei Hover)"* — which **conflicts** with the global `::-webkit-scrollbar` block in `globals.css:60-73`. Two competing scrollbar strategies. |
| `Select` family (10) | `kit/select.tsx:12-149` | kit | `@radix-ui/react-select` | none | Radix | — | `SelectGroup` `SelectValue` `SelectTrigger` `SelectContent` `SelectLabel` `SelectItem` `SelectSeparator` `SelectScrollUpButton` `SelectScrollDownButton` | yes | GOOD Radix a11y | **Unused.** BAD **4 broken utilities — Tailwind v4 syntax in a Tailwind 3 project** (`:72` `max-h-(--radix-select-content-available-height)`, `origin-(--radix-select-content-transform-origin)`; `:85` `h-(--radix-select-trigger-height)`, `min-w-(--radix-select-trigger-width)`). v3 requires `[var(--...)]`. Compare the **correct** v3 form in `dropdown-menu.tsx:71`. |
| `Separator` | `kit/separator.tsx:11` | kit | `@radix-ui/react-separator` | `orientation`, `decorative` | Radix | — | — | yes | GOOD `decorative = true` default | **Unused.** Annotated *"LUTEA-Delta: keine."* |
| `Skeleton` | `kit/skeleton.tsx:8` | kit | custom `div` | none | none | `data-slot="skeleton"` (`:11`) | — | no | BAD no `role="status"` / `aria-busy` | **Unused.** Annotated *"LUTEA-Delta: React-Import ergänzt (in MLHSM fehlte er – dort war nur `cn` importiert)."* Every loading state instead renders `<Loader2 className="animate-spin"/>` + prose — 13 copies. |
| `Switch` | `kit/switch.tsx:11` | kit | `@radix-ui/react-switch` | Radix `checked` | Radix | — | — | yes | GOOD Radix; GOOD `focus-visible:ring-2 ring-offset-2` | **Unused** — `settings-panel.tsx:220-226` hand-rolls a `<button aria-pressed>` toggle instead. Annotated *"rounded-full -> rounded-none (Designregel: keine runden Elemente)"*. |
| `Table` family (6) | `kit/table.tsx:4-45` | kit | native `<table>` | none | native | — | `TableHeader` `TableBody` `TableRow` `TableHead` `TableCell` | yes on `Table` only | WARN no `<caption>`, no `scope` on `TableHead`, **no overflow/sticky container** | `TableHead` is `h-9 text-[11px] uppercase tracking-wider` (`:36`) — the kit's own label style. `TableBody` is `cn("", className)` — a no-op wrapper (`:20`). `TableRow` carries `data-[state=selected]:bg-muted` (`:26`) but **no consumer ever sets `data-state`**, so that rule is dead. |
| `Tabs` family (4) | `kit/tabs.tsx:9-53` | kit | `@radix-ui/react-tabs` | none | Radix | — | `TabsList` `TabsTrigger` `TabsContent` | yes | GOOD Radix a11y | **Unused.** Annotated *"LUTEA-Delta: keine (MLHSM ist bereits LUTEA-konform: rounded-none, Akzent)."* |
| `Toast` family (7) | `kit/toast.tsx:8-67` | kit | BAD **none** — plain `div` / `button` | `default` `success` `destructive` | none | — | `ToastTitle` `ToastDescription` `ToastClose` `ToastIcon` | no | BAD **no live region anywhere** — `Toaster` renders no `role="status"` / `aria-live` | **Radix is imported (`:3`) and `ToastProvider` re-exported (`:8`) but never actually used**: `Toast` (`:37`) renders a `<div>`, not `ToastPrimitives.ToastRoot`. Consequence: every `data-[state=open]:animate-in` and `data-[swipe=end]:animate-out` class in `:21` is **dead** — no `data-state` is ever emitted. `ToastViewport` (`:10`) exported, never used. `ToastIcon` (`:64`) takes a **required** `variant` but receives cva's nullable `variant` at the call site (`toaster.tsx:21`). |
| `Toaster` | `kit/toaster.tsx:8` | kit | custom + `createPortal` | — | — | — | — | no | BAD no `aria-live`, no `role="status"`, no `role="alert"` | Renders `ToastProvider` (Radix) but **no `ToastPrimitive.Root` ever registers with it** — the provider is inert. Uses `createPortal(..., document.body)` behind a `mounted` guard, at `z-[9999]`. |
| `Tooltip` family (4) | `kit/tooltip.tsx:11-29` | kit | `@radix-ui/react-tooltip` | none | Radix | — | `TooltipProvider` `TooltipTrigger` `TooltipContent` | yes | GOOD Radix a11y | **Unused.** Annotated *"LUTEA-Delta: keine (Schattenstil 4px-Offset ist bereits LUTEA-Konvention)."* Uses `origin-[--radix-tooltip-content-transform-origin]` — correct **v3** shorthand. |

#### Layer: `dashboard` — 19 files

| Component | File | Layer | Underlying primitive | Variants | State props | data-* | Slots | Ref | a11y notes | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| `DashboardShell` | `dashboard/shell.tsx:5` | dashboard | custom layout | — | `title` `subtitle?` `actions?` `className?` | — | `actions` | no | GOOD `<h1>` at `:25`; GOOD `<main>` at `:21`; BAD no skip link; WARN the `h1` is inside `hidden ... lg:flex` (`:23`) so **below 1024px the dashboard has no `h1` at all** | `h-screen overflow-hidden` fixed-viewport shell. Re-declared in 5 routes because there is **no `dashboard/layout.tsx`**. `min-h-[69px]` duplicated with `dashboard-sidebar.tsx:43`. |
| `DashboardSidebar` | `dashboard/dashboard-sidebar.tsx:38` | dashboard | custom `<aside>` | — | none | — | — | no | GOOD `<nav aria-label="Hauptnavigation">` (`:52`); GOOD `aria-current="page"` (`:59`); BAD the Overseer/Settings triggers are bare `<button>`s with no `aria-haspopup` / `aria-expanded` | Declares its own `NAV` (`:30-36`) — **duplicated** with `dashboard-nav.tsx:11-17`. Hosts `GlobalSearch` (`:50`), which is therefore unreachable below `lg`. |
| `DashboardMobileHeader` | `dashboard/dashboard-sidebar.tsx:84` | dashboard | `kit/dialog` | `compact` on children | `title` | — | — | no | GOOD `aria-label="Navigation öffnen"` (`:100`); GOOD dialog has Title + Description (`:106-107`); GOOD `aria-label="Mobile Navigation"` (`:109`) | Drawer variant of the sidebar: **re-implements the same `NAV` map a third time** (`:110-120`), drops `aria-current`, drops `GlobalSearch`, and renders the title as a `<div>` (`:92-93`) rather than a heading. |
| `GlobalSearch` | `dashboard/global-search.tsx:14` | dashboard | custom | `compact?: boolean` | `compact` | — | — | no | BAD **no combobox semantics**: no `role="combobox"`, no `aria-expanded`, no `aria-controls`, no `aria-activedescendant`; results are bare `<button>`s (`:130`) with no listbox/option roles; **no arrow-key nav**; Escape only blurs (`:55`); no Enter handling; the busy indicator (`:60`) is a bare `<span>` with no text | Hand-rolled search input **bypassing `kit/input.tsx`** (`:51-59`) with its own `border-ring ring-3 ring-ring/40` focus recipe (`:48`). All three result groups use the same `SearchIcon` (`:74,86,99`). Dispatches `window.dispatchEvent(new CustomEvent("lutea:focus-company", ...))` (`:77`) — **nothing in the codebase listens for it**. 200ms debounce, min 2 chars (`:23,25`). |
| `DashboardNav` | `dashboard/dashboard-nav.tsx:19` | dashboard | custom `<nav>` | — | none | — | — | no | BAD **no `aria-label`**, no `aria-current` — strictly weaker than the sidebar copy | **Dead.** Also `export { LuteaLogoSmall }` (`:45`), a pointless re-export. Labels `/dashboard` as `"Übersicht"` here vs `"Unternehmen"` in `dashboard-sidebar.tsx:31` and `dashboard/page.tsx:10` — **stale**. |
| `StubSection` | `dashboard/stub-section.tsx:1` | dashboard | custom `div` | — | `title` `hint` `cta?` | — | `cta` | no | GOOD real `<h2>`; semantically correct for a placeholder | **Dead** — but it is the **correct** empty-state primitive (see 4.7). Near-identical to 10 inline copies. |
| `LogoutButton` | `dashboard/logout-button.tsx:7` | dashboard | `kit/button` | — | none | — | — | no | GOOD text label `"Abmelden"` + icon | `finally { window.location.href = "/login" }` — full page reload instead of `router.push` + `router.refresh()`. |
| `LoginForm` | `dashboard/login-form.tsx:13` | dashboard | `kit/button` + `kit/input` | — | `next: string` | — | — | no | GOOD **the only correct label in the repo**: `htmlFor="password"` (`:53`) matched by `id="password"` (`:57`); GOOD `autoComplete="current-password"`; GOOD `autoFocus`; BAD the error `<p>` (`:72`) has no `role="alert"` / `aria-live`; BAD no `aria-invalid` on the input when errored | `safeNext()` (`:8-11`) blocks `//` open-redirect. GOOD `type="submit"` + `disabled={busy \|\| !password}`. Also uses a raw `<a href="/">` (`:74`) rather than `next/link`. |
| `CompanyList` | `dashboard/company-list.tsx:39` | dashboard | `kit/card` `kit/button` `kit/input` `kit/badge` + raw | — | 6 `useState` (`companies` `search` `statusFilter` `loading` `error` `selected`) + 4 local handlers | — | — | no | GOOD `role="alert"` (`:159`); GOOD `aria-pressed` on rows (`:177`) and chips (`:245,327`); WARN `aria-label` on a plain `<div>` (`:133` `Statusfilter`) — not exposed without a `role`; WARN `aria-label` on a bare `<svg>` (`:197`); BAD the list is a stack of `<button>`s with no `role="list"`; BAD no `aria-live` on result changes | Local sub-components: `LoaderIcon` (`:225`), `FilterChip` (`:229`), `CompanyDetail` (`:259`), `Score` (`:355`). 300ms debounce (`:65`). Master-to-detail on mobile via `hidden lg:flex` (`:113-116`) and a `Zurück zur Liste` button (`:280`). The status picker in `CompanyDetail` (`:322-336`) is a **third** status-chip implementation. |
| `CrmPageClient` | `dashboard/crm-page-client.tsx:18` | dashboard | `kit/table` `kit/crm-status-badge` `kit/input` `kit/button` + raw | — | 6 `useState` | — | — | no | BAD **no accessible name** on the status `<select>` (`:74-83`); BAD the search `<input>`'s only name source is `placeholder` (`:67-72`); BAD `<TableRow onClick>` (`:108`) is not focusable and has no `role="button"`, so the detail panel is keyboard-unreachable; GOOD `aria-label="Schließen"` (`:149`) | Local `EmailDraftBlock` (`:213`). WARN `:299` contains **corrupted text**: `"Versand läuft über dein E-Mail-Programm (mailto). LUTEA logt den Kontakt und我们把das CRM."` WARN `:122` `status={c.crm_status as any}` defeats the `CrmStatus` type. BAD No `error` state at all — `load()` (`:26-33`) and `openDetail()` (`:40-46`) have no `try`/`catch` and no `res.ok` check. `FEHLT` (`:118`) is a **fourth** status visual language (all-caps red text). Detail panel is `fixed` (`:141`), forcing `crm/page.tsx:12` to override the shell padding with `className="p-0 md:p-0"`. |
| `AuditorClient` | `dashboard/auditor-client.tsx:24` | dashboard | `kit/button` (imported, unused) + raw | — | 5 `useState` | — | — | no | GOOD pass/fail is icon **and** colour **and** text `OK`/`PROBLEM` (`:162-166`); WARN raw `<img>` for screenshots with `eslint-disable-next-line @next/next/no-img-element` (`:131-132`), no width/height so CLS; BAD the lead list has no `role="list"`; BAD no `aria-busy` on the running state | Local `ScoreCat` (`:185`) — a **third** score visual. `:6` and `:8` are **two separate `lucide-react` import statements**. `Button` imported (`:5`), never used. **Score thresholds differ from `CompanyList`** — `>= 45` here (`:114`) vs `>= 40` there (`:356`). |
| `ProjectsClient` | `dashboard/projects-client.tsx:56` | dashboard | `kit/dialog` `kit/button` `kit/input` `kit/badge` (unused) | — | 5 `useState` | — | — | no | BAD **`<label>` without `htmlFor` at `:160,166,170`** so `Input name="name"` (`:167`) and `Textarea name="notes"` (`:171`) have **no accessible name**; BAD project names are `<span className="font-semibold">` (`:111`), so the page has **no `<h2>`** below the shell `h1` | WARN **imports in the middle of the file** (`:37-40`), after the `PortalRow` component — an append-edited file. `X` (`:39`) and `Badge` (`:38`) imported, unused. `PROJECT_STATUSES` (`:48-54`) **duplicates** `portal-client.tsx:7-11` `STATUS_LABELS`. Local `PortalRow` (`:9`), `ProjectCreateForm` (`:147`). |
| `VersionManagerClient` | `dashboard/version-manager-client.tsx:38` | dashboard | `kit/button` `kit/badge` `kit/input` + raw | — | 12 `useState` | — | — | no | BAD raw `<select>` with no accessible name (`:270-274`); BAD raw `<textarea>` (`:177-182`) bypassing `kit/Textarea`; GOOD all 4 `<iframe>`s have `title` (`:193,222,249,257`); GOOD `sandbox="allow-same-origin"` on all 4 | **~6 KB of HTML/CSS template literals inlined in the client bundle** (`:23-36`). WARN `sandbox="allow-same-origin"` on a same-origin `srcdoc` is unnecessary and weakens isolation if ever loosened. Four early-return full-screen modes (`:144,201,233,267`). Height via inline `calc(100vh - 180px)` / `- 220px` (`:146,220,245`) — iOS viewport bugs. `STATE_LABELS` (`:17-21`) declares a `rejected` state but **no reject action exists**. |
| `DashboardClient` | `dashboard/dashboard-client.tsx:31` | dashboard | `kit/card` `kit/button` `kit/badge` (unused) | — | 1 `useState` | — | — | no | BAD **nested interactive elements**: `<Link>` (`:71`) wrapping `<Card>` (`:72`) wrapping `<Button asChild><span>` (`:84-88`) — a link containing a button | **Dead.** Unused imports: `Badge` (`:5`), `toast` (`:6`), `AlertTriangle` / `CheckCircle2` / `Clock` (`:9`). Local `StatCard` (`:115`) — **duplicate of** `overseer-dashboard.tsx:322`. |
| `FinderClient` | `dashboard/finder-client.tsx:13` | dashboard | `kit/button` `kit/badge` | — | 5 `useState` | — | — | no | BAD raw `<input type="range">` (`:69-73`) with **no accessible name and no `aria-valuetext`**; BAD category toggle buttons have no `aria-pressed` (`:50-61`); BAD raw error banner with no `role="alert"` (`:84`) | **Dead.** Unused import `X` (`:6`). Its `CATEGORIES` list (`:9-11`) is **duplicated verbatim** in `overseer-dashboard.tsx:233`. |
| `OverseerOverlay` | `dashboard/overseer-overlay.tsx:15` | dashboard | `kit/dialog` | `compact` | `compact` | — | — | no | WARN `aria-label` only in `compact` mode (`:27`); BAD no `aria-haspopup="dialog"` / `aria-expanded`; GOOD dialog has Title + Description (`:36-37`) | Its trigger button (`:20-31`) is **character-for-character** the same markup as `settings-overlay.tsx:19-30`. Right-edge drawer via `DialogContent` overrides (`:34`). |
| `SettingsOverlay` | `dashboard/settings-overlay.tsx:14` | dashboard | `kit/dialog` | `compact` | `compact` | — | — | no | WARN same gaps as `OverseerOverlay` | Same duplicated trigger. WARN comment typo: *"maximale **WBÖhe** leicht beschränkt"* (`:13`). |
| `SettingsPanel` | `dashboard/settings-panel.tsx:16` | dashboard | BAD **local** `Card` + `kit/input` `kit/badge` `kit/button` | — | 5 `useState` + 4 sub-components | — | — | no | BAD `LabeledInput`'s `<label>` (`:210`) and `Toggle`'s `<label>` (`:219`) have **no `htmlFor` and no nested control**, so **every input in the settings dialog has no accessible name at all** and no `aria-label` is added; WARN hand-rolled toggle (`:220-226`) despite `kit/switch.tsx` sitting unused; BAD no `role="alert"` on errors (`:152,256,290,348`) | WARN **defines its own `Card({title})` at `:196`**, shadowing the kit's card concept — 8 usages (`:53,81,104,120,125,130,135`). WARN `:145-149` `DELETE /api/config` (`Standardwerte`) fires on **first click with no confirmation**, while the far less destructive `PrivacyCard` delete at `:335-345` has a bespoke two-step confirm. WARN `:249` text corruption: *"Gebäude-**Precrição**"* (Portuguese). Local `AICard`(157) `GeocodeCard`(231) `BackupCard`(261) `PrivacyCard`(310) `LabeledInput`(205) `Toggle`(216). `scoreWeights` are editable (`:106-115`) but **`computeOpportunityScore` hardcodes every weight** (`score.ts:22-49`) — the UI writes config nothing reads. |
| `OverseerDashboard` | `dashboard/overseer-dashboard.tsx:45` | dashboard | `kit/card` `kit/badge` `kit/button` | — | 7 `useState` | — | — | no | GOOD `role="alert"` (`:175`); GOOD `aria-labelledby` on both `<section>`s (`:227,270`) with matching `<h3>`; GOOD an `Erneut laden` retry (`:163-165`); BAD `Kill-Switch aktivieren` (`:216-224`, `variant="destructive"`) has **no confirmation**; BAD `Freigeben` (`:298-304`) is a single click on a gate that `policy.ts:26-36` treats as a deliberate human act | Local `actionLabel` (`:315`), `StatCard` (`:322`) — **duplicate of** `dashboard-client.tsx:115`, differing only by an `alert` prop. `CardHeader` / `CardTitle` imported (`:4`) but unused. `CATEGORIES` duplicated from `finder-client.tsx:9-11` (`:233`). |
| `PortalClient` | `dashboard/portal-client.tsx:13` | dashboard | `kit/badge` | — | `token` | — | — | no | WARN **heading-order break**: `<h1>` in the `invalid` state (`:47`) but `<h2>` with no `h1` in the `ready` state (`:65`); BAD no `aria-live` on state transitions; BAD no `aria-busy` | `STATUS_LABELS` (`:7-11`) **duplicates** `projects-client.tsx:48-54`. It is a **public** route (`auth.ts:153`) yet lives in `components/dashboard/` and uses no dashboard chrome. `Globe` imported (`:4`), unused. Copy typo: capitalised `PortalLink` (`:50`) should be `Portal-Link`. |

#### Layer: `public` — 3 files

| Component | File | Layer | Underlying primitive | Variants | State props | data-* | Slots | Ref | a11y notes | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| `PublicHeader` | `public/public-header.tsx:17` | public | `kit/button` + `next/link` | — | none | — | — | no | WARN `aria-label="LUTEA DESIGN Startseite"` (`:21`) **overrides** the inner `alt="LUTEA DESIGN"` — redundant; WARN `<nav>` (`:24`) has **no `aria-label`**; BAD `hidden md:flex` (`:24`) hides the nav below 768px **and there is no mobile menu anywhere in the app** | `NAV` const (`:5-11`) duplicates `public-footer.tsx:4-29` `COLS`. WARN The brand links to `/` which resolves to `src/app/page.tsx:3` `PlaceholderHome`, a logo splash with **no header/footer/nav/CTA** — a dead end. Header height `h-16` (`:20`). |
| `PublicFooter` | `public/public-footer.tsx:31` | public | `next/link` | — | none | — | — | no | BAD `<footer>` has no `aria-label`; WARN the three link groups are `<div>` + `<ul>`, not `<nav>`; BAD *"Impressum · Datenschutz"* (`:62`) is **plain text, not links** — legally required in DE and the routes do not exist | `COLS` (`:4-29`) hardcodes `hallo@lutea.design` as a link to `/kontakt` rather than `mailto:`. Year is `new Date().getFullYear()` at render. Tagline: *"Moderne Webdesign-Lösungen für Unternehmen. schnell. messbar. ehrlich."* (`:38`). |
| `PublicPageHeader` | `public/public-page-header.tsx:6` | public | custom `<section>` | — | `title` `subtitle?` | — | — | no | GOOD `<h1 className="font-display text-3xl tracking-wide text-accent md:text-4xl">` — the only correct public `h1` | `border-b border-border bg-card/50 py-12` + `mx-auto max-w-6xl px-4`. **Duplicates** the `SectionTitle` local in `agentur/page.tsx:147`. |
| `Brand` | `public/public-header.tsx:13` | public | `kit/logo` | — | none | — | — | no | WARN wrapper adds nothing | Exported but only consumed internally at `:22`. |

### 3.2 Recurring composites

| Composite | Appears in | Duplicated? | Canonical candidate | Notes |
|---|---|---|---|---|
| **Page / section header** | `public/public-page-header.tsx:6`; `agentur/page.tsx:147` (`SectionTitle`); `agentur/page.tsx:128` (inline FAQ kicker) | YES **3x** | `PublicPageHeader` — extract, add `kicker` + `level` | `SectionTitle` = kicker + `<h2>`; `PublicPageHeader` = `<h1>` + subtitle. Both use the same kicker class `text-[11px] font-semibold uppercase tracking-wider text-accent` (`:150`, `:128`). |
| **Dashboard page header** | `shell.tsx:23-32` (desktop); `shell.tsx:22` routed to `dashboard-sidebar.tsx:84-95` (mobile) | YES **2x** | the `shell.tsx` header | Three header heights: `min-h-[69px]` (shell), `min-h-[69px]` (sidebar), `h-14` (mobile) — two of them the same magic number written twice. |
| **Status badge** | `kit/crm-status-badge.tsx:23`; inline status buttons `company-list.tsx:322-336`; inline status grid `crm-page-client.tsx:170-183`; `company-list.tsx:229-257` `FilterChip`; `projects-client.tsx:117-130`; `finder-client.tsx:49-62`; `version-manager-client.tsx:17-21` `STATE_LABELS` to `Badge`; `portal-client.tsx:7-11` to `Badge` | YES **7 distinct implementations** | `kit/crm-status-badge.tsx` for display; a new `StatusSelect` for the interactive picker | Three *different* visual languages for one job: bordered pill with dot (`crm-status-badge`), `border-accent bg-accent/10 text-accent` chip (`company-list`, `finder-client`), `border-accent` with no bg and no text change (`crm-page-client:177`, `projects-client:124`). Plus `FEHLT` in red text (`crm-page-client:118`). |
| **Card grid** | `agentur/page.tsx:73`; `agentur/page.tsx:82`; `agentur/page.tsx:96`; `leistungen/page.tsx:26`; `dashboard-client.tsx:69`; `dashboard-client.tsx:100`; `overseer-dashboard.tsx:263` | YES **7x** | a `Grid` / `CardGrid` wrapper | `mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3` repeated verbatim; density then drifts to `gap-3 md:grid-cols-3` (`dashboard-client:69`) and `gap-3 md:grid-cols-4` (`:100`). |
| **Service / offer card** | `agentur/page.tsx:156` `ServiceCard`; `leistungen/page.tsx:28-39` (inlined) | YES **2x** | `agentur`'s `ServiceCard` | `leistungen` copies it **without extracting** — identical icon box `flex size-10 items-center justify-center bg-accent text-accent-foreground` (`:160` vs `:30`), identical `CardTitle className="text-base"`, identical `hover:border-accent/50`. Only delta: `leistungen` adds a `price` line (`:37`). **The clearest single duplication in the repo.** |
| **Search bar** | `company-list.tsx:118-128` (kit `Input` + `Search`); `crm-page-client.tsx:65-73` (raw `input`); `global-search.tsx:46-61` (raw `input` + custom focus ring) | YES **3x** | the `global-search.tsx:46-61` box | Two of three bypass `kit/input.tsx`. All three hand-place a `Search` / `SearchIcon` at `left-2.5` / `size-3.5`. **No clear/reset button anywhere.** |
| **Status filter control** | `company-list.tsx:133-149` (`FilterChip` row with counts); `crm-page-client.tsx:74-83` (native `<select>`) | YES **2x** | `FilterChip` | `kit/select.tsx` exists and is unused. `FilterChip` already handles the colour dot, the count, and `aria-pressed` — strictly the better control. |
| **Nav item** | `dashboard-sidebar.tsx:56-69`; `dashboard-nav.tsx:26-38`; `dashboard-sidebar.tsx:111-119`; `public-header.tsx:26-32`; `public-footer.tsx:49-54` | YES **5x** | `dashboard-sidebar.tsx:56-69` (the only one with `aria-current`) | `dashboard-nav.tsx:26-38` is a **byte-identical** copy minus `aria-current` / `aria-label`. The `NAV` array is declared **twice** (`:11-17` vs `:30-36`) with `/dashboard` labelled `"Übersicht"` vs `"Unternehmen"`. |
| **Stat tile** | `dashboard-client.tsx:115-135`; `overseer-dashboard.tsx:322-336`; `company-list.tsx:355-358` (`Score`); `auditor-client.tsx:185-194` (`ScoreCat`); `auditor-client.tsx:111-119` (big score) | YES **4 tile kinds + 2 score kinds** | `overseer-dashboard.tsx:322` (has the `alert` state) | The two `StatCard`s are ~90% identical (`flex size-10 shrink-0 items-center justify-center bg-accent text-accent-foreground`, `truncate text-sm font-semibold`, `text-2xl font-bold`). Score colours are hardcoded hexes in **both**, with **different thresholds** — see 4.12. |
| **Table wrapper** | `crm-page-client.tsx:93-130` — the **only** consumer of `kit/table.tsx` | NO **1x** | `kit/table.tsx` | WARN `kit/table.tsx` has no overflow container and no sticky header; `crm-page-client.tsx` hides columns with `hidden md:table-cell` (`:97-99`) instead of scrolling. `company-list.tsx` and `projects-client.tsx` reimplement tabular lists as `<button>` / `<div>` stacks. |
| **Empty state** | `stub-section.tsx:11`; `portfolio/page.tsx:21`; `crm-page-client.tsx:88`; `projects-client.tsx:103`; `auditor-client.tsx:173`; `overseer-dashboard.tsx:276`; `settings-panel.tsx:177`; `version-manager-client.tsx:225,251,259,293,299`; `company-list.tsx:215-218`; `company-list.tsx:164-171` | YES **10 implementations, 1 component** | `stub-section.tsx` (already built, already correct: `<h2>` + hint + `cta` slot) | All are `border border-dashed border-border p-10 text-center` with `p-4` / `p-10` / `p-16` and `text-sm` / `text-xs` drift. `company-list.tsx:215` adds an icon; `company-list.tsx:164` adds a reset action — neither is expressible in `StubSection`. |
| **Error banner** | `kontakt:92`; `website-check:88`; `auditor-client:97`; `finder-client:84`; `settings-panel:152`; `login-form:72`; `overseer-dashboard:161`; `overseer-dashboard:175`; `company-list:159` | YES **9x** | **none exists** — needs a new `kit/alert.tsx` | The class string `border-destructive/30 bg-destructive/10` is verbatim in all 9. Text colour drifts: `text-red-300` (6x), `text-red-200` (2x), unset (1x). `role="alert"` in only 2 of 9. Padding drifts `p-2` / `p-3` / `p-4`. |
| **Panel / surface block** | `card.tsx:9`; `settings-panel.tsx:198` (local `Card`); `auditor-client.tsx:61,91,101,144,161`; `projects-client.tsx:109`; `overseer-dashboard.tsx:282`; `crm-page-client.tsx:193,264`; `login-form.tsx:43`; `portal-client.tsx:45,56`; `version-manager-client.tsx:307`; `agentur/page.tsx:84,133`; `portfolio/page.tsx:32` | YES **20x** | `kit/card.tsx` (`Card` + `CardContent`) | The bare `border border-border bg-card p-4/5` div is the app's real workhorse, and it is **not** the kit `Card` — it is a hand-typed copy of it. **The single largest source of visual drift.** |
| **Uppercase micro-label** | `table.tsx:36`; `public-footer.tsx:43`; `website-check:96,102`; `portfolio/page.tsx:34`; `crm-page-client:159,167,185,266`; `auditor-client:62,104,145,188`; `finder-client:45`; `company-list:310,321`; `agentur:128,150`; `select.tsx:102`; `global-search:118` | YES **20x** (class string verbatim) | a `kit/Eyebrow` or a Tailwind `@utility` | `text-[11px] font-semibold uppercase tracking-wider text-muted-foreground` appears verbatim 17+ times across 9 files. It is a **token**, not a class. |
| **Icon tile** | `agentur:160`; `leistungen:30`; `dashboard-client:75`; `dashboard-client:124`; `overseer-dashboard:326` | YES **5x** | `agentur:160` | `flex size-10 items-center justify-center bg-accent text-accent-foreground` — verbatim 5x, always with a `size-5` icon. |
| **Loading spinner block** | 13 files: `Loader2 className="... animate-spin"` | YES **13x** | `kit/skeleton.tsx` (exists, unused) | 4 different spinner sizes: `size-4`, `size-3.5`, `size-4` with `mr-2` in `LoaderIcon` (`company-list:226`), plus an `animate-pulse` dot (`global-search:60`). **No `role="status"` anywhere.** |
| **Sidebar / drawer trigger** | `overseer-overlay.tsx:20-31`; `settings-overlay.tsx:19-30` | YES **2x, near-verbatim** | extract a `SidebarAction` | Identical class string, identical `aria-label={compact ? "... oeffnen" : undefined}` + `sr-only` pattern. |
| **Form field** | `kontakt/page.tsx:110` `Field`; `settings-panel.tsx:205` `LabeledInput`; `settings-panel.tsx:216` `Toggle`; `projects-client.tsx:159-172` (inline); `crm-page-client.tsx:279-290` (inline) | YES **5x** | `kit/label.tsx` + a new `Field` — **neither is currently used** | 4 of 5 have unassociated `<label>`s. Label typography drifts: `text-sm font-medium` (2x), `text-[11px] text-muted-foreground` (2x), `text-[11px] font-medium text-muted-foreground` (1x). |
| **Toast surface** | `kit/toast.tsx` + `kit/toaster.tsx` | NO **1x** | — | Functionally broken (see 10.2). Only 2 consumers: `company-list`, `overseer-dashboard`. |
| **Dialog drawer** | `overseer-overlay.tsx:34` (right); `dashboard-sidebar.tsx:104` (left); `settings-overlay.tsx:33` (centred, `max-h-[85vh]`) | YES **3x** | a `Drawer` variant over `kit/dialog.tsx` | The `left-0 top-0 h-dvh ... border-y-0 border-l-0 p-0` and `right-0 ... border-y-0 border-r-0 p-0` override strings are copy-pasted. |
| **Honeypot block** | `kontakt/page.tsx:62-65`; `website-check/page.tsx:64-67` | YES **2x** | a `HoneypotField` component | Identical inline style `position:absolute; left:-9999px; opacity:0; height:0; overflow:hidden` + `aria-hidden` + `tabIndex={-1}` + `autoComplete="off"`, but with a **different `id`** (`HONEYPOT_FIELD` vs `` `hc-${HONEYPOT_FIELD}` ``) and the **same `name`**. |

---

## 4. Repeated / duplicated implementations

> Ordered by the cost of leaving them alone.

### 4.1 The "surface block" — 20 copies of the kit `Card` body

**Files:** `kit/card.tsx:9` (canonical) vs `settings-panel.tsx:198` (local `Card({title})`), `auditor-client.tsx:61,91,101,144,161`, `projects-client.tsx:109`, `overseer-dashboard.tsx:282`, `crm-page-client.tsx:193,264`, `login-form.tsx:43`, `portal-client.tsx:45,56`, `version-manager-client.tsx:307`, `agentur/page.tsx:84,133`, `portfolio/page.tsx:32`.

**How they differ:** padding `p-3` / `p-4` / `p-5` / `p-6` / `p-8`; some use `bg-card/60` (`portfolio:32`), some `bg-card/50`, some flat `bg-card`; `settings-panel.tsx:198` invents a `title` prop with a `mb-3 text-sm font-semibold` header no other surface has; `login-form.tsx:43` and `portal-client.tsx:56` are centred modal shells, not cards; `crm-page-client.tsx:193` nests `text-xs` inside a `p-3` box; `crm-page-client.tsx:264` adds an `EmailDraftBlock` header row.

**Winner:** `kit/card.tsx` `Card` + `CardHeader` / `CardTitle` / `CardContent` — **with `p-6` replaced by a `density` prop** (`compact` = `p-3`, `default` = `p-4`, `comfortable` = `p-6`) so it matches the `h-8` / `text-[11px]` admin density. `settings-panel.tsx:196`'s local `Card` is the best first migration target: 8 usages in one file, and its `title` prop maps directly onto `CardTitle`.

### 4.2 The "service card" — 2 copies, near-identical

**Files:** `agentur/page.tsx:156-169` (`ServiceCard`) and `leistungen/page.tsx:27-40` (inlined).

**Identical:** `Card className="transition-colors hover:border-accent/50"`; the `flex size-10 items-center justify-center bg-accent text-accent-foreground` icon box with a `size-5` icon; `<CardTitle className="text-base">`; `<CardDescription>` inside `CardContent`.

**Only delta:** `leistungen` adds `<div className="mt-4 text-sm font-semibold text-accent">{s.price}</div>` (`:37`).

**Winner:** extract to `components/marketing/service-card.tsx` with an optional `price` prop, driven by **one** `SERVICES` array. Note that both files declare a `SERVICES` const (`agentur:8-15`, `leistungen:9-16`) listing the same 6 titles in a **different order** — `leistungen` moves `Wrench` / Landingpages to 3rd. Merge them: pricing belongs on `/leistungen`, and the `/agentur` descriptions are the copy source.

### 4.3 Status representation — 7 implementations

| # | Location | Form | Active state | Colour source |
|---|---|---|---|---|
| 1 | `kit/crm-status-badge.tsx:23` | `<span>` pill + dot | n/a (read-only) | inline `style` from `STATUS_COLORS` |
| 2 | `company-list.tsx:322-336` | `<button>` row, no dot | `border-accent bg-accent/10 text-accent` | class |
| 3 | `crm-page-client.tsx:170-183` | `<button>` 2-col grid | `border-accent` only — no bg, no text change | class |
| 4 | `company-list.tsx:229-257` `FilterChip` | `<button>` chip + dot + count | `border-accent bg-accent/10 text-accent` | class + inline dot |
| 5 | `projects-client.tsx:117-130` | `<button>` chip | `border-accent text-accent` — no bg | class |
| 6 | `finder-client.tsx:49-62` | `<button>` chip (categories) | `border-accent bg-accent/10 text-accent` | class |
| 7 | `version-manager-client.tsx:17-21` + `portal-client.tsx:7-11` | `Badge` + `STATE_LABELS` / `STATUS_LABELS` map | n/a | cva variant |

`#2` and `#4` are the same; `#3` and `#5` are a third. `#1` is the only one with the status dot. Add `crm-page-client.tsx:118` (`FEHLT`, all-caps red text) and there are effectively 8.

**Winner:** two components.
- `StatusBadge` (read-only) — the existing `crm-status-badge.tsx`, moved from inline `style` to token classes.
- `StatusSelect` (interactive) — new, based on `FilterChip` (which already has the dot, the count, and `aria-pressed`), used by `#2` / `#3` / `#5` / `#6`.

Also **merge** `projects-client.tsx:48-54` and `portal-client.tsx:7-11` into one `PROJECT_STATUS_LABELS` in `lib/status.ts`, alongside the existing `CRM_STATUSES`.

### 4.4 Input / search — 3 implementations, 2 bypass the kit

**Files:** `company-list.tsx:118-128` (kit `Input` + `Search` icon, `pl-8`); `crm-page-client.tsx:65-73` (raw `<input>` inside a hand-typed `flex h-8 items-center gap-2 border border-input bg-input px-2.5` box); `global-search.tsx:46-61` (raw `<input>` with its own `border-ring ring-3 ring-ring/40` focus state).

**How they differ:** wrapper markup; focus treatment (kit vs bespoke ring); width (`w-full` vs `w-52` vs `flex-1`); `global-search.tsx` adds a trailing busy dot and Escape handling, the others do not.

**Winner:** one `SearchInput` in the kit, built on `kit/input.tsx`, with a `left` icon slot and an optional trailing slot. `global-search.tsx:46-61` is canonical. **`crm-page-client.tsx:65-73` should be deleted outright.**

### 4.5 Native `<select>` — 3 raw + 1 unused Radix Select

**Files:** `crm-page-client.tsx:74-83`; `projects-client.tsx:161`; `version-manager-client.tsx:270-274`; and `kit/select.tsx` (**unused**).

**How they differ:** all three hand-type `h-8 border border-input bg-input px-2 text-sm outline-none`; none has an accessible name; `projects-client.tsx:161` adds `name` + `required` + `w-full`.

**Winner:** `kit/select.tsx` — after fixing its 4 Tailwind-v4 utilities (`:72,85`). The swap is simultaneously an a11y fix, a keyboard-navigation fix, and a consistency fix.

### 4.6 Dialog shells — 4 ad-hoc + 1 correct primitive

**Files:** `overseer-overlay.tsx:33-43` (right drawer); `settings-overlay.tsx:32-51` (centred, `max-h-[85vh]`, footer with `DialogClose`); `dashboard-sidebar.tsx:98-130` (left drawer via `DialogTrigger`); `projects-client.tsx:137-142` (centred form dialog); and `kit/confirm-dialog.tsx` (**unused**).

**How they differ:** the two drawers are the same component with mirrored override strings; the centred ones differ in padding (`p-0` + inner padding vs `p-6`).

**Winner:** two variants on top of `kit/dialog.tsx` — `Dialog` (centred) and `Drawer` (left/right, `p-0 border-y-0`, currently 3 copies of the same override). `ConfirmDialog` / `useConfirm` should replace every bespoke confirmation.

### 4.7 Empty states — 10 copies, 1 correct component

**Files:** `stub-section.tsx:11` (canonical, unused) vs `portfolio/page.tsx:21`, `crm-page-client.tsx:88`, `projects-client.tsx:103`, `auditor-client.tsx:173`, `overseer-dashboard.tsx:276`, `settings-panel.tsx:177`, `version-manager-client.tsx:225,251,259,293,299`, `company-list.tsx:164-171,215-218`.

**How they differ:** padding `p-4` / `p-10` / `p-16`; text `text-xs` / `text-sm`; some have an icon (`auditor-client:174` `SearchCheck`, `company-list:216` `Building2`), some have a CTA (`crm-page-client:89-90`, `projects-client:104`), some have a reset link (`company-list:168`), one uses vertical centring (`auditor-client:173` `min-h-72 flex flex-col items-center justify-center`, `stub-section:11` `min-h-96`). `company-list.tsx:215-218` drops the dashed border entirely.

**Winner:** `StubSection` — rename to `EmptyState`, add `icon?`, `action?`, and `size`, and replace all 10. This is a pure win: the file already exists, already has the right semantics (real `<h2>`, a `hint`, a `cta` slot), and is currently dead.

### 4.8 Error banners — 9 copies, 0 components

**Files:** `kontakt/page.tsx:92`, `website-check/page.tsx:88`, `auditor-client.tsx:97`, `finder-client.tsx:84`, `settings-panel.tsx:152`, `login-form.tsx:72`, `overseer-dashboard.tsx:161`, `overseer-dashboard.tsx:175`, `company-list.tsx:159`.

**How they differ:** the class string `border-destructive/30 bg-destructive/10` is verbatim in all 9; padding drifts `p-2` (`login-form`) / `p-3` / `p-4`; text colour drifts `text-red-300` (6), `text-red-200` (2), unset (1 — `company-list:159` puts `text-red-200` on an inner `div` at `:160`); `role="alert"` in only 2 of 9; `login-form.tsx:72` uses a `<p>` not a `<div>`.

**Winner:** new `kit/alert.tsx` with `variant="destructive" | "warning" | "success"`, `role="alert"` baked in, and a token foreground instead of raw `text-red-300` / `text-red-200`.

### 4.9 Micro-labels — 20 copies of one class string

`text-[11px] font-semibold uppercase tracking-wider text-muted-foreground` appears verbatim in: `table.tsx:36`, `public-footer.tsx:43`, `website-check/page.tsx:96,102`, `portfolio/page.tsx:34`, `crm-page-client.tsx:159,167,185,266`, `auditor-client.tsx:62,104,145,188`, `finder-client.tsx:45`, `company-list.tsx:310,321`, `agentur/page.tsx:128`, `select.tsx:102`, `global-search.tsx:118`. The `text-accent` variant appears at `agentur/page.tsx:40,150`.

**Winner:** a `kit/Eyebrow` component or a Tailwind `@utility` / plugin class. This is the **highest-leverage de-duplication in the repo** because it is a *type token*, not a component — and it is the pattern most likely to be re-invented in the next feature.

### 4.10 Nav definitions — 3 copies

**Files:** `dashboard-sidebar.tsx:30-36` (`NAV`), `dashboard-nav.tsx:11-17` (`NAV`, **dead**), and the inlined re-render at `dashboard-sidebar.tsx:110-120`.

`dashboard-nav.tsx:11-17` and `dashboard-sidebar.tsx:30-36` are identical except `/dashboard` is `"Uebersicht"` vs `"Unternehmen"`. `dashboard/page.tsx:10` also titles the page `"Unternehmen"` — so **`dashboard-nav.tsx` is stale**.

**Winner:** `dashboard-sidebar.tsx`'s copy, exported as `DASHBOARD_NAV` from `lib/nav.ts`, consumed by both the desktop `<nav>` and the mobile drawer. **`dashboard-nav.tsx` deleted.**

Public side: `public-header.tsx:5-11` `NAV` and `public-footer.tsx:4-29` `COLS` overlap on all 5 routes. **Winner:** one `SITE_NAV` in `lib/nav.ts`; the footer derives its columns from it (plus a legal column for `/impressum` + `/datenschutz`).

### 4.11 Sidebar / drawer triggers — 2 verbatim copies

`overseer-overlay.tsx:20-31` and `settings-overlay.tsx:19-30` are the same `<button type="button">` with the identical class string `"flex items-center gap-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"`, the identical `cn(compact ? "size-8 justify-center" : "w-full px-3 py-2.5")` branch, the identical `aria-label={compact ? "... oeffnen" : undefined}`, and the identical `<span className={cn(compact && "sr-only")}>`.

**Winner:** one `SidebarAction` (icon + label + `compact`) that both overlays use, differing only in icon and label.

### 4.12 Score visualisation — 4 implementations, **2 different threshold sets**

| Location | Green | Amber | Red / other | Display |
|---|---|---|---|---|
| `company-list.tsx:355-358` | `>= 70` to `#4CAF6D` | `>= 40` to `#F2C012` | else `#9A968C` (muted) | `text-4xl` / `text-[10px]` |
| `auditor-client.tsx:112-117` | `>= 70` to `#4CAF6D` | `>= 45` to `#F2C012` | else `#E0332E` (red) | `font-display text-5xl` |
| `auditor-client.tsx:185-194` `ScoreCat` | — | — | — | progress bar, no colour banding |
| `crm-page-client.tsx:124-126` | — | — | — | raw `font-mono text-xs` number, **no colour at all** |

The same `opportunity_score` is therefore **green/amber/grey in one place and green/amber/red in another** — a score of 40-44 reads as "neutral" on `/dashboard` and "warning" in `/dashboard/auditor`. Four hardcoded hexes that duplicate entries in `STATUS_COLORS`.

**Winner:** one `<Score value max tone="auto|neutral|alert" />` with **one** threshold table, sourced from a token, used by all four sites. The `/100` suffix is also duplicated (`company-list:313`, `auditor-client:118`).

### 4.13 Stat tiles — 2 near-identical

`dashboard-client.tsx:115-135` vs `overseer-dashboard.tsx:322-336`. Identical `flex size-10 shrink-0 items-center justify-center bg-accent text-accent-foreground`, `truncate text-sm font-semibold`, `text-2xl font-bold`; the overseer adds an `alert` prop producing `border-accent/50 bg-accent/5` (`:324`). `dashboard-client.tsx:121` additionally makes the whole tile a `<Link>` around a `<Card>` around a `<Button asChild><span>` — nested interactive elements.

**Winner:** `overseer-dashboard.tsx:322` (the superset), extracted as `kit/StatCard`. The link variant should be handled by wrapping in `<Link>` — **not** by nesting a `<Button>` inside a `<Link>`.

### 4.14 Icon tiles — 5 verbatim copies

`agentur/page.tsx:160`, `leistungen/page.tsx:30`, `dashboard-client.tsx:75`, `dashboard-client.tsx:124`, `overseer-dashboard.tsx:326` — all `flex size-10 items-center justify-center bg-accent text-accent-foreground` plus a `size-5` icon.

**Winner:** `kit/IconTile`.

### 4.15 Form fields — 5 implementations, `kit/label.tsx` unused

`kontakt/page.tsx:110-116` (`Field`); `settings-panel.tsx:205-214` (`LabeledInput`); `settings-panel.tsx:216-229` (`Toggle`); `projects-client.tsx:159-172` (3 inline); `crm-page-client.tsx:279-290` (2 inline); `version-manager-client.tsx:154-159,177-182` (raw `Input` plus a raw `textarea`).

**Winner:** `kit/Field` = `Label` (Radix) + control + `description?` + `error?`, with `htmlFor` / `id` generated and `aria-describedby` / `aria-invalid` wired. This fixes all 11 unassociated labels in one move (see 6.2) and gives `Textarea` the `aria-invalid` styling it is missing.

### 4.16 Loading states — 13 copies, `kit/skeleton.tsx` unused

`Loader2 className="animate-spin"` in 13 files at 4 sizes (`size-4`, `size-3.5`, `size-4` with `mr-2` in `LoaderIcon`, plus the `animate-pulse` dot in `global-search:60`). No `role="status"`, no `aria-live`, no `aria-busy` anywhere.

The copy also drifts: `"... werden geladen ..."`, `"Projekte werden geladen..."`, `"Einstellungen werden geladen..."`, `"Unternehmen wird geladen..."`, `"Portal wird geladen..."`, `"Overseer wird geladen ..."` (note the space before the ellipsis at `overseer-dashboard.tsx:156`, absent everywhere else), `"Analyse laeuft... (bis 15 s) - die Website wird abgerufen, geprueft und bewertet."`, `"Die Website wird analysiert... das dauert bis zu 15 Sekunden."`

**Winner:** `kit/Skeleton` (exists, unused) plus a `<Loading label="...">` wrapper with `role="status"`, and **one** ellipsis convention.

### 4.17 Adjacent duplication worth naming

- **Radix toast vs custom toast** — `kit/toast.tsx` imports Radix and re-exports `ToastProvider`, but renders plain `div`s; `kit/toaster.tsx` mounts the provider and portals manually. Neither path works. Pick one (see 10.2).
- **Mobile nav drawer vs desktop sidebar** — `dashboard-sidebar.tsx:84-133` re-implements the sidebar in a `Dialog`, including a **third** copy of the `NAV` map, and drops both `aria-current` **and** `GlobalSearch`. Global search is therefore unavailable below 1024px.
- **Dashboard shell re-declaration** — 5 routes each re-mount `DashboardShell` with its own title/subtitle (`dashboard/page.tsx:9-14`, `auditor/page.tsx:9-14`, `crm/page.tsx:9-15`, `projects/page.tsx:9-14`, `website/page.tsx:8-10`). A `dashboard/layout.tsx` would make this declarative.
- **Category lists** — `finder-client.tsx:9-11` and `overseer-dashboard.tsx:233` declare the same 8 OSM categories.

---

## 5. UX patterns observed

### 5.1 Public site IA and navigation

**Routes** (`auth.ts:153` `PUBLIC_PAGES`): `/` · `/login` · `/agentur` · `/leistungen` · `/portfolio` · `/website-check` · `/kontakt` · `/portal`.

```
/                     -> src/app/page.tsx        PLACEHOLDER - logo only, no chrome
/agentur              -> marketing home (README:47 calls it "Home")
/leistungen           -> pricing
/portfolio            -> empty state + "how we document projects"
/website-check        -> lead-gen tool
/kontakt              -> lead-gen form
/portal               -> customer status (token-gated)
/login                -> admin login
/dashboard/*          -> admin
```

Note there is **no `src/app/(public)/page.tsx`** — `/` is served from the app root, *outside* the `(public)` route group, so it has no `PublicHeader`, no `PublicFooter`, and no `<main>` wrapper from `(public)/layout.tsx:8`.

**Two structural problems:**

1. **`/` is a dead end.** `public-header.tsx:21` links the brand to `/`, which resolves to `src/app/page.tsx:3` `PlaceholderHome` — a `glass-grid` + `LuteaLogo` splash with **no header, no footer, no nav, no CTA**. The real marketing home is `/agentur`, which nothing in the header links to. A visitor clicking the logo is stranded on a logo.
2. **No mobile navigation.** `public-header.tsx:24` — `<nav className="hidden items-center gap-6 md:flex">`. Below 768px the 5 nav items **do not exist**. There is no hamburger, no `Dialog`, and the footer is not a substitute (it has 10 links to the same 5 routes with different labels). This is the most severe public-side defect.

**Navigation model:** a persistent primary CTA — `Projekt anfragen` (`public-header.tsx:39-41`, `size="sm"`) on every page — plus a secondary `Dashboard` ghost link (`:36-38`, hidden below `sm`). Header height `h-16` (`:20`), `sticky top-0 z-40`, `bg-background/90 backdrop-blur`, `border-b border-border`, `mx-auto max-w-6xl px-4`.

### 5.2 Marketing section structure (German strings = terminology source)

`agentur/page.tsx` is a 5-section landing page — entirely server-rendered, all data from module-level consts, zero client JS.

1. **Hero** (`:35-68`) — eyebrow badge `Websites, die Kunden bringen` with an accent dot (`:39-42`); `<h1 className="font-display text-4xl ... md:text-6xl">` with `LUTEA` in `text-accent` and `DESIGN` in the default foreground (`:43-45`); lead *"Moderne, schnelle und hochwertige Websites für lokale Unternehmen. Ein transparenter Prozess, messbare Ergebnisse."* (`:46-49`); two `size="xl"` CTAs — `Website anfragen` (default) and `Kostenloser Website Check` (outline) (`:51-56`); a 4-item trust row `Feste Preise` / `In 2-4 Wochen online` / `Wartung inkl. Option` / `DSGVO-konform`, each with a `size-1 rounded-full bg-accent` dot (`:58-65`).
2. **Leistungen** (`:71-76`) — `SectionTitle kicker="Leistungen" title="Alles fuer Ihre Website unter einem Dach"` plus 6 `ServiceCard`s in `md:grid-cols-2 lg:grid-cols-3`.
3. **Prozess** (`:79-92`) — 4 steps `01 Analyse` / `02 Konzept` / `03 Design & Build` / `04 Launch & Pflege` (`:18-21`), rendered as `font-display text-3xl text-accent/40` numerals over `border border-border bg-card p-5` (`:84-88`). **No timeline or connector** — just 4 boxes.
4. **CTA pair** (`:95-122`) — 2 `Card`s: `Sind Ihre Inhalte aktuell?` pointing at `/website-check` (*"Pruefen Sie Ihre Website - automatisch. Ergebnis in Sekunden: Technik, Mobile, SEO, Ladezeit und Luecken."*) and `Projekt anfragen` pointing at `/kontakt` (*"Erzaehlen Sie in 2 Minuten, was Sie brauchen. Sie erhalten eine ehrliche Einschaetzung und ein Festpreis-Angebot."*).
5. **FAQ** (`:125-142`) — 4 native `<details>` / `<summary>` (`:24-29`, `:133-138`) with `group-open:text-accent`. **The only accordion in the app; no JS, no Radix.** Heading: `Haeufige Fragen` (`:129`).

**`leistungen/page.tsx`** — `PublicPageHeader` (`:21-24`) plus 6 pricing cards in the same grid (`:26-41`), plus a centred price-disclaimer band (`:42-49`): *"Alle Preise sind Startpunkte - das Festpreis-Angebot entsteht nach kurzer Analyse Ihres Ist-Stands."*

**`portfolio/page.tsx`** — `PublicPageHeader` (`:15-18`) plus an empty state that **teaches the process** (`:21-48`): a dashed-border container, a `Card` titled `So dokumentieren wir Projekte`, and 3 sample entries rendered as `Problem:` / `Loesung:` / `Ergebnis:` triples (`:36-38`), followed by *"Sie haben eine Website mit Verbesserungspotenzial? Werden Sie Referenzprojekt."* (`:45-46`).

**Copy register — a genuine `du`-form voice, with exceptions:**

| String | File | Register |
|---|---|---|
| "Moderne Webdesign-Loesungen fuer Unternehmen. schnell. messbar. ehrlich." | `public-footer.tsx:38` | neutral |
| "Ehrliche Umfangstexte statt Parkettreden. Was hier steht, wird auch gemacht." | `leistungen/page.tsx:23` | neutral |
| "Projekte mit Kontext: Problem, Loesung, Ergebnis. Keine Galerie ohne Aussage." | `portfolio/page.tsx:17` | neutral |
| "Die meisten kleinen Websites sind in 2-4 Wochen online." | `agentur/page.tsx:26` | **Sie** |
| "Zwei Minuten ausfuellen - ehrliches Angebot statt Verkaufsgespraech." | `kontakt/page.tsx:47` | **du** |
| "Automatische Erstanalyse deiner Website - nachvollziehbar, keine geheimnisvolle Punktzahl." | `website-check/page.tsx:59` | **du** |
| "Wir melden uns in der Regel innerhalb von 24 Stunden zur kurzen Ist-Stand-Analyse bei dir." | `kontakt/page.tsx:56` | **du** |
| "Wir verarbeiten deine Angaben nur zur Bearbeitung der Anfrage (Datenminimierung, DSGVO)." | `kontakt/page.tsx:101` | **du** |
| "Feste Preise" / "In 2-4 Wochen online" / "Wartung inkl. Option" / "DSGVO-konform" | `agentur/page.tsx:59` | neutral |

**Inconsistencies found:**
- The trust row and FAQ use impersonal / `Sie` phrasing while the form pages and website-check use `du`. Within `/kontakt` itself the register is consistent (`du` at `:47` and `:56`), but `agentur:26` is `Sie`. Mixed register across the funnel.
- **Currency format is inconsistent on the same page**: `"ab 1.900 EUR"` (`leistungen:10`) vs `"ab 1.400 EUR"` (`leistungen:11`) vs `"ab 490 EUR"` (`:12`) vs `"ab 59 EUR/Monat"` (`:15`).
- `website-check/page.tsx:132-134` mixes `u.&#8239;a.` (narrow no-break space) and `&#8239;` entities inconsistently with the `&#8230;` ellipsis used elsewhere in the same file (`:84`).

### 5.3 Marketing to conversion flow

Three entry points, all converging on `/kontakt`:

- Header `Projekt anfragen` (persistent, every public page)
- Hero `Website anfragen` (primary, `default`) + `Kostenloser Website Check` (secondary, `outline`)
- `agentur:118` `Anfrage senden`; `leistungen:47` `Angebot anfragen`; `portfolio:46` `Werden Sie Referenzprojekt.`
- `agentur:106` `Website pruefen` -> `/website-check`

`/website-check` is positioned as the **low-friction lead magnet**: `agentur:39` "Websites, die Kunden bringen", `agentur:101-102` "Pruefen Sie Ihre Website - automatisch. Ergebnis in Sekunden: Technik, Mobile, SEO, Ladezeit und Luecken.", `agentur:55` `Kostenloser Website Check`.

**The conversion is not instrumented.** `README.md:50` states `POST /api/website-check` *"persistiert in `public_checks`"*, but the result view ends with plain prose and **no link and no form** (`website-check/page.tsx:123-126`): *"Erste schnelle Analyse. Fuer eine vollstaendige Pruefung (Lighthouse, Accessibility, mobile Screenshots, Auswertung) kontaktier uns einfach."* The intent is captured in the DB and never surfaced back to the visitor or the sales team in the UI.

### 5.4 Dashboard shell + sidebar model

- **Fixed viewport:** `shell.tsx:19` `flex h-screen overflow-hidden`; content scrolls in `shell.tsx:33` `min-h-0 flex-1 overflow-y-auto p-4 md:p-6`.
- **Sidebar:** 256px, `bg-card/50`, `shadow-sidebar` (`1px 0 0 #30363d`), `hidden ... lg:flex` (`:42`) — so **below 1024px there is no sidebar at all**, and `GlobalSearch` becomes unreachable.
- **Sidebar header:** `min-h-[69px]`, logo plus the subtitle `Business System` in `text-[11px]` (`:46`).
- **Page header:** `min-h-[69px]`, `bg-card/50`, `<h1 className="truncate text-sm font-bold tracking-wide">` (`:25`) — the h1 is deliberately *small and bold*: in this dashboard the page title is a label, not a heading. Subtitle `text-[11px] text-muted-foreground` (`:26`). `actions` slot (`:28`), then `LogoutButton` pinned right (`:30`).
- **Nav:** 5 items. Active = **`bg-accent text-accent-foreground`** — a filled gold block (`:63`). Inactive = `text-muted-foreground hover:bg-muted hover:text-foreground` (`:64`). `aria-current="page"` (`:59`). `exact: true` only for `/dashboard` (`:31`).
- **Sidebar footer:** `OverseerOverlay` -> `SettingsOverlay` -> `Oeffentliche Website` outbound link (`:73-79`).
- **`crm/page.tsx:12` breaks the shell's padding contract** with `className="p-0 md:p-0"` — the only page that does, and it has to, because its detail panel is `fixed` (`crm-page-client:141`). That is a smell, not a solution.
- **No `dashboard/layout.tsx`** — every one of the 5 pages re-mounts `DashboardShell` with its own title/subtitle.

### 5.5 Global search

`global-search.tsx`, mounted in the sidebar at `dashboard-sidebar.tsx:50` with `compact`.
- Debounce 200ms (`:25`), minimum 2 characters (`:23`).
- Three result groups: `Unternehmen` / `Projekte` / `Anfragen` (`:70,82,95`).
- Placeholder: `"Suchen: Firma, Ort, Website, Projekt, Anfrage..."` (`:56`) — good, it states the scope.
- **Every result row uses the same `SearchIcon`** (`:74,86,99`), so grouping is carried by the section label alone.
- **Cross-page hand-off:** clicking a company does `router.push("/dashboard")` then `window.dispatchEvent(new CustomEvent("lutea:focus-company", { detail: { id: c.id } }))` (`:77`). **Nothing in the codebase listens for `lutea:focus-company`** — the deep link silently does nothing.
- Projects and Anfragen results just `router.push` the section (`:89,102`) **without selecting anything** — dead-end results.
- Empty state: `Nichts gefunden fuer "{q}".` (`:66`) — correct German quotation marks.
- No recent searches, no result count, no match highlighting, no keyboard navigation.

### 5.6 Form UX and validation

**`/kontakt`** (`kontakt/page.tsx`) — 6 fields:

| Field | Control | Constraints | Line |
|---|---|---|---|
| `Name` | `Input` | `required minLength={2}` | `:67` |
| `Unternehmen` | `Input` | — | `:71` |
| `E-Mail` | `Input type="email"` | `required` | `:74` |
| `Website (falls vorhanden)` | `Input` | `placeholder="https://..."` | `:79` |
| `Gewuenschte Leistung` | `Input list="lutea-services"` | `<datalist>` with 8 options (`:10-13`) | `:82-86` |
| `Nachricht` | `Textarea` | `required minLength={5}` | `:89` |

- **Uncontrolled** form: `Object.fromEntries(new FormData(f).entries())` (`:26`), `f.reset()` on success (`:34`).
- **Validation is HTML-only on the client** — `required`, `minLength`, `type`. `aria-invalid` is never set, and per-field errors are never surfaced.
- **Server validation** via zod (`api/contact/route.ts:6-15`) with German messages: `"Bitte gib deinen Namen an."`, `"Bitte gib eine gueltige E-Mail-Adresse an."`, `"Bitte beschreibe dein Anliegen."` — but only `parsed.error.issues[0]?.message` is returned (`route.ts:21`). The user sees **one** error for a **six**-field form, in a single banner.
- **Anti-spam, three layers** (`lib/anti-spam.ts`): honeypot field `website_url_confirm` (`:7`, checked at `:24-30` -> 400 `"Anfrage abgelehnt."`); `X-Requested-With` custom header (`:13`, checked at `:33-38` -> 403 `"Ungueltige Anfrage."`); minimum 3-second dwell time (`:10`, checked at `:41-46` -> 429 `"Bitte warte einen Moment."`).
- **Rate limits** in middleware (`middleware.ts:11-15`): `/api/contact` 10 per 10 min, `/api/website-check` 15 per 10 min, `/api/auth/login` 10 per 15 min, keyed by `` `${pathname}:${clientIp}` `` (`:47`) -> 429 `"Zu viele Versuche - bitte spaeter erneut probieren."`.
- The honeypot markup is **copy-pasted in both public forms** with a `left:-9999px` inline style (`kontakt:62-65`, `website-check:64-67`) and — importantly — a **different `id`** (`HONEYPOT_FIELD` vs `` `hc-${HONEYPOT_FIELD}` ``) while keeping the **same `name`**.
- **Success state** (`kontakt:50-58`): `CheckCircle2 size-10 text-accent` plus `<h2>Danke - Anfrage eingegangen.</h2>` plus *"Wir melden uns in der Regel innerhalb von 24 Stunden zur kurzen Ist-Stand-Analyse bei dir."* Good, honest, specific.
- **DSGVO note** (`:100-102`): *"Wir verarbeiten deine Angaben nur zur Bearbeitung der Anfrage (Datenminimierung, DSGVO)."* — but it is **not a link** to a privacy policy, and no such route exists (`auth.ts:153`).

**`/website-check`** (`website-check/page.tsx`) — **controlled** (the only controlled public form): a single `Input type="url"` with `value` / `onChange` (`:68-76`), forced to `h-10` via `className="h-10 flex-1"` (`:73`) to escape the kit's `h-8`. The paired `Button size="lg"` is `h-10` (`button.tsx:24`) — so a `size="lg"` *pairing* would have been correct, but the kit has no paired sizing API and the override is manual. `website-check:73` is the only `h-10` input in the app.
- Result rows (`:107-121`): `CheckCircle2 text-accent` / `XCircle text-destructive` plus `<div className="text-sm font-semibold">{c.label}</div>` plus a note. **Pass/fail is icon plus colour only, with no text equivalent** — contrast `auditor-client.tsx:164-166`, which does add `OK` / `PROBLEM`.
- `website-check:111` — `<CheckCircle2 className="..." data-ok />`. `data-ok` is not a real attribute and does nothing; presumably an abandoned test hook.
- Loading copy is honest: *"Die Website wird analysiert... das dauert bis zu 15 Sekunden."* (`:84`).
- Idle copy: *"Wir pruefen u. a. HTTPS, mobile Ansicht, Titel/Description, H1-Struktur, Social-Vorschau, Alt-Texte und Ladezeit - und zeigen das Ergebnis klar verstaendlich an."* (`:132-134`).

**`/login`** (`login-form.tsx`) — a single password, no username field (the user is fixed to `lutea`, `auth.ts:66`). Copy is good: *"Interner Bereich. Zugang Passwort aus `config\lutea-auth.secret.json`."* (`:48-50`). Error `<p>` (`:72`) has **no `role="alert"`**. The back-link uses a raw `<a href="/">` (`:74`) rather than `next/link`.

**Admin forms** — `projects-client.tsx:147-179` `ProjectCreateForm` (3 fields: `Kunde (Lead)` `<select required>`, `Projektname` `Input required minLength={3}`, `Notizen` `Textarea`) and `crm-page-client.tsx:213-309` `EmailDraftBlock` (`Betreff` `input`, `Nachricht` `Textarea`). Neither surfaces server errors per field.

### 5.7 Status / permission model

Two orthogonal systems, cleanly separated.

**CRM pipeline** — 8 states, `lib/status.ts:1-10`:

```
unprocessed -> no_website -> opportunity -> contacted -> conversation -> offer -> customer -> archived
```

Labels (`status.ts:14-23`): `Unbearbeitet` `Keine Website` `Opportunity` `Kontaktiert` `Gespraech` `Angebot` `Kunde` `Archiviert`.

- WARN **`opportunity` is untranslated** — every other label is German. Either translate it to `Chance` / `Interesse` / `Lead`, or rename the key so the inconsistency is explicit.
- `archived` is hidden from the filter row (`company-list.tsx:135` filters it out) but shown in the detail picker (`:323` maps all 8) — an inconsistency on the same screen.
- `gate-executor.ts:106` treats `["unprocessed","no_website","opportunity"]` as the not-yet-contacted set.

**Project lifecycle** — 9 states, **duplicated** in `projects-client.tsx:48-54` and `portal-client.tsx:7-11`:

```
request -> planning -> design -> development -> review -> approval -> live -> maintenance
(plus: cancelled)
```

-> `Anfrage` `Planung` `Design` `Entwicklung` `Review` `Freigabe` `Live` `Wartung` `Abgebrochen`.

- WARN `review` -> `Review` and `development` -> `Entwicklung` is a deliberate-looking German/English mix (industry terms), but it is duplicated in two files and will drift.

**Version states** — `version-manager-client.tsx:17-21`: `draft` -> `Entwurf` / `secondary`, `approved` -> `Freigegeben` / `default`, `rejected` -> `Abgelehnt` / `destructive`. Note the badge scale is borrowed: `approved` renders `variant="default"` = **gold**, and the CRM status `contacted` is *also* `#F2C012`. **Status colours are not a system** — they are recycled from the primary scale. `rejected` is declared but **no reject action exists** anywhere in the UI.

**RBAC — `lib/rbac.ts` + `lib/policy.ts`.** This is the most rigorously designed part of the codebase and should be preserved verbatim in any extraction.

- `PermissionLevel = 0|1|2|3|4`; `ApprovalState = "auto" | "waiting_human" | "approved" | "denied"` (`rbac.ts:10-11`).
- Tools are namespaced `verb.noun` strings: `HIGH_RISK_TOOLS` (`rbac.ts:27-34`) = `email.send`, `production.deploy`, `dns.change`, `domain.purchase`, `hosting.purchase`, `payment.execute`; `MED_RISK_TOOLS` (`:36`) = `website.build`, `website.edit`, `website.preview`, `website.qa`.
- **Risk is derived, not stored** — `calculateRiskLevel` (`:38-48`) returns 4 for any `HIGH_RISK_TOOL`, 2 for any `MED_RISK_TOOL`, 3 or 4 for `data.delete` depending on whether an integer `id` is present, else 1. Effective level is `Math.max(perm.level, risk)` (`:66`).
- `requiresHuman = perm.requires_human === 1 || level >= 3` (`:67`).
- **No bypass for owner** — explicitly documented at `rbac.ts:4`: *"Kein Bypass: jede Rolle (inkl. owner) wird gegen die DB-Matrix geprueft."* Every role is checked against the `roles` / `permissions` / `role_permissions` DB tables (`:81-88`).
- `PermissionResult` (`:19-25`) returns `allowed`, `hasPermission`, `level`, `requiresHuman`, `reason` — a rich, self-describing result, and the `reason` strings are German: `"Tool '...' nicht bekannt."`, `"Ungueltige Ressourcen-ID."`, `"Rolle '...' hat keine Berechtigung fuer '...'."`, `"Aktion '...' erfordert Human Approval (Level ...)."`.
- **`policy.ts:26-36` `NEVER_SELF_APPROVE` is the standout design.** Nine irreversible actions (`email.send`, `production.deploy`, `dns.change`, `hosting.purchase`, `domain.purchase`, `payment.execute`, `data.delete`, `role.change`, `system.kill`) that **stay `PENDING` even when the owner themself triggered the request**. The rationale is documented in a 5-line comment (`policy.ts:16-25`): *"ein Gate, das sich im selben Request selbst genehmigt, ist eine UI-Illusion. Im Audit-Log waeren `gate_created` und `approved` nicht unterscheidbar, und die Freigabe waere nicht als eigener menschlicher Akt nachweisbar."* This is correct and should not be simplified.
- `policy.ts:80-92` `currentIdentity()` **re-verifies** the session / service token rather than trusting the `x-lutea-role` header the middleware set — *"Header des Middleware sind nicht vertrauenswuerdig"* (`:79`).
- Audit is written on **every** branch: `denied` (`:133`), `allowed` (`:144`), `gate_requested` (`:171`), `human_approved` (`:182`), each with `approvalState` and `policyDecision`.
- Kill-switch and pause are checked for service-token calls only (`policy.ts:105-110`).
- `PolicyError(status, code, message)` with codes `unauthenticated` / `forbidden` / `automation_stopped` (`policy.ts:38-47, 89, 108, 140`), surfaced by `policyErrorResponse` (`:192`).

**Gap:** RBAC governs **tool invocations** only. There is **no role check on any page** and **no role check on ordinary CRUD**. `middleware.ts` grants *any* valid session full access to every `/dashboard/*` route and every internal API. `LUTEA_AUTH_ROLE` (`auth.ts:85`) can be set to anything; `rbac.checkPermission` will then deny everything for an unknown role (`rbac.ts:61-63`) — so a misconfigured role silently locks the operator out of mutating actions, with no UI to explain why.

### 5.8 Error handling

- **Public forms:** a single field-less error banner plus a `catch` fallback `"Netzwerkfehler. Ist der Server erreichbar?"` (both `kontakt:37`, `website-check:50`). Honest and human — **keep the copy**.
- **Dashboard — two strategies coexist:**
  - *Correct:* `company-list` and `overseer-dashboard` have `error` state **and a retry button** — `Erneut laden` (`company-list:161`, `overseer-dashboard:163-165`). `company-list:58` also uses a specific message: *"Unternehmen konnten nicht geladen werden."*
  - *Broken:* `crm-page-client` has **no** `error` state. `load()` (`:26-33`) and `openDetail()` (`:40-46`) have no `try` / `catch` and no `res.ok` check. A failed `/api/companies` renders a permanently empty table with the message *"Keine Leads gefunden."* (`:89`).
- **Toast on failure:** `company-list:82` `Status nicht geaendert` / *"Bitte erneut versuchen."*; `company-list:102` `Audit fehlgeschlagen`; `overseer-dashboard:96` `Aktion konnte nicht ausgefuehrt werden.`; `overseer-dashboard:119` `Freigabe konnte nicht gespeichert werden.`
- `auditor-client:47` `json.error ?? "Analyse fehlgeschlagen."`.
- **Server:** `PolicyError` -> `{ok:false, error, code}`. zod -> `issues[0].message`. A consistent `{ok, error}` envelope across all 25 route files.

### 5.9 Loading states

- **No skeleton anywhere**, despite `kit/skeleton.tsx` existing. 13 hand-rolled `<Loader2 className="animate-spin"/>` plus prose.
- The only `animate-pulse` is the search busy dot (`global-search.tsx:60`).
- **In-button loading is the house convention and is well executed** — `disabled={busy}` plus a spinner swap plus a label change, consistently:
  - `busy ? "Analysiere ..." : "Website analysieren"` (`company-list:343`)
  - `busy ? "Wird gesendet..." : "Anfrage senden"` (`kontakt:98`)
  - `busy ? "AI analysiert und formuliert..." : "Entwurf erstellen"` (`crm-page-client:274`)
  - `saving ? ... : "Speichern"` (`version-manager:169`)
  - `busy ? "Geocoding laeuft..." : "Adressen verschaerfen"` (`settings-panel:253`)
  - `busy ? "Backup wird erstellt..." : "Jetzt Backup erstellen"` (`settings-panel:287`)
- **Whole-panel loading** via early return: `settings-panel.tsx:28-30`; `overseer-dashboard.tsx:155-157`; `version-manager-client.tsx:140-142`. In all three the early return sits **after** all hooks, so it is safe — but interleaving an early return with a function declaration is fragile and will break the moment a hook is added below it.
- **GlobalSearch** has a proper `busy` state but only a visual pulse (`:60`) — no `aria-live`.

### 5.10 Empty states

See 4.7 for the full list. **Content quality is good where it was written:**

| String | File |
|---|---|
| "Noch keine Projekte. Lege ein Projekt aus einem Lead im CRM an." | `projects-client:104` |
| "Waehle ein Projekt aus, um seine Website-Versionen anzuzeigen." | `version-manager:294` |
| "Noch keine Versionen fuer dieses Projekt. Erstelle die erste Version." | `version-manager:300` |
| "Noch keine Leads mit Website." | `auditor-client:83` |
| "Keine Freigaben offen." | `overseer-dashboard:277` |
| "Noch keine Kontaktversuche." | `crm-page-client:189` |
| "Keine Unternehmen gefunden." plus a reset link | `company-list:166-168` |
| "Unternehmen auswaehlen" | `company-list:217` |
| "Die ersten referenzierten Projekte entstehen in den kommenden Wochen..." | `portfolio:23-25` |

`portfolio/page.tsx:21-48` is the best of them — an empty state that **teaches the process** while being honest that it is empty. `company-list.tsx:215-218` is the worst: an icon plus one word, with no affordance.

### 5.11 Destructive confirmations

**Exactly one confirmation exists in the entire application**, and it is bespoke:

- `settings-panel.tsx:335-345` — a two-step inline confirm for `Alle Kontaktanfragen loeschen...` -> `Wirklich alle loeschen` (`variant="destructive"`) plus `Nein` (`variant="ghost"`), driven by `confirmDelete` state (`:312`).

**Irreversible actions with NO confirmation:**

| Action | File | Severity |
|---|---|---|
| `Standardwerte` — `DELETE /api/config`, resets all configuration | `settings-panel:145-149` | **high** — one click destroys region, crawl limits, score weights, categories |
| `Kill-Switch aktivieren` — `variant="destructive"` | `overseer-dashboard:216-224` | **high** — stops all automation |
| `Freigeben` on a pending human gate | `overseer-dashboard:298-304` | **medium** — `policy.ts:26-36` treats this as a deliberate human act that must be independently auditable |
| `Jetzt Backup erstellen` | `settings-panel:285-288` | low |

**And the correct primitive is already built and unused:** `kit/confirm-dialog.tsx`, whose own docstring (`:17-19`) reads *"Setzt `window.confirm` durch ein Design-System-Dialog ersetzt - destruktive Aktionen (Loeschen, Freigaben) bleiben dadurch im Design und auditierbar."* It offers a `destructive` variant, a promise-based `useConfirm()` hook (`:82-108`), `whitespace-pre-line` descriptions for multi-line warnings (`:50`), and German default labels `Bestaetigen` / `Abbrechen`. **Nothing uses it, and the two-step inline hack at `settings-panel:335-345` is strictly worse.**

### 5.12 Responsive strategy

- **Public:** `md:` (768px) is the only breakpoint that matters — nav toggle (`public-header:24`), grids (`agentur:73,82`, `leistungen:26`). Below `md` the site is single-column and **navigationally incomplete**.
- **Dashboard:** `lg:` (1024px) is the hard switch — sidebar in (`:42`), desktop header in (`shell:23`), mobile header out (`:88`).
- **Below `lg`:** `CompanyList` becomes a master-to-detail stack (`company-list:113-116` hides the list when `selected`, `:206` shows the detail; the `Zurueck zur Liste` button at `:280-282`); `auditor-client` and `crm` go single-column; `overseer-dashboard:263` `sm:grid-cols-2 xl:grid-cols-4`; `dashboard-sidebar:104` `w-[min(88vw,20rem)]` for the mobile drawer.
- **Column hiding instead of scrolling:** `crm-page-client:97-100,111,114,124` hide Kategorie / Website / Score with `hidden md:table-cell` / `hidden lg:table-cell`. `version-manager:312-313` truncates with `truncate max-w-80` / `max-w-64`. **No `overflow-x-auto` table wrapper exists.**
- **Bug:** `GlobalSearch` lives inside the `hidden lg:flex` sidebar (`dashboard-sidebar:42,50`) and is **not** repeated in `DashboardMobileHeader` (`:84-131`). Below 1024px, global search is unavailable.
- **Viewport heights:** `h-screen` in `shell:19`, `h-dvh` in `dashboard-sidebar:104` and `overseer-overlay:34`, and hardcoded `calc(100vh - 180px)` / `calc(100vh - 220px)` inline styles in `version-manager:146,220,245`. Mixing `h-screen` and `h-dvh` in the same shell guarantees a mismatch on mobile browsers with a dynamic toolbar.

### 5.13 Table UX

One table in the app, `crm-page-client.tsx:93-130`, on the kit's `Table`:

- Header `text-[11px] uppercase tracking-wider text-muted-foreground` (`table.tsx:36`); 5 columns, 3 of them responsive-hidden.
- Rows: `hover:bg-muted/50` plus `data-[state=selected]:bg-muted` (`table.tsx:26`) — but `data-state` is **never set**, so the selection style is dead. Selection is instead signalled by a `fixed` right panel (`:141`) and a `Loader2` chip at `fixed bottom-4 right-4` (`:136-138`) that overlaps the panel's own corner.
- `<TableRow onClick>` (`:108`) — not keyboard reachable, no `tabIndex`, no `role="button"`.
- Status cell uses `CrmStatusBadge` (`:122`) — the only read-only status badge usage in the app.
- `Keine Website` renders as `FEHLT` in `text-destructive text-xs font-semibold` (`:118`) — a **fourth** status visual language.
- The score cell is `font-mono text-xs` with `?? "-"` (`:124-126`) — **no colour at all**, unlike every other score rendering.
- No sorting, no pagination, no row selection, no bulk actions, no column resize, no sticky header. Row count as `"{n} Datensaetze"` (`:84`).
- Row click -> `openDetail(id)` fetches `/api/companies/${id}` and swaps the whole panel.
- `company-list.tsx` and `projects-client.tsx` both reimplement tabular-ish lists as `<button>` / `<div>` stacks rather than using `Table`.

### 5.14 Customer portal

`/portal?token=...` — the only genuinely customer-facing surface, and it lives in `components/dashboard/` (`portal-client.tsx`) while using no dashboard chrome.

Three states: `loading` / `invalid` / `ready`. The `invalid` copy is good (`:49-51`): *"Zugangs-Link ungueltig oder abgelaufen. Bitte die aktuelle Portallink-Nachricht von LUTEA DESIGN zum oeffnen benutzen - Tokens lassen sich regenerieren."* — though `PortalLink` (`:50`) should be `Portal-Link`. The `ready` state shows the project name, the client, a `border-l-2 border-accent` note block (`:71`), a status `Badge` (`:62`), and a footer with `hallo@lutea.design` (`:77`). Portal links are generated per project by `PortalRow` in `projects-client.tsx:9-36`, which displays the raw `/portal?token=...` URL in a `code` element with **no copy-to-clipboard button**.

---

## 6. Accessibility audit

### 6.1 Good practices — preserve these

| Practice | Where |
|---|---|
| `<html lang="de">` | `layout.tsx:21` |
| Real `<h1>` on every public page | `public-page-header.tsx:10`, `agentur:43`, `login-form.tsx:46`, `portal-client.tsx:47` |
| Real `<h1>` in the dashboard shell | `shell.tsx:25` |
| Real `<main>` landmarks | `shell.tsx:21`, `(public)/layout.tsx:8` |
| `aria-current="page"` on the active nav item | `dashboard-sidebar.tsx:59` |
| `aria-label` on both `<nav>` elements | `dashboard-sidebar.tsx:52, 109` |
| **Correct** label association (the only instance) | `login-form.tsx:53` `htmlFor="password"` matched by `:57` `id="password"` |
| `aria-label` on icon-only buttons | `dashboard-sidebar.tsx:100`, `crm-page-client.tsx:149`, `kit/dialog.tsx:45`, `kit/toast.tsx:44` |
| `aria-pressed` on all toggle buttons | `company-list.tsx:177, 245, 327`; `settings-panel.tsx:223` |
| `aria-labelledby` on landmark `<section>`s | `overseer-dashboard.tsx:227, 270` (with matching `<h3>`) |
| `aria-hidden` on decorative layers | `page.tsx:6`, `agentur:36`, `kontakt:62`, `website-check:64` |
| `aria-invalid` styling on `Input` | `input.tsx:9` |
| Visible focus rings | `button.tsx:7`, `input.tsx:9,23`, `switch.tsx:17`, `tabs.tsx:33` |
| Status not conveyed by colour alone | `crm-status-badge.tsx:51-52` (dot **and** text label); `auditor-client.tsx:164-166` (`OK` / `PROBLEM` text) |
| `target="_blank" rel="noreferrer"` | `company-list:297`, `auditor-client:130` |
| `title` on all four `<iframe>`s | `version-manager:193, 222, 249, 257` |
| Retry affordance on failure | `company-list:161`, `overseer-dashboard:163-165` |
| `autoComplete="current-password"` | `login-form.tsx:60` |
| `autoFocus` on the only field | `login-form.tsx:61` |
| Native `<details>` / `<summary>` FAQ (keyboard-accessible, no JS) | `agentur:133-138` |
| Honeypot `tabIndex={-1}` + `autoComplete="off"` | `kontakt:64`, `website-check:66` |
| Open-redirect guard | `login-form.tsx:8-11` |
| `sandbox` on all user-HTML iframes | `version-manager:192, 221, 249, 257` |
| `disabled` on every in-flight button | `company-list:341`, `crm-page-client:272,292`, `projects-client:26`, `settings-panel:141,251,285`, `overseer-dashboard:194,201,210,219,234,242,250,293,300` |
| `alt` on the one raw `<img>` | `auditor-client.tsx:134` |
| Correct German quotation marks in the empty state | `global-search.tsx:66` |

### 6.2 Gaps

#### Labels not associated with controls — 11 instances

`<label>` with neither `htmlFor` nor a nested control:

| Location | Affected controls |
|---|---|
| `settings-panel.tsx:210` (`LabeledInput`) | **every text/number input in the settings dialog** |
| `settings-panel.tsx:219` (`Toggle`) | the `robots.txt respektieren` toggle |
| `projects-client.tsx:160` | `<select name="companyId">` (`:161`) |
| `projects-client.tsx:166` | `Input name="name"` (`:167`) |
| `projects-client.tsx:170` | `Textarea name="notes"` (`:171`) |
| `kontakt/page.tsx:113` (`Field`) | all 6 fields (`:67,71,74,79,82,89`) |

**`settings-panel.tsx` is the worst case in the repository:** the `<label>` is unassociated, the `Input` has no `aria-label`, and the `Toggle` is a `<button aria-pressed>` with no name — so **every control in the settings dialog is completely unnamed for assistive technology**, across 12 fields (`:56-115`).

**`kontakt/page.tsx` is a subtle variant:** the visible `<label>` (`:113`) is unassociated, and the 6 controls are named by a *parallel* `aria-label` (`:67, 71, 74, 79, 82, 89`). Two consequences: (a) clicking the visible label text does **not** focus the input, and (b) the accessible name and the visible label happen to match only by manual discipline, so they will drift.

**Fix:** `kit/label.tsx` already exists and is unused. One `Field` component (see 4.15) fixes all 11.

#### Accessible name on a `div` — not exposed

`company-list.tsx:133` — `aria-label="Statusfilter"` on a plain `<div className="flex gap-1.5 overflow-x-auto pb-1">`. Without a `role` (for example `role="group"`), `aria-label` on a generic element is not reliably exposed. Use `<fieldset><legend className="sr-only">` or `role="group"`.

#### `aria-label` on a bare `<svg>`

`company-list.tsx:197` — `<Globe className="size-3 text-accent" aria-label="Website vorhanden" />`. An `<svg>` without `role="img"` is not reliably announced, and the icon is decorative (the domain is already implied by the row). Use `<span className="sr-only">` or `aria-hidden` plus adjacent text.

#### No live regions anywhere — zero `aria-live` / `role="status"` in the repository

This is the most systemic a11y gap. Consequences:

- **Toasts are entirely invisible to screen readers.** `toaster.tsx:15-33` renders a plain `createPortal` div with no `aria-live`, no `role="status"`, no `role="alert"`. Every *"Status geaendert"*, *"Audit gestartet"*, *"Freigegeben"*, *"Abgelehnt"*, *"Aktion ausgefuehrt"* is **silent**.
- Error banners — silent in 7 of 9: `kontakt:92`, `website-check:88`, `auditor-client:97`, `finder-client:84`, `settings-panel:152`, `login-form:72`, `overseer-dashboard:161`. Only `company-list:159` and `overseer-dashboard:175` have `role="alert"`.
- Inline errors — silent: `crm-page-client:189, 234, 255`; `settings-panel:256, 290, 348`.
- Loading states — no `aria-busy` anywhere: `portal-client:38-42`, `overseer-dashboard:155-157`, `settings-panel:28-30`, `version-manager:140-142`.
- The `GlobalSearch` busy indicator (`global-search.tsx:60`) is a bare `<span className="size-3 shrink-0 animate-pulse rounded-full bg-accent/60"/>` with no text.
- The `kontakt` success panel (`kontakt:50-58`) is not announced on transition.

#### Focus invisible on two interactive elements

- `kit/dialog.tsx:44` — the `DialogPrimitive.Close` sets `focus:outline-none` and provides **no replacement ring**. Keyboard users get no focus indicator on the dialog close button.
- `kit/toast.tsx:46` — `ToastClose` sets `focus:outline-none` and relies on `focus:opacity-100` to reveal a `text-foreground/50` icon. No ring, and the element starts at `opacity-0`.

#### Combobox not implemented — `global-search.tsx`

The input (`:51-59`) has `aria-label="Globale Suche"` but **no** `role="combobox"`, `aria-expanded`, `aria-controls`, `aria-autocomplete`, or `aria-activedescendant`. Results (`:130-137`) are bare `<button>`s inside a `<div>` — no `role="listbox"`, no `role="option"`, no `aria-selected`. No arrow-key navigation, no Enter-to-select, no Home/End. Escape only calls `setFocused(false)` (`:55`) without moving focus. **The feature is unusable without a mouse.**

#### Table not keyboard operable — `crm-page-client.tsx:108`

`onClick` on `<TableRow>`. A `<tr>` is not focusable, has no `role="button"`, no `tabIndex`, and no key handler. The entire company detail panel — including the status setter, the `Website analysieren` action, and the contact links — is **mouse-only**.

#### Heading-order breaks

- `shell.tsx:23` — the `<h1>` is inside `hidden ... lg:flex`. **Below 1024px the dashboard has no `h1` at all**, and `DashboardMobileHeader` renders the title as a `<div className="text-xs font-semibold">` (`:92-93`).
- `projects-client.tsx:111` — project names are `<span className="font-semibold">`. After the shell `h1`, the projects page has **no `<h2>` at all**.
- `crm-page-client.tsx:144` — the company name is a `<div className="text-base font-semibold">`. Same problem.
- `portal-client.tsx:47` `<h1>` in the `invalid` state vs `:65` `<h2>` with no `h1` in the `ready` state — the heading structure changes with the data state.
- `version-manager-client.tsx` — version rows use `<span>` (`:308`); panel titles use `<span className="text-sm font-semibold">` (`:151, 208, 241`).
- `auditor-client.tsx:104-105` — the audit result header is a `<div className="text-lg font-semibold">`, not a heading.

Good news: the public pages get this right — `PublicPageHeader` emits `<h1>`, `SectionTitle` emits `<h2>` (`agentur:151`), and the FAQ emits `<h2>` (`:129`).

#### Colour-only status

- `website-check/page.tsx:110-114` — pass/fail is `CheckCircle2` / `XCircle` plus colour, **no text equivalent**. The same information is rendered *correctly* with `OK` / `PROBLEM` in `auditor-client.tsx:164-166`. The two audit UIs disagree on accessibility.
- `auditor-client.tsx:112-117` and `company-list.tsx:356` — the score band is colour-only (the number itself is shown, so this is acceptable), but the two thresholds disagree (see 4.12).
- `crm-page-client.tsx:118` — `FEHLT` in `text-destructive text-xs font-semibold`: uppercase, coloured, and with no explanatory text.

#### Reduced motion: zero `prefers-reduced-motion` blocks in the entire repository

Unguarded: 13 `animate-spin` loaders, `animate-pulse` (`global-search:60`, `skeleton:12`), and every `animate-in` / `animate-out` / `slide-in-from-*` / `zoom-in-95` on Radix `Dialog` / `Select` / `DropdownMenu` / `Tooltip` content. For a project whose own `/website-check` sells accessibility audits to paying customers (`website-check:124`), shipping zero reduced-motion support is an unfortunate inconsistency.

#### Contrast risks

| Location | Element | Assessment |
|---|---|---|
| `agentur/page.tsx:85` | `text-accent/40` process numerals `01`-`04` on `bg-card` | `#F2C012` at 40% over `#171A21` is roughly 2.2:1. **Fails AA (4.5:1).** These are step numbers, decorative, but they read as content. |
| `company-list.tsx:216` | `text-muted-foreground/40` `Building2` icon on `background` | roughly 2.4:1. Decorative, but it is the only content of the "select a company" empty state. |
| `company-list.tsx:254` | `text-[10px] opacity-60` on the `FilterChip` count | roughly 2.3:1 effective. **Fails AA.** |
| `kit/toast.tsx:46` | `text-foreground/50` close `X` on `bg-popover` | roughly 5.1:1, passes — but it also starts at `opacity-0`, so it is invisible until hover or focus. |
| `kit/crm-status-badge.tsx:48` | the **`archived`** badge: `#1A1D24` text on a `#1A1D241A` background over `#111318` | roughly **1.1:1 — effectively invisible.** The archived status cannot be read at all. |
| systemic | `text-[10px]` and `text-[11px]` in `text-muted-foreground` (`#9A968C` on `#111318`, roughly 5.9:1) | Passes AA numerically, but these are the **primary section labels** throughout the dashboard, rendered at 10-11px. Small text at the edge of the ratio in a dense admin tool is a real legibility problem even though it technically passes. |

#### Skip links: none

Zero matches. The dashboard sidebar is the first focusable content on every admin page, so a keyboard user must tab through the logo link, the search input, and 5 nav items before reaching the main content — on **every** navigation.

#### Scrollable regions not focusable

The overflow containers at `company-list.tsx:152`, `crm-page-client.tsx:153, 191`, `global-search.tsx:64`, `auditor-client.tsx:65`, `version-manager-client.tsx:245` are keyboard-unscrollable. `kit/scroll-area.tsx` would fix this and is unused.

#### Decorative `<img>`

`auditor-client.tsx:132-137` uses a raw `<img>` with `alt="Screenshot der Website"` — the alt is present, but there is no `width` / `height`, so it causes layout shift.

#### Honeypot handling — correct

`tabIndex={-1}` (`kontakt:64`, `website-check:66`) and `aria-hidden` (`:62`, `:64`) keep the honeypot out of the tab order and the a11y tree. This part is right.

---

## 7. Reuse classification

`REUSE` = into a general library as-is · `MERGE` = duplicate with the other TEA project · `EXTRACT` = logic out of a page · `ADAPT` = small change generalises it · `NEW` = nothing exists · `PROJECT-SPECIFIC` = must stay in LUTEA · `DO-NOT-BUILD` = deliberately excluded

### 7.1 `kit/*` (20 files)

| Component | Verdict | One-line justification |
|---|---|---|
| `Button` | **REUSE** | The only component in the repo with `data-slot`, a complete cva variant x size matrix, `asChild`, icon auto-sizing, and a real focus ring — this is the reference the others should be measured against. |
| `Badge` | **REUSE** | 5 variants, `rounded-none`, token colours, zero props to reconcile; needs only `data-slot` added. |
| `Card` + sub | **ADAPT** | Correct anatomy, but `p-6` defaults are wrong for an `h-8` / `text-[11px]` admin density and the 6 parts have no `data-slot`; add a `density` prop and slots, then it is reusable. |
| `Input` | **REUSE** | ForwardRef, `aria-invalid` handling, correct focus ring, `ComponentProps<"input">`; the kit's best form control. |
| `Textarea` | **ADAPT** | Add the missing `aria-invalid:*` from `Input`; otherwise identical. |
| `Label` | **REUSE** | Radix-backed, `peer-disabled` states, already LUTEA-conformant per its own header comment; it simply needs adopting. |
| `Separator` | **REUSE** | Verbatim MLHSM, `decorative` defaults to `true`, correct `bg-border`; adopt as-is. |
| `Skeleton` | **REUSE** | `data-slot` + `animate-pulse` + `rounded-none`; the missing `role="status"` belongs on the wrapper, not here. |
| `Switch` | **REUSE** | Radix-backed with a proper focus ring and `data-[state=checked]`; replaces a hand-rolled `<button aria-pressed>`. |
| `Select` family | **ADAPT** | Complete Radix select, but 4 Tailwind-v4 utilities in a v3 project (`select.tsx:72,85`) silently do nothing — fix the syntax, then reuse. |
| `DropdownMenu` family | **ADAPT** | Complete, but needs `"use client"` for its `Portal` and the broken indentation at `:70`; then a straight lift. |
| `Tabs` family | **REUSE** | Verbatim MLHSM, already `rounded-none` / accent-correct. |
| `Tooltip` family | **REUSE** | Verbatim MLHSM; adopt together with a `TooltipProvider` at the app shell. |
| `ScrollArea` | **ADAPT** | Radix scroll areas are the only keyboard-scrollable overflow in a11y terms, but the `bg-muted-foreground/40` thumb conflicts with the global `::-webkit-scrollbar` block in `globals.css:60-73` — pick one scrollbar strategy. |
| `Table` family | **ADAPT** | Add an `overflow-x-auto` plus optional sticky-header wrapper, a `TableCaption`, and `scope` on `TableHead`; also drop the no-op `cn("", className)` on `TableBody:20` and the dead `data-[state=selected]` on `TableRow:26`. |
| `Dialog` family | **ADAPT** | Radix gives correct focus management for free, but `DialogOverlay` / `DialogPortal` are needlessly public, the close button's `focus:outline-none` (`:44`) needs a ring, and the `8px` hard-shadow should be a token. |
| `ConfirmDialog` + `useConfirm` | **REUSE** | The promise-based `useConfirm` pattern is exactly what every destructive action in this repo hand-rolls; it is the highest-leverage un-adopted component in the codebase. |
| `Toast` family + `Toaster` | **ADAPT** | Must be rebuilt on `ToastPrimitives.ToastRoot` + `ToastViewport` with an `aria-live` region — as written, Radix is imported but inert and the animations never fire. |
| `CrmStatusBadge` | **PROJECT-SPECIFIC** | Binds to `lib/status.ts`'s 8 CRM states; reusable as *shape* but the colour table and labels are LUTEA's sales pipeline. Ship the shape as `StatusBadge`, keep the LUTEA mapping in the app. |
| `LuteaLogo` / `LuteaLogoSmall` | **PROJECT-SPECIFIC** | Hardcoded to `/lutea-design-logo.png` with `alt="LUTEA DESIGN"`; the *pattern* (a `Logo` with `full` / `compact` sizes) generalises, the asset does not. |
| The 10 MLHSM-origin files (`label`, `scroll-area`, `separator`, `skeleton`, `switch`, `select`, `tabs`, `tooltip`, `dropdown-menu`, `confirm-dialog`) | **MERGE** | All 10 are unused and all 10 carry `Herkunft: MLHSM-KIT (HomeServerManager)`; the shared library already exists as copy-paste, so the work is promotion, not authorship. Adopt the whole set in one decision. |

### 7.2 Composites

| Composite | Verdict | Justification |
|---|---|---|
| `EmptyState` (`stub-section.tsx`) | **ADAPT** | Already built, already correct (`h2` + hint + `cta`); add `icon?` / `action?` / `size` and replace 10 inline copies. |
| `StatCard` | **EXTRACT** | Two 90%-identical copies (`dashboard-client:115`, `overseer-dashboard:322`) plus the `alert` state; promote the superset to the kit. |
| `Score` | **EXTRACT** | Four renderings, two *different* threshold tables (`company-list:356` vs `auditor-client:114`); one component, one threshold source, one hex source. |
| `SearchInput` | **EXTRACT** | Three hand-rolled search boxes, two bypassing `kit/input.tsx`; the `global-search.tsx` version is canonical. |
| `Field` (label + control + error) | **NEW** | Five implementations, 11 unassociated `<label>`s; `kit/label.tsx` is the base and the missing `aria-describedby` wiring is the value. |
| `Alert` (error banner) | **NEW** | 9 verbatim class-string copies, 3 text colours, 2 of 9 with `role="alert"`; nothing exists. |
| `Eyebrow` / section micro-label | **NEW** | One class string, 20 occurrences — it is a *type token*, not a component. |
| `IconTile` | **EXTRACT** | 5 verbatim copies of `flex size-10 ... bg-accent text-accent-foreground`. |
| `Panel` (the real workhorse `border border-border bg-card p-N`) | **ADAPT** | This — not `Card` — is what 20 sites actually use; give `Card` a `density` so the two converge. |
| `Loading` | **NEW** | 13 hand-rolled spinners at 4 sizes, no `role="status"`; `kit/skeleton.tsx` is the raw material. |
| `SidebarAction` | **EXTRACT** | `overseer-overlay:20-31` and `settings-overlay:19-30` are verbatim duplicates of the same trigger. |
| `Drawer` | **EXTRACT** | The `left-0 top-0 h-dvh ... border-y-0 border-l-0 p-0` and `right-0 ... border-y-0 border-r-0 p-0` override strings appear 3x on top of `DialogContent`. |
| `DASHBOARD_NAV` | **EXTRACT** | Declared twice (`dashboard-sidebar:30-36`, `dashboard-nav:11-17`) with a **label conflict** (`"Unternehmen"` vs `"Uebersicht"`). |
| `SITE_NAV` | **EXTRACT** | `public-header:5-11` and `public-footer:4-29` overlap on all 5 routes. |
| `PROJECT_STATUS_LABELS` | **MERGE** | `projects-client:48-54` and `portal-client:7-11` are the same 9-state lifecycle; belongs in `lib/status.ts` next to `CRM_STATUSES`. |
| `MobileNav` | **ADAPT** | `DashboardMobileHeader` re-lists `NAV` and omits `aria-current` *and* `GlobalSearch`; fold into `DashboardSidebar` as a `<Drawer>` variant. |
| `ContactForm` honeypot block | **EXTRACT** | `kontakt:62-65` and `website-check:64-67` are the same inline-styled block with a *different* `id` and the same `name`. |
| `dashboard/layout.tsx` | **EXTRACT** | 5 pages re-mount `DashboardShell`; a layout makes title/subtitle declarative. |
| `NAV_ITEM` (public) | **NEW** | 5 copies; only the sidebar version has `aria-current`. |

### 7.3 Feature-level

| Item | Verdict | Justification |
|---|---|---|
| `PublicHeader` / `PublicFooter` / `PublicPageHeader` | **ADAPT** | Correct anatomy and the only real `Public UI` layer — needs a mobile nav, a `nav` label, real `/impressum` + `/datenschutz` routes, and a `SITE_NAV` data source. |
| `ServiceCard` (`agentur:156`) | **EXTRACT** | `leistungen:28-40` is the same card with a `price` line; extract once, drive from one array. |
| `SectionTitle` (`agentur:147`) | **MERGE** | Same kicker + `h2` shape as `PublicPageHeader`; merge into one `PageHeader` with `level` and `kicker`. |
| `FinderClient` | **PROJECT-SPECIFIC** | Overpass / OSM lead import — no analogue in the other TEA project; keep, but its category list is duplicated in `overseer-dashboard:233`. |
| `OverseerDashboard` | **PROJECT-SPECIFIC** | Kill-switch plus a human-gate queue; the *pattern* (gate queue + control bar) generalises, the policy does not. |
| `VersionManagerClient` | **PROJECT-SPECIFIC** | `srcdoc` HTML versioning with side-by-side compare; keep in LUTEA, but extract `VersionCompare` and move `TEMPLATES` server-side. |
| `PortalClient` | **PROJECT-SPECIFIC** | Token-gated customer view; conceptually public, physically in `components/dashboard/`. |
| `CompanyList`, `CrmPageClient`, `AuditorClient`, `ProjectsClient` | **PROJECT-SPECIFIC** | Business logic; their *primitives* (list, filter row, detail panel, master-detail) are the reusable part. |
| `GlobalSearch` | **ADAPT** | The cross-component `CustomEvent("lutea:focus-company")` bus (`:77`) must go — deep-link via a query param instead, then add combobox semantics. |
| `LoginForm` | **REUSE** | `safeNext()` + `autoComplete` + the one correct `htmlFor` / `id` pair make this the reusable auth-form shape. |
| `LogoutButton` | **REUSE** | 25 lines, correct label, no state to reconcile; swap `location.href` for `router.refresh()`. |
| `DashboardClient` | **DO-NOT-BUILD** | Dead, unused imports, nested `<Link>` -> `<Card>` -> `<Button>`; the route it would have backed (a `/dashboard` "Uebersicht") does not exist. |
| `DashboardNav` | **DO-NOT-BUILD** | Dead, strictly weaker than `DashboardSidebar`'s copy, and carries a stale label. |
| `StubSection` (as named) | **ADAPT** | Not DO-NOT-BUILD — it is the correct `EmptyState`, just un-adopted and under-featured. |
| `scoreWeights` config UI | **DO-NOT-BUILD** | `settings-panel:106-115` writes weights that `score.ts:22-49` hardcodes — either wire the scorer to the config or delete the UI. Currently it is a control that lies. |
| Map (README:63 claims MapLibre) | **DO-NOT-BUILD** | `maplibre-gl` is not in `package.json` and not installed; the doc claim is aspirational. |

---

## 8. Public-vs-Admin distinction

### 8.1 What actually makes them structurally different (not just colour)

1. **Route topology.** Public = a `(public)` route group with one shared `layout.tsx` (`(public)/layout.tsx:4-11`): `PublicHeader` / `<main className="flex-1">` / `PublicFooter`, `min-h-screen flex-col`. Admin = **five sibling routes with no `layout.tsx`**, each re-mounting `DashboardShell` itself. The public side is compositional; the admin side is copy-pasted.
2. **Rendering model.** Public: 3 of 5 pages are React Server Components rendering module-level consts (`agentur`, `leistungen`, `portfolio`) — content is zero-JS. Admin: 100% client-rendered. Every dashboard route is a server component whose only job is `<DashboardShell><SomeClient/></DashboardShell>`, and all data arrives via `useEffect` + `fetch`.
3. **Layout physics.** Public flows (`min-h-screen`, natural document scroll, footer at the bottom). Admin is a fixed viewport: `h-screen overflow-hidden` (`shell:19`) with internal scroll containers, a `min-h-[69px]` header, and a 256px persistent sidebar. Different layout primitives, not a restyle.
4. **Component library.** Public uses `Button`, `Card`, `Input`, `PublicPageHeader` and **nothing else** — no `Table`, no `Dialog`, no `Toast`. Admin uses the full kit. The public site's own vocabulary (`SectionTitle`, `ServiceCard`, eyebrow badge, trust row, FAQ accordion) exists **nowhere else** in the app.
5. **Auth boundary.** Public is unauthenticated per `auth.ts:153-166` (allow-listed pages + 4 allow-listed API routes). Admin is behind `middleware.ts` HMAC cookie auth with Node runtime (`middleware.ts:9`).
6. **Navigation.** Public: 5 top-level marketing routes, no nesting, CTAs to `/kontakt`. Admin: 5 flat `/dashboard/*` routes + 2 sidebar overlays + logout + an outbound link to `/agentur`.
7. **Data shape.** Public content is literal arrays in the page file. Admin content is `fetch("/api/...")` with `{ok, error}` envelopes, local `type` declarations, and optimistic local state patching (`company-list:78-79`).
8. **Breakpoint semantics.** Public switches at `md` (768). Admin switches at `lg` (1024). The two layouts are not responsive variants of each other; they are two different layouts.

**What is *not* structurally different:** both consume the same `Button` / `Card` / `Input` with identical dark styling, both use `border-border` / `bg-card` surfaces, and the public site has **no light mode, no typography scale of its own, and no marketing tokens**. The distinction is structural in layout and data, cosmetic in visual language.

### 8.2 Which public components form a genuine `Public UI` layer

**Reusable as `Public UI` (generalise, don't rewrite):**

- `PublicPageHeader` -> the base `PageHeader`. Add `kicker`, `level`, `align`, and a `breadcrumb` slot. It is the only correct public `h1` in the app.
- `PublicHeader` -> needs a mobile nav (a `Drawer` like `DashboardMobileHeader`), `aria-label` on `<nav>`, and `SITE_NAV` from data. The sticky `bg-background/90 backdrop-blur` treatment is a good, reusable idea.
- `PublicFooter` -> needs `<nav aria-label>` on the link groups, real `mailto:` for the email, and **real `/impressum` + `/datenschutz` routes** — the current plain-text `Impressum · Datenschutz` (`public-footer.tsx:62`) is a legal gap, not just an a11y one.

**Marketing-specific (keep in a `marketing/` layer, do not generalise):**

- `SectionTitle` (`agentur:147`) -> merge into `PageHeader`, then it stops being marketing-specific.
- `ServiceCard` (`agentur:156`) -> extract; it is really a `FeatureCard` with an optional `price`, usable by `/leistungen` and any future landing page.
- Hero (`agentur:35-68`) — eyebrow badge, split `h1` with `text-accent` on the first word, dual `size="xl"` CTA, 4-item trust row. This is the brand's highest-value asset and it is **100% bespoke markup** with no reusable slot. Extract a `<Hero>` with `eyebrow` / `title` / `accentWord` / `lead` / `primaryCta` / `secondaryCta` / `trust[]`.
- Process steps (`agentur:84-88`) — numbered `font-display text-3xl text-accent/40` cards. Reusable as `<Steps>`, but the `/40` opacity fails contrast (see 6.2).
- FAQ accordion (`agentur:133-138`) — native `<details>` / `<summary>`. Reusable, and correctly has no JS dependency. But `group-open:text-accent` needs a visible affordance: the default marker is suppressed by `list-none`, so a `+` / `-` indicator is missing.
- `portfolio/page.tsx:21-48` — the "empty portfolio that teaches the process" pattern is worth naming (`<ProofPoint>` / `<CaseStudyTeaser>`: `problem` / `solution` / `result`).

**Should NOT be built at all in the shared library:**

- **A second, lighter marketing theme.** The public site is dark-only and shares the admin's exact palette. If the shared system ever needs a light mode, the *public* site is the only surface that should get it — but that is a product decision, not a component. Do not abstract a "marketing theme" until one exists.
- **A generic CMS-driven section renderer.** All 5 public pages are literal arrays in one file each. That is a feature at this size, not a limitation. A section-registry abstraction would be pure overhead.
- **An animation / motion library.** The public site has zero JS animation; `ScrollReveal` / `Parallax` are the classic "abstract for the sake of it", and the current no-JS FAQ is the better answer.
- **A second `Button` / `Card` for marketing.** The single kit `Button` with `size="xl"` (`button.tsx:25`) already serves the hero correctly.
- **A responsive-nav component before the current one is fixed.** Do not generalise `PublicHeader`'s nav until it has a mobile variant — otherwise the abstraction encodes the bug.

---

## 9. API conventions worth standardising

### 9.1 Observed conventions (mostly good)

| Concern | Current convention | Where | Verdict |
|---|---|---|---|
| Handler names | `export async function GET/POST/PUT/PATCH/DELETE(req: NextRequest \| Request)` | all 25 route files | KEEP |
| Success envelope | `{ ok: true, ...payload }` | 25 files, e.g. `api/contact:34` | KEEP |
| Error envelope | `{ ok: false, error: string }`, plus `code` from `PolicyError` | `policy.ts:195`, `middleware.ts:49,58` | KEEP; make `code` mandatory |
| List payload key | `json.companies` / `json.projects` / `json.versions` — plural of the entity | `company-list:56`, `projects-client:56`, `version-manager:63` | KEEP |
| Client fetch | `fetch(url)` then `const json = await res.json()` then `if (!res.ok \|\| !json.ok) throw` | `company-list:54-55`, `crm-page-client:31`, `auditor-client:46` | STANDARDISE — `company-list` checks both, `crm-page-client` checks only `json.ok` |
| Mutation verb | `PATCH` for status/score updates, `POST` for creates, `PUT` for full config replace, `DELETE` for resets | `company-list:71` PATCH, `settings-panel:35` PUT, `:146` DELETE | KEEP — genuinely well chosen |
| Class merging | `cn(...)` = `twMerge(clsx(...))` | `lib/utils.ts:4` | KEEP — the single most consistent thing in the repo |
| Variant prop name | `variant` in `Button` / `Badge` / `Toast`; **`tone`** in `CrmStatusBadge:29`; `size` in `Button` and `IconTile`-alikes | — | STANDARDISE on `variant`; retire `tone` |
| Variant values | `default` `secondary` `destructive` `outline` `link` `ghost` `sm` `lg` `xl` `icon` `iconSm` `muted` `success` `solid` | `button.tsx:11-28`, `badge.tsx:10-15`, `toast.tsx:25-27`, `crm-status-badge.tsx:15-16` | STANDARDISE — `muted` and `success` are one-off; `solid` collides with a colour concept |
| `data-slot` | present on `Button` and `Card` only; `Skeleton` has it; the other 17 do not | `button.tsx:49`, `card.tsx:7`, `skeleton.tsx:11` | STANDARDISE — emit on every kit root and sub-component |
| Ref forwarding | `React.forwardRef` in 11 of 20 kit files; **absent** in `Badge`, `Card` (x6), `CrmStatusBadge`, `TableHeader/Body/Row/Head/Cell`, `Toast` (x3) | see 3.1 | STANDARDISE — forward on every kit primitive |
| Display name | mixed: `X.displayName = "X"` (input.tsx, table.tsx), `X.displayName = Primitive.displayName` (label, switch, select, separator, scroll-area, tabs, tooltip), and no `displayName` at all on the `Card` family, `Badge`, `toast` family, `confirm-dialog` | — | STANDARDISE on the primitive form for wrapped, the literal for custom |
| `ComponentProps<"input">` vs `React.HTMLAttributes<HTMLDivElement>` | both styles present in the same file | `input.tsx:4` vs `badge.tsx:25` | STANDARDISE — the intrinsic-element form is newer and stricter |
| Server / client split | 20 of 39 component files are `"use client"`, and **only 3 of them need to be**: `dialog`, `toast`, `toaster`, plus the 17 Radix-backed kit files. `public/*` and most `kit/*` are server-safe. | see 10.1 | STANDARDISE — `"use client"` only where an event handler, hook, or portal is present |
| Page-level data fetching | 100% client `useEffect` + `fetch`; zero `await` of a data source in a page or layout | all 19 dashboard components | ADOPT RSC for first paint; the current model has no server-rendered dashboard content at all |
| Types | `Company` is imported from `@/db/database` in `crm-page-client:4` and `auditor-client:4`, but **re-declared locally** in `company-list:27-37`, `projects-client:42-46`, `portal-client:15-19` | — | STANDARDISE — one shared `types.ts`; the local `Company` has 10 of 16 fields |
| `as any` casts | `crm-page-client:122` `status={c.crm_status as any}` | — | ELIMINATE — this is exactly what `isCrmStatus` (`status.ts:36`) exists for |
| Error `reason` strings | German, from `rbac.ts:62,76,96,106` and `policy.ts` | — | KEEP — the German domain vocabulary is a genuine asset |
| Toast API | `toast({ title, description?, variant?, duration? })` returning `{ id, dismiss }`; module-level singleton store | `hooks/use-toast.ts:19-40` | ADAPT — needs a provider context and an `aria-live` region |
| Uncontrolled vs controlled forms | Uncontrolled + `FormData` in `kontakt:26`, `projects-client:74`; controlled `useState` in `website-check:68-76`, `settings-panel:56-115` | — | PICK ONE per form type: uncontrolled for POST-once forms, controlled for live-preview forms |

### 9.2 The house style a shared design system should enforce

1. **One `cn`** — already correct; re-export it from the library, never redefine it.
2. **Every kit root emits `data-slot`** — currently 3 of 20. This is what makes styling overrides and testing possible.
3. **One variant vocabulary** — `variant` (never `tone`), and one shared scale: `intent` (primary / secondary / ghost / outline / destructive / link) crossed with `emphasis` (solid / subtle / outline) crossed with `size` (xs / sm / md / lg / xl / icon). `CrmStatusBadge`'s `solid | outline` is already the right shape, just misnamed and misfiled.
4. **Forward a ref on every primitive**, always.
5. **Every interactive element ships a visible `focus-visible` ring** — and never `focus:outline-none` without a replacement (the `dialog.tsx:44` / `toast.tsx:46` bug).
6. **`"use client"` only where a handler, hook, or portal exists.** 17 of the 20 currently-declared client files are client-only because of Radix, not because of their own logic.
7. **One `PageHeader` / `SectionHeader` pair**, one `EmptyState`, one `Alert`, one `Field`, one `Eyebrow`, one `SearchInput`, one `Score`, one `StatCard`, one `IconTile` — each with a single canonical implementation.
8. **One response envelope, one error `code` enum, one `isCrmStatus`-style type guard** at every DB boundary.
9. **Design tokens as real CSS custom properties** — this is the one prerequisite. See 11.1.

---

## 10. Bundle / perf observations

### 10.1 `use client` boundaries

20 of 39 component files (and 2 of 13 pages) carry `"use client"`. Three of the kit files genuinely need it (`dialog.tsx:1`, `toast.tsx:1`, `toaster.tsx:1`) and six more need it only because of Radix (`dropdown-menu.tsx` is missing it entirely, a bug). But the real cost is elsewhere:

- **Every dashboard route is client-rendered end to end.** `dashboard/page.tsx`, `auditor/page.tsx`, `crm/page.tsx`, `projects/page.tsx`, `website/page.tsx` are all Server Components whose entire body is `<DashboardShell><SomeClient/></DashboardShell>`. All data arrives via `useEffect` + `fetch`. There is **zero** server-rendered dashboard content, no streaming, and every navigation is a client round trip plus a full table re-render.
- `layout.tsx:24` renders `<Toaster />` in the **root** layout, so the toast client bundle (Radix toast + `lucide-react` icons) ships on every public marketing page too — where toasts are never used.
- `page.tsx:3` (`PlaceholderHome`) and all 5 public pages except `kontakt` and `website-check` are Server Components — that part is correct.

### 10.2 The toast system is functionally dead weight

`@radix-ui/react-toast` is a declared dependency (`package.json:25`) and `kit/toast.tsx:3` imports it, but:

- `Toast` (`:34-38`) renders a plain `<div>`, **not** `ToastPrimitives.ToastRoot`.
- `Toaster` (`toaster.tsx:16`) mounts `ToastProvider`, but no `ToastPrimitive.Root` ever registers with it — the provider is inert.
- Consequently every `data-[state=open]:animate-in`, `data-[state=closed]:animate-out`, and `data-[swipe=end]:animate-out` class in `toast.tsx:21` is **dead**, because no `data-state` attribute is ever emitted. The swipe-to-dismiss behaviour does not exist.
- `ToastViewport` (`:10`) is exported and never used; its `z-[100]` competes with the real `z-[9999]` at `toaster.tsx:17`.
- `use-toast.ts:12-13` stores `listeners` and `toasts` in **module-level mutable singletons**. This breaks under SSR and parallel renders, prevents per-provider scoping, and means `toast()` called during a server render would mutate shared state.
- No `aria-live` anywhere, so even the working parts are invisible to screen readers.

Net: a full Radix toast dependency, an unused viewport, a dead animation set, two z-index values, and an inaccessible result — for a feature used in exactly 2 files.

### 10.3 Dependency placement

- `lighthouse` (^13.5.0) and `playwright-core` (^1.63.0) are in **`dependencies`**, not `devDependencies` (`package.json:30,34`). They are not bundled into the client, but they inflate every production install and are not listed in `next.config.ts:6` `serverExternalPackages`, so a route that requires them at runtime would pull them through the server bundle. (I did not read `src/lib/lighthouse.ts`, so I cannot confirm whether they are required at runtime.)
- `osm-pbf` (^0.0.2) is also in `dependencies`. `maplibre-gl` is **not** a dependency at all, despite `README.md:63` claiming *"MapLibre (Phase 4)"*.
- 8 of the 11 Radix packages resolve to **zero** imported call sites (§1). That is 8 unused packages in the production dependency tree.

### 10.4 `next.config.ts`

```ts
const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: false },   // :4  real gate
  eslint: { ignoreDuringBuilds: true },      // :5  no-op — eslint is not installed
  serverExternalPackages: ["better-sqlite3"], // :6
};
```

- `serverExternalPackages: ["better-sqlite3"]` plus `export const runtime = "nodejs"` in `middleware.ts:9` means the **middleware cannot use the Edge runtime**. `authenticateRequest` (`auth.ts:143-151`) calls `getAuthConfig()`, which does `fs.mkdirSync` / `fs.existsSync` / `fs.readFileSync` and `scryptSync` — on **every request**, in middleware, on the Node event loop. At `auth.ts:91-94` `verifyPassword` calls `scryptSync` per login attempt; the rate limit (`middleware.ts:12`, 10 per 15 min) bounds that, but the `fs` stat calls are unbounded.
- The `eslint` flag is inert because `node_modules/eslint` does not exist. There is **no lint gate of any kind**, which is why the dead code, the unused imports, the 4 broken Tailwind utilities, and the corrupted strings have all survived.

### 10.5 Fonts

- Three font families load on **every** route, including public pages that never use `font-mono`. `@fontsource-variable/jost` + `@fontsource-variable/jetbrains-mono` + `@fontsource/lilita-one` = at least 4 font files.
- No `next/font`, so no `font-display` control, no subsetting, and no metric-matched fallback — the `Lilita One` `h1`s on `/agentur` (`:43`), `/leistungen` (via `PublicPageHeader`), `/login`, and `/portal` will shift.
- Self-hosting is the right call; the missing `next/font` is the gap.

### 10.6 Images

- `LuteaLogo` (`logo.tsx:12`) and `LuteaLogoSmall` (`:26`) **both** set `priority`. On `/agentur` there are 3 instances (header, footer, and the hero has none but `/` has 1) all preloading the same `/lutea-design-logo.png`. `priority` also implies `fetchpriority="high"`, so a decorative footer logo competes with real content.
- `LuteaLogoSmall` is a fixed `h-10 w-20` box with `object-contain` of a 2:1 source — in the sidebar it is overridden to `h-8 w-16` (`dashboard-sidebar.tsx:90`), so the aspect handling is per-call-site, not in the component.
- `auditor-client.tsx:132-137` uses a raw `<img>` for audit screenshots with an `eslint-disable` comment and no dimensions — the screenshot source is `/api/screenshots/[name]`, a runtime route, so `next/image` would need `loader` or `unoptimized`. Acceptable, but it is a CLS risk and it bypasses Next's image optimisation entirely.

### 10.7 Client bundle bloat specific to a shared library

- `version-manager-client.tsx:23-36` inlines **~6 KB of HTML + CSS template literals** (3 full documents) into the client bundle. These are static content and belong on the server or behind a fetch.
- `lucide-react` is imported via the barrel (`import { X, Y } from "lucide-react"`) in **24+ files**. lucide-react is ESM with `sideEffects: false` so it tree-shakes correctly, but the barrel costs build time and defeats any future per-icon import optimisation.
- The kit is small and the tree-shaking story is clean. The real risk for a shared library is not size but the **inconsistency** documented in §4: 20 hand-typed surface blocks and 20 hand-typed micro-labels guarantee that a shared `Card` change will not reach 20 of its 20 usages.

### 10.8 Things that would hurt a shared library specifically

| Observation | Why it hurts |
|---|---|
| Colours as literal hex in `tailwind.config.ts` | Theming requires editing TypeScript; no CSS-var indirection; the `.bg-card` override at `globals.css:16-18` is a symptom |
| `darkMode: "class"` with no light theme | The strategy implies two themes exist. It does not. A consumer will assume otherwise. |
| 4 broken Tailwind-v4 utilities in `select.tsx` | Copying this file into a v3 project ships silent no-ops. Copying into a v4 project is the only case where it works. |
| 8 unused Radix packages | A shared library's install cost is paid by every consumer. |
| 3 dead/unused components (`DashboardClient`, `DashboardNav`, `StubSection`) | `StubSection` is the *correct* primitive; shipping it as dead code invites the 10 inline copies to persist. |
| Module-level singleton state in `use-toast.ts` | Not SSR-safe, not multi-provider-safe. |
| No tests, no lint | 0 test files and no linter. For a library that is meant to be shared, this is the highest-risk item on the list. |

---

## 11. Risks and open questions

### 11.1 Confirmed defects (each verified by reading the code)

| # | Risk | Evidence | Severity |
|---|---|---|---|
| 1 | **No CSS custom properties for colour.** Semantically-named tokens are literal hexes. Theming is impossible without editing TypeScript. | `globals.css:9-13` (only `--radius-*`); `rg 'var\(--'` = 0 matches; `tailwind.config.ts:19-36` | **High** — blocks any shared theming |
| 2 | **`tailwind.config.ts` status key mismatch.** `colors.status.noWebsite` vs the canonical `no_website` — the entire `colors.status` scale is unreachable. | `tailwind.config.ts:39` vs `status.ts:3,16,27` | Medium |
| 3 | **`status.archived` badge is unreadable** — `#1A1D24` on a 10%-alpha version of itself over `#111318`, roughly 1.1:1. | `crm-status-badge.tsx:33,48` + `status.ts:33` | Medium |
| 4 | **The toast system is inert.** Radix imported, provider mounted, but `Toast` is a plain `div` — no `data-state`, so every animation is dead and there is no live region. | `toast.tsx:3,8,21,34-38`; `toaster.tsx:16,20` | Medium |
| 5 | **No `aria-live` / `role="status"` anywhere in the repo.** All toasts and 7 of 9 error banners are silent. | 0 matches; `toaster.tsx:15-33` | Medium |
| 6 | **Every control in the settings dialog has no accessible name.** `<label>` without `htmlFor`, `Input` without `aria-label`. | `settings-panel.tsx:210,219` | Medium |
| 7 | **11 unassociated `<label>` elements** across 4 files. | `settings-panel:210,219`; `projects-client:160,166,170`; `kontakt:113` | Medium |
| 8 | **Zero `prefers-reduced-motion` support** with 13 spinners and full Radix enter/exit animations. | 0 matches | Medium |
| 9 | **`/kontakt` validation shows 1 error for a 6-field form.** Only `issues[0]` is returned. | `api/contact/route.ts:21` | Medium |
| 10 | **`crm-page-client` has no error handling at all** — a failed fetch renders "Keine Leads gefunden." permanently. | `crm-page-client.tsx:26-33,40-46,89` | Medium |
| 11 | **Two irrecoverable actions with no confirmation** — `DELETE /api/config` and Kill-Switch, while the correct primitive (`kit/confirm-dialog.tsx`) sits unused. | `settings-panel:145-149`; `overseer-dashboard:216-224`; `confirm-dialog.tsx:1-109` | Medium |
| 12 | **No public mobile navigation** below 768px. | `public-header.tsx:24` `hidden md:flex`, no alternative | **High** (public) |
| 13 | **`/` is a dead end** — the header brand links to a logo placeholder with no chrome. | `public-header.tsx:21` -> `app/page.tsx:3-9` | **High** (public) |
| 14 | **`GlobalSearch` is unreachable below 1024px** — it lives only in the `hidden lg:flex` sidebar. | `dashboard-sidebar.tsx:42,50`; `:84-131` omits it | Medium |
| 15 | **Corrupted user-facing strings.** Chinese characters inside a German sentence, Portuguese inside a German sentence, a mangled German comment. | `crm-page-client.tsx:299` `und我们把das CRM`; `settings-panel.tsx:249` `Gebäude-Precição`; `settings-overlay.tsx:13` `WBÖhe` | Medium |
| 16 | **`as any` defeats the status type** at the one place a type guard exists. | `crm-page-client.tsx:122`; guard at `status.ts:36` | Low |
| 17 | **Two different score thresholds for the same value.** A 40-44 score is neutral in one place and a warning in another. | `company-list.tsx:356` (`>=40`) vs `auditor-client.tsx:114` (`>=45`) | Medium |
| 18 | **`scoreWeights` in settings are dead config** — the UI writes weights that `computeOpportunityScore` hardcodes. | `settings-panel.tsx:106-115` vs `score.ts:22-49`; `score.ts:4` comment admits it | Medium |
| 19 | **`PUBLIC_PAGES` is an exact-match array.** Any trailing slash or future sub-route silently redirects to `/login`. | `auth.ts:153,163` | Medium |
| 20 | **In-memory rate limiting.** `Map` per instance, lost on restart, and falls back to a single shared `"local"` bucket when `x-forwarded-for` is absent. | `auth.ts:168-182`; `middleware.ts:20-24` | Medium |
| 21 | **Asset bypass is a regex, not a route table.** Any path ending `.txt`, `.map`, `.js` etc. bypasses auth. | `middleware.ts:17-18,42` | Low |
| 22 | **Doc/code drift.** `README.md:63` claims MapLibre; `maplibre-gl` is not a dependency and not installed. `README.md:55` documents a second Basic-Auth layer that the app UI never mentions. | verified against `package.json` and `node_modules` | Low |
| 23 | **`data-ok` is not a real attribute** — likely an abandoned test hook rendering as DOM noise. | `website-check/page.tsx:111` | Low |
| 24 | **Legal routes do not exist.** `Impressum · Datenschutz` in the footer is plain text, not links. | `public-footer.tsx:62`; absent from `auth.ts:153` | Medium (legal) |
| 25 | **No CSRF token on session-authenticated mutations.** Only the 2 public forms check `X-Requested-With`. Defensible via `sameSite=lax` + `Content-Type: application/json`, but the invariant is unstated and untested. | `anti-spam.ts:13`; `auth.ts:37` per README | Medium |
| 26 | **1 `h1` disappears below 1024px** on every dashboard page. | `shell.tsx:23` `hidden ... lg:flex` | Medium |
| 27 | **Company detail panel is keyboard-unreachable** — `onClick` on `<TableRow>`. | `crm-page-client.tsx:108` | Medium |
| 28 | **`lutea.focus-company` has no listener.** Global search company results silently do nothing. | `global-search.tsx:77`; 0 other matches | Low |
| 29 | **In-memory rate-limit `Map` is unbounded until 500 entries** and cleanup only runs when `buckets.size > 500`. | `auth.ts:172-174` | Low |
| 30 | **Zero tests, zero lint.** 0 `*.test.*` / `*.spec.*` files; `eslint.ignoreDuringBuilds: true` with eslint not installed. | verified | **High** (process) |

### 11.2 Style and syntax drift that will become bugs

| # | Issue | Evidence |
|---|---|---|
| 1 | **4 Tailwind-v4 utilities in a Tailwind 3 project.** `max-h-(--x)`, `origin-(--x)`, `h-(--x)`, `min-w-(--x)` all silently emit nothing in v3; the correct form is `[var(--x)]`, as used in `dropdown-menu.tsx:71`. | `select.tsx:72,85` vs `dropdown-menu.tsx:71` |
| 2 | **Two shadow scales.** Hard-shadow offsets 4px (`tooltip`), 6px (`toast`, `select`, `dropdown-menu`), 8px (`dialog`, `global-search`); plus `shadow-xl` (`crm-page-client:141`); plus an unused `shadow-card`. | 5 locations |
| 3 | **Two z-index scales for overlays** — `z-[100]` (dead) and `z-[9999]`. | `toast.tsx:13`, `toaster.tsx:17` |
| 4 | **Imports in the middle of the file** — legal, but a sign the file was append-edited and never reviewed. | `projects-client.tsx:37-40` |
| 5 | **Two `lucide-react` import statements in one file.** | `auditor-client.tsx:6,8` |
| 6 | **Broken indentation** from a bot or bulk edit. | `dropdown-menu.tsx:70` |
| 7 | **A no-op documented edit** — the comment claims `ms-auto -> ms-auto`. | `dropdown-menu.tsx:3` |
| 8 | **A local `Card` shadowing the kit's `Card` concept** in the same layer. | `settings-panel.tsx:196` vs `kit/card.tsx:4` |
| 9 | **Duplicated label map with a conflicting route label** — `"Uebersicht"` vs `"Unternehmen"` for `/dashboard`. | `dashboard-nav.tsx:12` vs `dashboard-sidebar.tsx:31` and `dashboard/page.tsx:10` |
| 10 | **Inconsistent currency format on one page** — `1.900 EUR` vs `1.400 EUR` vs `490 EUR`. | `leistungen/page.tsx:10,11,12` |
| 11 | **Mixed `du` / `Sie` register** across the public funnel. | `agentur:26` vs `kontakt:47,56,101`, `website-check:59,84` |
| 12 | **`h-screen` and `h-dvh` mixed in one shell**, plus hardcoded `calc(100vh - …)`. | `shell:19`; `dashboard-sidebar:104`; `overseer-overlay:34`; `version-manager:146,220,245` |
| 13 | **Ellipsis style drifts** — `"Overseer wird geladen ..."` (space) vs `"Projekte werden geladen..."` (none). | `overseer-dashboard:156` vs `projects-client:100` |

### 11.3 Dead code inventory (safe to delete or must be adopted)

| File / export | Status | Evidence |
|---|---|---|
| `dashboard/dashboard-client.tsx` | **Dead** — 0 importers; 5 unused imports | `rg -l DashboardClient src` -> only itself |
| `dashboard/dashboard-nav.tsx` | **Dead** — 0 importers; weaker than the sidebar copy; stale label | same |
| `dashboard/finder-client.tsx` | **Dead** — 0 importers; its `CATEGORIES` is duplicated in `overseer-dashboard:233` | same |
| `CardFooter` | **Dead export** | only referenced in `card.tsx` |
| `DialogOverlay`, `DialogPortal` | **Dead exports** (used internally only) | only in `dialog.tsx` |
| `ToastViewport` | **Dead export**; its `z-[100]` is the dead z-index | only in `toast.tsx` |
| `StubSection` | **Dead — but it is the correct primitive.** Adopt it, do not delete it. | only in its own file |
| `kit/{label,scroll-area,separator,skeleton,switch,select,tabs,tooltip,dropdown-menu,confirm-dialog}.tsx` | **All 10 unused**, all 10 MLHSM-origin | `rg` for every JSX usage -> 0 |
| `colors.lutea.{gold,green,blue}` | **Dead** | 0 markup references |
| `colors.status.*` | **Dead** (and key-mismatched) | 0 markup references |
| `boxShadow.card` | **Dead** | 0 markup references |
| `--radius-sm/md/lg` | **Dead** | 0 `var(--` matches |
| `#root` selector | **Dead** (Vite-ism) | `globals.css:37-42` |
| `settings-panel.tsx:188` `PersonalCard` / `PortalRow` path | `DashboardClient`'s `/api/stats` call | `dashboard-client:35` |
| `scoreWeights` config | **Write-only** | `settings-panel:106-115` vs `score.ts:22-49` |
| `version-manager-client.tsx:17-21` `rejected` state | **Declared, no action** | no reject handler |
| `stub-section.tsx` `cta` slot | Never exercised | no importer |
| `crm-page-client.tsx:50-51` `{" "}` after `list.length === 0 ?` | Dead JSX branch artifact | `:50` |

### 11.4 Open questions — things I could not determine from the files read

1. **Is `/` intended to be the marketing home, or is `PlaceholderHome` a temporary splash?** `README.md:47` says `/agentur` is Home; `public-header.tsx:21` links the brand to `/`. One of the two is wrong and I cannot tell which is intended.
2. **Are the 8 unused Radix packages a deliberate roadmap or accidental leftovers?** `select`, `switch`, `tabs`, `tooltip`, `dropdown-menu`, `scroll-area`, `separator`, `label` all have finished kit implementations. Either they were copied in advance of use (in which case adopt them) or they are stale.
3. **Is `lighthouse` / `playwright-core` required at runtime?** They are in `dependencies`, not `devDependencies`, and not in `serverExternalPackages`. I did not read `src/lib/lighthouse.ts`, so I cannot say whether a route requires them. If it does, that is a packaging bug.
4. **Is `colors.status.*` meant to replace `STATUS_COLORS`?** The intent is clear from the naming, but nothing references it, and the key mismatch means it could never work as written.
5. **Is the `scoreWeights` config meant to be wired to the scorer?** `score.ts:4` says *"Die Gewichtung kann später konfigurierbar werden (config-Objekt)"* — the intent is documented but unimplemented. Someone must decide whether to build it or delete the UI.
6. **Should `/impressum` and `/datenschutz` exist?** They are named in the footer as plain text and referenced nowhere else. For a German agency site this is a legal requirement, not a feature.
7. **Is the MLHSM kit meant to be a shared package, or deliberately forked per project?** 10 files carry `Herkunft: MLHSM-KIT` with `LUTEA-Delta` notes, which implies a deliberate fork. That determines whether the answer is "publish a package" or "keep a copy-paste convention with a sync script".
8. **Was the 4-key score threshold divergence intentional?** A 40-44 score being neutral on `/dashboard` and a warning in the Auditor looks like drift, but it could be a deliberate product decision.
9. **Are `DashboardClient` and `FinderClient` planned for a route that does not exist yet?** `DashboardClient` has a `Übersicht` page (`Nächste Schritte` + `Kennzahlen`) that would suit a `/dashboard` landing page, and `FinderClient` is a full Overpass import UI. Both are complete, not stubs. There is no `/dashboard/uebersicht` or `/dashboard/finder` route.

### 11.5 The three highest-leverage changes

1. **Move colours to real CSS custom properties** (`--background`, `--card`, `--muted-foreground`, …) and reference them from `tailwind.config.ts`. Without this, nothing else can be shared — every consumer would inherit LUTEA's hexes. This is the prerequisite for §7.
2. **Adopt the 10 MLHSM-origin kit files as a set and add a `Field` + `Alert` + `EmptyState`.** That single decision removes 11 unassociated labels, 9 duplicated error banners, and 10 duplicated empty states — the three largest a11y defect clusters in the repo — and it is largely an *adoption* job, not an authorship job, because the code already exists.
3. **Add `prefers-reduced-motion` and a lint gate.** `next.config.ts:5` already sets `eslint.ignoreDuringBuilds: true` while eslint is not even installed, so nothing has been catching dead code, unused imports, broken Tailwind utilities, or corrupted strings. A single `eslint` + `eslint-plugin-tailwindcss` + `stylelint` setup would have caught items 1, 4, 15, 16, 23, 27, 28 and the whole of §4.9.

---

*End of audit. No files in the target repository were modified, created, or deleted.*







