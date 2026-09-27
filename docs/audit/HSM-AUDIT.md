# HSM Frontend UI/UX / Design-System Audit

**Repo:** `E:\HSM` @ `79bfb92` (uncommitted changes are Rust-only: `src/crates/hsm-core/src/lib.rs`, `module.rs`, untracked `event_bus.rs` — frontend is clean)
**Scope:** everything under `E:\HSM\src` except `node_modules`/`target`
**Read in full:** 20 files in `src/components/kit/*`, 9 in `src/components/*`, 20 in `src/pages/*`, all config, `api.ts` (1797 L), `use-toast.ts`, `styles.css`, plus `AGENTS.md`, `DECISIONS.md`, `PROJECT_STATE.md`, `TODO.md`, `ANLEITUNG_SHADCN_MIGRATION.md`, `docs/ARCHITECTURE.md`, `docs/CONTRIBUTING.md`, `.github/workflows/ci.yml`, `src-tauri/tauri.conf.json`.
**Not read (out of scope):** `src/crates/**`, `src-tauri/src/**`, `docs/API.md`, `docs/SECURITY.md`, `src/scripts/*`, `src/tools/*`.

---

## 1. Stack

### Runtime shape
- **Vite SPA**, React **18.3.1** + `react-dom` 18.3.1 (`src/package.json:38-39`). `jsx: "react-jsx"`, no `React` import needed except `React.StrictMode` (`src/main.tsx:1`).
- **Vite 6.4.3** (`package-lock.json`), dev server pinned `port: 1420, strictPort: true` (`src/vite.config.ts:16-19`) — this is the Tauri dev port.
- **Tauri 2 wraps it.** `src-tauri/tauri.conf.json:6-11`: `devUrl: http://localhost:1420`, `frontendDist: ../src/dist`, `beforeBuildCommand: npm --prefix ../src run build`, window 1280×800 (min 980×600), NSIS bundle, CSP `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; frame-ancestors 'none'` (`tauri.conf.json:25`).
- **But it is also a plain web dashboard.** `vite.config.ts:8-10` — `base: process.env.VITE_BASE ?? "/"`; production sets `VITE_BASE="/dashboard/"`. `src/api.ts:4-6` documents this: the SPA is served *by the service through Caddy*, all calls are relative `/api/v1/*`. `docs/ARCHITECTURE.md:67-98` confirms `browser ──Basic auth──> Caddy ──reverse_proxy──> hsm-service`.
- **No router, no state library.** `PageKey` union + `useState` in `src/App.tsx:89-107, 166-167`; every page is rendered by a long `if` chain (`App.tsx:428-452`). `React.StrictMode` on (`main.tsx:9`).

### Dependencies (exact, from `package.json`; installed versions from `package-lock.json`)

| Group | Package | Range | Locked |
|---|---|---|---|
| **UI primitives** | `@base-ui/react` | `^1.8.0` | 1.8.0 |
| | `@radix-ui/react-avatar` | `^1.2.6` | 1.2.6 |
| | `@radix-ui/react-dialog` | `^1.1.23` | 1.1.23 |
| | `@radix-ui/react-dropdown-menu` | `^2.1.24` | 2.1.24 |
| | `@radix-ui/react-label` | `^2.1.15` | (2.1.x) |
| | `@radix-ui/react-scroll-area` | `^1.2.18` | (1.2.x) |
| | `@radix-ui/react-select` | `^2.3.7` | 2.3.7 |
| | `@radix-ui/react-separator` | `^1.1.15` | (1.1.x) |
| | `@radix-ui/react-slot` | `^1.3.3` | 1.3.3 — **imported nowhere** |
| | `@radix-ui/react-switch` | `^1.3.7` | (1.3.x) |
| | `@radix-ui/react-tabs` | `^1.1.21` | 1.1.21 |
| | `@radix-ui/react-toast` | `^1.2.23` | 1.2.23 |
| | `@radix-ui/react-tooltip` | `^1.2.16` | (1.2.x) |
| **Styling** | `tailwindcss` | `^3.4.14` | **3.4.19** (v3, not v4) |
| | `postcss` | `^8.4.49` | 8.5.26 |
| | `autoprefixer` | `^10.4.20` | 10.5.4 |
| | `class-variance-authority` | `^0.7.1` | 0.7.1 |
| | `cn` | `^0.2.5` | 0.2.5 — shadcn's compiled clsx+tailwind-merge replacement |
| | `tw-animate-css` | `^1.4.0` | 1.4.0 — **installed, never imported** |
| **Animation** | *(Tailwind core only)* — see §9 | | |
| **Icons** | `lucide-react` | `^1.41.0` | 1.41.0 |
| **Fonts** | `@fontsource-variable/jost` | `^5.3.0` | 5.3.0 — imported `styles.css:1` |
| | `@fontsource-variable/jetbrains-mono` | `^5.3.0` | 5.3.0 — imported `styles.css:2` |
| | `@fontsource/lilita-one` | `^5.3.0` | 5.3.0 — imported `styles.css:3`, **never used in app CSS** |
| | `@fontsource-variable/geist` | `^5.3.0` | 5.3.0 — **never imported** |
| | `@fontsource-variable/nunito` | `^5.3.0` | 5.3.0 — **never imported** |
| **Data/charts** | *(none)* — hand-rolled SVG, `src/components/Chart.tsx` | | |
| **Terminal** | `@xterm/xterm` | `^6.0.0` | 6.0.0 |
| | `@xterm/addon-fit` | `^0.11.0` | 0.11.0 |
| **Tooling (misfiled)** | `shadcn` | `^4.21.0` | 4.21.0 — **in `dependencies`, not `devDependencies`** |
| **Build** | `vite`, `@vitejs/plugin-react` | `^6.0.0` / `^4.3.4` | 6.4.3 / 4.7.0 |
| **Typecheck** | `typescript` | `^5.6.3` | 5.9.3 |
| **Lint** | **none** | — | no eslint/prettier/biome/stylelint/editorconfig in `git ls-files` |
| **Testing** | **none** | — | no test runner, no `*.test.*`, no `*.spec.*` |
| **State** | **none** | — | React `useState`/`useRef`/`useCallback` only |

### Scripts (`package.json:6-13`)
`dev` · `build` · `preview` · `typecheck` (`tsc --noEmit`) · `tauri` · `deploy-ui`. **No `lint`, no `test`.**

### Tailwind configuration
`src/tailwind.config.js` — `darkMode: "class"` (:4), `content: ["./index.html","./**/*.{js,ts,jsx,tsx}"]` (:3), `theme.extend` only (:6-40). **No `theme.screens` override** → stock breakpoints. **No `theme.spacing`/`borderRadius`/`keyframes`/`animation` extension** at all. `plugins: []` (:42). Font families (:7-10) and colours (:11-35) are flat, one-level objects, not CSS-variable-driven.

### shadcn CLI config — `src/components.json` (exists, but is **stale/wrong in 4 places**)
```
style: "default"          rsc: false        tsx: true
tailwind.config: "tailwind.config.js"   OK
tailwind.css:     "src/styles.css"      WRONG  -> should be "styles.css" (config lives inside src/)
tailwind.baseColor: "slate"             WRONG  -> no slate-based tokens exist
tailwind.cssVariables: false            OK     -> matches reality (colours are literal hex in the config)
tailwind.prefix: ""                    OK
aliases.components: "@/components"      OK
aliases.ui:        "@/components/ui"    WRONG  -> actual folder is "@/components/kit"
aliases.utils:     "@/lib/utils"        OK
aliases.lib:       "@/lib"              OK
aliases.hooks:     "@/hooks"            OK
iconLibrary: "lucide-react"             OK
```
`src/ANLEITUNG_SHADCN_MIGRATION.md` is worse: it tells an agent to edit `components/ui/*` (:14, :72, :78) and to use `text-mlhsm-gold` / `text-mlhsm-olive` (:80) — **neither colour exists** (`tailwind.config.js:12-16` defines `mlhsm.red/yellow/blue` only). Its claim "Komponenten sind Base-UI-basiert (nicht Radix direkt)" (:79) is false: only `kit/button.tsx` is Base UI, the other 19 kit files are Radix. `docs/CONTRIBUTING.md:24-26` and `src/AGENTS.md:11-13` correctly state "MLHSM-KIT is the only UI standard", i.e. the project's own rule is *no* `components/ui/`.

### tsconfig (`src/tsconfig.json`)
`strict`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `useDefineForClassFields`, `moduleResolution: "bundler"`, `paths: { "@/*": ["./*"] }`, `include: ["."]`. **No `"types": ["vite/client"]` and no `vite-env.d.ts`** — which is why every `import.meta.env` access is hand-cast: `api.ts:8-10`, `lib/gameLogos.ts:5-7`, `pages/Ai.tsx:320`.

---

## 2. Design tokens

### Colour
There is **exactly one theme (dark-only)**, and it lives in `tailwind.config.js` as literal hex — **not** as CSS custom properties. `components.json` sets `cssVariables: false`, so there is no `var(--background)` layer at all.

`src/tailwind.config.js:11-35`, verbatim:

| Token | Value | Token | Value |
|---|---|---|---|
| `mlhsm.red` | `#E0332E` | `background` | `#111318` |
| `mlhsm.yellow` | `#F2C012` | `foreground` | `#E8E6E0` |
| `mlhsm.blue` | `#2F6FEB` | `card` | `#171A21` |
| `popover` | `#1E222B` | `card-foreground` | `#E8E6E0` |
| `popover-foreground` | `#E8E6E0` | `primary` | `#E0332E` |
| `primary-foreground` | `#FFFFFF` | `secondary` | `#232733` |
| `secondary-foreground` | `#D4D2CA` | `muted` | `#1B1F27` |
| `muted-foreground` | `#9A968C` | `accent` | `#F2C012` |
| `accent-foreground` | `#111318` | `destructive` | `#B3261E` |
| `border` | `#343A46` | `input` | `#1B1F27` |
| `ring` | `#F2C012` | | |

**No light theme exists.** `<meta name="color-scheme" content="dark">` (`index.html:6`), `theme-color #111318` (:7), and `darkMode: "class"` is configured but **no `.dark` / `.light` class is ever applied** — `html` has no class (`index.html:2`). Every `dark:`-prefixed utility in the codebase is therefore dead. Found: `kit/button.tsx:6` (`dark:aria-invalid:border-destructive/50`, `dark:aria-invalid:ring-destructive/40`) — 2 occurrences, no other `dark:` in the repo.

**`--radius-*` is the only token family that is in CSS, and every value is `0`** — `styles.css:24-30`:
```css
:root {
  --radius-sm: 0;  --radius-md: 0;  --radius-lg: 0;
  --radius-xl: 0;  --radius-2xl: 0;
}
```
These custom properties are **never referenced** (`--radius` appears nowhere else). The square/brutalist look is instead hard-coded as `rounded-none` — **182 occurrences across 33 files** — with a handful of escapes: `rounded-full` (switch thumb, status dots, progress bars, avatar, scroll thumb), `rounded-md` (`ServerVariables.tsx:100`, `GameServerDetail.tsx:485`, `ConfigEditor.tsx:446`, `FileBrowser.tsx:323,346`, `LoadingScreenEditor.tsx:999,1054`), `rounded-sm` (`LoadingScreenEditor.tsx:1054,1308,1336,1536`), `rounded-[inherit]` (`scroll-area.tsx:15`). So "radius = 0" is a *convention*, not a token, and four components quietly break it.

**Semantic tokens that are declared but unused:** `mlhsm.blue` (only used via arbitrary colour in `App.tsx:301,317`), `mlhsm.yellow` (`App.tsx:320,339`), `mlhsm.red` (`App.tsx:276,338`).

### Colour vocabulary *actually* used in JSX (this is the real, undocumented palette)
The token set is bypassed in favour of **hand-mixed Tailwind ramps** — 190 occurrences of `destructive` alone, plus:
- success: `bg-accent/10 border border-accent/40 text-accent` (5x: `Backups.tsx:209`, `Cloudflare.tsx:132`, `Notifications.tsx:108`, `Websites.tsx:204`) **and** `bg-emerald-500/10 border border-emerald-500/25 text-emerald-400` (2x: `ConnectLinkDialog.tsx:218`, `LoadingScreenMakerDialog.tsx:598`) — two "success" greens.
- warn: `text-amber-200/300/400`, `bg-amber-900/30`, `bg-amber-800/60`, `bg-amber-950/40` — 37 occurrences across 19 files, mixed freely.
- error: `text-red-300` (23x, 12 files) *and* `text-destructive` (used by the kit and by `GameServers.tsx:330,381`) — the two never agree.
- `bg-green-900/40 text-green-300` (`Ai.tsx:506,576`) — a third success colour.
- `bg-slate-500` (`Chart.tsx:35`) and `placeholder-slate-500` (`Notifications.tsx:154,163,172`) — raw `slate` palette, which is *not* the configured `baseColor` vocabulary.
- Chart series colours are hard-coded hex passed as props: `#22d3ee`, `#a78bfa`, `#f59e0b` (`Monitoring.tsx:20-22`) — outside the token set entirely.

### Radii
Zero, see above. `rounded-none` is the design's identity.

### Shadows (`tailwind.config.js:36-39`)
```js
boxShadow: { card: "0 1px 3px rgba(0,0,0,0.3)", sidebar: "1px 0 0 #30363d" }
```
**Both are declared and never used.** `card.tsx:12` hard-overrides with `shadow-none`; `App.tsx:270` uses `border-r border-border` instead of `shadow-sidebar`. The actual shadows are arbitrary hard-offset "brutalist" shadows:

| Value | Where |
|---|---|
| `shadow-[8px_8px_0_0_rgba(0,0,0,0.5)]` | `kit/dialog.tsx:41` |
| `shadow-[6px_6px_0_0_rgba(0,0,0,0.5)]` | `kit/dropdown-menu.tsx:48,66`, `kit/select.tsx:78`, `kit/toast.tsx:26` |
| `shadow-[4px_4px_0_0_rgba(0,0,0,0.5)]` | `kit/tooltip.tsx:22` |
| `shadow-[6px_6px_0_0_rgba(0,0,0,0.4)]` | `Websites.tsx:232` |
| `shadow-2xl` | `App.tsx:360`, `LoadingScreenMakerDialog.tsx:107` |
| `shadow-xl` | `App.tsx:360` (drawer) |
| `shadow-lg` | `ServerModeOverlay.tsx:78`, `kit/color-picker.tsx:209` |
| `shadow-lg` (thumb) | `kit/switch.tsx:20` |
| `shadow-sm` | `LoadingScreenEditor.tsx:1326` |
| `shadow-[0_10px_40px_rgba(0,0,0,0.6)]` | `LoadingScreenEditor.tsx:1169` |
| `shadow` (default) | `ServerVariables.tsx:75` — **the only default Tailwind shadow in the app** |

Four distinct offset magnitudes (4/6/8/10 px) for the same "one elevation" concept.

### Spacing
No spacing scale is defined. All spacing is inline Tailwind defaults. The dominant page rhythm is **`space-y-6`** on the page root — 20 occurrences across 16 pages. Panel inner padding is **not** uniform: `p-5` (`Caddy.tsx:83,112`, `Docker.tsx:204,246,274`, `Https.tsx:78`, `Backups.tsx:220,259,283`, `Monitoring.tsx:191`, `Notifications.tsx:117`, `Security.tsx:93,103`) vs `p-6` (`card.tsx:26`, `Websites.tsx:221`, `DynamicDns.tsx:150`, `SetupWizard.tsx:121`, `kit/dialog.tsx:41`) vs `p-4` (`Diagnostics.tsx:56,85,153,206`, `DynamicDns.tsx:81,132,301`, `Https.tsx:187,204`, `Backups.tsx:368`). Card component padding is fixed at `p-6` + `pt-0` (`card.tsx:26,63,73`).

**No density variables exist.** Two "compact field" conventions are hand-rolled per page: `h-8` + `text-xs` + `font-mono` (`ServerVariables.tsx:84`, `ConfigEditor.tsx:354`, `LoadingScreenEditor.tsx:1631,1733,2074`) and `h-9` (`ConfigEditor.tsx:419,430`). The kit's own `Input` is `h-10` (`input.tsx:11`) — so *every* compact field in the app overrides the kit's height, i.e. the kit exposes no `size` on `Input`.

### Fonts
- Declared: `tailwind.config.js:7-10` — `sans: ["Jost Variable","Jost","Futura","sans-serif"]`, `mono: ["JetBrains Mono","monospace"]`.
- Applied: `styles.css:48` — `font-family: "Jost Variable","Jost","Futura",system-ui,sans-serif` (adds `system-ui`, the config does not). Loaded via CSS `@import` at `styles.css:1-3` → **render-blocking, three families, in the critical CSS**.
- `mono` is used in exactly 8 places for machine data: `GameServerDetail.tsx:403,407,412,419,425,431`, `Diagnostics.tsx:109,169,192`, `GameServers.tsx:647`, `ConfigEditor.tsx:461,532,646`, `Database.tsx:450,497,1135`.
- `Lilita One` (`@fontsource/lilita-one`, imported `styles.css:3`) is **not referenced by any app CSS rule** — it only appears as a *string* in the generated loadingscreen font list (`loadingScreens.ts:30`) and in `FONT_LOADERS` (`loadingScreens.ts:34-36`, a Google-Fonts `<link>` for the generated page). So the app ships a font it never draws.
- `Geist` and `Nunito` are installed and never imported anywhere (0 occurrences).
- Type scale in use (arbitrary, no scale defined): `text-[9px]`, `text-[10px]`, `text-[11px]`, `text-xs` (12), `text-sm` (14), `[0.8rem]`, `text-base` (16), `text-lg`, `text-xl`, `text-2xl`, `text-4xl`. **9px and 10px are used for real UI text**, not just decoration — e.g. `App.tsx:278,381,389,393`, `LoadingScreenEditor.tsx:1054,1544,1583,1628,1739,1762,1783,1865,1902,2001,2050,2105,2120,1536`, `GameServers.tsx:406,434,448`. `Chart.tsx:68,97` uses SVG `fontSize={9}`.

### z-index scale

| Value | Where | Layer |
|---|---|---|
| `z-50` | `kit/dialog.tsx:24,41`, `kit/select.tsx:78`, `kit/dropdown-menu.tsx:48,66`, `kit/tooltip.tsx:22`, `App.tsx:358`, `FileManager.tsx:234` | overlays & popovers |
| `z-[60]` | `LoadingScreenMakerDialog.tsx:687` | fullscreen preview |
| `z-[70]` | `kit/color-picker.tsx:209` | colour popover |
| `z-[100]` | `kit/toast.tsx:17` | toaster |
| `z-[900]` | `LoadingScreenEditor.tsx:1293` | selection overlay |
| `z-[1000]` | `LoadingScreenEditor.tsx:1389,1395,1398` | marquee + snap guides |
| `z-[1001]` | `LoadingScreenEditor.tsx:1371,1374` | inline text editor |
| *(inline `zIndex: 1001`)* | `LoadingScreenEditor.tsx:1374` | same, as a style |
| *(unclassed)* | `LoadingScreenEditor.tsx:1267` (`zIndex: el.z + 1`, 1..n) | canvas elements |

No scale is declared in the config; all values are ad-hoc. The editor's `z-[900]/[1000]/[1001]` live inside a `z-50` dialog, so the numeric ordering is meaningless outside that context.

### Breakpoints
Stock Tailwind (`sm 640 / md 768 / lg 1024 / xl 1280 / 2xl 1536`). Used:
- `sm:` — 9 files (dialog footers, grids, 2-col form grids)
- `md:` — `input.tsx:11` (`md:text-sm`), `App.tsx:381,420,411,415,548,554,560,565`, `Docker.tsx:84`, `Caddy.tsx:84`, `Websites.tsx:206,251,320,322`, `Diagnostics.tsx:101,134`, `Settings.tsx:275,591`, `ServerVariables.tsx:126,145`, `ConfigEditor.tsx:526,549,557`, `ConnectLinkDialog.tsx:169,198`
- `lg:` — **the only structural breakpoint**: `App.tsx:270` (`hidden lg:flex` sidebar), `:358,370,372` (drawer), `:592` (4-up status grid)
- `xl:` — `Caddy.tsx:84`, `GameServers.tsx:379`, `GameServerDetail.tsx:564`, `LoadingScreenEditor.tsx:1525,1456`
- Custom: `min-[1280px]:inline` — `LoadingScreenEditor.tsx:1456` (raw arbitrary variant; effectively `xl:`)

Collapsing model: the sidebar is the *only* thing that changes at `lg`. Everything else reflows grids. `2xl:` is unused. The window minimum in Tauri is 980 px (`tauri.conf.json:18-19`), i.e. **between `md` and `lg`** — the desktop sidebar never appears in a default-sized window; users get the mobile drawer at 980 px.

### Animation keyframes / durations / easings
- **One keyframe is defined**: `@keyframes hsmspin { from rotate(0deg) to rotate(360deg) }` — `styles.css:67-76`. It is *never referenced* in `styles.css`; it exists only so the generated loadingscreen HTML can rely on it (`loadingScreens.ts:319,456`).
- **No `theme.extend.keyframes` or `theme.extend.animation` in the Tailwind config.** So `animate-spin`, `animate-pulse` come from Tailwind core (0.4s / 2s linear-infinite respectively), and the only durations/easings authored are inline: `duration-200` (`kit/dialog.tsx:41`), `transition-[width] duration-500` (`GameServers.tsx:426`), `transition-all` (buttons, cards), `transition-colors`, `transition-opacity`, `transition-transform`.
- **All Radix enter/exit animations are broken.** `kit/dialog.tsx:24,41`, `kit/select.tsx:78`, `kit/dropdown-menu.tsx:48,66`, `kit/toast.tsx:26`, `kit/tooltip.tsx:22` use `animate-in animate-out fade-in-0 fade-out-0 zoom-in-95 zoom-out-95 slide-in-from-top-2 slide-out-to-right-full data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)]`. These utilities come from `tailwindcss-animate` or `tw-animate-css`. **Neither is loaded**: `tw-animate-css@1.4.0` is in `dependencies` but never `@import`ed (`styles.css:1-7` imports only the three fonts), and `tailwindcss-animate` is **not in `package-lock.json` at all** (verified). Tailwind v3.4 core does not define `animate-in`/`fade-in-0`/`zoom-in-95`/`slide-in-from-*`. Result: **every dialog, select, dropdown, toast and tooltip opens and closes with no animation at all**, and the `data-[state=open]` / `data-[side=bottom]` / `data-[swipe=move]` hooks the CSS is written against are inert.

### Focus ring definitions
- `ring` colour: `#F2C012` (gold) — `tailwind.config.js:34`. The brand's focus colour is the *same* value as `accent`, so focused and selected states are chromatically identical (see §6, G8).

| Recipe | File:line |
|---|---|
| `outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50` | `kit/button.tsx:6` (most complete: 3px ring at 50% + border colour change) |
| `focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-1 ring-offset-background` | `kit/input.tsx:11` |
| `focus:ring-2 focus:ring-ring/50 focus:ring-offset-1` (**`focus:`, not `focus-visible:`**) | `kit/select.tsx:22` |
| `focus:outline-none focus:ring-2 focus:ring-ring/50 focus:ring-offset-2` (**`focus:`**) | `kit/dialog.tsx:47` (close button) |
| `focus:outline-none focus:ring-2 focus:ring-ring/40 focus:ring-offset-1` (**`focus:`**, and `focus:` on a non-focusable `div`) | `kit/badge.tsx:7` — **never fires** |
| `focus:outline-none focus:ring-2 focus:ring-ring/50 focus:ring-offset-2` (**`focus:`**) | `kit/toast.tsx:63,78` |
| `focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2` | `kit/tabs.tsx:30,45` |
| `focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background` (**40%**, not 50%) | `kit/switch.tsx:12` |
| `focus-visible:ring-1 focus-visible:ring-ring` (**1px, no offset**) | `ConfigEditor.tsx:563` (textarea) |
| `aria-invalid:ring-3 aria-invalid:ring-destructive/20` / `dark:.../40` | `kit/button.tsx:6` |

So the focus ring is **1px-3px, 40%-50% opacity, offset 0-2, on 6 of 8 controls**, and the app's own hand-rolled `<button>`s (`App.tsx:519`, `Database.tsx:238`) have **no focus styling at all** (they get the UA default, which on `bg-background #111318` is a low-contrast blue/white ring).

### `cn` (the class merger)
`src/lib/utils.ts` is one line: `export { cn } from "cn"`. `cn@0.2.5` is a compiled Tailwind-aware merge (`clsx` + `tailwind-merge` replacement, `"sideEffects": false`, dual ESM/CJS). **Two import paths are used for the same function:** `import { cn } from "cn"` (`kit/button.tsx:3`) and `import { cn } from "@/lib/utils"` (everywhere else, 16 files).

### Raw CSS outside Tailwind (`styles.css`)
- `.bg-card { background-color: #171a21; }` (`:10-12`) — a hand-written duplicate of the `card` token, defined in `@layer utilities`, whose *only* consumer is `src/styles.css:49` itself (`@apply bg-background text-foreground antialiased`). Dead: no TSX uses `bg-card` expecting this; all `bg-card` usages resolve to the Tailwind token.
- `.glass-grid` (`:14-21`) — 48px grid + radial mask. **Zero consumers.**
- Global `border-color: theme("colors.border")` for `*` (`:32-38`).
- `::-webkit-scrollbar` 10px, track `#111318`, thumb `#343A46`, thumb:hover `#f2c012` (`:78-91`) — WebKit-only, no `scrollbar-width`/`scrollbar-color` standards fallback, and it fights `kit/scroll-area.tsx:41` which renders its own `w-2.5 bg-border` thumb.
- `::selection { background:#f2c012; color:#111318 }` (`:62-65`).
- `html, body, #root { height:100% }` (`:40-45`).

### Non-token values hard-coded in components
`#0a0a0c` — terminal background in 3 places: `GameServerDetail.tsx:111` (xterm theme), `:473` (container class), `FileBrowser.tsx:423` (editor textarea). `#e6edf7`, `#9aa7bd` — the loadingscreen palette, `loadingScreens.ts:495-496`. `#0a0e1a`, `#1a2332`, `#1e293b` — template backgrounds, `loadingScreens.ts:558,599`. `rgba(0,0,0,0.35)`, `rgba(245,158,11,0.85)` — editor selection/inline-edit styles, `LoadingScreenEditor.tsx:1272,1375-1376`.

---

## 3. Component inventory

### 3a. `src/components/kit/*` (20 files)

| Component | File | Underlying primitive | Variants | Size props | State props | data-* used | Slots / parts | Ref fwd | a11y notes | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| `Avatar`, `AvatarImage`, `AvatarFallback` | `kit/avatar.tsx` | **radix** `@radix-ui/react-avatar` | none | none | none | none authored | 3-part | yes (all 3) | Radix supplies `img` alt handling + `span` fallback | **DEAD — imported nowhere.** Hardcodes `h-10 w-10 rounded-full` (:15) |
| `Badge` | `kit/badge.tsx` | none (plain `div`) | `default\|secondary\|destructive\|outline` (cva :10-18) | none | hover only | none | — | no | `focus:ring-2` on a non-focusable `div` — dead (:7). No `aria-label` support | Renders `<div>` (:32) — **invalid inside `<span>`/`<p>`**, which is exactly how it is used (`Websites.tsx:381-389`, `GameServers.tsx:396-401`, `GameServerDetail.tsx:326-332`) |
| `Button` | `kit/button.tsx` | **base-ui** `@base-ui/react/button` | `default\|outline\|secondary\|ghost\|destructive\|link` (:10-19) | `default\|xs\|sm\|lg\|icon\|icon-xs\|icon-sm\|icon-lg` (:22-32) — **8 sizes** | `disabled` (`disabled:pointer-events-none disabled:opacity-50` :6), `aria-invalid` (:6), `aria-expanded` (:12-16) | `data-slot="button"` (:50) | — | yes (via Base UI `render`) | `focus-visible:border-ring` + `ring-3 ring-ring/50` — the best recipe in the kit. `aria-invalid:ring-destructive/20` + `dark:.../40` (dead) | Only kit file importing `cn` from `"cn"` not `@/lib/utils` (:3). **Only component using cva-`className`-injection**: `buttonVariants({variant,size,className})` (:51) — no other component does this. Styles `has-data-[icon=inline-end]` (:23-26) and `in-data-[slot=button-group]` (:24-32) against attributes **nothing in the repo ever sets** |
| `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` | `kit/card.tsx` | none (6 `div`s) | none | none | none | none | 6-part | yes (all 6) | `CardTitle` is a `div` (:36) — **heading semantics lost** at every use site | `shadow-none` hard-coded (:12) → the `shadow-card` token is dead. Padding fixed `p-6`/`p-6 pt-0` (:26,63,73) so every consumer overrides (`p-4`, `p-2`, `pb-2`) |
| `ColorPicker` | `kit/color-picker.tsx` | **custom** | none | `size="icon-sm"` trigger (:195) | `open` internal (:96); no `disabled` | none | — | no | **Popover has no `role`, no `aria-expanded`, no `aria-controls`; SV square and hue strip are `div`s with pointer handlers only — no `role="slider"`, no `tabIndex`, no arrow-key support, no numeric `aria-valuenow`. Mouse-only.** Trigger uses `title="Farbe wählen"` (:195), not `aria-label` | Own popover: `fixed z-[70]` (:209), no portal, no focus trap; `document` `pointerdown`+`keydown` listeners (:123-127). Hardcoded `PANEL_W=248/PANEL_H=252` (:24-25) duplicated by `w-[15.5rem]` (:209). Exports `hexToHsv`/`hsvToHex` (:35,:62) as public API. Uses `!p-0`, `!size-5` `!` overrides (:197,:263) |
| `ConfirmDialog` + `useConfirm()` | `kit/confirm-dialog.tsx` | radix Dialog + `Button` | `destructive` boolean (:36) | fixed `max-w-md` (:42) | `open`/`onConfirm`/`onCancel` required (:20-27) | none | — | no | inherits Dialog; title turns `text-destructive` (:44) | Promise-based `useConfirm` returning `[ReactNode, (opts)=>Promise<boolean>]` (:80-110). Defaults `"Bestätigen"`/`"Abbrechen"` (:34-35). `DialogFooter className="gap-2 sm:gap-0"` fights the component's own `sm:space-x-2` (:53). Doc comment says "MLHSM" not "HSM" (:15) |
| `Dialog`, `DialogPortal`, `DialogOverlay`, `DialogContent`, `DialogHeader`, `DialogFooter`, `DialogTitle`, `DialogDescription`, `DialogTrigger`, `DialogClose` | `kit/dialog.tsx` | **radix** `react-dialog` | none | `className` only (`max-w-lg` :41) | `open`/`onOpenChange` from Radix; `data-[state=open/closed]` | none authored | 10-part | yes for Overlay/Content/Title/Description; no for Header/Footer | Radix gives trap + `aria-modal` + restore. Close button's label is **English**: `<span className="sr-only">Close</span>` (:49) | Overlay `bg-black/80` (:24). Content `shadow-[8px_8px_0_...]` (:41) — differs from the 6px used by every other overlay. `sm:rounded-none` (:41) is a **no-op** — it is already `rounded-none` |
| `DropdownMenu` + 14 parts | `kit/dropdown-menu.tsx` | **radix** `react-dropdown-menu` | none | none | `data-[state]`, `data-[side]`, `data-[disabled]` | none | 15 exports | yes (9 of 15) | `focus:bg-muted` (:84) — **inconsistent with `SelectItem`'s `focus:bg-accent`** (`select.tsx:121`). `Separator` uses `bg-border` (:163) vs `SelectSeparator`'s `bg-muted` (`select.tsx:143`) | **Single consumer** (`LoadingScreenEditor.tsx:53-58`). `inset` boolean prop (:22,29,78,85,142,149). Broken indentation `:65-68`. Unused exports: `CheckboxItem`, `RadioItem`, `Label`, `Shortcut`, `Group`, `Sub`, `SubContent`, `SubTrigger`, `RadioGroup` |
| `Input` | `kit/input.tsx` | none (`<input>`) | none | none (hardcoded `h-10`) | `disabled` (:11) | none | — | yes | `focus-visible:ring-2 ring-ring/50 ring-offset-1`; `md:text-sm` (:11) keeps 16px on mobile to dodge iOS zoom | No `size` prop — **every** compact use overrides with `h-8`/`h-9` + `text-xs` (12 sites). No `invalid`/`aria-invalid` styling (only `Button` has it) |
| `Label` | `kit/label.tsx` | **radix** `react-label` | **none** — cva has a single base, no `variants` (:7-9) | none | `peer-disabled:*` (:8) | none | — | yes | Radix Label **without `htmlFor`** (see §6 G1) | `labelVariants()` is called with no arguments (:18) — cva is pointless here. **0 `htmlFor` in the entire repo** |
| `ScrollArea`, `ScrollBar` | `kit/scroll-area.tsx` | **radix** `react-scroll-area` | none | none | none | none | 2-part | yes (both) | no `aria-label` support; `Viewport` is not focusable | `ScrollBar` is exported but never imported — `ScrollArea` hardcodes the vertical one (:18). Thumb `bg-border` (:41) collides with the global `::-webkit-scrollbar-thumb` styling. Consumer count: 3 (`App.tsx:63`, `Database.tsx:52`, `GameServerDetail.tsx:11`) |
| `Select` + 9 parts | `kit/select.tsx` | **radix** `react-select` | none | none | `data-[state]`, `data-[disabled]`, `data-[side]` | none | 10-part | yes (8 of 10) | `focus:` not `focus-visible:` (:22) → ring on mouse click. Item focus is `bg-accent` (:121) vs dropdown's `bg-muted` | **`max-h-[--radix-select-content-available-height]` (:78) is missing `var()` — an invalid arbitrary value that resolves to nothing.** `ScrollUpButton`/`ScrollDownButton` exported but never used directly. Viewport uses `position === "popper"` twice (:79, :90) |
| `Separator` | `kit/separator.tsx` | **radix** `react-separator` | none | `orientation` (:13) | `decorative` default **`true`** (:13) | none | — | yes | `decorative` default `true` → renders `role="none"`, so it is invisible to AT. For a *semantic* divider the caller must pass `decorative={false}` — nobody does | 1 consumer (`LoadingScreenEditor.tsx:991`) |
| `Skeleton` | `kit/skeleton.tsx` | none (`<div>`) | none | none | none | none | — | no | no `aria-busy`, no `aria-hidden` | **`animate-pulse rounded-none bg-muted` — imported NOWHERE.** The app has 8 different hand-rolled "Lade …" texts instead |
| `Switch` | `kit/switch.tsx` | **radix** `react-switch` | none | none | `checked`/`onCheckedChange` (Radix), `disabled` (:12) | `data-[state=checked/unchecked]` | — | yes | `focus-visible:ring-2 ring-ring/**40**` (:12) — the odd one out | `h-6 w-11` track, `h-5 w-5` thumb, `translate-x-5` (:12,20) — the **only** rounded-full interactive control. Consumers: 3 (`App.tsx:62`, `LoadingScreenEditor.tsx:69`, `Settings.tsx:30`). **`App.tsx:873` renders it with no `aria-label`** |
| `Table` + 7 parts | `kit/table.tsx` | none (wraps `<div className="relative w-full overflow-auto">` :9) | none | none | `data-[state=selected]` on row (:61) — no consumer sets it | none | 8-part | yes (8 of 8) | wrapper is a `div`, not `role="region"`; no `<caption>` support beyond an unused part | `TableHead` `h-12 px-4` (:76) vs `TableCell` `p-4` (:90) — **asymmetric padding**, and `px-4` != `p-4` means head and cell do not line up on the first column. `[&:has([role=checkbox])]:pr-0` (:76,:90) supports a checkbox column that **no consumer has**. **2 consumers** (`FileBrowser.tsx:12-19`, `Database.tsx:29-36`) — 7 other pages hand-roll `<table>` |
| `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` | `kit/tabs.tsx` | **radix** `react-tabs` | none | none | `data-[state=active]` (:30) | none | 4-part | yes (3 of 4) | Radix gives roving tabindex + `aria-controls` | `TabsList` `h-10` (:15) but every consumer overrides (`h-8` `LoadingScreenEditor.tsx:1048`). Active = `bg-accent` (:30). No `data-slot`. Consumers: 4 files |
| `Toast` + `ToastAction`, `ToastClose`, `ToastTitle`, `ToastDescription`, `ToastViewport`, `ToastProvider` | `kit/toast.tsx` | **radix** `react-toast` | `default\|destructive` (cva :29-33) | none | `open`, `onOpenChange`, `data-[swipe=*]`, `data-[state=open/closed]` | `toast-close=""` (:81) | 8-part | yes (6 of 8) | Radix's `ToastAnnounce` provides the live region — toasts announce, inline banners do not | `ToastViewport` `z-[100]`, `md:max-w-[420px]` (:17). `p-6 pr-8` (:26) is very large for a toast. `ToastClose` is `opacity-0` until `group-hover` (:78) → **keyboard users never see the close button** |
| `Toaster` | `kit/toaster.tsx` | radix + `useToast` hook | none | none | none | none | — | no | **No `aria-live` region of its own**; `<ToastProvider>` is mounted *here* (:15), i.e. inside `main.tsx`'s `<Toaster/>` which is a sibling of `<App/>` — any throw inside `App` unmounts the toaster | Renders `title`/`description` conditionally (:20-23), so a toast with neither is an empty box. Does not pass `duration` or `onOpenChange` |
| `Tooltip`, `TooltipTrigger`, `TooltipContent`, `TooltipProvider` | `kit/tooltip.tsx` | **radix** `react-tooltip` | none | none | `data-[state=closed]`, `data-[side=*]` | none | 4-part | yes (Content) | Radix sets `aria-describedby` on the trigger — **so a `Tooltip`-wrapped button with no `aria-label` still has no accessible name** | `TooltipProvider` in `main.tsx:10` (default 700 ms delay) **and** a *second nested* provider at `LoadingScreenEditor.tsx:983` (`delayDuration={300}`). Shadow `4px` — a fourth offset value |

### 3b. `src/components/*` (9 files)

| Component | File | Underlying primitive | Variants | Size props | State props | data-* used | Slots / parts | Ref fwd | a11y notes | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| `Chart` (default) + `ChartSeries` | `Chart.tsx` | **none — hand-rolled SVG** | — | `height=180` (:28), `yMax=100` (:28) | empty-state branch (:33-39) | none | — | no | `role="img"` + `aria-label="Verlauf der Systemauslastung"` (:55-56) — **good** | Fixed `W=900` with `viewBox` + `w-full h-auto` (:52-54) — resolution independent, 0 deps (D021). **Hardcoded `#334155` grid / `#64748b` labels (:66,68,97) — not tokens, 9px, ~3.4:1 on `bg-card` → fails WCAG AA.** Empty state uses `text-slate-500` (:35) — `slate` is not the configured base palette. `padding-left 34` is a magic number for the y-axis gutter. Single point → a bare `<circle>` (:89). No `<title>`/`<desc>` children |
| `ConfigEditor` (default) + `commonConfigPresets()` | `ConfigEditor.tsx` | radix-less; `Button`/`Input`/`Label` + `LoadingScreenMakerDialog` | editor mode `structured\|raw` (:135) | — | `busy`, `dirty`, `error`, `notice`, `expanded`, `makerOpen` (:156-160) | none | — | no | Path `<Input>` has a `Label` with **no `htmlFor`** (:414-418) | Structured/raw KV parser: `parseConfigLines`/`buildConfigText` (:81,:112) preserve original prefix/quoting — the right call. `fileSupportsStructured` whitelists `.properties .cfg .conf .ini` (:125-133). **5 index keys** (`renderLine` :340,:375,:380,:392,:399) — index keys break reorder semantics, and the list *is* reordered by `importantIdx`, so React reconciles the wrong rows. Renders its own error banner (:505) *and* a `notice` line (:571) *and* a `toast` (:233) for one operation |
| `ConnectLinkDialog` (default) | `ConnectLinkDialog.tsx` | radix Dialog + `Select` | — | `SelectTrigger h-9` (:169,:197) | `loading`, `error`, `copied` (:42-44) | none | — | no | `Select`s have `Label`s with **no `htmlFor`** (:160,:190). Copy button label changes text ("Kopieren"→"Kopiert") so it *is* announced | Builds `steam://connect/{ip}:{port}` (:121). `GAME_PORT = 27015` (:25) domain constant. **Renders a raw `<a>` styled as a primary button (:239-246) instead of `<Button>`** — a link, so it is correctly not a button, but it duplicates the primary-button styling by hand. Sequential `await` for 3 independent IPs (:84,:89,:94) instead of `Promise.all` |
| `FileBrowser` (default) | `FileBrowser.tsx` | `Table` kit + `Dialog` + `useConfirm` | — | — | `busy`, `opBusy`, `editorBusy`, `action` | none | — | no | **5 icon-only `Button`s in every row action with no `aria-label` and no `title`** (:389-406: `Pencil`, `FolderInput`, `Download`, `PencilLine`, `Trash2`). Breadcrumb segments are `Button`s whose only state signal is `font-bold` (:308,:314) — no `aria-current` | `MAX_EDITOR_BYTES = 2 MiB` (:49) checked *after* transfer. `formatSize` uses **GiB/MiB/KiB** (:52-55) — the only page that does; everyone else uses GB/MB/KB. Breadcrumb "root" is an English string in a German app (:309). Hidden file inputs (:284,:291). `autoFocus` (:334). `Escape` cancels the inline bar (:332) — the only place a raw key handler is used for this |
| `LoadingScreenEditor` (default) | `LoadingScreenEditor.tsx` (2165 L) | 11 kit components | 4 tab groups, 16 element types | `IconBtn` re-declares Button's union (:1478-1479) | 18 `useState` (:214-227) | none | 11 sub-components | no | `IconBtn`/`ToggleBtn` do set `aria-label` + `aria-pressed` (:1492,:1521-1522) — **the best a11y in the app.** Alt-drag duplicates, Shift-click multi-select, marquee, 8 resize handles, `Ctrl+Z/Y/D/C/X/V/A/0`, arrow nudge, `Space`-pan, `Esc`-cancel, double-click inline edit — an unusually complete editor keyboard model (:836-944). The keydown listener is on **`window`** and is not scoped to dialog open-state | `dangerouslySetInnerHTML` (:1267) with `elementInnerHtml` output. History: 150-entry stack, 500 ms coalescing (:267-274) in a `useRef` (not reactive) + `histState` mirror. `ResizeObserver` fit (:304-316), `wheel` listener on `window` with `capture: true, passive: false` (:344) — a global non-passive wheel listener. `onPointerDown` x7. `z-[900/1000/1001]`. Header/left-panel/canvas/right-panel/statusbar = a full IDE shell in one file |
| `LoadingScreenMakerDialog` (default) | `LoadingScreenMakerDialog.tsx` (772 L) | radix Dialog x2, `ConfirmDialog` x2, `LoadingScreenEditor` | 3 steps `slots\|pick\|config` (:50) | — | 16 `useState` (:79-96) | none | — | no | **Nested `Dialog` inside `Dialog` (:710)** — the inner "In welchen Slot speichern?" dialog. Slot cards are plain `div`s with `Button`s inside (:367-455); the *card* is not clickable, so that is OK. Slot preview `<iframe sandbox="allow-scripts">` (:376) and fullscreen `<iframe sandbox="allow-scripts allow-same-origin allow-autoplay">` (:701) — **`allow-same-origin` + user HTML is a real XSS-to-token-theft surface** even though it is `tabIndex={-1}` | `SLOT_COUNT = 4` (:64). Bypasses `api.ts`: **hardcoded `fetch("/api/v1/websites/...")`** (:155) → `VITE_API_BASE` is ignored here. `refreshSlots` derives filled slots by listing files then N x `readSlotState` (N sequential API round-trips, :168-171). Fullscreen preview at `z-[60]` is a sibling of the dialog, not inside it, yet the outer `DialogContent` is still `aria-modal` → **the fullscreen layer is focus-trapped out** |
| `ServerVariables` (default) | `ServerVariables.tsx` | `Button`, `Input` | — | `Input h-8` (:84) | `busy`, `dirty`, `error`, `notice`, `expanded` | none | — | no | **Inputs have no `<Label>` at all** — the key is a `<span className="break-all font-mono text-xs">` (:79-81). The unsaved-changes dot is `aria-hidden` (:76). **The "Ungespeicherte Änderungen" pill (:113) is text — good.** Save button is `disabled={busy \|\| !dirty}` (:164) | Dirty tracking by diffing `values` vs `saved` (:42) — correct. Uses `orderConfigKeys`/`configKeyPriority` to split "important" vs "rest" (:39-41) with a `Mehr anzeigen (n)` expander (:130-148). Emits **both** a `notice` (:55) **and** a `toast` (:56) for one save — duplicate feedback. `JSON.parse(JSON.stringify())` deep clone (:36,:54). Header block (:98-117) is the same icon+title+subtitle pattern as `ConfigEditor.tsx:444-501` and `GameServerDetail.tsx:483-497` |
| `configPriority.ts` | `configPriority.ts` | n/a (pure) | — | — | — | — | — | — | — | `IMPORTANT_KEYS` — **43 hand-listed key fragments** (:7-50), matched with `o === n \|\| n.includes(o) \|\| o.includes(n)` (:65) — the `includes` in both directions means `port` (:17) matches `SV_PORT`, `SV_PORT_RANGE`, `SV_RCONPORT` and `appid` (:25) matches `APPID_PRIVATE`. Returns `0..n` or `null` (:60-68); `orderConfigKeys` sorts stably (:74-84). Domain logic → **stays in HSM** |
| `loadingScreens.ts` | `loadingScreens.ts` | n/a (pure) | 7 templates (:658-666) | `ASPECT_OPTIONS` 3 (:142-146) | — | — | — | — | Generated HTML is `lang="de"` (:445), `alt=""` on decorative imgs (:460), `autoplay` audio | ES5-only code generator for GMod Awesomium (:4-16) — `var`, no arrow functions, `XMLHttpRequest` not `fetch` (:351-418). `escAttr` escapes `& " < > '` (:232-239) — **no escaping of the `style` attribute values, and `elementStyle` interpolates `el.color`/`el.bgColor` raw into CSS** (:278,:281), so a crafted colour string injects CSS. `pxVw` emits `vw` units so text scales with the window (:242). 7 hand-authored layout presets with literal hex palettes (:513-656). `cloneConfig` is `JSON.parse(JSON.stringify())` (:671) |

### 3c. Supporting modules (not components, but part of the system surface)

| Module | File | Notes |
|---|---|---|
| `useToast` / `toast` / `reducer` | `hooks/use-toast.ts` | `TOAST_LIMIT = 1` (:11) — **a second toast silently replaces the first**; `TOAST_REMOVE_DELAY = 1_000_000` ms ~ 16.7 min (:12). **Module-level mutable singleton**: `memoryState` (:134) + `listeners` array (:132) + `toastTimeouts` `Map` (:59) + `count` (:28). Breaks multi-root/SSR/parallel tests. `useToast`'s effect depends on `[state]` (:185) → **unsubscribes and resubscribes on every state change**. `DISMISS_TOAST` performs a side effect inside the reducer (:93-105) with an apologetic comment (:96-97) |
| `cn` | `lib/utils.ts` | one line: `export { cn } from "cn"` |
| `eggLogoUrl` | `lib/gameLogos.ts` | 9 name→asset entries (:14-27), substring match (:35). **Hand-rolled `asset()` + `import.meta.env.BASE_URL` handling** (:5-12) with an explanatory comment about `/dashboard/` — i.e. it works around the same base-path problem that `index.html:9`'s `href="/favicon.svg"` also has |
| `api.ts` | `api.ts` (1797 L) | `API_BASE` from `VITE_API_BASE ?? "/api/v1"` (:8-10). `apiFetch` (:29) sets `credentials: "same-origin"` + `Content-Type: application/json` and throws on `!res.ok` with a parsed message (`errorMessage` :12-27 handles plain text, bare JSON string, `{message}`, `{error}`). Helpers `getJson/postJson/putJson/deleteJson` (:40-63). **Two functions are browser no-ops, not API calls**: `serverModeOverlay` returns `undefined` (:1354) and `restartService` returns a German *sentence* (:1279-1281) — yet `App.tsx:209-220` runs a confirm dialog, sets `restarting`, calls it and shows the result as if it were an action. **Mojibake in two user-visible strings**: `api.ts:1276` `"Caddy lÃ¤uft nicht."`, `api.ts:1280` `"Ein Neustart wÃ¼rde die eigene Verbindung kappen â€” bitte per Remote/Desktop durchfÃ¼hren."` |
| `EggLogo` consumer | `GameServers.tsx:46-52` | returns `null` when there is no match → the layout shifts by 36 px per card. `alt=""` (:50) — decorative, correct |

### 3d. Recurring page-level composites

| Composite | Appears in pages | Duplicated? | Canonical candidate | Notes |
|---|---|---|---|---|
| **Status dot + label** | `App.tsx:399-409` (header pill), `App.tsx:613-618` (grid), `App.tsx:673` (container list), `App.tsx:733-741` (game servers), `App.tsx:792` (websites), `Docker.tsx:207,332-337`, `Monitoring.tsx:56-60` (**dot only, no label**), `Notifications.tsx:119-123` (**dot only**), `ServiceManager.tsx:74-76` (emoji), `DynamicDns.tsx:88-89` (emoji), `Diagnostics.tsx:186-188` (emoji), `Diagnostics.tsx:15-18` (emoji), `Security.tsx:10-12` (emoji), `GameServers.tsx:106-117` (`statusDotClass`), `GameServerDetail.tsx:302-332` | **Yes — 15 sites, 5 dialects** | `kit/badge.tsx` + a new `StatusDot`/`StatusBadge` | Dot sizes: `h-2.5 w-2.5` (5x) and `h-2 w-2` / `h-1.5 w-1.5` (6x). Colours: `bg-accent`, `bg-accent/50`, `bg-green-500`, `bg-amber-500`, `bg-red-500`, `bg-muted-foreground`, `bg-muted-foreground/40` — **7 different "online" greens/yellows for the same semantic**. Four pages use **emoji** instead of lucide icons |
| **Metric / stat tile** | `Monitoring.tsx:41-66` `StatCard` (+`online` dot), `Backups.tsx:368-389` `SummaryCard` (colour prop `"slate\|emerald\|amber\|red"`), `Https.tsx:187-209` `SummaryCard` (colour prop `"emerald\|amber\|orange\|red"`), `Security.tsx:91-98` `SummaryCard` (colour prop is a **raw class string** `text-accent`), `Diagnostics.tsx:151-158` `InfoCard`, `Diagnostics.tsx:160-176` `DependencyRow`, `Diagnostics.tsx:178-202` `ServiceRow`, `Security.tsx:100-118` `CheckRow`, `DynamicDns.tsx:81-122` inline stat grid, `Caddy.tsx:83-110` inline 4-up grid, `Database.tsx:333-350` `<dl>` grid, `Ai.tsx:177-221` `Card`-based 3-up | **Yes — 6 named functions + 4 inline variants, 3 incompatible colour-prop vocabularies** | **new `StatTile`** | `Monitoring` value-first, `Backups`/`Https` value-first (`text-2xl font-bold`), `Security` label-first, `Diagnostics.InfoCard` label-first, `Database` `<dt>/<dd>`. Value sizes: `text-2xl font-semibold`, `text-2xl font-bold`, `text-xl font-semibold`, `text-sm`. **Two `SummaryCard` implementations with the same name and different props** — the exact thing a shared library must kill |
| **Panel / section card** | `rounded-none bg-card border border-border` — **31 occurrences in 15 pages** | **Yes** | `kit/card.tsx` | Padding splits `p-4` / `p-5` / `p-6`. 7 pages use `<Card>` correctly; 15 pages use the raw div string |
| **Page root** | `space-y-6` in 16 pages | Yes, but consistent | `Page` layout primitive | 1 outlier: `GameServers.tsx:328` uses `space-y-5`; `GameServerDetail.tsx:312` uses `space-y-4` |
| **"Lade X…" full-page loader** | `Ai.tsx:72-77`, `DynamicDns.tsx:70-76`, `GameServerDetail.tsx:291-296`, `GameServers.tsx:298-304`, `SetupWizard.tsx:61-67`, `ServiceManager.tsx:59-61` — all `<div className="flex items-center justify-center h-64">` (5 exact matches) + `Database.tsx:352`, `FileManager.tsx:301` | **Yes — 8 sites, 5 with the identical `h-64` wrapper** | **new `PageLoader`; `kit/skeleton.tsx` is already written and already dead** | German strings: "Lade ModelMesh…", "Lade DDNS-Status…", "Lade Server…", "Lade Game-Server…", "Lade Setup-Assistent…", "Lade Service-Status…", "Lade Übersicht…", "Lade Dateien…" |
| **Inline error banner** | **31 occurrences of `bg-destructive/10` across 19 files** | **Yes — 4 visual dialects** | **new `Alert`/`Callout`** | Dialect A `bg-destructive/10 border border-destructive/30` (9x) + `text-destructive`; dialect B `bg-red-950/50 border border-destructive/30/50 text-red-300` (7x); dialect C `border-destructive/40 bg-destructive/10` (`Ai.tsx:82`, `GameServers.tsx:330`, `GameServerDetail.tsx:284,380`); dialect D `border border-destructive/25 bg-destructive/10` (`ConfigEditor.tsx:505`, `ServerVariables.tsx:121`, `ConnectLinkDialog.tsx:152`, `LoadingScreenMakerDialog.tsx:496`). Padding: `p-2`, `p-3`, `p-4`. Dismiss affordance: 4 have a `schließen` `Button` (`Backups.tsx:200`, `Cloudflare.tsx:139`, `Notifications.tsx:102`, `FileManager.tsx:288`), the rest do not. Prefixes: `"IPC-Fehler: "` (4x, `Caddy.tsx:78`, `Docker.tsx:240`, `Monitoring.tsx:184`, `Websites.tsx:210`) and `"Fehler:"` (7x) — **"IPC-Fehler" is a lie**: the transport is HTTP (`api.ts:30`), not IPC |
| **Inline success/notice banner** | `bg-accent/10 border border-accent/40` (5x) + `showNotice(msg)` helper (3x) | Yes | `Alert variant="success"` | `showNotice` is **copy-pasted 3x** with an identical 5 s `setTimeout` — `Cloudflare.tsx:84-87`, `FileManager.tsx:89-92`, `Websites.tsx:75-78`. The timer is never cleared on unmount |
| **Manual "refresh" button** | `App.tsx:411-417` (**two** buttons for the same action, `sm:` breakpoint swap), `Caddy.tsx:53-61` (`btn()` helper), `Docker.tsx:251-256, 288-293` (two, one conditional on `main === "games"`), `Https.tsx:79-85`, `Backups.tsx:237-242`, `Security.tsx:46-52`, `Diagnostics.tsx:69-75`, `FileManager.tsx:270-275`, `FileBrowser.tsx:268-271`, `Database.tsx:414-417`, `GameServerDetail.tsx:359-366`, `Ai.tsx:172-174` + `:268-270` | **Yes — 15 sites, all `variant="ghost"` + hand-written `px-3 py-1.5 rounded-none bg-muted text-muted-foreground hover:bg-muted text-sm`** | **new `RefreshButton`** (the string `"px-3 py-1.5 rounded-none bg-muted text-sm text-muted-foreground hover:bg-muted"` appears **verbatim in 8 files**) | `Security.tsx:49` and `Diagnostics.tsx:72` are **byte-identical** except for the label |
| **Status badge/pill** | `Https.tsx:211-234` `StatusBadge`, `Backups.tsx:32-56` `statusStyle`+`statusLabel`, `Websites.tsx:187-198`+`:533-548`, `GameServers.tsx:106-132` `statusDotClass`+`statusLabel`, `GameServerDetail.tsx:302-332` (inline), `Docker.tsx:127-142` `StateText`, `Settings.tsx:184-189` (`Badge` + `aria-label`), `Ai.tsx:186-188, 504-509, 576` | **Yes — 5 independent status-mapping tables for the same wire union** | `kit/badge.tsx` + **new `StatusBadge` fed by a single `status -> {label,tone}` map** | Wire types: `WebsiteStatus` (6 values), `ContainerStatus` (6), `BackupStatus` (3), `CertificateStatus` (5), `GameServer["status"]` (4), `DependencyStatus` (4), `SecuritySeverity` (3). **Every one is re-mapped by hand, and no two maps agree on the German wording**: "Online/Läuft/Angehalten/Fehler" vs "Läuft/Gestoppt/Starten/Pausiert/Fehler" vs "Erfolgreich/Fehlgeschlagen/Ausstehend" vs "Gültig/Warnung/Kritisch/Abgelaufen/Fehler" |
| **Panel header w/ icon + title + subtitle** | `ServerVariables.tsx:98-117`, `ConfigEditor.tsx:444-501`, `GameServerDetail.tsx:483-497`, `LoadingScreenEditor.tsx:1708-1715, 1955-1962, 2027-2030`, `LoadingScreenMakerDialog.tsx:238-248` | Yes — 8 sites | new `PanelHeader` | Pattern: `grid size-7 place-items-center rounded-md bg-foreground/5` + `text-sm font-medium leading-tight` + `text-[11px] leading-tight text-muted-foreground/80` |
| **Action-button group with per-row state** | `Docker.tsx:363-400`, `Websites.tsx:457-513`, `Backups.tsx:333-357`, `Https.tsx:167-175`, `GameServers.tsx:453-511`, `FileBrowser.tsx:386-407` (5 icon-only), `Database.tsx:513-525` (2 icon-only) | Yes | `ActionCell` / `RowActions` | Every destructive action is a `variant="ghost"` with a hand-written `bg-destructive/10 text-red-300 hover:bg-red-800/40` class string (6x) instead of `variant="destructive"`, which the kit already provides (`button.tsx:18`) |
| **Page title block** | `App.tsx:386-391` (global header), `GameServers.tsx:335-346`, `ServiceManager.tsx:57`, `SetupWizard.tsx:96`, `Ai.tsx:170-175, 266-270, 324, 385, 477, 563`, `Diagnostics.tsx:113, 123, 133` (uppercase `h3`), `DynamicDns.tsx:151` | Yes — 2 competing title styles | new `PageHeader` (title + description + actions) | `App.tsx:381` header is `min-h-[69.5px]` — a magic number. `Ai.tsx` has **6** `h3` page-level titles inside tabs |
| **Form field w/ label** | `Cloudflare.tsx:199-213`, `DynamicDns.tsx:164-196, 202-243, 250-265, 275-289`, `Websites.tsx:253-321` | Yes | new `Field` (`Label`+control+`description`+`error`) | **None of them associate the label with the control** — see §6 G1. `Websites.tsx:253-321` is a whole form built from bare `<input>`/`<select>`/`<label>` with `required` on one field and no validation messages |
| **Section `<h3>` uppercase label** | `Diagnostics.tsx:113, 123, 133`, `Security.tsx:77`, `LoadingScreenEditor.tsx:1063, 1554, 1718-1895` | Yes | new `SectionLabel` | `text-sm font-medium text-muted-foreground uppercase tracking-wide` vs the editor's `text-[10px] font-semibold uppercase tracking-wider` |
| **Sidebar nav** | `App.tsx:286-291` (desktop) and `App.tsx:369-373` (mobile) — **the same three `<NavGroup>` calls written out twice** | **Yes — literally duplicated JSX** | new `Nav` + `Drawer` | Desktop `w-64`, mobile `w-72`. Brand mark duplicated (`:275-276`, `:362-363`). Nav data is 3 arrays + `NavItem` interface (`:109-139`) |
| **Long-running bar / progress** | `App.tsx:683-685` (container bar), `App.tsx:939-941` (`MetricBar`), `GameServers.tsx:424-429` (install progress) | Yes | new `Meter` | All three are `h-1.5|h-2.5 w-full overflow-hidden rounded-full bg-muted` + inner `rounded-full` + inline `style={{width}}`. `App.tsx:925-929` and `GameServers.tsx:107-117` each hardcode their own threshold ladder |
| **Save-bar with dirty indicator** | `ServerVariables.tsx:150-173`, `ConfigEditor.tsx:570-593` | Yes | new `DirtySaveBar` | Nearly identical: notice-text-or-hint left, `Speichern` right, both `Loader2`→`Save` icon swap, both `disabled={busy \|\| !dirty}`, both an `Ungespeicherte Änderungen` amber pill (`ServerVariables.tsx:113`, `ConfigEditor.tsx:496`) |
| **"Ungespeicherte Änderungen" pill** | `ServerVariables.tsx:113-115`, `ConfigEditor.tsx:496-498` | Yes | `DirtyBadge` | Byte-identical: `rounded bg-amber-400/15 px-1.5 py-0.5 text-[11px] font-medium text-amber-300` |
| **Empty state** | `App.tsx:472-474`, `Https.tsx:88-93`, `Backups.tsx:282-287`, `Docker.tsx:245-259`, `Websites.tsx:348-358`, `Cloudflare.tsx:229-238`, `GameServers.tsx:370-377`, `FileBrowser.tsx:357-362`, `FileManager.tsx:302-305`, `Database.tsx:388-396`, `LoadingScreenEditor.tsx:1092-1097, 1281-1290`, `Chart.tsx:33-39`, `Ai.tsx:398-402`, `Settings.tsx:173-175`, `GameServerDetail.tsx:565-567` | **Yes — 16 sites** | new `EmptyState` | Two families: plain sentence in a bordered div (9x) and centred-with-icon (3x). The only one with an icon + guidance is `LoadingScreenEditor.tsx:1281-1290`. Only `Websites.tsx:354` tells the user what to do next |
| **Token/secret field with reveal toggle** | `Settings.tsx:286-293`, `Settings.tsx:510-517`, `Settings.tsx:621-628`, `Settings.tsx:712-719`, `Ai.tsx:590-592` | **Yes — 5 copies** | new `SecretInput` | 4 identical `absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground` overlay buttons. **`Settings.tsx:624` uses `bottom-2` not `top-1/2 -translate-y-1/2`** — the only one that differs, and it is wrong. **`Ai.tsx:590-592` has no `aria-label` and no `aria-pressed`** — a completely unnamed toggle |
| **Divider row** | `Settings.tsx:456-458` `SeparatorRow` (`<div className="h-px bg-border" />`) | Yes | `kit/separator.tsx` | `Settings.tsx` reimplements `Separator` as a `div` **in the same file that imports `Switch`/`Badge` but not `Separator`** |
| **Danger zone** | `GameServerDetail.tsx:643-672` only | No (1 site) | new `DangerZone` | `border-destructive/30` + `text-destructive` title + two buttons |
| **Wizard steps** | `SetupWizard.tsx:99-118` (dead page) | 1 site | new `Steps` | Progress dots + connecting bars; state derived from `state.current_step` |
| **Code / log viewer** | `GameServerDetail.tsx:564-574`, `FileBrowser.tsx:422-427`, `ConfigEditor.tsx:562-567`, `Database.tsx:1092-1099`, `LoadingScreenEditor.tsx:1353-1383`, `Security.tsx:113-115` (`<pre>`), `ConnectLinkDialog.tsx:220` (`<code>`), `GameServers.tsx:647-649` (`<pre>`) | Yes — 8 sites, 4 patterns | new `CodeBlock` | Log text is `text-green-300/90` on `#0a0a0c`; editor textareas use `bg-background`; `Security.tsx` uses `bg-muted`; `GameServerDetail` uses `#0a0a0c`. **Three different monospace-background conventions** |
| **Field-with-unit suffix** | `LoadingScreenEditor.tsx:1584-1609` `NumField` | 1 site (well built) | new `NumberField` | `Input` with `rounded-none rounded-r-none` + a `<span>` unit badge `border-l-0`. Commits on blur and on Enter, reverts on unparseable (:1593-1604). The best form control in the app, used in 1 place |
| **Coloured "action chip" button** | `Websites.tsx:429, 437, 479`, `Cloudflare.tsx:254-258`, `Https.tsx:168-172`, `Backups.tsx:334-356`, `Docker.tsx:366-397`, `Caddy.tsx:112-119`, `Notifications.tsx:177, 188, 194`, `DynamicDns.tsx:98-104`, `Security.tsx:46-52`, `Diagnostics.tsx:216-226`, `ServiceManager.tsx:173-180`, `GameServers.tsx:454-499` | **Yes — 13 pages** | **a `variant` on `Button`** | A fixed semantic palette of hand-written `variant="ghost"` + className: green=`bg-accent/15 text-accent hover:bg-accent/40`, amber=`bg-amber-900/60 text-amber-200 hover:bg-amber-800/60`, blue=`bg-blue-900/60 text-blue-200 hover:bg-blue-800/60`, purple=`bg-purple-900/60 text-purple-200 hover:bg-purple-800/60`, orange=`bg-orange-900/50 text-orange-200 border border-orange-800`, sky=`bg-sky-900/50 text-sky-200 border border-sky-800 hover:bg-sky-800/50`, red=`bg-destructive/10 text-red-300 hover:bg-red-800/40`. **None of this is in the `Button` cva**, so it is re-typed by hand ~40 times |

---

## 4. Repeated / duplicated implementations (exhaustive)

> Ordered by blast radius. "Winner" = the implementation that should become the shared primitive.

### D1 — The hand-painted "action chip" button. **~40 sites, 13 pages. The single largest duplication.**
The `Button` cva (`kit/button.tsx:9-20`) offers 6 variants. **13 of 14 pages bypass it** and hand-write a colour. The recurring literals, with counts:

| Literal className | Count | Sites |
|---|---|---|
| `px-3 py-1.5 rounded-none bg-accent/15 text-accent text-sm hover:bg-accent/40 disabled:opacity-40` | 8 | `Caddy.tsx:112`, `Https.tsx:82`, `Notifications.tsx:177`, `Websites.tsx:326` |
| `px-2 py-0.5 rounded bg-accent/15 text-accent text-xs hover:bg-accent/40 disabled:opacity-40` | 1 | `Backups.tsx:225` |
| `px-2 py-1 rounded bg-accent/15 text-accent text-xs hover:bg-accent/40 disabled:opacity-40` | 4 | `Docker.tsx:369`, `GameServers.tsx:462` |
| `px-3 py-1.5 rounded bg-accent/15 text-accent text-xs hover:bg-accent/40 disabled:opacity-40` | 1 | `FileManager.tsx:254` |
| `px-4 py-2 rounded bg-accent/15 text-accent text-sm hover:bg-accent/40 disabled:opacity-40` | 1 | `Notifications.tsx:177` |
| `px-3 py-1.5 rounded bg-amber-900/60 text-amber-200 text-sm hover:bg-amber-800/60` | 2 | `Caddy.tsx:113`, `Backups.tsx:239` |
| `px-2 py-1 rounded bg-amber-900/60 text-amber-200 text-xs hover:bg-amber-800/60 disabled:opacity-40` | 3 | `Docker.tsx:378`, `Backups.tsx:239`, `GameServers.tsx:486` |
| `px-3 py-1.5 rounded bg-blue-900/60 text-blue-200 text-sm hover:bg-blue-800/60` | 2 | `Backups.tsx:232,345`, `Notifications.tsx:188` |
| `px-2 py-0.5 rounded bg-purple-900/60 text-purple-200 text-xs hover:bg-purple-800/60` | 1 | `Backups.tsx:272` |
| `px-2 py-1 rounded text-muted-foreground text-xs hover:bg-destructive/20 hover:text-destructive` | 1 | `GameServers.tsx:498` |
| `px-3 py-1.5 rounded bg-muted text-muted-foreground text-sm hover:bg-muted` / `bg-muted text-xs` | 20 | `Docker.tsx:251,290,386`, `Https.tsx:171`, `Backups.tsx:337`, `FileManager.tsx:244,260,272`, `Cloudflare.tsx:257`, `Websites.tsx:485,500`, `GameServers.tsx:474`, `Caddy.tsx:115,116,118`, `Security.tsx:49`, `Diagnostics.tsx:72,221` |
| `px-2 py-1 rounded bg-destructive/10 text-red-300 text-xs border border-destructive/30 hover:bg-red-800/40` | 4 | `Backups.tsx:353`, `Websites.tsx:506`, `Cloudflare.tsx:187`, `FileManager.tsx:333` |
| `px-4 py-2 rounded bg-destructive/10 text-red-300 text-sm hover:bg-red-800/40` | 2 | `Notifications.tsx:194`, `FileManager.tsx:333` |
| `px-2 py-1 rounded bg-destructive/15 text-destructive text-xs hover:bg-destructive/30` | 1 | `Docker.tsx:394` |
| `px-2 py-1 rounded bg-sky-900/50 text-sky-200 text-xs border border-sky-800 hover:bg-sky-800/50` | 1 | `Websites.tsx:479` |
| `bg-orange-900/50 text-orange-200 border border-orange-800` | 1 | `Cloudflare.tsx:256` |
| `bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 hover:border-emerald-400/60` | 1 | `LoadingScreenMakerDialog.tsx:417,607` |
| `bg-muted border border-border text-muted-foreground hover:bg-muted` (neutral) | 8 | `Security.tsx:49`, `Diagnostics.tsx:72,221`, `DynamicDns.tsx:101,294`, `SetupWizard.tsx:149,156`, `ServiceManager.tsx:168` |
| `px-3 py-1.5 rounded text-xs` (bare, no colour) | 5 | `FileManager.tsx:254,260,266,272` |

**Winner: `kit/button.tsx`.** Add semantic variants (`success`, `warning`, `info`, `neutral`, `danger-subtle`) and a compact `size` so the `py-1.5`-without-`h-` problem (documented as a *stolperstein* in `ANLEITUNG_SHADCN_MIGRATION.md:193-201`) disappears structurally. Note that every one of these also fights the kit's `h-8` default with `h-auto` — that is the migration guide's own §6.2 pain point and it is still visible in the source today.

### D2 — Error / notice banner. **31 sites, 19 files, 4 visual dialects.**
Full breakdown in §3d "Inline error banner". Additional structural duplication: **`showNotice(msg)` is copy-pasted 3x with an identical 5 s timer** — `Cloudflare.tsx:84-87`, `FileManager.tsx:89-92`, `Websites.tsx:75-78`. The `msg`/`notice` state + `setError(null)`-on-dismiss + `schließen` `Button` triple is repeated 4x.
**Winner: a new `Alert` component** (`variant: info|success|warning|destructive`, `dismissible`, `onDismiss`). The `bg-red-950/50` family is used 7x and is *not* a token — it should map to `bg-destructive/10`.

### D3 — Hand-rolled `<table>`. **8 pages bypass the `Table` kit entirely.**
`Ai.tsx:274, 479` (2 tables), `Backups.tsx:291`, `Cloudflare.tsx:218`, `Docker.tsx:313`, `FileManager.tsx:307`, `Https.tsx:106`, `Websites.tsx:338`.
All 8 use the **same** header literal: `<thead className="bg-background text-muted-foreground">` + `<th className="px-4 py-3 font-medium">` + `<tbody className="divide-y divide-border">` + `<tr className="hover:bg-muted/50">` + `<td className="px-4 py-3 ...">`.
The kit (`kit/table.tsx`) uses `h-12 px-4` heads, `p-4` cells and `border-b` rows — i.e. **the two table systems do not agree on padding at all**, and the 8 raw tables are internally consistent with each other. Six of them render **all** rows with no pagination.
**Winner: `kit/table.tsx`** — but it must first be given the `px-4 py-3` rhythm and a `TableEmptyRow`, otherwise the migration costs more than it saves. `Docker.tsx:313` also drops `<caption>`/`scope` entirely.

### D4 — Status semantics re-implemented 5x (label text + colour + shape, per wire union).
`Https.tsx:211-234` (`StatusBadge`), `Backups.tsx:32-56` (`statusStyle`+`statusLabel`), `Websites.tsx:187-198`+`:533-548`, `GameServers.tsx:106-132`, `GameServerDetail.tsx:302-332`, `Docker.tsx:127-142` (`StateText`). See §3d "Status badge/pill" for the German-wording divergence. `GameServerDetail.tsx:326-332` is the only place that uses the kit `Badge` variants (`secondary`/`default`/`outline`/`destructive`) *and* a coloured dot *and* the label — three representations of one status, in one block.
**Winner: one `StatusBadge` + one `statusMeta` registry** keyed by the wire string, since the wire types already exist and are shared (`api.ts:173-179, 277-283, 976-981, 1019`).

### D5 — "Lade …" loader. **8 sites, 5 byte-identical wrappers.**
`Ai.tsx:72-77`, `DynamicDns.tsx:70-76`, `GameServerDetail.tsx:291-296`, `GameServers.tsx:298-304`, `SetupWizard.tsx:61-67` all render exactly `<div className="flex items-center justify-center h-64"><div className="text-muted-foreground">Lade …</div></div>`. `ServiceManager.tsx:59-61`, `Database.tsx:352` and `FileManager.tsx:301` are inline variants.
**Winner: a new `PageLoader`,** built on `kit/skeleton.tsx`, which is already written, already token-compliant, and **completely unused**.

### D6 — Refresh button. **15 sites; 1 literal repeated 8x.**
`"px-3 py-1.5 rounded-none bg-muted text-sm text-muted-foreground hover:bg-muted"` appears verbatim at `Docker.tsx:253,290`, `Https.tsx:171` (minus `rounded-none`), `Backups.tsx:337`, `Cloudflare.tsx:257`, `FileManager.tsx:272`, `Security.tsx:49` (as `h-auto px-4 py-2`), `Diagnostics.tsx:72` (as `h-auto px-4 py-2`). `Security.tsx:49` and `Diagnostics.tsx:72` are **byte-identical except the label**. `App.tsx:411-417` renders **two** buttons for one action, switching on `sm:` with identical handlers.
`Caddy.tsx:53-61` factors the same idea into a local `btn(action, label, style)` closure — the only page that noticed the repetition, and it still bakes the styling into a string argument.
**Winner: a new `RefreshButton`** with `busy` and `label` props, so the `RefreshCw` spin swap stops being hand-written 13 times.

### D7 — Secret field with reveal toggle. **5 copies, 1 broken.**
`Settings.tsx:286-293`, `:510-517`, `:621-628`, `:712-719`; `Ai.tsx:590-592`. The first three are identical; the fourth uses `bottom-2` (wrong vertical alignment, `Settings.tsx:624`); the fifth (`Ai.tsx:590`) has **no `aria-label`, no `aria-pressed`, and no tooltip** — an unnamed icon-only button.
**Winner: new `SecretInput`.**

### D8 — Summary/stat tile. **6 named functions, 3 incompatible `color` prop vocabularies.**
`Monitoring.tsx:41` `StatCard({label,value,sub,online})` · `Backups.tsx:368` `SummaryCard({label,value,color:"slate"|"emerald"|"amber"|"red"})` · `Https.tsx:187` `SummaryCard({label,value,color:"emerald"|"amber"|"orange"|"red"})` · `Security.tsx:91` `SummaryCard({label,count,color:"text-accent"})` — **`color` is a raw class string here and a token name in the other two** · `Diagnostics.tsx:151` `InfoCard({label,value})` · `ServiceManager.tsx:152` `ActionCard({title,description,loading,variant:"primary"|"danger"})` — a *button*, named like a card.
**Winner: new `StatTile`** with a `tone` prop over the semantic palette; `ActionCard` is a different component entirely and should be `Button variant` + `Card`.

### D9 — Save-bar with dirty indicator. **2 near-identical implementations.**
`ServerVariables.tsx:150-173` vs `ConfigEditor.tsx:570-593` — same left notice/hint, same `Speichern`, same `Loader2`→`Save`, same `disabled={busy || !dirty}`, and the *"Ungespeicherte Änderungen"* pill is byte-identical at `ServerVariables.tsx:113` and `ConfigEditor.tsx:496`.
**Winner: new `DirtySaveBar`** + `DirtyBadge`.

### D10 — Empty state. **16 sites, 2 families, 9 identical class strings.**
`rounded-none border border-border p-5 text-muted-foreground text-sm` (6x) vs `p-5 border border-border bg-card rounded-none` (`GameServers.tsx:371`). `Cloudflare.tsx:229-238` and `Websites.tsx:348-358` are the only ones implemented as a `colSpan` row inside the table (which is the right answer). `LoadingScreenEditor.tsx:1281-1290` is the only one with an icon + guidance + dashed border.
**Winner: new `EmptyState`** (`icon`, `title`, `description`, `action`), plus `TableEmptyRow` for the in-table case.

### D11 — Confirm-on-destructive. **Applied 11x via `useConfirm`, skipped in at least 4 destructive places.**
Confirming (11 call sites): `App.tsx:209, 228`, `Backups.tsx:124, 145, 166`, `Cloudflare.tsx:90`, `FileManager.tsx:214`, `FileBrowser.tsx:164`, `GameServers.tsx:280`, `GameServerDetail.tsx:199, 236`, `Notifications.tsx:64`, `LoadingScreenMakerDialog.tsx:751, 761`.
**Not confirming, despite being destructive:**
- `Docker.tsx:184-199, 391-397` — **`deleteContainer` runs with no confirmation at all.** One click on a "Löschen" chip destroys a container.
- `Diagnostics.tsx:216-226` — recovery actions mutate the system; `action.safe` is shown as a `nicht sicher` pill (`:211`) but there is **no confirmation for unsafe actions** (`handleExecute` :45-64 has none).
- `Database.tsx:702-745, 812-859, 1009-1054` — `dropDbTable`/`dropDbColumn`/`deleteDbRow` use a *typed-name* dialog, a **stronger** pattern than `useConfirm` and inconsistently applied (`DropTableDialog` :713 requires typing the table name, `DeleteRowDialog` :1009 requires nothing).
- `Cloudflare.tsx:252-261` (`toggleProxy`), `Https.tsx:168-175` (`checkCertificateHttps`) — correctly not confirming.
**Winner: `kit/confirm-dialog.tsx` + a `typeToConfirm` extension.** The Database typed-confirm pattern (`Database.tsx:713-714, 827`) is the better one and is currently the *only* implementation.

### D12 — Feedback channel. **4 competing mechanisms for the same event.**

| Mechanism | Where | Count |
|---|---|---|
| Radix toast (`toast()` / `useToast().toast()`) | `ServerVariables.tsx:56`, `ConfigEditor.tsx:233,281,304`, `FileBrowser.tsx:126,135,154,175,188,204,220,235,246`, `LoadingScreenEditor.tsx:974,976`, `LoadingScreenMakerDialog.tsx:273,312,348`, `Database.tsx:137,139,1069,1072`, `Settings.tsx:76,88,95,231,235,241,246,430,433,475,481,486,552,558,563,573,576,661,667,672,681,685` | 26 calls |
| inline `notice`/`msg` state + banner | `Cloudflare.tsx:131-135`, `Websites.tsx:203-207`, `Backups.tsx:208-218`, `FileManager.tsx:280-284`, `ConfigEditor.tsx:571-579`, `ServerVariables.tsx:151-159`, `Https`/`Security`/`Diagnostics` results | 7 pages |
| `console.error` only | `App.tsx:643, 704, 767, 1058`, `Ai.tsx:162` | 5 sites — **errors swallowed with no user-visible feedback at all** |
| nothing | `Docker.tsx:143-199` (a single `setNotice` on a `span`), `Caddy.tsx:74` | 2 |

Worse: **`ServerVariables.tsx:55-59` and `ConfigEditor.tsx:280-281, 303-304` emit BOTH a toast and an inline notice for one action.** `Settings.tsx:74-78, 86-90, 93-97` defines the **same `notify` closure three separate times**.
**Winner: one `useNotifier()` returning `{ notify, inlineError }` bound to the shared `Alert` + a single toast policy.**

### D13 — Sidebar navigation. **The same JSX block twice.**
`App.tsx:286-291` and `App.tsx:369-373` are the identical three `<NavGroup>` calls; `App.tsx:275-276` and `App.tsx:362-363` are the identical brand mark. `NavButton` (`App.tsx:508-532`) is a raw `<button>` with no `aria-current`; the active state is `bg-accent text-accent-foreground` — **the same colour as the focus ring** (§2, §6 G8).
Also duplicated: `SYSTEM_NAV` gives `ddns` the **same `LayoutGrid` icon as `dashboard`** (`App.tsx:15, 117, 129`) — a copy-paste bug.
**Winner: a `Nav` primitive + one `<Drawer>` wrapping the same `Nav`.**

### D14 — 12 raw form controls that bypass the kit.
`DynamicDns.tsx` — 6 `<input>` (`:154, 203, 217, 231, 251, 278`) + 1 `<select>` (`:165`) + 7 `<label>`; `Websites.tsx` — 9 `<input>` (`:253, 261, 268, 290, 301, 312, 372, 394, 404`) + 1 `<select>` (`:279`) + 4 `<label>`; `Cloudflare.tsx` — 1 `<select>` (`:200`) + 1 `<label>` (`:199`); `Notifications.tsx` — 3 `<input>` (`:149, 158, 167`); `Database.tsx` — 3 `<input>` (`:579, 587, 789`) + 4 `<label>`; `SetupWizard.tsx` (dead) — 4 + 4; `Ai.tsx` — 1 `<select>` (`:434`); `Settings.tsx` — 4 raw `<button>` (`:286, 510, 621, 712`); `FileBrowser.tsx` — 2 hidden `<input type=file>`; `LoadingScreenEditor.tsx` — 2 hidden `<input type=file>`; `App.tsx:519` + `Database.tsx:238` — 2 raw `<button>`; `ConnectLinkDialog.tsx:239` — 1 raw `<a>` styled as a button.
All 14 raw `<label>`s use `className="block text-sm text-muted-foreground mb-1|2"` — a house style written 14 times outside the kit. This is exactly the debt `src/AGENTS.md:12-14` and `ANLEITUNG_SHADCN_MIGRATION.md:41-56` describe as open; the instruction file's own table is stale (it claims `components/ui/`, and its counts no longer match).
`DynamicDns.tsx:209, 223, 237` uses `as any` on the `DdnsProvider` union — the **pre-existing TS error** documented in `ANLEITUNG_SHADCN_MIGRATION.md:203-208` is still there, now suppressed with `as any` rather than left as an error. `npm run typecheck` passes because the cast silences it.

### D15 — Panel/section wrapper string. **31 sites.**
`rounded-none bg-card border border-border` (+ `p-4`/`p-5`/`p-6`) at 31 sites in 15 pages, while 6 pages use `kit/card.tsx` correctly (`App.tsx`, `GameServers`, `GameServerDetail`, `Settings`, `Database`, `Ai`). Same visual, two mechanisms, three paddings.
**Winner: `kit/card.tsx`** (after its padding is made overridable rather than fought).

### D16 — Polling loop. **21 `setInterval`s, 13 files, no shared hook.**
`App.tsx:180` (5 s), `:646` (5 s), `:707` (5 s), `:770` (30 s), `:1010` (60 s), `:819` (5 s) · `Docker.tsx:162` (15 s) · `Caddy.tsx:35` (15 s) · `Backups.tsx:92` (15 s) · `Websites.tsx:71` (15 s) · `Cloudflare.tsx:44` (15 s) · `Notifications.tsx:46` (15 s) · `Https.tsx:36` (30 s) · `Ai.tsx:67` (30 s) · `Monitoring.tsx:149, 152` (5 s + 15 s) · `GameServers.tsx:182, 183, 200` (15 s, **1 s clock**, 2 s install) · `ServerModeOverlay.tsx:54` (3 s) · `GameServerDetail.tsx:150` (1 s `fit.fit()`).
Eleven files each declare their own `const POLL_MS = 15000` (or `STATUS_POLL_MS`/`METRICS_POLL_MS`) — **11 independent constants with 4 different names for the same idea**. Three patterns for the cleanup: `window.setInterval` + `clearInterval` (10x), a `useRef` holding the handle (`Monitoring.tsx:121, 149, 158`), and a `cancelled` boolean (`App.tsx:638`, `:699`, `:762`; `ServerModeOverlay.tsx:39`; `Monitoring.tsx:124`). **No page has visibility-based pausing, backoff, or abort.**
**Winner: a `usePolling(fn, ms, {enabled, pauseWhenHidden})` hook** — this is the single highest-value extraction in the codebase.

### D17 — Dead code (7 groups).
- `src/components/kit/avatar.tsx` (50 L) + `@radix-ui/react-avatar` — **imported nowhere**.
- `src/components/kit/skeleton.tsx` — **imported nowhere**.
- `@radix-ui/react-slot` — **imported nowhere**.
- `src/pages/SetupWizard.tsx` (275 L) — **never imported by `App.tsx`**. Dead.
- `src/pages/ServiceManager.tsx` (182 L) — **never imported by `App.tsx`**. Dead.
- `tw-animate-css` — installed, never imported (§2).
- `@fontsource-variable/geist`, `@fontsource-variable/nunito` — installed, never imported.
- `@fontsource/lilita-one` — imported, never used in app CSS.
- Unused kit exports: `kit/scroll-area`'s `ScrollBar`; `kit/dropdown-menu`'s `CheckboxItem`/`RadioItem`/`Label`/`Shortcut`/`Group`/`Sub`/`SubContent`/`SubTrigger`/`RadioGroup`; `kit/select`'s `ScrollUpButton`/`ScrollDownButton`; `kit/table`'s `TableFooter`/`TableCaption`; `boxShadow.card`; `boxShadow.sidebar`; `.glass-grid`; `.bg-card` in `styles.css`.

### D18 — 3 dead API functions still wired to UI.
`serverModeOverlay` (`api.ts:1352-1356`) is documented as a "Browser no-op" but is called from `App.tsx:827` and `ServerModeOverlay.tsx:31, 47` as if it did something. `restartService` (`api.ts:1279-1281`) returns a *sentence*, and `App.tsx:208-220` gives it a confirm dialog, a spinner and an error path. `ensureServiceRunning`/`ensureCaddyRunning` (`api.ts:1269-1277`) are called in a chain at `App.tsx:174-178` purely for the side effect of *returning a string nobody reads* — and their return strings are the two mojibake ones.

---

## 5. UX patterns observed

### Navigation model
Single-window, no URL routing. `App.tsx:89-107` defines a 19-member `PageKey` union; `App.tsx:166` holds it in `useState`. `navigate(p)` (`:254-258`) sets the page, clears `selectedServerId` and closes the drawer. **Deep-linking is impossible** — a reload always lands on `"dashboard"`. `game-server-detail` is a pseudo-route carrying `selectedServerId` (`:167`) and is the one place with a back affordance (`GameServerDetail.tsx:320-322`, `:448`).
Sidebar = 3 nav groups from 3 arrays (`SERVICES_NAV` `:116-122`, `SYSTEM_NAV` `:124-130`, `DATA_NAV` `:132-139`) with 3 group titles: **"Allgemein"**, **"Web & Netzwerk"**, **"System & Daten"**. `PageKey` contains `"logs"` (`:107`) which is never rendered and is not in any nav array; `titleFor` (`:143-149`) therefore returns the raw string `"logs"` for it, and the fallback branch (`:453-475`) renders *"Bereich logs in Vorbereitung."* That fallback array (`:454-470`) is itself a **hand-maintained duplicate of the render switch above it** and already omits `ai` and `game-servers` — two sources of truth that can silently disagree.
Header (`App.tsx:381-418`): hamburger (`< lg`), page title + subtitle, a status pill, a refresh button. `PAGE_SUBTITLES` (`:151-158`) covers only 5 of 19 pages.

### Page structure
`App.tsx:420` is the content frame: `flex-1 overflow-y-auto p-4 md:p-6`. Pages are `<section className="space-y-6">`. Three pages break the pattern: `GameServers.tsx:328` (`space-y-5`), `GameServerDetail.tsx:312` (`space-y-4`), `Ai.tsx:80` (`space-y-6` but with a `Tabs` root). Every page's own header is redundant with `App.tsx:381-418` — e.g. `GameServers.tsx:335-346` re-states the title and the count, `ServiceManager.tsx:57` and `SetupWizard.tsx:96` render an `<h2>` the app shell already displays as an `<h2>`.

### Status / polling model
- `App.tsx:141` `STATUS_POLL_MS = 5000` — the app shell polls `getServiceStatus()` forever (`App.tsx:180-183`).
- **The dashboard runs 6 concurrent timers**: `/status` 5 s (`App.tsx:180`), containers 5 s (`:646`), game servers 5 s (`:707`), server mode 5 s (`:819`), websites 30 s (`:770`), public IP 60 s (`:1010`). Three of them all hit `/api/v1/status` every 5 s.
- Backend probe cadences differ from the frontend's: `docs/ARCHITECTURE.md:106-115` says system metrics 5 s, engine 15 s, Caddy 20 s, websites 45 s, ModelMesh 120 s. **The UI polls faster than the data changes** — 5 s for a 20 s Caddy probe, 30 s for a 45 s website probe.
- Freshness is shown in exactly 3 places: `Monitoring.tsx:180` (*"zuletzt {time}"*), `Security.tsx:71` (*"Letzter Scan"*), `DynamicDns.tsx:126` (*"Letztes Update"*). 11 other polling pages show no timestamp.
- `getServiceStatus` **never throws** — it catches and returns `{reachable:false, message}` (`api.ts:144-163`). So `App.tsx:186-196`'s `catch` is dead, and every consumer must check `.reachable` rather than rely on the catch. `Monitoring.tsx:133-135` does check.
- **A real bug in the Caddy page**: `Caddy.tsx:64-65` computes `status.message.startsWith("online")`, but `getCaddy()` overwrites the message with `""` (`api.ts:260-263`). So `online` is **always `false`** and the status line at `Caddy.tsx:71` always renders in `text-amber-400` even when Caddy is running.

### Feedback model
- **Toasts** (26 call sites) vs **inline banners** (7 pages) vs **`console.error` only** (5 sites) vs **nothing** (2 sites) — see D12. `use-toast.ts:11` `TOAST_LIMIT = 1` means a burst of two notifications shows only the newest, and `:12` `TOAST_REMOVE_DELAY = 1_000_000` means dismissed toasts linger in memory for ~17 minutes.
- `TOAST_LIMIT=1` is why `Database.tsx:135-141` centralises writes through `showWrite()` and why `Settings.tsx` threads a `notify` callback down 4 levels instead of importing the singleton `toast` directly (it does also call `useToast()` three separate times in one file: `:36`, `:216`, `:1057`).
- Positive/negative framing is inconsistent for the same severity: success is `bg-accent/10` on 5 pages and `bg-emerald-500/10` on 2; error is `text-destructive` on some and `text-red-300` on others.

### Error handling
- Every page keeps `error: string | null` from a `try/catch`, and `String(e)` is the universal conversion (28 sites). This produces raw `Error: <message>` strings in the UI — e.g. a rejected fetch shows `Error: Failed to fetch`.
- The prefix `"IPC-Fehler: "` (`Caddy.tsx:78`, `Docker.tsx:240`, `Monitoring.tsx:184`, `Websites.tsx:210`) is factually wrong; the transport is HTTP (`api.ts:30`).
- 5 places swallow errors entirely with a bare `catch {}` and no user feedback: `App.tsx:643, 704, 767, 1058` and `Ai.tsx:162`. `App.tsx`'s are all inside polling loops — a permanently unreachable service leaves the dashboard showing "0 von 0" forever.
- `ServerVariables.tsx:61-63` and `ConfigEditor.tsx:194-196, 234-236` surface errors inline **and** keep the panel usable; that is the best behaviour in the app.
- **`FileManager.tsx` contains real double-encoded UTF-8 (mojibake) in 12 user-visible strings** — verified at the byte level (the file literally contains U+00E2 U+20AC U+00A6, i.e. `â€“`, not U+2013). Affected lines: `62, 102, 172, 206, 226, 240, 246, 292, 301, 311, 312, 320, 325, 335` — including the two table headers *"GrÃ¶ÃŸe"* and *"GeÃ¤ndert"*, the button label *"LÃ¶schen"*, the loading text *"Lade Dateienâ€¦"*, and the emoji directory markers `ðŸ“`/`ðŸ“`. **`api.ts:1276, 1280`** have the same defect in German error sentences. A shared library must not inherit this; a repo-level `utf-8`/encoding guard is needed.

### Empty states
16 sites (D10). The best is `LoadingScreenEditor.tsx:1281-1290` (icon + sentence + dashed frame). The most common is a bare sentence in a bordered div. Only `Websites.tsx:354` includes a next action (*"Klicke auf „+ Neue Website" um zu starten."*). `GameServers.tsx:370-377` correctly distinguishes "no data" from "filtered out" (*"Noch keine Game-Server angelegt."* vs *"Keine Server gefunden, die auf den Filter passen."*) — the only place that does.

### Loading states
5 identical full-page loaders, 3 inline text loaders, and **zero uses of `Skeleton`** even though it is implemented. There is no `aria-busy` and no `aria-live` on any loading state, so a screen-reader user gets no announcement that data is on the way. The 8 "Lade …" strings use the single-character ellipsis `…` (U+2026) consistently — 64 occurrences across 24 files — which is the right typographic choice and *is* consistent.

### Destructive-action confirmation
D11. The `useConfirm()` promise API (`confirm-dialog.tsx:80-110`) is the house pattern and is used 11x. It is bypassed for container deletion (`Docker.tsx:391-397`) and for unsafe recovery actions (`Diagnostics.tsx:216-226`). The Database page's typed-name confirmation (`Database.tsx:713-714, 827`) is strictly stronger and exists exactly once.

### Forms and validation
- **No form library, no validation library, no schema.** Validation is ad-hoc: `disabled={!name.trim() || !eggName}` (`GameServers.tsx:674`), `disabled={!serverUrl.trim() || !topic.trim() || loading}` (`Notifications.tsx:176`), `disabled={saving || !apiKey.trim()}` (`Ai.tsx:593`), `ok = confirm.trim() === target` (`Database.tsx:714, 827`).
- Exactly one `required` attribute in the whole codebase: `Websites.tsx:260`.
- Cross-field validation exists in exactly 2 places, both in `Settings.tsx`: password confirmation (`:230-233`) and non-empty token (`:474-477, 551-554, 660-663`).
- **Password strength is not validated at all** (`Settings.tsx:229-250` accepts any string).
- Error display for validation is a **toast**, not an inline field error (`Settings.tsx:231, 235, 246`), so the message appears in the corner while the offending field is elsewhere on the page.
- `DynamicDns.tsx` is the only page with a real multi-field form and it uses 6 raw `<input>` + 1 raw `<select>` + 7 raw `<label>`, with `as any` casts at `:209, 223, 237`.
- `Websites.tsx:249-331` is a raw `<form onSubmit>` with 9 inputs, 1 select, 4 labels, 3 checkboxes, `required` on one field, and **no error display at all** — failures land in the top-level `error` banner at `:208-218`.
- Number inputs: `type="number"` with `min`/`max` in `DynamicDns.tsx:278-285` and `SetupWizard.tsx:240-257`; `GameServerDetail.tsx:613-623` uses `type="number"` with a `placeholder` instead. `LoadingScreenEditor`'s `NumField` (`:1562-1612`) is the only one that clamps, reverts on parse failure and commits on Enter.
- `Select` (Radix) is used in 4 files; the other 3 selects are raw.
- Disabled-while-busy is inconsistent: `GameServerDetail.tsx:608, 622` disables the dev-server inputs while busy; `GameServers.tsx:631, 633, 638` does not disable the create form while `creating`.

### Keyboard support
- **Radix gives it** wherever Radix is used: dialog focus trap + restore, `Select` typeahead, `Tabs` roving tabindex, `Tooltip` Escape, `DropdownMenu` arrow keys, `Toast` F6/arrow keys.
- **Everything hand-rolled has none.** The clickable `Card`s (`App.tsx:596-603, 655, 715, 777`; `GameServers.tsx:384-388`) are `<div onClick>` — **6 status cards and every game-server card are unreachable by keyboard**. `NavButton` is a real `<button>` so it is focusable, but has no `aria-current`.
- `FileBrowser.tsx:330-333` — the one place a raw `onKeyDown` is used well: Enter submits, Escape cancels, with `autoFocus`.
- `ConfigEditor.tsx:422-424` — Enter loads the path.
- `Ai.tsx:447-452` — Enter sends the chat message.
- `ServerModeOverlay.tsx:61-74` — a 3x-Escape-within-2 s gesture to exit server mode; a real feature, entirely keyboard-driven, documented only in the hint panel (`:106-117`).
- `LoadingScreenEditor.tsx:836-944` is by far the most complete keyboard model in the app, and it publishes a cheat-sheet footer (`:1443-1457` via `KbdCheat`) — the only page that documents its own shortcuts. **That footer is `flex` with no wrap, so below ~1280 px the cheat sheet is clipped** (`:1456` hides only the last item with `hidden min-[1280px]:inline`).
- Tab order in `GameServerDetail.tsx:319-377` puts 6 action buttons in a row before any content; tab order in the `FileBrowser` row is 5 unlabeled icon buttons per row x N rows.

### Responsive strategy
- **Only `lg:` is structural** (`App.tsx:270`, `:358`). The Tauri window minimum is 980 px (`tauri.conf.json:18-19`), which is *below* `lg` — **so the default desktop window shows the mobile drawer, and the desktop sidebar is unreachable without resizing the window past 1024 px.** This is the single most consequential responsive finding.
- The mobile drawer (`App.tsx:357-376`) is `w-72` with a `bg-black/60` backdrop that closes on click; it has no close-on-Escape, no focus trap, and the app's main content stays interactive behind it.
- `App.tsx:393-410` hides the status pill below `md`; `App.tsx:411-417` renders **two** refresh buttons, one `hidden sm:inline-flex` with a text label and one `sm:hidden` icon-only — the only deliberate content-substitution responsive pattern in the app, done inline rather than by a component.
- Grids reflow at `sm`/`md`/`xl` throughout; `GameServerDetail.tsx:390` and `:601` use `sm:grid-cols-2`; `LoadingScreenEditor`'s two side panels are **fixed width** (`w-[16.5rem]` :1045, `w-[19.5rem]` :1406) with no responsive collapse — inside a `DialogContent` at `max-w-[94vw]` (`LoadingScreenMakerDialog.tsx:467`). Below ~600 px of dialog width the canvas has zero space.
- `Websites.tsx:437` and `Https.tsx:156` use `max-w-xs` truncation; `GameServerDetail.tsx:404,425,431` use `break-all` on paths. `truncate` is used pervasively for text that is often *the only* copy of a value (e.g. `Diagnostics.tsx:155` truncates the Caddyfile path with no tooltip; `Caddy.tsx:105-106` `break-all`s it).
- `viewport-fit=cover` is set (`index.html:5`) but there is no `env(safe-area-inset-*)` usage anywhere.

### Table UX
- **Two incompatible table systems** (D3). The kit's `Table` is used in 2 files; 8 files hand-roll `<table>`.
- Column density is very high: `Docker.tsx:314-323` has 7 columns including a truncated 12-char container ID (`ShortId` :111-113) and a port map string built by `Ports()` (:115-125). At 980 px minimum width this overflows; `Docker.tsx:312` wraps it in `overflow-x-auto`, but only 3 of the 8 raw tables do.
- Row action affordances are inconsistent: text chips (`Docker`, `Websites`, `Backups`, `Https`, `GameServers`) vs bare icons with no label (`FileBrowser`, `Database`).
- **No table has a `<caption>`**, and no `th` has `scope`. The kit offers `TableCaption` (`table.tsx:96-106`) and it is exported and unused.
- **No sorting anywhere.** `GameServers.tsx:315-323` filters in memory; `Websites.tsx:359-364` sorts the dashboard site to the top in memory; `Database.tsx` supports `orderBy`/`orderDir` in the API (`api.ts:1525-1543`) but `getDbTableRows` is called with only `page`/`pageSize` (`Database.tsx:107`) — **the sorting capability exists end-to-end and is simply not wired up**.
- **Only `Database.tsx` paginates** (`PAGE_SIZE = 25`, `:57`, server-side, with Zurück/Weiter at `:531-538`). Every other table renders every row. `Ai.tsx:490` fetches **all** usage records (`mmListUsage()`, `:51`) and then `slice(0, 50)` client-side; `:246` also has a bug: `models.length - 12` where it means the *enabled* count.
- Row hover is `hover:bg-muted/50` in all 8 raw tables and in `kit/table.tsx:61` — that one is consistent. Selection (`data-[state=selected]`) is styled but unused.
- Number alignment is not considered: `Backups.tsx:306-317` puts a date, a kind, a source, a size and a status in a `text-left` table with no `tabular-nums` anywhere in the app.

### Long-running operation UX
- **Game-server install** is the most developed: `GameServers.tsx:64-100` maps `InstallProgress` to a German sentence, `progressFor()` (:64-71) synthesises a percentage from `phase` when the server does not send one, a 1 s clock tick (`:183`) keeps the elapsed counter live, a 2 s poll (`:200`) fetches per-server progress, and a bar + ETA + last log line are shown (`:422-438`). This is the best long-running UX in the app.
- **Everything else has no progress at all**: `Backups.handleCreate` (`:96-108`) awaits a full backup with no spinner beyond the button label; `Https.handleCheck` (`:40-59`) tracks per-domain `checking` state correctly; `Database`'s writes use one global `busy` flag (`:83, 143-155`) which disables everything app-wide.
- **No abort/cancel anywhere.** `api.ts:29` `apiFetch` takes no `AbortSignal`, so no in-flight request can be cancelled — including the `file.arrayBuffer()` + `uploadSiteFile` loop in `FileManager.tsx:121-130, 168-183`, which uploads N files sequentially with no cancel button and no aggregate progress.
- `FileManager.uploadTree` (`:160-190`) sorts by path depth ascending so parents exist before children, and skips `node_modules/`, `.git/`, `.next/`, `__MACOSX/` (`:173`) — good defensive behaviour, no progress UI.
- Polling *continues while a dialog is open and while a mutation is in flight* (e.g. `GameServerDetail` keeps the App-level 5 s `/status` poll running; `LoadingScreenMakerDialog` re-reads slot state on open only, not on a timer).

### German terminology (source strings, for the shared library's copy deck)
Nouns/labels in use, exactly as written: **"Übersicht"**, "Startseite", "Websites", "Hosting verwalten", "KI-Routing & Modelle", "Dienste", "Container starten & stoppen", "System", "CPU, RAM, Netzwerk", "Web & Netzwerk", "System & Daten", "Caddy", "Cloudflare", "Game-Server", "HTTPS", "Dyn. DNS", "Backups", "Datenbank", "Security", "Diagnose", "Alarme", "Einstellungen", "Schnellzugriff", "Servermodus", "Systemauslastung", "Öffentliche Erreichbarkeit", "Dienste sind im Internet erreichbar", "Noch keine Dienste öffentlich veröffentlicht.", "Läuft" / "Gestoppt" / "Nicht erreichbar", "Neuer Ordner", "Ordner laden", "ZIP entpacken", "Ordner leer", "Hochladen", "Wiederherstellen", "Aufräumen", "Alte löschen", "Gesamtgröße", "Podman-Volumes", "sichern", "Gültig", "Warnung", "Kritisch", "Abgelaufen", "Fehler", "Erfolgreich", "Fehlgeschlagen", "Ausstehend", "nicht sicher", "Verbindung trennen", "Proxied" / "DNS only", "Publish-Token hinterlegt", "Ohne Token (anonym)", "Token entfernen", "Test senden", "Neue Website erstellen", "Erweiterte Optionen (Domain, HTTP-Weiterleitung, etc.)", "Keine Domain", "Öffentliche IP", "▶ Lokal öffnen", "Gesperrt", "Fehler:", "IPC-Fehler:", "schließen" / "Schließen" (both capitalisations), "Lade …", "Speichern" / "Speichere…" / "Speichere." (three variants for one verb: `Settings.tsx:309, 520, 594`), "Verbinden" / "Verbinde…" / "Verbinde." (`:632, 721`), "Trennen" / "Trenne…" / "Trenne." (`:636, 726`), "Ungespeicherte Änderungen", "Gefahrenzone", "Server löschen", "Neu installieren" / "Installiere neu…", "Dev-Server anlegen" / "Erstelle…", "Konsole öffnen" / "Verbunden", "Keine Container-Logs (Container läuft nicht?)", "Wähle links eine Tabelle aus.", "Noch keine Messwerte vorhanden.", "Alles läuft", "Read-only SQL-Konsole", "In welchen Slot speichern?", "Überschreiben", "Aktivieren", "Vollbild", "Kein Loadingscreen aktiv".

Copy defects found: `"Speichere."` / `"Verbinde."` / `"Trenne."` (a full stop where an ellipsis belongs) at `Settings.tsx:520, 633, 722, 726`; `"Close"` in `kit/dialog.tsx:49`; `"IPC-Fehler"`; `"Bereich logs in Vorbereitung."`; the double-encoded UTF-8 in `FileManager.tsx` + `api.ts`. The `…` vs `...` mix is actually clean (all `…`).

---

## 6. Accessibility audit

### Good practices present (worth keeping)
- `kit/dialog.tsx` is a faithful Radix wrapper: focus trap, `aria-modal`, initial focus, focus restore, Escape. `DialogTitle`/`DialogDescription` are wired in **every** dialog usage except `FileBrowser.tsx:419-421`, which has a `DialogTitle` but **no `DialogDescription`**. Otherwise: `GameServers.tsx:522-527`, `Database.tsx:627-632, 678-683`, `ConnectLinkDialog.tsx:133-142`, `LoadingScreenMakerDialog.tsx:481-493` all pair them.
- `Chart.tsx:55-56` — `role="img"` + a German `aria-label`.
- `LoadingScreenEditor.tsx` `IconBtn` sets `aria-label` on every icon-only button (`:1492`), `ToggleBtn` sets both `aria-label` and `aria-pressed` (`:1521-1522`), and the alignment/aspect button groups set `aria-pressed` (`:1849, 2043`). **This is the only component in the app that gets icon-only buttons right.**
- `Settings.tsx:186, 200` — `aria-label` on a `Badge` and a `Switch` conveying the state in words (`"Zustand: ${mod.state}"`, `"${mod.name} deaktivieren"`).
- `ServerVariables.tsx:113-115` and `ConfigEditor.tsx:496-498` — the dirty state is a **text pill**, not only a colour.
- `App.tsx:405-409` — the header status pill pairs the colour with the word "Alles läuft" / the service message.
- `App.tsx:615-618, 793-795` — status dots are always accompanied by text.
- `GameServers.tsx:586-593` — "Erweiterte Optionen" sets `aria-expanded`.
- `tabIndex={-1}` on the fullscreen iframe (`LoadingScreenMakerDialog.tsx:703`) removes a non-interactive frame from the tab order.
- Global focus reset: `styles.css:32-38` sets a border colour for `*`; `*::selection` is defined (`:62-65`).
- Radix `Toast` provides its own `aria-live` announcement; `ToastTitle`/`ToastDescription` are used correctly in `toaster.tsx:20-23`.
- 27 `focus-visible` / `focus:ring` declarations — the *intent* is there.

### Gaps, with file:line

**G1 — No form label is ever associated with its control. (Critical, 30+ fields)**
`htmlFor` appears **0 times** in the entire frontend. Every `<Label>` is decorative:
- `GameServers.tsx:531, 540, 599, 623-628, 646` — 5 labels, no `htmlFor`/`id`.
- `GameServerDetail.tsx:603, 612` — *"Name (optional)"* / *"Port (optional)"*.
- `Settings.tsx:267, 277, 297, 495, 593, 603, 613` — 7 labels.
- `LoadingScreenEditor.tsx:553, 1583, 1628, 1729, 1746, 1800, 1817, 1834, 2033, 2114, 2118` — 11 labels.
- `ConfigEditor.tsx:414-417`, `ConnectLinkDialog.tsx:160, 190`, `FileBrowser.tsx:324` — 4 labels.
- Raw `<label>`s: `Cloudflare.tsx:199`, `DynamicDns.tsx:164, 202, 216, 230, 250, 275`, `Websites.tsx:289, 300, 311, 403`, `Database.tsx:578, 586, 788, 872`, `SetupWizard.tsx:160, 211, 234, 239, 250`.
Consequence: clicking a label does nothing, and every one of these inputs has **no accessible name**. `ServerVariables.tsx:79-81` is worse — the field key is a bare `<span>` with no label element at all, and ~20 variables are edited in a 2-column grid.
`kit/label.tsx` already wraps Radix Label, so the primitive is fine; the *usage* is absent.

**G2 — Icon-only buttons with no accessible name. (Critical, 20+)**
- `FileBrowser.tsx:389-406` — **5 buttons per row**, each containing only a lucide icon, no `aria-label`, no `title`. A 40-file directory = 200 unnamed buttons.
- `Database.tsx:514-524` — `Pencil` and `Trash2` per row, no names.
- `App.tsx:298-351` — the three sidebar power buttons. They *are* wrapped in `Tooltip` (`:296, 315, 334`), and Radix Tooltip assigns `aria-describedby` — but a `describedby` is not a `name`. All three are announced as "button".
- `GameServers.tsx:500` — `Trash2` with no name.
- `LoadingScreenMakerDialog.tsx:428` (`Eye`), `:435` (`Trash2`) — `title` only, which is unreliable for AT and absent on touch.
- `Ai.tsx:590-592` — the API-key reveal toggle, no name, no `aria-pressed`.
- `LoadingScreenEditor.tsx:1640-1651, 1654-1667` — `ColorRow` preset swatches carry `title={c}` (a hex string) only.
- `kit/color-picker.tsx:190-207` — trigger has `title="Farbe wählen"` but no `aria-label` and no `aria-expanded`.

**G3 — `aria-label` coverage: 12 occurrences in 4 files.** Only `Chart.tsx:56`, `LoadingScreenEditor.tsx` (x8), `ServerModeOverlay.tsx:92`, `Settings.tsx` (x4). The other 18 pages contain **zero** `aria-label`.

**G4 — No live regions anywhere for asynchronous state.**
`aria-live`: **0 occurrences**. `role="alert"`: **0 occurrences**. So:
- The 31 inline error banners are invisible to a screen reader when they appear.
- The 8 "Lade …" loaders announce nothing.
- The `Ungespeicherte Änderungen` pills appearing/disappearing announce nothing.
- The container/game-server counts changing every 5 s announce nothing.
- `TOAST_LIMIT = 1` also means a second toast *replaces* the first with no announcement of the loss.
Only the Radix toast path announces, and only because Radix supplies `ToastAnnounce` internally.

**G5 — `aria-invalid` / `aria-describedby` / error association: none.**
`aria-describedby`: 0 occurrences. `aria-invalid`: 5, all inside `kit/button.tsx:6` as a *style* hook — **no page ever sets it**, so the invalid styling is dead. No form field in the app is ever marked invalid, and no field error is ever associated with its input. `Settings.tsx:230-237` reports *"Passwörter stimmen nicht überein"* / *"Benutzername fehlt"* **as a toast**, with the field itself unchanged.

**G6 — Clickable non-interactive elements.**
- `App.tsx:596-603` — 4 service-status `Card`s with `onClick` -> navigate. No `role`, no `tabIndex`, no key handler. Same for `App.tsx:655-657`, `:715-717`, `:777-779` (3 dashboard cards).
- `GameServers.tsx:384-388` — every server card is `<Card onClick>`; inside it sit 4 buttons that each need `e.stopPropagation()` (`:459, 471, 483, 495, 504`) to be clickable. The card itself is not keyboard-reachable and has no role.
- Total: **8 non-keyboard-reachable primary navigation targets** on the two most important screens.

**G7 — `role` usage: 3 occurrences.** `Chart.tsx:55` (`role="img"` — correct), `kit/table.tsx:76, 90` (`[&:has([role=checkbox])]` inside a selector — not a role assignment). Nothing in the app assigns `role="status"`, `role="progressbar"`, `role="group"`, `role="list"`/`listitem`, or `role="navigation"`. The 3 nav groups are unlabelled `<nav>`/`<div>`s. The three progress bars (`App.tsx:684`, `App.tsx:940`, `GameServers.tsx:425`) have **no `role="progressbar"`, no `aria-valuenow`**.

**G8 — Focus-visible is inconsistent and partially wrong.**
- `focus:` instead of `focus-visible:` on 4 controls: `kit/select.tsx:22`, `kit/dialog.tsx:47`, `kit/toast.tsx:63, 78`. Result: a visible ring on mouse click, and a *missing* ring if the browser's heuristic does not fire.
- `kit/badge.tsx:7` puts `focus:ring-2` on a non-focusable `div` — never fires.
- `kit/table.tsx` rows, `App.tsx:519` `NavButton`, `Database.tsx:238` — **no focus style whatsoever**.
- **The focus ring and the selected/active state are the same colour** (`ring: #F2C012` = `accent: #F2C012`, `tailwind.config.js:29, 34`). A focused nav item and an active nav item are indistinguishable by colour, and the `NavButton` active state (`bg-accent` + `accent-foreground` fill) obliterates the ring entirely: `focus-visible:ring-3` is drawn *outside* a solid `#F2C012` background, i.e. a gold ring on a gold button (`App.tsx:523-525`).
- `::selection` (`styles.css:62-65`) is also gold-on-gold, so text selection is the same colour as the focus indicator.

**G9 — Reduced motion: completely absent.**
`prefers-reduced-motion`: **0 occurrences**. `motion-reduce:`: **0 occurrences**. Yet the app runs:
- `animate-pulse` on live status dots that change every second — `GameServers.tsx:111`, `GameServerDetail.tsx:306`.
- `animate-spin` on 13 elements — `App.tsx:307, 326`, `ConfigEditor.tsx:587`, `ConnectLinkDialog.tsx:146`, `FileBrowser.tsx:269`, `Database.tsx:415, 1112`, `GameServerDetail.tsx:658`, `Ai.tsx:201`, `LoadingScreenEditor.tsx:2142`, `LoadingScreenMakerDialog.tsx:374, 514, 674`.
- `animate-pulse` in the dead `Skeleton`.
- The generated loadingscreen `@keyframes hsmspin` (`loadingScreens.ts:319`) runs at 0.9 s linear infinite, permanently, inside a game client.
- `transition-all` on every `Button` and every clickable `Card`.
For users with `prefers-reduced-motion: reduce`, all of this is non-negotiable motion with no opt-out.

**G10 — Contrast risks (computed against the actual dark tokens).**

| Site | Pair | Ratio | Verdict |
|---|---|---|---|
| `Chart.tsx:68, 97` — 9 px axis labels | `#64748b` on `#171A21` | ~3.4:1 | **fails** (needs 4.5:1; 9 px is also below any readable minimum) |
| `Chart.tsx:35` — empty-state text | `text-slate-500` (#64748b) on `bg-card` | ~3.4:1 | **fails** |
| `Notifications.tsx:154, 163, 172` — `placeholder-slate-500` | #64748b on `#1B1F27` | ~3.3:1 | **fails** for placeholder text |
| `App.tsx:422` — `text-red-300` on `bg-destructive/10` over `#111318` | #fca5a5 on ~#1b1517 | ~8:1 | passes |
| `App.tsx:391-397` — `text-accent` on `bg-accent/10` over `#111318` | #f2c012 on ~#191a14 | ~10:1 | passes |
| `GameServers.tsx:107-117` — `bg-green-500` dot on `#171A21` | #22c55e | ~6.6:1 | passes (but green is not the token) |
| `LoadingScreenEditor.tsx:1308, 1336` — `bg-amber-400` label, `text-background` | #fbbf24 on #111318 | ~10:1 | passes |
| `LoadingScreenEditor.tsx:1395, 1398` — `border-fuchsia-400` snap guides | #e879f9 on `#111318` | ~6:1 | passes |
| `kit/label.tsx:8` `peer-disabled:opacity-70` | reduces `text-sm font-medium` to ~70% | borderline | risk |
| `App.tsx:393-410` — status pill text at `text-[11px]` | #f2c012 / #b3261e on tinted | >7:1 | passes, but 11 px is small for a persistent status indicator |
| `styles.css:86-90` — scrollbar thumb hover `#f2c012` | high contrast | — | passes |

`text-muted-foreground` (#9A968C) on `bg-card` (#171A21) is ~7.4:1, so the muted token itself is fine; the failures come from the *un-tokenised* `slate` values and the 9-10 px sizes.

**G11 — Dialog focus handling: mostly correct, with three specific failures.**
- Radix's trap/restore works, but: (a) `FileBrowser.tsx:417-438` has a `DialogTitle` and no `DialogDescription`; (b) `LoadingScreenMakerDialog.tsx:687-708` renders the fullscreen preview as a **sibling** of the outer `DialogContent`, so it is inside the dialog's focus trap and the `inert` background but visually on top — a keyboard user can see it and cannot reach it; (c) the nested "In welchen Slot speichern?" `Dialog` (`:710-749`) is a second Radix root stacked on the first, and the outer dialog's `onEscapeKeyDown`/`onInteractOutside` are overridden (`:469-477`) to accommodate the *third* layer (the fullscreen iframe) — three interacting focus scopes.
- `ConfirmDialog` (`kit/confirm-dialog.tsx:41`) maps `onOpenChange(false)` to `onCancel()` — correct, but the *destructive* confirm button does not receive initial focus, so a stray `Enter` hits `Abbrechen` first. Radix defaults initial focus to the first focusable element, which is the cancel button (`:54`), so this is accidentally right, but it is right by ordering, not by design.

**G12 — Other concrete issues.**
- `App.tsx:161-166` — **conditional hook call.** `useConfirm()` is called at `:161`, then `if (new URLSearchParams(...).has("overlay")) return <ServerModeOverlay />;` at `:162-164`, and only then `useState` at `:166+`. If the query string ever changes without a reload, React throws *"Rendered fewer hooks than expected"*.
- `GameServers.tsx:404` — the "more" counter uses `servers.length === 1 ? "Server" : "Server"` — a dead ternary.
- `Ai.tsx:246` — `models.length - 12` where the enabled count is meant; the label can over- or under-report.
- `GameServers.tsx:159` — `serversRef` is kept in sync by an effect (`:160-162`) purely so the 2 s install poll can read it; the poll therefore lags by one render.
- `Websites.tsx:433-441` — an external link with `rel="noreferrer"` only; elsewhere the app uses `rel="noopener noreferrer"` (`App.tsx:1034`, `LoadingScreenMakerDialog.tsx:620`). `noreferrer` implies `noopener` in modern browsers, so this is inconsistent rather than exploitable.
- No `<html lang>` mismatch: `index.html:2` is `lang="de"`, which is correct. The dialog's English `sr-only` "Close" (G-unlisted above, `kit/dialog.tsx:49`) is the only language slip in a user-facing string.
- `index.html:12` — `<div id="root"></div>` with no `<noscript>` fallback.

---

## 7. Reuse classification

One classification per component/composite. `REUSE` = take essentially as-is. `MERGE` = two-project duplicate. `EXTRACT` = logic must be pulled out of a page. `ADAPT` = a small change generalises it. `NEW` = nothing exists. `PROJECT-SPECIFIC` = must stay in HSM. `DO-NOT-BUILD` = should deliberately not exist in the library.

### Kit components

| Subject | Class | Justification |
|---|---|---|
| `Button` (Base UI) | **ADAPT** | Solid 8-size + 6-variant cva and the best focus recipe in the repo, but it needs semantic variants, a compact size to kill the `h-auto` fight, and the `has-data-[icon]`/`in-data-[slot=button-group]` selectors either wired up or deleted (`button.tsx:23-32`) |
| `Card` family | **ADAPT** | Sound 6-part API; needs `CardTitle` to render a heading, `shadow-none` replaced by a real token, and padding to be a prop rather than something 31 call sites override |
| `Badge` | **ADAPT** | Renders a `div` (invalid inside `<span>`/`<p>`, which is where it is used) and has a dead `focus:ring` — fix the element and drop the ring |
| `Input` | **ADAPT** | Correct focus handling and the iOS-zoom `md:text-sm` trick; needs a `size` prop (12 sites hand-roll `h-8`/`h-9`) and `aria-invalid` styling to match `Button` |
| `Label` | **ADAPT** | Primitive is correct; the cva with zero variants is noise, and the house must enforce `htmlFor`/`id` pairing at the *usage* level |
| `Dialog` family | **ADAPT** | Faithful Radix; needs the English `sr-only "Close"` localised, the 4th shadow magnitude reconciled, and the dead `animate-in` classes either made live or removed |
| `Select` family | **ADAPT** | Needs the invalid `max-h-[--radix-…]` fixed, focus moved to `focus-visible:`, and item focus colour aligned with `DropdownMenu` |
| `DropdownMenu` family | **REUSE** | Correct Radix wrapper, correct `inset` API, correct `focus:bg-muted`; 9 of its 15 exports are unused by HSM but belong in a general kit |
| `Switch` | **REUSE** | Clean, correct, and the one control that gets a rounded thumb right; only needs `focus-visible:ring-ring/50` for consistency |
| `Tabs` family | **REUSE** | Straightforward Radix wrapper with a sensible active state |
| `Tooltip` family | **REUSE** | Straightforward Radix wrapper; the nested second `TooltipProvider` in the editor is a consumer bug, not a component bug |
| `Toast` family | **ADAPT** | Needs `TOAST_LIMIT` > 1, a real `TOAST_REMOVE_DELAY`, a visible-on-focus close button, and the `ToastProvider` moved to `main.tsx` so a crash in `App` does not kill the toaster |
| `Toaster` | **ADAPT** | Merge into the toast family; the `ToastProvider` placement and the missing default `duration` are the changes |
| `ConfirmDialog` + `useConfirm()` | **REUSE** | The promise-based confirm is the best API in the codebase — clean, type-safe, no `window.confirm`; it is what the rest of the app should be migrated *to* |
| `Table` family | **MERGE** | There are two table systems (§4 D3). Merge the 8 hand-rolled tables into the kit, adopting the `px-4 py-3` rhythm the raw tables already agree on |
| `Separator` | **ADAPT** | `decorative` defaulting to `true` makes it invisible to AT; the default should be `false` for a semantic divider, and `Settings.tsx:456-458` should be deleted |
| `ScrollArea` family | **REUSE** | Clean Radix wrapper; the `ScrollBar` export should be promoted to real usage and the global `::-webkit-scrollbar` should be reconciled with it |
| `Avatar` family | **DO-NOT-BUILD** | Imported nowhere, no consumer, and its `h-10 w-10 rounded-full` breaks the design's `rounded-none` identity — a library should not ship a component the host app does not need |
| `Skeleton` | **REUSE** | Already correct and already token-compliant; the host app is the problem (8 hand-rolled loaders instead of using it) |
| `ColorPicker` | **GENERALIZE** | The colour maths (`hexToHsv`/`hsvToHex`, `color-picker.tsx:35, 62`) is pure and reusable, but the popover is a mouse-only custom widget with no slider semantics — it needs a real `role="slider"`/keyboard implementation and a portal before it can be a library component |

### App components

| Subject | Class | Justification |
|---|---|---|
| `Chart` (SVG) | **REUSE** | 0 dependencies, resolution-independent, `role="img"` + `aria-label` already present; only the `#334155`/`#64748b` hard-codes and the 9 px labels need fixing |
| `ConfigEditor` | **PROJECT-SPECIFIC** | A game-server `.cfg`/`.properties` editor with `sv_loadingurl` awareness; the underlying dirty-tracking + save-bar shell is extractable, but the KV parser and the preset table are HSM-only |
| `ServerVariables` | **PROJECT-SPECIFIC** | The env-var grid with `configPriority` ordering is a game-server concept; the `DirtySaveBar` + dirty-dot patterns inside it are extractable |
| `ConnectLinkDialog` | **PROJECT-SPECIFIC** | `steam://connect/{ip}:{port}` and the Podman-guest-IP concept are HSM-only; the `CopyableValue` + `CopyButton` pattern inside it is generalisable |
| `FileBrowser` | **GENERALIZE** | A remote-filesystem browser is genuinely reusable (and 4 of its 5 row actions need names added first); the HSM-specific part is only the API client |
| `LoadingScreenEditor` (2165 L) | **DO-NOT-BUILD** | A whole design tool — grid, snap, marquee, 8-handle resize, layer stack, undo/redo, inline text editing. A component library should ship the *primitives* it is made of (`Canvas`, `SnapLine`, `LayerList`, `Toolbar`), not a 2165-line application widget |
| `LoadingScreenMakerDialog` | **DO-NOT-BUILD** | A 4-slot product workflow tied to a game server's `sv_loadingurl`; nothing about it generalises beyond the nested-dialog and slot-card patterns |
| `loadingScreens.ts` | **PROJECT-SPECIFIC** | Generates ES5 HTML for GMod's Awesomium engine; the constraint (`var`, `XMLHttpRequest`, no `fetch`) is engine-specific and the 7 templates are content |
| `configPriority.ts` | **PROJECT-SPECIFIC** | 43 game-server config key fragments; pure and well-written, but domain data, not design system |
| `eggLogoUrl` / `lib/gameLogos.ts` | **PROJECT-SPECIFIC** | Game-egg name -> asset mapping; the `import.meta.env.BASE_URL` + `asset()` helper inside it is a generalisable base-path util though |

### Composites (all currently page-local)

| Subject | Class | Justification |
|---|---|---|
| Status dot + label (15 sites) | **EXTRACT** | Same intent, 5 dialects, 7 colours, 3 sizes — pull into one `StatusDot` with a `tone` prop |
| `StatusBadge` + status metadata (5 wire unions) | **EXTRACT** | Five hand-written label/colour tables for shared wire types; one `statusMeta` registry is the obvious extraction |
| `SummaryCard`/`StatCard`/`InfoCard` (6 fns) | **EXTRACT** | Two same-named functions with incompatible props; extract one `StatTile` with `tone` |
| Panel / section card (31 sites) | **MERGE** | The raw `rounded-none bg-card border border-border` string and `Card` render the same thing — merge into `Card` |
| `"Lade …"` loader (8 sites) | **MERGE** | 5 byte-identical wrappers; merge into one `PageLoader` built on the already-dead `Skeleton` |
| Inline error/notice banner (31 sites, 4 dialects) | **EXTRACT** | One concept, four visual dialects, two different error text colours, inconsistent dismissal — extract `Alert` |
| Refresh button (15 sites) | **EXTRACT** | One className literal repeated 8x and a `RefreshCw` spin swap repeated 13x — extract `RefreshButton` |
| Secret field with reveal (5 sites) | **EXTRACT** | 4 identical copies plus one broken; extract `SecretInput` |
| Save-bar with dirty indicator (2 sites) | **EXTRACT** | Near-identical, including the byte-identical dirty pill — extract `DirtySaveBar` + `DirtyBadge` |
| Empty state (16 sites) | **EXTRACT** | 16 sites, 2 families; extract `EmptyState` (+ `TableEmptyRow` for the in-table case) |
| Sidebar nav (2 identical JSX blocks) | **EXTRACT** | The same three `<NavGroup>` calls written twice plus a duplicated brand mark — extract `Nav` + `Drawer` and render one nav in both shells |
| Progress / meter bar (3 sites) | **EXTRACT** | Same markup three times, each with its own threshold ladder — extract `Meter` with `value`/`max`/`tone` |
| Panel header (icon + title + subtitle, 8 sites) | **EXTRACT** | The same 3-part header markup 8 times — extract `PanelHeader` |
| Section label (uppercase `h3`, 6 sites) | **EXTRACT** | Two competing sizes for one concept — extract `SectionLabel` |
| Page header / title block (13 sites) | **EXTRACT** | Two competing title styles, and every page re-states a title the shell already shows — extract `PageHeader` and let the shell own the title |
| Action chip colouring (~40 sites, 13 pages) | **ADAPT** | Not a new component — a set of missing `Button` variants; the literal classNames collapse into cva entries |
| Row action group (7 tables) | **EXTRACT** | Text chips in 5 tables, bare icons in 2; extract `RowActions` so icon buttons get names and text chips get tokens |
| Form field with label + description + error (3 pages) | **EXTRACT** | The `Label`-less-of-`htmlFor` pattern is written by hand in 3 pages; extract `Field` and make association structural |
| `NumField` (unit suffix, commit-on-blur/Enter) | **REUSE** | The best form control in the app, used in exactly 1 place — promote it as `NumberField` |
| Polling loop (21 intervals, 11 constants) | **EXTRACT** | The highest-value single extraction: 21 `setInterval`s, 4 constant names, 3 cleanup patterns, zero visibility handling — one `usePolling` hook |
| Feedback (toast vs inline vs console vs nothing) | **EXTRACT** | 4 mechanisms and 2 duplicate-emission sites; one `useNotifier` plus one `Alert` policy |
| `ConfirmDialog` call sites (11) | **REUSE** | Already using the kit correctly; the gap is the 4 sites that do *not* confirm (§4 D11) |
| Typed-name confirmation (`DropTableDialog`) | **ADAPT** | Strictly stronger than `useConfirm` and exists once — promote it to `typeToConfirm` on the confirm dialog |
| `Toast` singleton store (`use-toast.ts`) | **ADAPT** | Keep the shadcn API but make it a React context/store, raise `TOAST_LIMIT`, fix the remove delay, and remove the reducer side effect |
| `metricFormatters` (`formatBytes` x4, `formatUptime`, `elapsedSince`, `etaText`) | **EXTRACT** | `formatBytes` is written 4 times with 3 different unit systems (KB/MB/GB, KiB/MiB/GiB); `FileBrowser` uses bytes-only, `Backups`/`Monitoring`/`Database` differ — one `formatBytes`/`formatDuration` util |
| Dead code: `avatar.tsx`, `SetupWizard.tsx`, `ServiceManager.tsx`, `@radix-ui/react-slot`, `tw-animate-css`, `geist`, `nunito`, `lilita-one` | **DO-NOT-BUILD** | Unused; a library must not ship them and a CI lint rule should catch them |
| Dead API stubs (`serverModeOverlay`, `restartService`) | **DO-NOT-BUILD** | Browser no-ops masquerading as server calls; either implement or remove |

---

## 8. API conventions worth standardising

Observed recurring shapes, with the house style a shared library should enforce.

### 8.1 Module paths
| Convention | Where | Problem |
|---|---|---|
| `@/components/kit/...` | `App.tsx:53-70`, `Settings.tsx:26-32`, `Database.tsx:24-52`, `ConfigEditor.tsx:16-20`, `ServerVariables.tsx:6-9` | two styles coexist |
| `../components/kit/...` | 12 pages | the majority |
| `./kit/confirm-dialog` | `FileBrowser.tsx:33` | a third style, inside a file that uses `../` for everything else on the same import block (:2-19) |
| `../api` vs `@/api` | `api.ts` consumers split both ways | `FileBrowser.tsx:20-31` uses `../api`, `ConfigEditor.tsx:15` uses `@/api` |
| `cn` from `"cn"` | `kit/button.tsx:3` | bypasses the `@/lib/utils` barrel every other file uses |

**Standardise:** one alias root (`@/`), one `cn` entry point, relative imports only for sibling files in the same directory.

### 8.2 Class merging
- `cn(base, className)` positional — used by every component except `Button`.
- `Button` injects `className` **into** the cva call: `buttonVariants({ variant, size, className })` (`button.tsx:51`) so tailwind-merge can de-duplicate. `Badge` does not: `cn(badgeVariants({ variant }), className)` (`badge.tsx:32`).
- `!`-prefixed overrides are used where a variant would be correct: `color-picker.tsx:197, 263`, `LoadingScreenEditor.tsx:1586, 1647, 1660`.

**Standardise:** always pass `className` into cva; ban `!` in library code; make `cn` the only merge utility.

### 8.3 Variant naming
- `variant` + `size` are the universal prop names (`button.tsx:9, 22`, `badge.tsx:10`, `label.tsx:14`, `toast.tsx:29`).
- Variant value sets are inconsistent between the two `SummaryCard`s (`slate|emerald|amber|red` vs `emerald|amber|orange|red`) and `Security`'s takes a raw class string.
- Ad-hoc variant props exist alongside `variant`: `destructive` (boolean) on `ConfirmDialog` (`confirm-dialog.tsx:36`), `on` on `ToggleBtn` (`LoadingScreenEditor.tsx:1510`), `transparent` on `ColorRow` (`LoadingScreenEditor.tsx:1618`), `show` on `Websites` state, `pressed` implied via `aria-pressed`.
- `LoadingScreenEditor`'s `IconBtn` re-declares Button's union by hand: `variant?: "outline"|"ghost"|"default"|"secondary"` and `size?: "icon-sm"|"icon-xs"|"icon"|"icon-lg"` (`:1478-1479`) — a shadow copy of `VariantProps<typeof buttonVariants>` that will drift.

**Standardise:** `variant` + `size` only; every variant set derived from `VariantProps<typeof xVariants>`; booleans only for genuinely boolean semantics (`destructive` is defensible; `on`/`show` are not).

### 8.4 Loading / busy state — no convention at all
`loading` (`Security.tsx:46`, `Diagnostics`, `Backups`, `Https`, `DynamicDns`, `Notifications`, `SetupWizard`, `ConnectLinkDialog`, `ServiceManager` `ActionCard`), `busy` (`Caddy`, `Docker`, `Backups`, `Database`, `FileManager`, `ServerVariables`, `ConfigEditor`, `GameServerDetail`, `Monitoring` `logsBusy`), `busyId` (`Docker.tsx:147`), `actionLoading` (`ServiceManager.tsx:15`), `creating` (`Websites`, `Backups`), `saving` (`DynamicDns`, `Settings`, `Database`), `updating` (`DynamicDns`), `testing` (`Notifications`, `Ai`), `restarting`/`powerBusy` (`App`), `reinstalling`/`powerBusy`/`devBusy` (`GameServerDetail`), `deploying`/`activating`/`busySlot`/`savingSlots` (`LoadingScreenMakerDialog`), `opBusy`/`editorBusy` (`FileBrowser`), `uploading` (`LoadingScreenEditor`).
**No component in the kit accepts a `loading` prop.** Every caller swaps an icon and rewrites the label text — 13 copies of the `RefreshCw` spin and 3 copies of the `Loader2` -> `Save` swap.

**Standardise:** one `loading?: boolean` prop on `Button` (and `PageLoader`/`RefreshButton`); keep per-item state as `<id>Loading` or a `Set<string>`, but the *prop name* is fixed.

### 8.5 Event handler names
| Handler | Shape | Where |
|---|---|---|
| `onChange` | `(value) => void` | `ColorPicker` (`color-picker.tsx:95`), `LoadingScreenMakerDialog` via `onChange` (`:588`) |
| `onValueChange` | `(string) => void` | Radix `Select` consumers (`GameServers.tsx:356`, `Database.tsx:569`) |
| `onCheckedChange` | `(boolean) => void` | `Switch` consumers (`App.tsx:873`, `Settings.tsx:199`) |
| `onOpenChange` | `(boolean) => void` | every `Dialog` |
| `onPointerDown/Move/Up` | DOM-shaped | `color-picker.tsx:218-221`, `LoadingScreenEditor.tsx:1176-1211` |
| `onClick={() => void fn()}` | floating-promise wrapper | **49 occurrences** across 16 files |
| `onRun` | `(fn, keepSelection) => void` | `Database.tsx:551` `RunFn` |
| `onExecute` | `() => void` | `Diagnostics.tsx:204` |
| `onDeployed` | `(url) => void` | `LoadingScreenMakerDialog.tsx:75` |
| `onUpdated` | `() => void \| Promise<void>` | `ServerVariables.tsx:24` |
| `onChanged` | `() => void` | `GameServerDetail.tsx:44` |
| `onNavigate` | `(PageKey) => void` | `App.tsx:537` |
| `onOpenServer` | `(id) => void` | `App.tsx:441` |
| `notify` | `(msg, desc, ok) => void` | `Settings.tsx:113` |

**Standardise:** DOM-shaped names for DOM-shaped props; domain verbs (`onSave`, `onDeploy`, `onDelete`) for domain callbacks; `onOpenChange` only where the value is literally open state. The `(msg, desc, ok)` triple at `Settings.tsx:113` is a positional-boolean smell and should be `{ tone, title, description }`.

### 8.6 Controlled vs uncontrolled
- Radix handles controlled/uncontrolled itself (`open`, `checked`, `value`).
- `LoadingScreenEditor` is a **fully controlled** component: `cfg` in, `onChange(cfg)` out, with its own internal history (`LoadingScreenEditor.tsx:203-213`) — a reusable pattern, but the internal history is invisible to the parent, so a parent's `cfg` reset silently desyncs it.
- `ServerVariables` and `ConfigEditor` are **uncontrolled with `useEffect` re-sync** (`ServerVariables.tsx:34-37`, `ConfigEditor.tsx:163-170`).
- `ConfigEditor`'s `loadedRef` guard (`:161, 164`) means `presets` changes after mount are ignored — a subtle controlled/uncontrolled bug.
- `Database` dialogs take `value` + `onChange` (`Database.tsx:553-556`) and reset via `useEffect` on `open` (`:761-767, 824-826, 897-903, 957-966`) — **4 copies of the reset-on-open effect**.

**Standardise:** one `useResetOnOpen(open, initial)` helper; controlled-only for new primitives; a documented rule that a controlled component's internal history is authoritative and `resetKey` is required to clear it.

### 8.7 Slot / part conventions
- `data-slot` appears **exactly once** in the entire codebase: `data-slot="button"` (`kit/button.tsx:50`). It is referenced by the button's own variants (`in-data-[slot=button-group]`, `:24-32`) but **no `ButtonGroup` exists**, and `has-data-[icon=inline-*]` (`:23-26`) has no producer.
- No `data-state`/`data-*` authoring on any other primitive (all state styling goes through Radix's own `data-[state=open]` etc., which is correct).
- Slots/part names are consistent with shadcn (`CardHeader`, `SelectTrigger`, `DialogContent`, `DropdownMenuItem`, `TableCell`) — this part of the API is already library-grade.

**Standardise:** every primitive sets `data-slot="<kebab-name>"`; every part-based component sets it on each part; consumer-driven slots get a documented `data-*` contract.

### 8.8 Ref forwarding
- `React.forwardRef` in: `avatar` (3), `card` (6), `dialog` (Overlay/Content/Title/Description), `dropdown-menu` (9/15), `input`, `label`, `scroll-area` (2), `select` (8/10), `separator`, `switch`, `table` (8/8), `tabs` (3/4), `toast` (6/8), `tooltip` (Content).
- **No ref** in: `badge`, `skeleton`, `confirm-dialog` (the `Dialog` usage), and **none of the 9 `components/*` composites** — including `FileBrowser` (wraps hidden file inputs) and `LoadingScreenEditor` (wraps a canvas).
- `Button` relies on Base UI's `render` prop rather than `forwardRef` — the only primitive that does, and it is the right one.
- `displayName` is set consistently on Radix wrappers (`X.displayName = Primitive.displayName`) and hardcoded in `card.tsx` (`"Card"`, `"CardHeader"`, …).

**Standardise:** every primitive forwards a ref; parts may be plain function components if they are leaf elements, but every component that wraps a DOM node (or hosts an imperative API) must.

### 8.9 `"use client"` directives
Present in 14 files (`avatar`, `color-picker`, `confirm-dialog`, `dialog`, `select`, `separator`, `tooltip`, `use-toast`, `ServerVariables`, `ConfigEditor`, `ConnectLinkDialog`, `LoadingScreenEditor`, `LoadingScreenMakerDialog`). **Absent** in 8 kit files that are equally client-only (`badge`, `input`, `label`, `scroll-area`, `skeleton`, `switch`, `table`, `tabs`, `toast`, `toaster`) and in all 20 pages. In a Vite SPA this directive does nothing, so it is pure noise that hints at an abandoned RSC migration (`components.json` still says `rsc: false`).

**Standardise:** drop it entirely, or apply it to every file — never half of them.

### 8.10 Prop spreading
`{...props}` is always last, which is correct, with one exception: `Button` (`:51-52`) computes `className` and then spreads — safe only because `className` was destructured. `kit/dropdown-menu.tsx:65-68` has `className` mis-indented inside the spread, a sign the file was hand-edited.

**Standardise:** `...props` last, `className` always last of the named props, formatting enforced by a formatter (there is none — see §9).

---

## 9. Bundle / perf observations

### 9.1 Dead weight that is nonetheless installed
| Item | Cost | Note |
|---|---|---|
| `shadcn@4.21.0` in **`dependencies`** | full CLI + transitive graph in `npm ci` on Windows, and `npm audit --omit=dev --audit-level=high` (`ci.yml:92-94`) scans it | A dev tool in a production dependency list; it will be reported by any consumer's audit |
| `tw-animate-css@1.4.0` | 0 bytes in the bundle (never imported) but the CSS it would define is **relied on by 5 kit components** (§2) | Either import it in `styles.css` or delete the dependency *and* the classes |
| `@radix-ui/react-slot` | 0 bytes (tree-shaken) | never imported |
| `@radix-ui/react-avatar` + `kit/avatar.tsx` | 0 bytes (tree-shaken) | never imported |
| `@fontsource-variable/geist`, `@fontsource-variable/nunito` | 0 bytes | never imported |
| `@fontsource/lilita-one` | **~15-30 KB woff2 in the bundle** | imported at `styles.css:3`, never referenced by any CSS rule |
| `shadcn` CLI's own transitive deps | install time on CI (node 22, `npm ci` every push) | |

### 9.2 No code splitting
`App.tsx:71-87` statically imports **all 19 pages**; `GameServerDetail.tsx:14-16` statically imports `@xterm/xterm`, `@xterm/addon-fit` and `@xterm/xterm/css/xterm.css`. There is not one `React.lazy` / `import()` in the codebase.
Consequence: xterm (the single heaviest dependency) plus `LoadingScreenEditor` (2165 L), `LoadingScreenMakerDialog` (772 L), `ConfigEditor` (605 L) and `FileBrowser` (441 L) — roughly 4000 lines of editor UI — ship in the initial chunk for users who only ever open the dashboard.
**Cheapest high-value fix:** `const GameServerDetail = lazy(() => import("./pages/GameServerDetail"))`, which alone removes xterm from the initial chunk.

### 9.3 Font loading
Three `@fontsource` families are `@import`ed at the top of `styles.css:1-3`, i.e. **render-blocking CSS imports before the Tailwind directives**. No `font-display` tuning, no `preload` in `index.html`, no `unicode-range`/subset configuration, no `adjustFontFallback`. `vite build` will emit the woff2 files but there is no hint to the browser about the two that matter on first paint.
Also: the `sans` family is declared in **two places that disagree** — `tailwind.config.js:8` (`["Jost Variable","Jost","Futura","sans-serif"]`) and `styles.css:48` (adds `system-ui` before `sans-serif`). Anything using `font-sans` gets a different stack from `body`.

### 9.4 Polling
21 `setInterval`s across 13 files. On the **dashboard** alone, 6 timers run concurrently (`App.tsx:180, 646, 707, 770, 819, 1010`), three of them hitting `/api/v1/status` every 5 s. The app-shell poll at `App.tsx:180` runs **regardless of which page is shown** — including while `GameServerDetail`'s xterm `fit.fit()` runs every 1 s (`:150`) and while 2 dialogs are open.
There is **no `document.visibilityState` check anywhere** (0 occurrences), no exponential backoff on error, and no `AbortController` — so a backgrounded window keeps the service busy indefinitely. `docs/ARCHITECTURE.md:163-165` already lists "Event-driven frontend state instead of polling" as a known gap.

### 9.5 Un-virtualised lists
| List | Size | Virtualised? |
|---|---|---|
| `FileBrowser` listing | unbounded (whole directory) | No |
| `Database` rows | 25, server-side paged (`Database.tsx:57`) | No (fine) |
| `Ai` usage records | **all** records fetched (`Ai.tsx:51`) then `slice(0, 50)` (`:490`) | No — unbounded payload |
| `GameServers` cards | all servers, all rendered (`GameServers.tsx:379`) | No |
| `LoadingScreenEditor` layers | all elements (`LoadingScreenEditor.tsx:1100`) | No (fine — design-scale) |
| `Chart` points | 120 (`Monitoring.tsx:140`) | No (fine — 360 path commands) |

`api.ts:528-538` `readSiteFile` returns a `number[]` — a whole file as a JS array. `FileBrowser` caps at 2 MiB *after* the transfer (`FileBrowser.tsx:134`), so a 2 MiB file becomes a 2-million-element array plus a `TextDecoder` pass.

### 9.6 Charts
**No chart library.** `src/components/Chart.tsx` is 104 lines of hand-rolled SVG with a fixed `W = 900` and a `viewBox`, so it scales losslessly and costs nothing. D021 (`DECISIONS.md:131-134`) records this as a deliberate decision. The only cost is that the colours are hard-coded outside the token set and the label font is 9 px — a design-system problem, not a performance one.

### 9.7 Import-time side effects
| Side effect | Where | Note |
|---|---|---|
| Module-level mutable singleton (store + listener array + timeout map + counter) | `hooks/use-toast.ts:28, 59, 132, 134` | Not tree-shakeable, not multi-root safe, breaks test isolation, and makes every consumer of `toast` depend on module evaluation order |
| Module-level template evaluation | `loadingScreens.ts:658-668` — `LOADING_TEMPLATES` calls `nebulaLayout()`, `pulseLayout()`, … at import; each builds ~13 element objects | ~90 objects + 7 configs per import; pulled into the main chunk via `App -> ConfigEditor -> LoadingScreenMakerDialog -> loadingScreens` |
| Module-level ID counters | `loadingScreens.ts:148, 470` | module-global mutable state; two editors in one page would share counters |
| Font CSS `@import` | `styles.css:1-3` | render-blocking |
| Global CSS side effects | `styles.css:32-38` (`*` border-color), `:78-91` (scrollbar) | intentional but global; the scrollbar rules apply inside `ScrollArea` where a custom thumb is also rendered |

### 9.8 Rendering
- No `React.memo` anywhere. The dashboard re-renders all 6 cards every 5 s; `LoadingScreenEditor` re-renders the whole canvas on every pointer-move (`:602` `updateEls` -> `mutate` -> `onChange` -> parent `setCfg` -> re-render) with no throttling beyond the 500 ms history coalescing (`:267`).
- `mutate` (`LoadingScreenEditor.tsx:259-280`) does a full `JSON.stringify(top) === JSON.stringify(next)` deep comparison on **every** change, including every pointer-move — O(config) per frame.
- `App.tsx:162` reads `new URLSearchParams(window.location.search)` **on every render**, not in a `useMemo`.
- `Websites.tsx:359-364` and `GameServers.tsx:306-313, 315-323` sort/filter on every render rather than memoising.

### 9.9 Tooling gaps that directly cause the above
- **No linter, no formatter** (0 config files in `git ls-files`). The codebase nonetheless contains `// eslint-disable-next-line react-hooks/exhaustive-deps` (`ConfigEditor.tsx:169`, `ServerModeOverlay.tsx:73`) and `/* eslint-disable react/display-name */` (`LoadingScreenEditor.tsx:1910`) — directives that suppress nothing.
- **No tests** (no runner, no test files) for 12 000 lines of UI, including a 2165-line canvas editor with a hand-rolled undo stack.
- `tsconfig.json` has `noUnusedLocals`/`noUnusedParameters` but no `noUncheckedIndexedAccess` and no `exactOptionalPropertyTypes`; the codebase uses `any` in 11 `catch (e: any)` sites and `as any` in `DynamicDns.tsx:209, 223, 237`.
- `import.meta.env` is untyped (no `vite-env.d.ts`, no `"types": ["vite/client"]`), which is why three files hand-cast it and one (`Ai.tsx:320`) got the `VITE_API_BASE` default wrong relative to `api.ts` in the process.

---

## 10. Risks & open questions

### 10.1 Risks a shared library must not inherit
1. **One primitive library, two headless runtimes.** `kit/button.tsx` is Base UI; the other 19 kit files are Radix. `Base UI`'s `Button` uses a `render` prop, Radix uses `asChild` — the two idioms leak into consumer code (`LoadingScreenEditor.tsx:1002` uses `DropdownMenuTrigger asChild` around a `Button`, which happens to work but is a mixed-idiom smell). Pick one before publishing, or document the split.
2. **The design has no light mode and no second consumer to validate against.** Every token is a dark-only hex in `tailwind.config.js`; `darkMode: "class"` is configured but unused; `components.json` says `cssVariables: false`. A library that hard-codes hex in a Tailwind config cannot be re-themed without forking the config. **This is the decision to make first.**
3. **The `accent` / `ring` collision.** Both are `#F2C012`. Focus indication and selection state are the same colour, and `::selection` is a third gold. Any library that keeps this token set inherits an AA focus-visibility problem (see §6 G8).
4. **`rounded-none` as a convention, not a token.** 182 occurrences plus 4 `--radius-*` custom properties that nothing reads. If the library expresses radius as a scale, 182 call sites (or a global override) must be reconciled.
5. **Broken animation layer.** 5 kit components depend on `tw-animate-css` utilities that are never loaded. A library that ships those classNames without the import reproduces the bug invisibly — the code *looks* correct.
6. **Encoding corruption is already in the repository.** `src/pages/FileManager.tsx` (12 user-visible strings) and `src/api.ts:1276, 1280` contain double-encoded UTF-8, verified at byte level. Any extraction that moves these strings will move the corruption; a repo-wide `utf-8` guard (editorconfig + a CI grep for the `â€`/`Ã¤` signature) is needed first.
7. **Conditional hook call in the app shell.** `App.tsx:161-166` calls `useConfirm()`, then returns early at `:162-164`, then calls `useState`. Harmless today because the query string never changes at runtime; a fatal render error the moment it does. A shared `AppShell` must not inherit this shape.
8. **`dangerouslySetInnerHTML` in a shared surface.** `LoadingScreenEditor.tsx:1267` injects `elementInnerHtml` output, and `loadingScreens.ts:278, 281` interpolates `el.color` / `el.bgColor` into a `style` string **without escaping**. A crafted hex value in a saved config becomes CSS injection. `escAttr` covers HTML attributes (`:232-239`) but not the style values. Do not generalise `loadingScreens.ts` into a library without fixing this.
9. **`allow-same-origin` iframe with user-controlled HTML.** `LoadingScreenMakerDialog.tsx:701` renders `srcDoc` with `sandbox="allow-scripts allow-same-origin allow-autoplay"`. That combination escapes the sandbox and grants the framed document same-origin access — to the dashboard, its `Basic auth` session, and the local API. `tabIndex={-1}` prevents focus but not scripting. The CSP (`tauri.conf.json:25`) has no `frame-src`, so `srcDoc` frames are permitted.
10. **`app.css` shadowing.** `styles.css:10-12` defines `.bg-card` in `@layer utilities` with the same value as the `card` token. Any library that ships a different `card` value will collide with this hand-written override in a way that is very hard to debug.

### 10.2 Bugs found in passing (not design-system issues, but they will be blamed on the library)
| Bug | Location | Effect |
|---|---|---|
| `online` is always `false` | `Caddy.tsx:64-65` vs `api.ts:260-263` (`getCaddy` sets `message: ""`) | The Caddy page always renders its status in `text-amber-400` |
| Conditional hook call | `App.tsx:161-166` | Fatal on any query-string change |
| Duplicate `LayoutGrid` icon | `App.tsx:117` vs `:129` | "Dyn. DNS" and "Übersicht" share an icon |
| `"Server" : "Server"` dead ternary | `GameServers.tsx:339` | No-op |
| Wrong count in "+N weitere" | `Ai.tsx:246` uses `models.length`, not the enabled count | Over/under-reports |
| `ProvidersTab` never refetches | `Ai.tsx:319-321` — `useEffect` depends on `onRefresh` but never calls it | Stale provider list; also bypasses `api.ts` and omits `credentials` |
| `as any` on a discriminated union | `DynamicDns.tsx:209, 223, 237` | Silences the pre-existing type error documented in `ANLEITUNG_SHADCN_MIGRATION.md:203-208` |
| Invalid Tailwind arbitrary value | `kit/select.tsx:78` `max-h-[--radix-…]` (missing `var()`) | Select content is not height-constrained |
| Dead style hooks | `kit/button.tsx:23-32` (`has-data-[icon]`, `in-data-[slot=button-group]`) | Never fires |
| Two dead nav pages shipped | `SetupWizard.tsx` (275 L), `ServiceManager.tsx` (182 L) | 457 lines of unrendered UI whose `api.ts` functions (`getSetupStatus`, `completeSetup`, `installService`, …) are still exported and typed |
| `components.json` points at a non-existent alias | `components.json:16` `ui: "@/components/ui"` | `shadcn add` would write to the wrong folder — exactly what `AGENTS.md:13` forbids |
| `minWidth: 980` < `lg` breakpoint | `tauri.conf.json:19` + `App.tsx:270` | The desktop sidebar is unreachable in a default window |

### 10.3 Open questions (cannot be answered from the source)
1. **Is the second project the same product?** `AGENTS.md:11-13` and `docs/CONTRIBUTING.md:24-26` both insist on a single "MLHSM-KIT", and the kit directory is `components/kit` (not `ui`), which is not a shadcn convention. `ANLEITUNG_SHADCN_MIGRATION.md` refers throughout to `components/ui`, implying the kit was renamed at some point. Without knowing the other project's shape it is impossible to say which of the 18 duplications are *intentional* divergences and which are drift.
2. **Is the light mode coming?** `darkMode: "class"`, `color-scheme: dark`, `cssVariables: false` and a `mlhsm.gold`/`mlhsm.olive` reference in a stale doc all point different ways. The token strategy decision (§10.1.2) depends on the answer.
3. **Is `radius: 0` a design decision or a migration artefact?** The `--radius-*: 0` block plus 182 `rounded-none` plus 4 components that use `rounded-md`/`rounded-full` looks like a deliberate "brutalist/Bauhaus" identity (the `bauhaus` loadingscreen template, `loadingScreens.ts:639-656`, uses `Courier New` and hard corners). If deliberate, it should be a token, not 182 classNames.
4. **Are the 2 dead pages intended to be re-wired?** They are complete, typed, and their API functions are exported — they look like a feature that was dropped from the nav rather than abandoned.
5. **Should `tw-animate-css` be turned on, or should the classNames be deleted?** The kit was clearly written against a Tailwind-v4 / `tw-animate-css` mental model (the `data-slot`, `in-data-[slot=…]`, `has-data-[icon=…]` idioms in `button.tsx` are all Tailwind-v4 conventions) but the project is on Tailwind 3.4.19. This looks like a partial upgrade. Migrating to Tailwind v4 would fix the animation layer, remove the `postcss`/`autoprefixer` config, and change the token model — a decision, not a patch.
6. **Who owns the German copy?** The wording diverges per page for the same wire status (see §4 D4), and `FileManager.tsx` shows the copy has been corrupted by tooling at least once. A shared library needs a single owner and a lint for encoding, or the divergence will simply be re-created.
7. **Is `useConfirm` the intended house pattern for a *third* project?** It is the best API in the codebase and the only one with a documented promise-based contract (`confirm-dialog.tsx:71-79`). If so, the typed-name variant should be built on it rather than beside it.

### 10.4 What a shared library must be careful to preserve
- The **dark, square, gold-accent, hard-shadow** visual identity. It is consistent and deliberate (`loadingScreens.ts:639-656` proves the intent), and the `rounded-none` convention is its clearest signal.
- The **German-first, informal-du register** ("Klicke, lade deine Dateien hoch", `Websites.tsx:226`) rather than a translated formal tone. Note the app mixes this with formal *"Sie"* in the older pages (`SetupWizard.tsx:11, 178, 207`; `Backups.tsx:284`) — the informal voice is the current one.
- The **real-data discipline**. `Caddy.tsx:5-6`, `Docker.tsx:6-7`, `Monitoring.tsx:3-4` and `api.ts:1-6` all state in comments that nothing is faked. A design system that encourages mock data in stories would work against an explicit project rule.
- The **migration posture**. `AGENTS.md:12-14` explicitly allows existing raw elements as *Bestandsarbeit*. A library that forces a big-bang migration will be resisted; one that ships an incremental path (codemods for the 8 raw tables, a lint rule for `htmlFor`) will not.

---

*End of report. 10 sections, all file:line references verified against `git -C E:\HSM ls-files` at `79bfb92`.*





