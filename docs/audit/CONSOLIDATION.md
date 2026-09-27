# TEA UI — Consolidation of the HSM and LUTEA audits

**Inputs (read in full, nothing else consulted):**
- `docs/audit/HSM-AUDIT.md` — HomeServerManager, `E:\HSM` @ `79bfb92`, 931 lines / 10 sections
- `docs/audit/LUTEA-AUDIT.md` — LUTEA Design Dashboard, `E:\LUTEADESIGNDASHBOARD` @ `a486f92`, 1225 lines / 11 sections

**Citation convention.** `H §n` / `H:NNN` = HSM-AUDIT section N / line NNN. `L §n` / `L:NNN` = LUTEA-AUDIT section N / line NNN. `H:<file:line>` and `L:<file:line>` = a source-code reference *as quoted inside* the corresponding audit — the audit is the authority; this document adds no source reads of its own. Rows marked **`DECISION REQUIRED`** are proposals, not findings: neither audit settles them.

**No new facts.** Every value, count, class string and defect below is traceable to one of the two reports.

---

## 1. Verdict

- **TEA UI is not a component-library request — it is a token-layer request wearing a component library's clothes.** Both repos carry the same 18-token dark palette as **literal hex inside a Tailwind config**, with `cssVariables: false` (H:90, H §2) and **zero** `var(--…)` matches in the whole LUTEA source (L:78, L §2.1). Neither theme can be re-themed without forking TypeScript. LUTEA ranks this defect #1 and calls it the prerequisite for everything else (L:1126, L §11.1; L:1212, L §11.5). HSM ranks the same thing as "the decision to make first" (H:883, H §10.1.2). **This is the finding; everything else here is downstream of it.**
- **HSM's single most important finding: the kit was written against Tailwind v4 and is running on v3.4.19.** `tw-animate-css@1.4.0` is installed and never imported (H:41, H:821), so every `animate-in animate-out fade-in-0 zoom-in-95 slide-in-from-*` in `kit/dialog.tsx:24,41`, `kit/select.tsx:78`, `kit/dropdown-menu.tsx:48,66`, `kit/toast.tsx:26`, `kit/tooltip.tsx:22` **emits nothing** (H:197). Five components, five silent no-ops, invisible in review because the class names look correct. HSM's own words: a library that ships those classNames without the import "reproduces the bug invisibly — the code *looks* correct" (H:886).
- **LUTEA's single most important finding: 10 of 20 kit files are a verbatim copy of HSM's, and all 10 are unused.** `label, separator, switch, tabs, tooltip, skeleton, scroll-area, select, dropdown-menu, confirm-dialog` each carry `Herkunft: MLHSM-KIT (HomeServerManager)` plus a `LUTEA-Delta:` note (L:59, L:914). They are dead — while the repo hand-rolls 20 surface blocks, 20 micro-labels, 13 spinners, 9 error banners, 10 empty states and 3 raw `select` elements (L §3.2, L §4). **The shared library already exists as copy-paste; the work is promotion, not authorship** (L:59, L:1213).
- **The cross-repo headline: these are not two designs, they are one design that diverged on `primary`.** 16 of the 18 tokens are byte-identical between `tailwind.config.js:11-35` (H:92-107) and `tailwind.config.ts:13-47` (L:87-117). The one structural break: **HSM `primary = #E0332E` (red); LUTEA `primary = #F2C012` (gold) = `accent` = `ring`** (H:100, H:106 vs L:98, L:104, L:109). Every downstream divergence — which Button variant is default, what an active nav item is, what a primary link looks like — falls out of that one value. **Decide `primary` and half the divergences table resolves itself.**
- **Top 5 highest-leverage generalisations, in order:**
  1. **Move all colour to real CSS custom properties**, referenced from one Tailwind config, with a `tea` reference theme plus per-project `hsm` / `lutea` themes. Kills both `.bg-card` duplicate-override hacks (`styles.css:10-12` in HSM, `globals.css:16-18` in LUTEA — the latter "wins on source order, hardcodes the value, blocks theming, and is a latent cascade bug", L:128) in one move. *(L:1212; H:891)*
  2. **Adopt `Field` + `Alert` + `EmptyState` + `Eyebrow` in one decision.** It removes 30+ unnamed form controls and **zero** `htmlFor` in HSM (H §6 G1), 11 unassociated labels in LUTEA (L:790-800), **40** duplicated error banners (31 + 9), **26** empty states (16 + 10) and **26** duplicated micro-label class strings (L:419) — the four largest defect clusters across both repos, and the four cheapest to fix because nothing needs authoring. *(L:1213; H:693-710)*
  3. **Publish one `statusMeta` registry: wire value → label + tone + description.** Five hand-written German label tables for the same wire unions in HSM (H:296) and eight status visual languages in LUTEA (L:369), whose two score thresholds disagree by five points for the same value (L:443-448). This one registry is the only place German terminology becomes mechanically enforceable.
  4. **Ship a real `Button` variant × size matrix with a `loading` prop, and delete every hand-painted action chip.** HSM has ~40 hand-written colour class strings across 13 pages (H:321-346) and 13 hand-written `RefreshCw` spin swaps (H:755) because *no kit component accepts `loading`* (H:755). LUTEA already does this correctly and consistently in-button — `disabled={busy}` + spinner swap + label change, in six places (L:674-680). That is the pattern to lift.
  5. **Make the two invisible things visible: reduced motion and live regions.** Both repos have **zero** `prefers-reduced-motion` and **zero** `motion-reduce:` (H:604, L:225) while running 13+ spinners and full Radix enter/exit animations. HSM has **zero** `aria-live` and **zero** `role="alert"` (H:578) across 31 inline error banners; LUTEA has zero too, which makes 7 of 9 error banners and *every* toast silent (L:813-821). Two CSS/attribute decisions retroactively cover four audit sections.
- **What must NOT be built as a component library: a "product" layer.** HSM's `LoadingScreenEditor` (2165 L) and `LoadingScreenMakerDialog` (772 L) are DO-NOT-BUILD by HSM's own classification (H:683-684); LUTEA's `DashboardClient`, `DashboardNav`, the `scoreWeights` config UI and the claimed MapLibre map are DO-NOT-BUILD by its own (L:955-959). TEA UI is a **token + primitive + composite** package. Full stop.
- **The risk neither audit can retire alone:** HSM has a conditional hook call in its app shell (`App.tsx:161-166` — `useConfirm()` at :161, early `return` at :162-164, `useState` at :166+; H:635) and an `allow-same-origin` iframe carrying user HTML (H:890). LUTEA has a full Radix toast dependency mounted inertly (L:1067) and a settings dialog where *every* control has no accessible name (L:798). A shared library must not inherit either shape, and both audits say so independently.

---

## 2. Shared DNA — the common design system the two repos actually share

The facts that hold in **both** repos. This is the material for the `default` / `tea` theme of TEA UI. Nothing here is a judgement call; every row cites both reports.

### 2.1 Colour — 16 of 18 tokens byte-identical

`H:92-107` (`tailwind.config.js:11-35`) vs `L:87-117` (`tailwind.config.ts:13-47`).

| Token | HSM | LUTEA | Identical? |
|---|---|---|---|
| `background` | `#111318` | `#111318` | **yes** |
| `foreground` | `#E8E6E0` | `#E8E6E0` | **yes** |
| `card` | `#171A21` | `#171A21` | **yes** |
| `card-foreground` | `#E8E6E0` | `#E8E6E0` | **yes** |
| `popover` | `#1E222B` | `#1E222B` | **yes** |
| `popover-foreground` | `#E8E6E0` | `#E8E6E0` | **yes** |
| `secondary` | `#232733` | `#232733` | **yes** |
| `secondary-foreground` | `#D4D2CA` | `#D4D2CA` | **yes** |
| `muted` | `#1B1F27` | `#1B1F27` | **yes** |
| `muted-foreground` | `#9A968C` | `#9A968C` | **yes** |
| `accent` | `#F2C012` | `#F2C012` | **yes** |
| `accent-foreground` | `#111318` | `#111318` | **yes** |
| `destructive` | `#B3261E` | `#B3261E` | **yes** |
| `border` | `#343A46` | `#343A46` | **yes** |
| `input` | `#1B1F27` | `#1B1F27` | **yes** (and `input` = `muted` in both) |
| `ring` | `#F2C012` | `#F2C012` | **yes** (and `ring` = `accent` in both) |
| `primary` | **`#E0332E`** | **`#F2C012`** | **NO** |
| `primary-foreground` | **`#FFFFFF`** | **`#111318`** | **NO** |
| brand ramp | `mlhsm.red #E0332E`, `mlhsm.yellow #F2C012`, `mlhsm.blue #2F6FEB` (H:96-98) | `lutea.gold #F2C012`, `lutea.green #4CAF6D`, `lutea.blue #2F6FEB` (L:89-91) | `blue` only |

Additional shared facts:

- **Both declare a 3-entry brand ramp and reference none of it.** HSM: `mlhsm.red/yellow/blue` "declared but unused" (H:119). LUTEA: `lutea.gold`, `lutea.green`, `lutea.blue` "never referenced in any `.tsx`" (L:89-91, L:1187). → **Do not promote this ramp. Delete it** — dead weight in both.
- **A dead `#2F6FEB` blue reachable only by arbitrary value in HSM** (H:119). In LUTEA it is live: `status.conversation` (L:114). It is the natural `info` tone, and HSM's `mlhsm.blue` is the same hex.
- **`ring` = `accent` = `#F2C012` in both**, and in HSM `::selection` is a third gold (`styles.css:62-65`, H:225). H §6 G8 calls the collision "an AA focus-visibility problem": a focused nav item and an active nav item are chromantically identical, and the active `bg-accent` fill "obliterates the ring entirely — a gold ring on a gold button" (H:600). **Shared defect, not a divergence.**
- `muted-foreground #9A968C` on `card #171A21` is **~7.4:1 — passes** (H:628). This is the one colour pair both audits explicitly clear.

### 2.2 Radii — the same rule, the same non-implementation

- HSM `styles.css:24-30`: `--radius-sm/md/lg/xl/2xl: 0` — five properties, **never referenced** (H:110-117). `rounded-none` hard-coded **182 times across 33 files** (H:117).
- LUTEA `globals.css:9-13`: `--radius-sm/md/lg: 0` — three properties, **never consumed**, because `theme.extend.borderRadius` is not defined at all (L:80). `rounded-none` hard-coded across 19 kit call sites (L:140).
- LUTEA's own kit records the rule as an explicit design law: `switch.tsx:9` — *"LUTEA-Delta: rounded-full -> rounded-none (Designregel: keine runden Elemente)"* (L:140). HSM records the same intent in the `bauhaus` loadingscreen template with "hard corners" (H:912, H:919).
- **`rounded-full` is allowed for exactly one family in both: dots, pills, avatars, progress, scroll thumb** (H:117; L:141).
- → **TEA UI rule:** the square identity is a *token decision*, not 200 class names. Every radius step `0`, plus a named `pill` exception list, plus a lint ban on `rounded-md` / `rounded-lg` outside it.

### 2.3 Elevation — the same brutalist hard-shadow idiom, the same three magnitudes

| Layer | HSM | LUTEA |
|---|---|---|
| Dialog | `8px` — `kit/dialog.tsx:41` (H:141) | `8px` — `dialog.tsx:37` (L:149) |
| Popover / menu / select / toast | `6px` — `dropdown-menu.tsx:48,66`, `select.tsx:78`, `toast.tsx:26` (H:142) | `6px` — `toast.tsx:21`, `select.tsx:72`, `dropdown-menu.tsx:53,71` (L:150) |
| Tooltip | `4px` — `kit/tooltip.tsx:22` (H:143) | `4px` — `tooltip.tsx:23` (L:151) |
| Search / command surface | — | `8px` — `global-search.tsx:64` (L:149) |
| `shadow-card "0 1px 3px rgba(0,0,0,0.3)"` | declared, **never used** (H:135) | declared, **never used** (L:152) |
| `shadow-sidebar "1px 0 0 #30363d"` | declared, **never used** — `App.tsx:270` uses `border-r border-border` instead (H:137) | declared, **used once** — `dashboard-sidebar.tsx:42` (L:153) |
| `shadow-none` hard-overridden on `Card` | `card.tsx:12` (H:137) | `card.tsx:9` (L:152) |
| Soft-shadow outliers | `shadow-2xl`, `shadow-xl`, `shadow-lg`, `shadow-sm`, `shadow-[0_10px_40px_…]`, one default `shadow` (H:145-151) | `shadow-xl` — `crm-page-client.tsx:141` (L:154) |

→ **TEA UI rule:** exactly three elevation tokens — `4px` tooltip, `6px` popover, `8px` modal, all zero-blur `rgba(0,0,0,0.5)`. HSM's four distinct offsets in one app (H:153) and LUTEA's `shadow-xl` (L:156) are drift, not variants.

### 2.4 Fonts — identical families, identical loading, one extra weight class in LUTEA

- HSM `tailwind.config.js:7-10` (H:161): `sans: ["Jost Variable","Jost","Futura","sans-serif"]`, `mono: ["JetBrains Mono","monospace"]`. Applied at `styles.css:48` with `system-ui` inserted — **config and CSS disagree** (H:835).
- LUTEA `tailwind.config.ts:9-11` (L:188-190): `sans` identical, `mono` identical, **plus `display: ["Lilita One","Jost","sans-serif"]`**.
- **Loading strategy is the same and equally flawed in both:** three `@fontsource*` packages `@import`ed as CSS at `styles.css:1-3` / `globals.css:1-3` — **render-blocking, no `font-display` control, no metric-matched fallback, no subsetting** (H:834, L:193, L:1091). Neither uses `next/font`.
- `@fontsource/lilita-one` is present in both. In HSM it is imported and **never referenced by any app CSS rule** (H:164, H:825 — 15-30 KB woff2 in the bundle for nothing). In LUTEA it is used, as the `display` face on the marketing `h1`s (L:518, L:1091).
- `@fontsource-variable/jost` and `jetbrains-mono` are **the only two families both repos genuinely use**; `mono` is the machine-data face in both (H:163, L:196).
- → **TEA UI rule:** ship `sans` + `mono` + `display`, loaded through the library's single entry stylesheet with `font-display: swap` and `size-adjust` fallbacks. Delete `geist` and `nunito` (installed, never imported, H:165).

### 2.5 The dark + square + gold + hard-shadow identity is deliberate, not accidental

HSM §10.4 states it and proves it: the `bauhaus` loadingscreen template uses `Courier New` and hard corners (H:912, H:919). Both repos target German-speaking operators, both share the informal-du register (H:920, L:528-540), and both use `Lilita One` + Jost + JetBrains Mono. **This is the strongest shared-DNA evidence in either audit and the reason a single reference theme is defensible at all.**

### 2.6 Shared status vocabulary — the shape, not the labels

- Both use the same 8-slot concept: dot + label + optional count, where the dot is `rounded-full` (H:288, L:364).
- Both paint status off the same gold accent: LUTEA's `status.contacted` is `#F2C012` (L:113) and its version badge reuses `variant="default"` = gold for `approved` (L:642), which L §5.7 calls *"Status colours are not a system — they are recycled from the primary scale."* HSM has the same disease in a different form: `bg-accent` is the "online" green at 15 sites (H:288).
- → **TEA UI rule:** `statusMeta` is the *only* legal way to render a status. Colour comes from the registry, never from a class string at the call site.

### 2.7 Kit lineage — the most consequential shared fact

10 of LUTEA's 20 kit files are byte-derived from HSM's `src/components/kit`, each carrying a provenance header:

| LUTEA file | Provenance line | LUTEA's own delta note |
|---|---|---|
| `dropdown-menu.tsx` | `:2` | comment at `:3` claims `ms-auto -> ms-auto` — a no-op (L:1167) |
| `skeleton.tsx` | `:5` | "React-Import ergänzt (in MLHSM fehlte er)" (L:265) |
| `label.tsx` | `:6` | "keine." — not adopted (L:259) |
| `tabs.tsx` | `:6` | "keine (MLHSM ist bereits LUTEA-konform: rounded-none, Akzent)." (L:268) |
| `switch.tsx` | `:8` | **`rounded-full -> rounded-none (Designregel: keine runden Elemente)`** (L:140) |
| `tooltip.tsx` | `:8` | "keine (Schattenstil 4px-Offset ist bereits LUTEA-Konvention)." (L:271) |
| `scroll-area.tsx` | `:6` | "Scrollbar auf LUTEA-Scrollbar-Design" — **conflicts with the global `::-webkit-scrollbar` block** (L:262) |
| `select.tsx` | `:9` | **4 Tailwind-v4 utilities that silently emit nothing in v3** (L:263) |
| `separator.tsx` | `:8` | "keine." |
| `confirm-dialog.tsx` | `:16` | not adopted; a bespoke two-step confirm ships instead (L:255) |

Both audits reach the same conclusion independently: HSM §7 calls `dropdown-menu`, `Switch`, `Tabs`, `Tooltip`, `ConfirmDialog`, `ScrollArea` REUSE-worthy (H:660-669); L §7.1 calls the same 10 files MERGE, "adopt the whole set in one decision" (L:914), and L §11.5.2 repeats it as the second-highest-leverage change (L:1213).

### 2.8 Shared conventions that need no negotiation

| Convention | HSM | LUTEA | Verdict |
|---|---|---|---|
| Fonts | Jost Variable / JetBrains Mono | identical | ship both |
| Icons | `lucide-react` (H:43) | `lucide-react` (L:41) | ship, one version |
| Merge util | `cn` package (H:218) | `twMerge(clsx(...))` (L:1017) | **diverges — §3** |
| `cva` | `^0.7.1` (H:39) | `0.7.1` (L:34) | ship |
| Tailwind major | 3.4.19 (H:36) | 3.4.19 (L:35) | **same — §3** |
| Dark only | yes (H:108) | yes (L:60) | **same — §3** |
| Button focus recipe | `focus-visible:ring-3 focus-visible:ring-ring/50` + `border-ring` (`kit/button.tsx:6`, H:204) | `focus-visible:ring-3 focus-visible:ring-ring/50` (`button.tsx:7`, L:230) | **the one focus recipe both got right** |
| Button variant vocabulary | `default outline secondary ghost destructive link` (H:241) | `default outline secondary ghost destructive link` (L:251) | **identical** |
| Tests / lint | none, none (H:55-56, H:872-873) | none, none (L:52, L:54) | **shared — the reason §7 exists** |

---

## 3. Divergences

Every place HSM and LUTEA disagree. Citations are to the originating audit.

| Aspect | HSM | LUTEA | Impact on a shared system | Resolution |
|---|---|---|---|---|
| **`primary`** | `#E0332E` red, `primary-foreground #FFFFFF` (`tailwind.config.js:11-35`, H:96-101) | `#F2C012` gold, `primary-foreground #111318` (`tailwind.config.ts:13-47`, L:98-99) — **byte-identical to `accent` and `ring`** | The single largest break. It decides which Button variant is default, what an active nav item is, what a primary link is, what a toast is. Everything downstream of "primary" inherits it. | **`DECISION REQUIRED`.** Recommended: `primary = #F2C012`, `primary-foreground = #111318` (LUTEA's values) — `accent` is already gold in both, so LUTEA's `primary` is the *collapse* case. HSM's `#E0332E` is a **second red that sits beside `#B3261E`** and is used semantically nowhere, so it is not `destructive` either. `DECISION REQUIRED` also on whether `#E0332E` is deleted outright or kept as a `danger-strong` tone. |
| **Radius** | `--radius-sm/md/lg/xl/2xl: 0`, 5 props, never referenced (H:110-117); `rounded-none` ×182 / 33 files | `--radius-sm/md/lg: 0`, 3 props, never consumed; no `borderRadius` extension exists (L:80); `rounded-none` in 19 kit sites | Two prop counts, zero implementations. Shipping either *as variables* is a silent no-op. | **All steps `0`; ship no `--radius-*` custom properties at all** — a real `borderRadius` scale with every step `0` plus one named `pill` exception. Delete both dead blocks. |
| **Switch radius** | `h-6 w-11` track, `h-5 w-5` thumb, `translate-x-5`, **`rounded-full`** — "the only rounded-full interactive control" (`kit/switch.tsx:12,20`, H:253) | `h-5 w-9`, **`rounded-none`**, delta recorded explicitly as a design-law change (`switch.tsx:9,17`, L:140, L:266) | LUTEA deliberately overrode the copy to honour the square rule; HSM deliberately kept the pill. The inherited file carries LUTEA's edit, so a naive "HSM is canonical" merge silently breaks HSM's switch. | **`DECISION REQUIRED`:** (a) square track + square thumb, honouring the stated law in both repos, or (b) `rounded-full` on the thumb only as a named exception. HSM calls the pill thumb "the one control that gets a rounded thumb right" (H:661), so both are defensible — but the law gets written down **once**. |
| **Focus-ring recipe** | 8 recipes. Canonical: `outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50` (`kit/button.tsx:6`, H:204). Divergents: `ring-2 /50 offset-1` (`input.tsx:11`), `ring-2 /40 offset-2` (**switch**, `switch.tsx:12`), `ring-1` no offset (`ConfigEditor.tsx:563`), **`focus:` on 4 controls** (`select.tsx:22`, `dialog.tsx:47`, `toast.tsx:63,78`), `focus:` on a non-focusable `div` (`badge.tsx:7`) | 5 recipes. Canonical: `focus-visible:ring-3 focus-visible:ring-ring/50` (`button.tsx:7`, `input.tsx:9,23`). Divergents: `ring-3 /40` **on a `<div>`** (`global-search.tsx:48`), `ring-2 /40 offset-2 offset-background` (`switch.tsx:17`), `ring-2 /50 offset-2 offset-background` (`tabs.tsx:33,48`), **`focus:outline-none` with no replacement at all** (`dialog.tsx:44`, `toast.tsx:46`) | The button recipe agrees exactly. Everything else is ad-hoc. HSM has ring-on-a-`div`; LUTEA has **no ring at all** on two controls. | **One recipe: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background`, with `ring-3` reserved for `Button`/`Input` primary surfaces.** `DECISION REQUIRED` on `ring`'s own value — both use `#F2C012`, identical to `accent` and (HSM) to `::selection`, which H §6 G8 calls an AA focus-visibility failure (H:600). |
| **Elevation offset** | 4 / 6 / 8 / 10 px for one concept, plus `shadow-2xl`, `shadow-xl`, `shadow-lg`, `shadow-sm`, and one default `shadow` (H:139-153) | 4 / 6 / 8 px, plus one `shadow-xl` (L:156) | HSM has a 10px value LUTEA has never seen plus a default Tailwind shadow; LUTEA has a soft `shadow-xl` that breaks the idiom. | **Three tokens only**, all zero-blur `rgba(0,0,0,0.5)`: 4px tooltip, 6px popover, 8px modal. HSM's 10px and both `shadow-xl` instances are deleted. |
| **Status colour source** | **No status scale exists.** 7 colours for one "online" semantic: `bg-accent`, `bg-accent/50`, `bg-green-500`, `bg-amber-500`, `bg-red-500`, `bg-muted-foreground`, `bg-muted-foreground/40` (H:288). Success is `bg-accent/10` on 5 pages **and** `bg-emerald-500/10` on 2 **and** `bg-green-900/40` on 1 (H:123-126) | **Two sources, one broken:** `colors.status.*` in `tailwind.config.ts:39-46` **and** `STATUS_COLORS` in `lib/status.ts:25-34` — *"two sources of truth for status colour; one is broken and neither is used"* (L:121) | There is nothing to merge. HSM has drift; LUTEA has an unreachable scale plus a duplicate. | **One `statusMeta` registry**, keyed by wire value, with `tone` as an enum (`positive / info / caution / critical / neutral`). Delete `colors.status.*` and `STATUS_COLORS` from both. |
| **`status.*` token key mismatch** | n/a | `colors.status.noWebsite` vs the canonical wire key `no_website` (`status.ts:3,16,27`) — **the entire `status.*` scale is unreachable** (L:111, L:1127) | A naming bug that kills a whole token scale. Proof that a colour scale keyed by hand-written camelCase cannot survive a snake_case wire type. | **Delete the scale.** Keys derive from the wire union at the type level; no hand-written colour key may exist. The `archived` badge is `#1A1D24` text on a 10%-alpha version of itself — **~1.1:1, effectively invisible** (L:865, L:1128) — the clearest possible argument against hand-picked status hexes. |
| **Tailwind version** | `^3.4.14` → locked **3.4.19** (H:36). `theme.extend` only, `plugins: []` (H:63) | `^3.4.18` → **3.4.19** (L:35). `theme.extend` only (L:158) | **Same major, same minor** — the least divergent axis in the document, which is lucky, because both kits were written against v4. | **Standardise on v4 for TEA UI — `DECISION REQUIRED`.** HSM §10.3.5 gives the evidence: `data-slot`, `in-data-[slot=…]` and `has-data-[icon=…]` (`button.tsx:23-32`, H:789, H:904) are all v4 idioms on a v3 project, i.e. "a partial upgrade" (H:914). Staying on v3 means carrying LUTEA's 4 broken v4 utilities (L:1161) forward forever. |
| **Radix / Base UI split** | **`kit/button.tsx` is Base UI** (`@base-ui/react@1.8.0`, uses `render`); the other 19 kit files are Radix (H:23, H:241, H:882) | **Radix everywhere**, including `Button` via `@radix-ui/react-slot` + `asChild` (L:24, L:251) | HSM is the odd one out. H §10.1.1 calls the mix a "mixed-idiom smell" — `render` and `asChild` leak into consumer code (H:882). | **One runtime: Radix.** Adopt LUTEA's `Slot` + `asChild` `Button`; delete `@base-ui/react` from HSM. HSM's `Button` cva is otherwise the better of the two (8 sizes vs 6, H:241), and LUTEA's is the only one with icon auto-sizing (`[&_svg:not([class*='size-'])]:size-4`) and `select-none` (L:251) — keep both sets. |
| **Dark-only** | Dark-only. `darkMode:"class"` set, **no `.dark` class ever applied** (`index.html:2`); `components.json` `cssVariables:false` (H:108, H:90) | Dark-only. `darkMode:"class"` with `<html className="dark">` hardcoded (`layout.tsx:21`); L:60 calls the strategy and the class **"both decorative"** | Both are single-theme wearing a two-theme API. The trap: a consumer reads `darkMode:"class"` and assumes a light theme exists. | **See §8.3.** `DECISION REQUIRED` on shipping a light theme. Independent of that answer: `darkMode: "class"` goes, and both `.bg-card` overrides go (`styles.css:10-12`, `globals.css:16-18`). |
| **Density heights** | `Input h-10` (`input.tsx:11`), `TabsList h-10` (`tabs.tsx:15`), `TableHead h-12` (`table.tsx:76`), `Switch h-6 w-11`. **No `size` prop on `Input`**, so 12 sites hand-roll `h-8` / `h-9` (H:158, H:247, H:253, H:255) | `Button h-8` default / `h-7` sm / `h-10` lg / `h-11` xl (`button.tsx:22-27`), `Input h-8` (`input.tsx:9`), `SelectTrigger h-8` (`select.tsx:23`), `TabsList h-9` (`tabs.tsx:18`), `TableHead h-9` (`table.tsx:36`), `Switch h-5 w-9` (`switch.tsx:17`) | **A full density step between the two.** LUTEA is one step denser everywhere and documents why in-file: *"Trigger auf h-8 (Dashboard-Informationsdichte statt h-10 Form-Dichte)"* (L:167). HSM's compact fields are escape hatches fighting its own kit (H:158). | **LUTEA's density is canonical** — internally consistent and documented; HSM's is a pile of overrides. TEA UI ships `size` on every control (`xs…xl`, `md = h-8`) plus an explicit `density` escape hatch. HSM's 12 override sites become `size="sm"`. |
| **Card padding** | `p-6` + `pt-0`, hard-coded (`card.tsx:26,63,73`); "every consumer overrides (`p-4`, `p-2`, `pb-2`)" (H:242) | `CardHeader` is `p-6`; "every real use overrides to `p-4` / `p-5`" (L:252) | Identical defect, identical shape. Both have a kit `Card` nobody can use at its default padding, plus 31 + 20 hand-typed surface blocks that bypass it entirely. | **`density` prop, LUTEA's own proposal** — `compact = p-3`, `default = p-4`, `comfortable = p-6` (L:345) — because it matches the `h-8` / `text-[11px]` density. **Plus: `CardTitle` must render a heading.** It is a `div` in HSM (`card.tsx:36`, H:242) and a `div` in LUTEA (L:252), so heading semantics are lost at ~50 use sites. |
| **Table head height** | `h-12 px-4` (`table.tsx:76`) vs `TableCell p-4` (`:90`) — **asymmetric**, and `px-4` != `p-4`, so head and cell do not line up on column 1 (H:254) | `h-9 text-[11px] uppercase tracking-wider` (`table.tsx:36`) — no overflow container, no sticky header, no `caption`, no `scope` (L:267) | 12px vs 9px, and HSM's is internally broken. Different column models too: HSM's wrapper is a `div` with no `role="region"`; LUTEA has **no wrapper at all**. | **`h-9` + LUTEA's `text-[11px] uppercase tracking-wider` head style** — the same string as the micro-label, so one token doing two jobs. `p-4` on cells, `px-4 py-3` on heads so they align. Add `overflow-x-auto`, optional sticky, `TableCaption`, `scope="col"`. |
| **Toast implementation** | **Works.** Real `ToastPrimitive.ToastRoot`; Radix supplies the live region (H:256). But `TOAST_LIMIT = 1` — a second toast silently replaces the first (H:278); `TOAST_REMOVE_DELAY = 1_000_000` ms ≈ 16.7 min (H:278); `ToastClose` is `opacity-0` until `group-hover` so keyboard users never see it (`toast.tsx:78`, H:256); animations dead; and `ToastProvider` is mounted inside `main.tsx`'s `Toaster` — a **sibling of `App`**, so a throw in `App` kills the toaster (H:257) | **Inert.** `kit/toast.tsx:3` imports Radix and `:8` re-exports `ToastProvider`, but `Toast` (`:37`) renders a plain `div` — so **no `data-state` is ever emitted** and every `data-[state=open]:animate-in` / `data-[swipe=end]:animate-out` is dead. Provider inert, no live region, real layer `z-[9999]` (`toaster.tsx:17`) while `ToastViewport` sits at a dead `z-[100]` (`toast.tsx:13`) (L:269-270, L:1056-1067) | Two opposite failures from the same copy. HSM has a working-but-hostile toast; LUTEA has a broken one and pays a full Radix dependency for it (L:1067). | **Rebuild once on HSM's Radix path** with LUTEA's missing bits: real `ToastRoot`, a real `aria-live` region, `TOAST_LIMIT > 1`, a sane remove delay, a close button visible on focus, provider owned by the library, one `z` token. Neither `use-toast` survives — both are **module-level mutable singletons** (H:278, L:1064) that break SSR and multi-provider. |
| **Select implementation** | Radix, **used** in 4 files. Broken arbitrary value: `max-h-[--radix-select-content-available-height]` (`select.tsx:78`) is **missing `var()`** → resolves to nothing (H:250, H:903). Item focus is `bg-accent` (`:121`) vs `DropdownMenu`'s `focus:bg-muted` (`dropdown-menu.tsx:84`, H:246) | Radix, **unused**. Broken differently: **4 Tailwind-v4 utilities in a Tailwind v3 project** — `max-h-(--radix-select-content-available-height)`, `origin-(--radix-select-content-transform-origin)` (`:72`), `h-(--radix-select-trigger-height)`, `min-w-(--radix-select-trigger-width)` (`:85`) — all silently emit nothing (L:263, L:1161) | **Neither repo has a working `Select`.** HSM's is one missing `var()`; LUTEA's is four v4-syntax utilities. The correct v3 form already exists in LUTEA's own `dropdown-menu.tsx:71` (L:1161). | **Rewrite once.** Radix `Select`, v4 syntax (if TEA UI ships v4) or `[var(--…)]` (if v3); item focus `bg-muted` to match `DropdownMenu`; `focus-visible:` not `focus:`; a real `size` prop so the `h-8` override at `select.tsx:23` becomes a prop. |
| **Animation library** | `tw-animate-css@1.4.0` **installed, never imported** (H:41, H:821). `tailwindcss-animate` is **not in `package-lock.json` at all** (H:197). Result: every dialog, select, dropdown, toast and tooltip opens with **no animation**, and the `data-[state=open]` hooks the CSS is written against are inert (H:197) | `tailwindcss-animate@1.0.7`, **loaded** at `tailwind.config.ts:54` (L:38) — animations work. But `duration-` / `ease-` matches **zero** times: no motion token axis exists, everything runs at Tailwind defaults (L:224) | **A working animation layer in one repo and a silently dead one in the other, from the same copied class names.** | **Adopt LUTEA's working setup** (or v4-native). Then add the axis neither has: named durations + easings, plus **`prefers-reduced-motion` honoured globally** (both repos: zero occurrences, H:604, L:225). HSM's `@keyframes hsmspin` (`styles.css:67-76`) exists only for generated loadingscreen HTML (H:195) and is not an app token. |
| **`cn` vs `clsx` + `tailwind-merge`** | `cn@0.2.5` — a *compiled* Tailwind-aware merge that replaces `clsx` + `tailwind-merge` (H:40, H:218). Neither `clsx` nor `tailwind-merge` is a dependency. **Two import paths for one function:** `import { cn } from "cn"` (`kit/button.tsx:3`) vs `import { cn } from "@/lib/utils"` (16 files) (H:218) | `cn = twMerge(clsx(...))` at `lib/utils.ts:4` (L:1017), with `tailwind-merge@3.7.0` and `clsx` as direct dependencies (L:36-37). L §9.2.1 calls this *"the single most consistent thing in the repo"* (L:1034) | Different merge semantics behind one function name, and one repo has a second import path that bypasses its own barrel. Any component lifted verbatim between repos silently changes behaviour. | **One `cn`, one import path.** `DECISION REQUIRED` on the implementation: the `cn` package (smaller, no dual dep) or explicit `tailwind-merge` + `clsx` (transparent, matches LUTEA). Either way `cn` is imported **only** from the library entry point, and HSM's `kit/button.tsx:3` direct import is deleted. Non-negotiable alongside: HSM's `Button` injects `className` **into** the cva call (`button.tsx:51`) while `Badge` does not (`badge.tsx:32`) (H:740) — **pass `className` into `cva` on every primitive** — and **ban `!`-prefixed overrides in library code** (H:741). |
| Font `display` token | **None.** `@fontsource/lilita-one` imported, **never referenced by any app CSS rule** (H:164) | `display: ["Lilita One","Jost","sans-serif"]` (`tailwind.config.ts:11`), used on marketing `h1`s (L:518) | HSM has no display face; LUTEA's marketing pages depend on one. | **Ship `display`.** HSM simply does not use it. LUTEA's `agentur:43` `font-display text-4xl … md:text-6xl` is "the brand's highest-value asset" (L:990). |
| `--radius-*` prop count | 5 (`sm,md,lg,xl,2xl`, H:110-115) | 3 (`sm,md,lg`, L:71-76) | Cosmetic — both are dead. Listed so the merge does not "reconcile" a non-problem. | Delete both blocks; ship a real `borderRadius` scale with all steps `0`. |
| `.glass-grid` | Defined, **zero consumers** (H:222) | Defined, **live** at `page.tsx:6` and `agentur/page.tsx:36` (L:129) | One repo treats it as decoration to delete, the other as brand. | **Keep it and give it a token** — L §8.2 calls the marketing layer the brand's highest-value asset. HSM's copy is dead only because HSM has no marketing surface. **But** LUTEA layers a *second* 48px grid on `body` (`globals.css:44-53`) that "doubles up with `.glass-grid`, so `/` and `/agentur` render two overlapping 48px grids" (L:131) — one of the two is deleted. |
| `data-slot` coverage | **1 of 20** — `data-slot="button"` (`kit/button.tsx:50`) (H:789) | **3 of 20** — `button.tsx:49`, `card.tsx:7`, `skeleton.tsx:11` (L:1020) | Both are far below standard, and HSM's single instance is referenced by two selectors with **no producer** (`has-data-[icon=inline-end]`, `in-data-[slot=button-group]`, `button.tsx:23-32`) | **`data-slot` on every kit root and every part** (L:1035, H:793). Then either wire `ButtonGroup` or delete the two dead selectors. |
| `"use client"` discipline | Present in 14 files, **absent in 8 equally client-only kit files and all 20 pages**; in a Vite SPA the directive does nothing — "pure noise that hints at an abandoned RSC migration" (H:804) | Present on 20 of 39 files; `dropdown-menu.tsx` is **missing it** despite wrapping a `Portal` (L:256) — a real bug | Opposite problems. | **Follow LUTEA's rule: `"use client"` only where a handler, hook, or portal exists** (L:1039). TEA UI ships RSC-safe code with the directive only on interactive primitives. |
| Ref forwarding | `forwardRef` in 12 kit files; **absent** in `badge`, `skeleton`, `confirm-dialog` (H:796-797). `Button` uses Base UI's `render` instead (H:798) | `forwardRef` in 11 of 20; **absent** in `Badge`, all 6 `Card` parts, `CrmStatusBadge`, `TableHeader/Body/Row/Head/Cell`, `Toast`×3 (L:1021) | Both incomplete; the missing set differs. | **Every primitive forwards a ref** (L:1037, H:801). Non-negotiable for a library. |
| Variant prop name | `variant` + `size` throughout, plus ad-hoc booleans: `destructive` on `ConfirmDialog` (`confirm-dialog.tsx:36`), `on` on `ToggleBtn`, `transparent` on `ColorRow` (H:746-748) | `variant` in `Button`/`Badge`/`Toast`; **`tone`** in `CrmStatusBadge:29`; `size` elsewhere (L:1018) | `tone` vs `variant` in one kit, and `solid` (a visual) colliding with `success` (a semantic) in one value namespace (L:1019) | **`variant` only; `tone` retired** (L:1018). One scale: `intent` (`primary secondary ghost outline destructive link`) × `emphasis` (`solid subtle outline`) × `size` — which is LUTEA's own `solid|outline` pair, misnamed and misfiled (L:1036). |
| Status → colour semantics | gold `accent` is the "online" green at 15 sites (H:288); `bg-emerald-500` and `bg-green-900` are two more "success" greens (H:123, H:126) | `status.contacted = #F2C012` = `primary` = `accent` (L:113, L:642); `version-manager` reuses `variant="default"` = gold for `approved` (L:642) | **Same disease, same colour.** Status is painted from the primary scale in both — which is why "success" is gold in one repo and emerald in the other. | **Status colour comes from `tone`, never from `accent`.** See §8.4. |
| Surface / padding rhythm | `p-4` / `p-5` / `p-6` chosen per page across 13 panel sites (H:156) | `p-3` / `p-4` / `p-5` / `p-6` / `p-8` across 20 hand-typed surface blocks (L:343) | LUTEA drifts one step finer. | LUTEA's `density` prop resolves it (L:345). |
| Copy register | Informal **du**, with older pages in formal **Sie** (`SetupWizard.tsx:11,178,207`; H:920) | Informal **du** on form pages, **Sie** in the funnel (`agentur:26`); L §5.2 calls the mix "an awkward inconsistency" (L:543) | **Both repos mix registers.** | `DECISION REQUIRED`: one register for TEA UI's shared copy deck. HSM argues the informal voice "is the current one" (H:920). |
| Orthography | Real umlauts throughout: "Übersicht", "Größe" (H:530) | **Systematic `ae`/`oe`/`ue` transliteration:** "Gespraech", "Bestaetigen", "Loeschen", "Ungueltige Ressourcen-ID", "fuer", "geprueft" (L:625, L:651, L:717) | Two orthographies for the same language in the same product family. | `DECISION REQUIRED`, and a hard call: real umlauts (HSM) vs transliteration (LUTEA). Note LUTEA's transliteration has already produced **three corrupted strings** — Chinese inside German (`crm-page-client.tsx:299`), Portuguese inside German (`settings-panel.tsx:249` "Gebäude-Precrição"), and a mangled comment (`settings-overlay.tsx:13` "WBÖhe") (L:1140) — weak but real evidence that the transliteration pipeline is a corruption vector, not a style. |
| `formatBytes` | **4 copies, 3 unit systems:** `KB/MB/GB` and `KiB/MiB/GiB`. `FileBrowser` uses **GiB/MiB/KiB** (`FileBrowser.tsx:52-55`), "the only page that does; everyone else uses GB/MB/KB", and has a bytes-only path too (H:267, H:717) | **No byte formatter exists in the repo at all** | The divergence is **entirely intra-HSM**; LUTEA contributes nothing. | One `formatBytes(binary = true)` + `formatDuration` in TEA UI utils. See §5.21. |
| z-index scale | `z-50` overlays plus ad-hoc `z-[60]`, `z-[70]`, `z-[100]`, `z-[900]`, `z-[1000]`, `z-[1001]`; no scale declared (H:170-182) | `z-30`, `z-40`, `z-50`, a dead `z-[100]`, and a real `z-[9999]` (L:200-208) | "Two competing scales for the same overlay band" (L:208); HSM's editor values are meaningless outside their dialog context (H:182) | **Named scale: `content 10 / sticky 30 / header 40 / overlay 50 / modal 60 / toast 70`** (extending L:208's proposal). `z-[9999]` and HSM's `z-[1000]` / `z-[1001]` are deleted. |
| Scrollbar strategy | `::-webkit-scrollbar` **and** `kit/scroll-area.tsx:41` renders its own `w-2.5 bg-border` thumb — "it fights" (H:224) | `globals.css:60-73` **and** the `scroll-area` delta "conflicts with the global block" (L:262) | **Identical conflict in both, inherited through the copy.** WebKit-only in both, no `scrollbar-width` / `scrollbar-color` Firefox fallback (H:224, L:133) | **Pick one:** `ScrollArea` for scrollable regions, the global rule for the document, with standards properties alongside the WebKit pseudo-elements. |
| `components.json` | **Exists and is wrong in 4 places:** `tailwind.css: "src/styles.css"` (should be `styles.css`), `baseColor: "slate"` (no slate tokens exist), `aliases.ui: "@/components/ui"` (**the folder is `@/components/kit`**), `cssVariables: false` (H:65-80) | **Does not exist**; no shadcn CLI (L:59) | A `shadcn add` in HSM would write to a folder that does not exist — "exactly what `AGENTS.md:13` forbids" (H:906) | **No `components.json` in TEA UI.** TEA UI is a package, not a shadcn target. HSM's copy survives only as a historical artifact of the kit rename. |
| Dead-code discipline | Dead: `avatar.tsx`, `skeleton.tsx`, `@radix-ui/react-slot`, `SetupWizard.tsx` (275 L), `ServiceManager.tsx` (182 L), `tw-animate-css`, geist, nunito, lilita-one, 8 unused kit exports, 2 unused shadow tokens, 2 dead CSS classes (H:427-436) | Dead: `DashboardClient`, `DashboardNav`, `FinderClient`, `CardFooter`, `DialogOverlay` / `DialogPortal`, `ToastViewport`, **`StubSection`**, **all 10 MLHSM-origin kit files**, `colors.lutea.*`, `colors.status.*`, `boxShadow.card`, `--radius-*`, `#root` (L:1177-1196) | **Both repos ship dead primitives — and in both cases the dead primitive is the *correct* one** (HSM: `Skeleton`; LUTEA: `StubSection`) | A published library must not ship an unadopted component. Every §4 entry is either adopted by both consumers or explicitly `DO-NOT-BUILD`. |
| `formatBytes` location | 4 copies across `Backups` / `Monitoring` / `Database` / `FileBrowser` (H:717) | absent | Already covered above; called out here because it is the only divergence where one side has **no** implementation. | Same. |

---

## 4. Merged component inventory (the canonical TEA UI catalogue)

The de-duplicated union of both kits and both sets of page-level composites. Classification is exactly one of `REUSE | MERGE | EXTRACT | ADAPT | GENERALIZE | NEW | PROJECT-SPECIFIC | DO-NOT-BUILD`.

**Priority key.** `P0` = blocks the token layer, or blocks adoption of a component that is already written. `P1` = largest defect- or size-reduction. `P2` = completeness, no active defect.

| TEA UI component | Exists in HSM | Exists in LUTEA | Problems found | Classification | Target package | Priority | Notes |
|---|---|---|---|---|---|---|---|
| **tokens / theme** (`tea`, `hsm`, `lutea`) | hex in `tailwind.config.js:11-35`, `cssVariables:false` (H:90-107) | hex in `tailwind.config.ts:13-47`, **zero** `var(--)` in source (L:78-117) | No CSS custom properties; `darkMode:"class"` decorative in both; `.bg-card` duplicated in both stylesheets (H:221, L:128) | **MERGE** | `@tea-ui/tokens` | **P0** | 16 of 18 hexes already identical. L §11.5.1: *"Without this, nothing else can be shared"* (L:1212). |
| **`cn` + cva + variant utils** | `cn@0.2.5`, two import paths (H:218) | `twMerge(clsx(...))` (L:1017) | Different merge semantics behind one name; `className` into cva in `Button` only (H:740) | **MERGE** | `@tea-ui/utils` | **P0** | §3. One `cn`, one entry point, `className` always inside `cva`. |
| **Button** | `kit/button.tsx`, **Base UI**, 6 variants × **8 sizes** (`default xs sm lg icon icon-xs icon-sm icon-lg`, H:241) | `kit/button.tsx`, **Radix Slot**, 6 variants × 6 sizes, `asChild`, icon auto-sizing, `select-none` (L:251) | Two headless runtimes; HSM's `has-data-[icon]` / `in-data-[slot=button-group]` are dead (H:904); ~40 hand-painted colour class strings bypass the cva (H:321-346); **no component accepts `loading`** (H:755) | **MERGE** | `@tea-ui/primitives` | **P0** | Radix `asChild` + HSM's 8-size matrix. Add `loading?: boolean` and the semantic variants (`success / warning / info / neutral / danger-subtle`) that collapse the ~40 hand-written chips. |
| **IconButton** | implied by `size="icon-xs"…"icon-lg"` (`button.tsx:22-32`, H:241) | `size="icon"`, `size="iconSm"` (L:251) | Different smallest sizes; HSM's `icon-xs` is undocumented and unpoliced | **ADAPT** | `@tea-ui/primitives` | P1 | Not a separate component — a `Button` size plus a **mandatory `aria-label`** rule (§6). Adopt HSM's 4-step icon scale. |
| **ButtonGroup** | **no component** — the *selectors* exist and are dead (`button.tsx:24-32`, H:789, H:904) | none | HSM's variants are styled against `in-data-[slot=button-group]` with no producer | **NEW** | `@tea-ui/primitives` | P2 | Either build it (7 row-action sites, H:298) or **delete the two dead selectors**. Shipping the styles without the component *is* the bug. |
| **Input** | `kit/input.tsx`, `h-10`, `md:text-sm` iOS-zoom trick (H:247) | `kit/input.tsx`, `h-8`, `aria-invalid:*` present, `ComponentProps<"input">` (L:257) | HSM: no `size` prop (12 override sites), no `aria-invalid` styling. LUTEA: correct | **MERGE** | `@tea-ui/primitives` | **P0** | LUTEA's `aria-invalid` + HSM's `md:text-sm`; a `size` prop replaces all 12 `h-8` / `h-9` overrides. |
| **Textarea** | **absent from the kit** — raw at `ConfigEditor.tsx:563`, `FileBrowser.tsx:423` (H:212, H:267) | `kit/input.tsx:19`, `min-h-20` (L:258) | LUTEA's is **missing the `aria-invalid:*` that sits 10 lines above it in the same file** (L:258) | **REUSE** | `@tea-ui/primitives` | P1 | Take LUTEA's, add `aria-invalid`, add `size`. HSM has no textarea to de-duplicate. |
| **SearchInput** | **absent** — 3 raw inputs with `placeholder-slate-500` (`Notifications.tsx:154,163,172`, H:127), ~3.3:1, fails AA (H:618) | 3 impls: `company-list.tsx:118-128` (kit `Input` + `Search`, `pl-8`), `crm-page-client.tsx:65-73` (raw), `global-search.tsx:46-61` (raw + bespoke `ring-3 ring-ring/40`) (L:316, L:379) | 2 of 3 bypass `kit/input.tsx`; widths diverge (`w-full` / `w-52` / `flex-1`); **no clear/reset button anywhere** (L:316) | **EXTRACT** | `@tea-ui/composites` | P1 | `global-search.tsx:46-61` is canonical (L:383). Left icon slot + optional trailing slot + reset. |
| **PasswordInput / SecretInput** | 5 copies of a reveal toggle: `Settings.tsx:286-293, 510-517, 621-628, 712-719` + `Ai.tsx:590-592` (H:307, H:372) | **absent as a component**; `login-form.tsx` has the only correct `htmlFor`/`id` pair, `autoComplete="current-password"`, `autoFocus` (L:284) | HSM: one copy mis-aligned (`bottom-2` instead of `top-1/2 -translate-y-1/2`, `Settings.tsx:624`); one has **no `aria-label` and no `aria-pressed`** (`Ai.tsx:590-592`, H:372) | **NEW** | `@tea-ui/composites` | P1 | Merge HSM's reveal toggle with LUTEA's `autoComplete` / `autoFocus` / `htmlFor` discipline. The toggle needs `aria-label` + `aria-pressed`. |
| **Select** | `kit/select.tsx` Radix, **used** in 4 files; `max-h-[--radix-…]` missing `var()` (H:250, H:903); `focus:` not `focus-visible:`; item focus `bg-accent` != dropdown's `bg-muted` (H:246) | `kit/select.tsx` Radix, **unused**; **4 Tailwind-v4 utilities that emit nothing in v3** (L:263, L:1161) | Neither repo has a working `Select`; HSM also has 3 raw `select` elements (H:491) | **MERGE** | `@tea-ui/primitives` | **P0** | Rewrite once. Align item focus with `DropdownMenu` (`bg-muted`). Add `size`. |
| **Switch** | `kit/switch.tsx` Radix, `h-6 w-11` / `h-5 w-5`, `rounded-full` thumb, `ring-ring/**40**` (H:211, H:253); **used 3×**; `App.tsx:873` renders it with **no `aria-label`** (H:253) | `kit/switch.tsx` Radix, `h-5 w-9`, `rounded-none`, `ring-offset-2 ring-offset-background` (L:266); **unused** — `settings-panel.tsx:220-226` hand-rolls a `button aria-pressed` | Radius law diverges (§3); one HSM use site is unnamed | **MERGE** | `@tea-ui/primitives` | P1 | LUTEA's offset recipe is better; density and radius per §3. HSM §7: "the one control that gets a rounded thumb right" (H:661). |
| **Checkbox** | **no checkbox in the kit**; `@radix-ui/react-checkbox` is not a dependency; `Websites.tsx:249-331` has 3 raw checkboxes; `kit/table.tsx:76,90` has `[&:has([role=checkbox])]:pr-0` styling for a checkbox column **no consumer has** (H:254) | **absent entirely**; only a dead `CheckboxItem` export inside the unused `dropdown-menu.tsx` (L:256) | Raw checkboxes in HSM, nothing in LUTEA; both have table CSS anticipating a column that does not exist | **NEW** | `@tea-ui/primitives` | P1 | Needed by the existing table CSS. Ships with `RowActions`. |
| **Radio / RadioGroup** | no primitive; dead `RadioItem` + `RadioGroup` exports in `dropdown-menu.tsx` (H:246) | same dead exports, same unused file (L:256) | Zero real usage in either repo. HSM's status pickers are hand-rolled button rows (L:313) | **NEW** | `@tea-ui/primitives` | P2 | Only after `StatusSelect` exists — LUTEA's own analysis routes the interactive status picker to a chip row, not a radio group (L:373). |
| **Tabs** | `kit/tabs.tsx` Radix, `TabsList h-10` overridden to `h-8` at 1 site (H:255); **used 4 files**; no `data-slot` | `kit/tabs.tsx` Radix verbatim MLHSM, `TabsList h-9` (L:268); **unused** | HSM's `h-10` is a density outlier | **REUSE** | `@tea-ui/primitives` | P2 | LUTEA's delta note says "keine — MLHSM ist bereits LUTEA-konform" (L:268). Fix the `h-10` and it is done. |
| **Card family** | `kit/card.tsx`, 6 parts, `shadow-none` hard-coded, `p-6` / `pt-0` hard-coded (H:242); **7 pages use it correctly, 15 use the raw div** (H:290, H:419) | `kit/card.tsx` + 5 parts, `data-slot="card"` on `Card` only, `p-6` header, `CardFooter` **unused** (L:252) | **`CardTitle` is a `div` in both** → heading semantics lost at ~50 sites. `p-6` default overridden everywhere. `shadow-card` dead in both. A local `Card` shadows the kit's concept in `settings-panel.tsx:196` (L:1168) | **MERGE** | `@tea-ui/primitives` | **P0** | `density` prop + `CardTitle` renders a real heading + `data-slot` on all 6 parts. Highest fan-out component in the union: 31 HSM sites (H:418) + 20 LUTEA sites (L:323) converge here. |
| **Badge** | `kit/badge.tsx`, 4 variants, renders a **`<div>`** → invalid inside the `<span>` / `<p>` where it is actually used (H:240); dead `focus:ring-2` on a non-focusable `div` (H:208) | `kit/badge.tsx`, 5 variants (adds `muted`), `rounded-none` (L:250) | Same `div` element bug in both. HSM's `focus:ring` can never fire | **MERGE** | `@tea-ui/primitives` | P1 | Render a `<span>`. Drop the ring. `muted` is a one-off — fold into the shared variant scale. |
| **StatusBadge** | **5 independent hand-written label tables** for 5 wire unions (H:296, H:358): `WebsiteStatus` (6 values), `ContainerStatus` (6), `BackupStatus` (3), `CertificateStatus` (5), `GameServer["status"]` (4), `DependencyStatus` (4), `SecuritySeverity` (3). `GameServerDetail.tsx:326-332` renders **three representations of one status in one block** (H:359) | **7 implementations + `FEHLT`** (L:313, L:369): `crm-status-badge.tsx:23` (span + dot, **inline `style`** from `STATUS_COLORS`, hardcoding `color:"#111318"` — unthemeable, not `twMerge`-able, L:253), `company-list.tsx:322-336`, `crm-page-client.tsx:170-183`, `company-list.tsx:229-257` `FilterChip`, `projects-client.tsx:117-130`, `finder-client.tsx:49-62`, `version-manager-client.tsx:17-21` | Neither repo has a registry. HSM's German wording differs per page for the same wire value (H:296). LUTEA's `archived` badge is **~1.1:1, unreadable** (L:865) | **EXTRACT** | `@tea-ui/composites` | **P0** | One `StatusBadge` (read-only) + one `StatusSelect` (interactive, from `FilterChip`, L:373) + one `statusMeta` registry. See §5.2 and the German table in §5.22. |
| **StatusDot** | **15 sites, 5 dialects, 7 colours, 3 sizes** (`h-2.5 w-2.5` ×5; `h-2 w-2` / `h-1.5 w-1.5` ×6); **4 pages use emoji** instead of lucide (`ServiceManager.tsx:74-76`, `DynamicDns.tsx:88-89`, `Diagnostics.tsx:15-18,186-188`, `Security.tsx:10-12`) — H:288 | a dot exists only inside `FilterChip` (L:364) | Seven colours for one "online" semantic; emoji in 4 pages | **EXTRACT** | `@tea-ui/composites` | P1 | One `StatusDot` with a `tone` prop. The `rounded-full` exception is already the shared radius law. |
| **Alert** (error / notice banner) | **31 sites, 19 files, 4 visual dialects** (H:293, H:348): A `bg-destructive/10 border border-destructive/30` (9×); B `bg-red-950/50 … text-red-300` (7×, and **`bg-red-950/50` is not a token**, H:350); C `border-destructive/40 bg-destructive/10`; D `border border-destructive/25 bg-destructive/10`. Padding `p-2` / `p-3` / `p-4`. 4 of 31 have a dismiss button. Prefixes `"IPC-Fehler: "` (4×, **factually wrong — the transport is HTTP**, H:468) and `"Fehler: "` (7×) | **9 copies, 0 components**; `border-destructive/30 bg-destructive/10` verbatim in **all 9**; `text-red-300` 6×, `text-red-200` 2×, unset 1×; **`role="alert"` in only 2 of 9** (L:322, L:411) | 40 hand-typed banners, 2 error text colours that never agree, 4 padding values, `role="alert"` on 4 of 40 | **NEW** | `@tea-ui/composites` | **P0** | `variant="info / success / warning / destructive"`, `dismissible`, `role="alert"` baked in, token foreground instead of `text-red-300`. Also absorbs HSM's `showNotice` helper, copy-pasted 3× with a 5 s timer never cleared on unmount (H:349) and HSM's success family (H:294). |
| **EmptyState** | **16 sites, 2 families** (H:306, H:383); most common is a bare sentence — `rounded-none border border-border p-5 text-muted-foreground text-sm` (6×). Only `Websites.tsx:354` tells the user what to do next. Only `GameServers.tsx:370-377` distinguishes "no data" from "filtered out" | **10 implementations, 1 component** — `stub-section.tsx:11` is already correct (real `<h2>` + `hint` + `cta` slot) and **dead**; all 10 are `border border-dashed border-border p-10 text-center` with `p-4` / `p-10` / `p-16` drift (L:321, L:403) | 26 sites. HSM's `icon + guidance` variant exists in exactly one place (`LoadingScreenEditor.tsx:1281-1290`); LUTEA has the best *content* — `portfolio/page.tsx:21-48`, "an empty state that teaches the process" (L:700) | **MERGE** | `@tea-ui/composites` | **P0** | Adopt `StubSection` as the base (L:407), add `icon` / `action` / `size`, plus a `TableEmptyRow` for the in-table case — HSM's `Cloudflare.tsx:229-238` and `Websites.tsx:348-358` are the only in-table implementations and they are the right answer (H:384). L §11.5.2: pure win, the file already exists. |
| **Skeleton** | `kit/skeleton.tsx` — `animate-pulse rounded-none bg-muted`, **imported nowhere** (H:252); no `aria-busy`, no `aria-hidden` | `kit/skeleton.tsx` — `data-slot="skeleton"` (`:11`), **imported nowhere**; delta note "React-Import ergänzt" (L:265); no `role="status"` / `aria-busy` | **Dead in both.** Both repos render 8 + 13 hand-rolled loaders instead | **REUSE** | `@tea-ui/composites` | P1 | Already correct and already token-compliant in both. L §11.3 warns: shipping it as dead code "invites the 10 inline copies to persist" (L:1114). |
| **Spinner / Loading** | 13 `animate-spin` elements (H:606); 8 `"Lade …"` loaders, 5 of them byte-identical `<div className="flex items-center justify-center h-64">` wrappers (H:292, H:363); **no `aria-busy`, no `aria-live`** (H:477) | 13 `<Loader2 className="animate-spin">` in **4 different sizes** (`size-4`, `size-3.5`, `size-4` + `mr-2`, plus a pulse dot) (L:326, L:472); **no `role="status"` anywhere**; copy drifts, incl. a space before the ellipsis (`overseer-dashboard.tsx:156`, L:1131) | 21 loaders, 4 sizes, 2 ellipsis styles, zero announcements | **NEW** | `@tea-ui/composites` | P1 | One `Loading` with `role="status"` + `aria-busy`, built on `Skeleton`. Adopt HSM's `…` (U+2026) convention, consistently used 64×/24 files (H:477). HSM's 8 full-page `"Lade X…"` strings and LUTEA's in-button pattern (L:674-680) are *different* mechanisms and both are right — ship both. |
| **Progress / Meter** | 3 sites, same markup 3×: `h-1.5` / `h-2.5 w-full overflow-hidden rounded-full bg-muted` + inner `rounded-full` + inline `style={{width}}` (H:303); **no `role="progressbar"`, no `aria-valuenow`** (H:594); 2 sites carry their own threshold ladder (H:303) | raw `<input type="range">` at `finder-client.tsx:69-73` with **no accessible name and no `aria-valuetext`** (L:291); `ScoreCat` progress bar with no colour banding (L:445) | Neither repo declares a progressbar; HSM's bars are unlabelled to AT; LUTEA's slider has no name | **EXTRACT** | `@tea-ui/composites` | P1 | One `Meter` with `value` / `max` / `tone`, `role="progressbar"`, `aria-valuenow` and `aria-valuetext` (the last is what makes a LUTEA-style slider announce). `rounded-full` is already the shared radius exception. |
| **Table family** | `kit/table.tsx`, 8 parts, `TableHead h-12 px-4` vs `TableCell p-4` **asymmetric**; wrapper is a `div`, no `role="region"`; `[&:has([role=checkbox])]:pr-0` for a column that does not exist; **used in 2 files**; **8 pages hand-roll `table`** with a different rhythm (`px-4 py-3`) (H:254, H:352) | `kit/table.tsx`, 6 parts, `h-9` head, **no overflow container, no sticky header, no `caption`, no `scope`**; `TableBody` is a no-op `cn("", className)`; `data-[state=selected]` dead (L:267, L:908); **1 consumer** (L:320) | Two incompatible table systems in HSM; one incomplete in LUTEA. **No table in either repo has a `caption`** (H:516). Only HSM's `Database.tsx` paginates (H:518) | **MERGE** | `@tea-ui/primitives` | **P0** | HSM's `px-4 py-3` rhythm (its 8 raw tables already agree on it, H:356) + LUTEA's `h-9` head + an `overflow-x-auto` wrapper + `TableCaption` + `scope="col"` + `TableEmptyRow`. HSM's `TableFooter` / `TableCaption` are already written and unused (H:436). |
| **Dialog family** | `kit/dialog.tsx`, 10 parts, faithful Radix, 8px shadow (`:41`); close label is **English** — `<span className="sr-only">Close</span>` (`:49`); close button uses `focus:` not `focus-visible:` (H:245) | `kit/dialog.tsx`, 10 parts, 8px shadow (`:37`), `aria-label="Schließen"` (`:45`); close button sets **`focus:outline-none` with no replacement ring** (L:825) | Both have a close-button focus defect, in opposite ways. HSM's 8px is the outlier against its own 6px popovers (H:141-143) | **MERGE** | `@tea-ui/primitives` | **P0** | Take LUTEA's German `aria-label` and HSM's `focus-visible:` ring. `DialogOverlay` / `DialogPortal` should not be public (L:254). `DialogFooter` should not force `border-t pt-4` (L:254). |
| **AlertDialog / ConfirmDialog** | `kit/confirm-dialog.tsx` + promise-based `useConfirm()` (`:80-110`); **used 11×** (H:244, H:388); bypassed for `deleteContainer` (H:390) and for unsafe recovery actions (H:391) | `kit/confirm-dialog.tsx` + `useConfirm()` — **verbatim MLHSM, unused**; the repo ships a bespoke two-step inline confirm instead (`settings-panel.tsx:335-345`, L:255, L:717) | HSM: 11 confirming sites, ≥4 destructive sites with **no** confirm. LUTEA: **exactly one confirmation in the whole app**, and `DELETE /api/config` (destroys all config) plus Kill-Switch have **none** (L:708-714) | **REUSE** | `@tea-ui/primitives` | **P0** | HSM §7: "the best API in the codebase" (H:666); L §7.1: "the highest-leverage un-adopted component" (L:910). Add HSM's **`typeToConfirm`** extension — the Database typed-name pattern (H:394) is strictly stronger and exists exactly once. |
| **Drawer / Sheet** | mobile drawer `App.tsx:357-376`, `w-72`, `bg-black/60` backdrop, **no close-on-Escape, no focus trap**, main content stays interactive behind it (H:506) | **3 copies of the same override string** over `DialogContent`: `left-0 top-0 h-dvh … border-y-0 border-l-0 p-0` (`dashboard-sidebar.tsx:104`), mirrored `right-0 …` (`overseer-overlay.tsx:34`), centred `max-h-[85vh]` (`settings-overlay.tsx:33`) (L:330, L:399) | 4 hand-built drawers; HSM's is not keyboard-complete, LUTEA's 3 are copy-pasted | **EXTRACT** | `@tea-ui/primitives` | P1 | One `Drawer` variant over `Dialog` (L:399), with a focus trap and Escape. `h-screen` and `h-dvh` must not be mixed in one shell (L:726, L:1172). |
| **DropdownMenu** | `kit/dropdown-menu.tsx`, 15 parts, correct `inset`, `focus:bg-muted`; **9 of 15 exports unused**; **used once** (`LoadingScreenEditor.tsx:53-58`) (H:246) | `kit/dropdown-menu.tsx`, 15 parts, **entirely unused**, **missing `"use client"`** despite wrapping a `Portal`, broken indent at `:70` (L:256) | Nearly identical files; LUTEA's has a real bug HSM's does not | **REUSE** | `@tea-ui/primitives` | P2 | HSM §7: REUSE. Fix the missing directive. Its `origin-[var(--…)]` at `dropdown-menu.tsx:71` is the **correct v3 form** and the reference for fixing HSM's `Select` (L:1161). |
| **Tooltip** | `kit/tooltip.tsx`, 4 parts, 4px shadow; **two nested `TooltipProvider`s** — `main.tsx:10` (700 ms) and `LoadingScreenEditor.tsx:983` (300 ms) (H:258) | `kit/tooltip.tsx`, 4 parts verbatim, **unused**; needs a `TooltipProvider` at the app shell (L:271, L:906) | HSM's nested provider is a consumer bug. A `Tooltip`-wrapped button with no `aria-label` still has **no accessible name** (H:258) | **REUSE** | `@tea-ui/primitives` | P2 | One provider, mounted once by the library. **Every icon-only tooltip ships with a mandatory `aria-label`** (§6). |
| **Toast family + Toaster** | **Functional** Radix path; `TOAST_LIMIT=1`; `TOAST_REMOVE_DELAY=1_000_000`; close `opacity-0` until hover; provider mounted as a sibling of `App` (H:256-257, H:278) | **Inert** — Radix imported, `Toast` renders a `div`, provider never receives a `Root`, no live region, `z-[9999]` vs a dead `z-[100]` (L:269-270, L:1056-1067) | Opposite failures from one copy. Both `use-toast` files are module-level mutable singletons (H:278, L:1064) | **ADAPT** | `@tea-ui/primitives` | **P0** | Rebuild on `ToastPrimitive.ToastRoot` + a real `aria-live` region. `TOAST_LIMIT > 1`, sane remove delay, close button visible on focus, provider owned by the library, one `z` token. |
| **Avatar** | `kit/avatar.tsx` Radix, **imported nowhere**; hard-codes `h-10 w-10 rounded-full` (H:239, H:428) | **absent** (logos only) | Dead in HSM, and it breaks the square identity | **DO-NOT-BUILD** | — | P2 | HSM §7: "a library should not ship a component the host app does not need" (H:670). Neither app has a user-avatar surface. |
| **Logo** | **absent** — hand-rolled brand mark, **duplicated** at `App.tsx:275-276` and `:362-363` (H:409) | `kit/logo.tsx` — `LuteaLogo` (`aspect-[2/1]` + `fill` + `object-contain` + `priority`) and `LuteaLogoSmall` (fixed `h-10 w-20`, overridden to `h-8 w-16` at the call site); `priority` on **every** instance → up to 3 preloads of one PNG (L:260-261, L:1096) | LUTEA's component is right; its sizing is per-call-site and its `priority` is unconditional | **GENERALIZE** | `@tea-ui/marketing` | P2 | Ship the *pattern* (`Logo` with `full` / `compact`), not the asset (L:913). `priority` becomes a prop, default `false`. |
| **Separator** | `kit/separator.tsx` Radix, `decorative` defaults to **`true`** → renders `role="none"`, invisible to AT; 1 consumer; `Settings.tsx:456-458` re-implements it as a `<div className="h-px bg-border" />` **in a file that imports the kit** (H:251, H:308) | `kit/separator.tsx` verbatim, **unused**; delta "keine." (L:264) | Same default in both. Semantic dividers are invisible to AT in both | **ADAPT** | `@tea-ui/primitives` | P2 | HSM §7: the default should be `false` (H:668). HSM's hand-rolled `div` is deleted. |
| **ScrollArea** | `kit/scroll-area.tsx` Radix, `w-2.5 bg-border` thumb, **3 consumers**; `ScrollBar` export never imported; thumb **fights the global `::-webkit-scrollbar`** (H:249) | `kit/scroll-area.tsx` verbatim, **unused**; its own delta note says it "conflicts with the global `::-webkit-scrollbar` block" (L:262) | Identical conflict in both. L §6.2: the overflow containers are **keyboard-unscrollable** and `ScrollArea` would fix it (L:872-874) | **REUSE** | `@tea-ui/primitives` | P1 | Promote `ScrollBar` to real usage; ship standards scrollbar properties alongside the WebKit pseudo-elements; one strategy. |
| **Label** | `kit/label.tsx` Radix; cva with a single base and **no variants**; `labelVariants()` called with no args; **`htmlFor` appears 0 times in the entire frontend** (H:248, H:555) | `kit/label.tsx` Radix verbatim, **unused**; its non-adoption is "the direct cause of the 11 unassociated `label` elements" (L:259, L:802) | The primitive is fine in both. The **usage** is absent in both | **REUSE** | `@tea-ui/primitives` | P1 | The primitive is not the problem — the `Field` composite below is. |
| **Field** (Label + control + description + error) | **absent**; 14 raw `label` elements share the class string `block text-sm text-muted-foreground mb-1|2`; 12 raw form controls bypass the kit (H:300, H:414-415) | **absent**; 5 implementations, 4 of 5 with unassociated `label`s; `settings-panel.tsx:210,219` leaves **every control in the settings dialog completely unnamed for AT across 12 fields** (L:328, L:798) | **41+ unnamed controls across both repos** | **NEW** | `@tea-ui/composites` | **P0** | Generates `id` / `htmlFor`, wires `aria-describedby` + `aria-invalid`, owns the error slot. L §11.5.2: fixes all 11 unassociated labels in one move (L:1213). HSM's `ServerVariables.tsx:79-81` is worse than either — the field key is a bare `span`, so ~20 variables in a 2-column grid have no name at all (H:562). |
| **ColorPicker** | `kit/color-picker.tsx` — **mouse-only custom widget**: the popover has no `role`, no `aria-expanded`, no `aria-controls`; the SV square and hue strip are `div`s with pointer handlers, **no `role="slider"`, no `tabIndex`, no arrow-key support, no `aria-valuenow`**; its own `fixed z-[70]` popover has **no portal and no focus trap**; `document`-level listeners; `PANEL_W=248 / PANEL_H=252` magic numbers; `!p-0` / `!size-5` overrides; the trigger has `title=`, not `aria-label` (H:243) | **absent** | **Both repos only *appear* to need it** — HSM's loadingscreen editor genuinely needs colour picking. But as written it is unusable without a mouse; WCAG 2.1.1 and 4.1.2 fail outright, not marginally | **DO-NOT-BUILD** | — | P2 | **The pure part is worth keeping and is not a component:** `hexToHsv` / `hsvToHex` (`color-picker.tsx:35,62`) are pure functions → ship in `@tea-ui/utils`. The widget is not publishable until it has real slider semantics. (Deliberately diverges from HSM §7's `GENERALIZE`, H:672 — on the a11y evidence.) |
| **CommandPalette / GlobalSearch** | **absent** | `global-search.tsx:14` — **no combobox semantics**: no `role="combobox"`, no `aria-expanded` / `aria-controls` / `aria-activedescendant`; results are bare `button`s with no listbox / option; **no arrow-key nav, no Enter-to-select**; Escape only blurs. *"The feature is unusable without a mouse"* (L:280, L:828-830). Dispatches `window.dispatchEvent(new CustomEvent("lutea:focus-company"))` and **nothing listens for it** (L:578, L:1153) | A genuinely valuable feature built on zero ARIA. All 3 result groups use the same `SearchIcon`, so grouping rests on the section label alone (L:577) | **NEW** | `@tea-ui/composites` | P1 | Build it *as* a combobox or do not build it. HSM has nothing to migrate. The `CustomEvent` bus must not survive (L:952). |
| **Pagination** | **1 implementation**: `Database.tsx` — `PAGE_SIZE = 25` (`:57`), server-side, Zurück / Weiter (`:531-538`). Plus: `Ai.tsx:490` fetches **all** usage records then `slice(0, 50)` client-side (H:518); 6 of 8 raw tables render every row (H:355); sorting exists end-to-end in the API and is simply not wired up (H:517) | **none** (L:738: "no sorting, no pagination, no row selection, no bulk actions, no column resize, no sticky header") | HSM's is page-local; LUTEA has nothing, and its one table has no overflow wrapper | **EXTRACT** | `@tea-ui/composites` | P1 | From HSM. Also the answer to LUTEA's un-virtualised-list problem (L:1104). |
| **Breadcrumb** | `FileBrowser.tsx:308,314` — segments are `Button`s whose only state signal is `font-bold`; **no `aria-current`**; the root label is an **English** string in a German app (`:309`) (H:267) | **none** | One half-implementation with a language slip | **GENERALIZE** | `@tea-ui/composites` | P2 | Needs `aria-current="page"` and German copy. Worth shipping only if TEA UI also takes HSM's remote-file-browser shape (§4 `FileBrowser`). |
| **Collapsible** | none; only dead `Sub` / `SubContent` / `SubTrigger` exports inside `dropdown-menu.tsx` (H:246) | none | Nothing exists | **NEW** | `@tea-ui/primitives` | P2 | Only if `Accordion` needs it. |
| **Accordion** | none | **1 implementation, no JS**: native `details` / `summary` in the FAQ (`agentur:133-138`), `group-open:text-accent` — but the default marker is suppressed by `list-none`, so there is **no `+` / `-` affordance** (L:522, L:992) | The only accordion in either repo is native, correct, and missing an affordance | **ADAPT** | `@tea-ui/primitives` | P2 | Native `details` is the right default — keyboard-accessible with zero JS (L:775). Adopt with a visible indicator; reach for Radix `Accordion` only when animation is required. |
| **HoverCard** | none | none | **Neither repo has one — and both appear to need one.** HSM: 6 status cards + every game-server card are `div onClick` with no role, no `tabIndex`, no key handler — **"8 non-keyboard-reachable primary navigation targets on the two most important screens"** (H:590-592). LUTEA: `TableRow onClick` at `crm-page-client.tsx:108` — "the entire company detail panel … is **mouse-only**" (L:832-834) | **DO-NOT-BUILD** | — | P2 | **A hover-only primitive is how both repos ended up with mouse-only primary actions.** The need is real (detail-on-demand); the answer is a keyboard-operable `Dialog` / `Sheet` at small viewports and an always-reachable trigger. Publishing `HoverCard` would institutionalise the defect. |
| **Kbd** | `LoadingScreenEditor.tsx:1443-1457` `KbdCheat` — *"the only page that documents its own shortcuts"* (H:501) | none | HSM's footer is `flex` with no wrap, so below ~1280 px the cheat sheet is **clipped** (`:1456` hides only the last item) (H:501) | **EXTRACT** | `@tea-ui/composites` | P2 | Small, high-value, and it wraps. |
| **CodeBlock** | **8 sites, 4 patterns, 3 monospace-background conventions**: `#0a0a0c` (terminal / editor), `bg-background` (textarea), `bg-muted` (`Security.tsx:113-115`) (H:311, H:229) | none; only a raw `code` with a raw portal URL and **no copy-to-clipboard button** (`projects-client.tsx:9-36`, L:746) | 3 conventions for one concept | **EXTRACT** | `@tea-ui/composites` | P2 | One `CodeBlock` with a `tone` (`terminal` / `muted` / `plain`) and a copy button, so `CopyableValue` / `CopyButton` (H:681) stops being re-invented. |
| **TableOfContents** | none | none | **Neither app has the content volume.** Both are dashboards; HSM's longest document is the loadingscreen editor's layer list, LUTEA's is a 5-route site (L:494-503) | **DO-NOT-BUILD** | — | P2 | Listed because the brief asks for it. Adding it means shipping a component with zero consumers in either repo — the exact sin HSM §7 flags against `Avatar` (H:670). |
| **PanelHeader** (icon + title + subtitle) | **8 sites**, one pattern: `grid size-7 place-items-center rounded-md bg-foreground/5` + `text-sm font-medium leading-tight` + `text-[11px] leading-tight text-muted-foreground/80` (H:297) | **3 sites** for the public variant; `SectionTitle` at `agentur:147` is kicker + `h2`, `PublicPageHeader:6` is `h1` + subtitle — the two "duplicate" each other (L:304, L:311) | Same shape at two element levels | **EXTRACT** | `@tea-ui/composites` | P1 | Note HSM's uses `rounded-md` — a **radius-law violation** (§3) that survived 8 times. |
| **SectionLabel / Eyebrow** | 6 sites, **two competing sizes**: `text-sm font-medium text-muted-foreground uppercase tracking-wide` vs the editor's `text-[10px] font-semibold uppercase tracking-wider` (H:301) | **20 occurrences of one class string**: `text-[11px] font-semibold uppercase tracking-wider text-muted-foreground` (L:324, L:419) | 26 sites. LUTEA's is "a **type token**, not a class" and "the **highest-leverage de-duplication** in the repo" (L:421) | **NEW** | `@tea-ui/primitives` | **P0** | Ship as a Tailwind `@utility` or a zero-cost component. The cheapest single win in either audit. |
| **IconTile** | none | **5 verbatim copies**: `flex size-10 items-center justify-center bg-accent text-accent-foreground` + a `size-5` icon (L:325, L:460) | 5 sites | **EXTRACT** | `@tea-ui/marketing` | P1 | Needs a `size-4` variant for the dashboard density. |
| **StatTile / StatCard** | **6 named functions + 4 inline variants, 3 incompatible `color` vocabularies** (H:289, H:376): `StatCard({label,value,sub,online})`; `Backups.SummaryCard({color:"slate"\|"emerald"\|"amber"\|"red"})`; `Https.SummaryCard({color:"emerald"\|"amber"\|"orange"\|"red"})`; **`Security.SummaryCard({color:"text-accent"})` — a raw class string where the other two take a token**; `Diagnostics.InfoCard`; and `ServiceManager.ActionCard`, a *button* named like a card. Value sizes drift across `text-2xl font-semibold` / `text-2xl font-bold` / `text-xl` / `text-sm` | **2 ~90 %-identical `StatCard`s**: `dashboard-client.tsx:115` and `overseer-dashboard.tsx:322`, differing only by an `alert` prop → `border-accent/50 bg-accent/5` (L:319, L:454) | 6 + 4 HSM variants with **two same-named functions and different props** — "the exact thing a shared library must kill" (H:289) | **EXTRACT** | `@tea-ui/composites` | P1 | Take LUTEA's superset (it has the `alert` state), swap in `IconTile`, give it a **`tone`** prop. HSM's value-first vs label-first split is a real design decision — `DECISION REQUIRED`. |
| **Score** | none | **4 renderings, 2 different threshold sets**: `company-list.tsx:355-358` `>=70`→`#4CAF6D`, `>=40`→`#F2C012`, else `#9A968C`; `auditor-client.tsx:112-117` `>=70`→`#4CAF6D`, `>=45`→`#F2C012`, else `#E0332E`; `ScoreCat` bar with no banding; `crm-page-client.tsx:124-126` a raw `font-mono` number with **no colour at all** (L:443-448) | A score of 40-44 reads as "neutral" on `/dashboard` and "warning" in `/dashboard/auditor` (L:448) | **EXTRACT** | `@tea-ui/composites` | P2 | One threshold table, one hex source; four hardcoded hexes that duplicate `STATUS_COLORS` (L:448). `DECISION REQUIRED` on the threshold set — L §11.4.8 flags the divergence as possibly intentional (L:1208). |
| **RefreshButton** | **15 sites**, 1 literal repeated 8×; `Security.tsx:49` and `Diagnostics.tsx:72` **byte-identical except the label**; `App.tsx:411-417` renders **two** buttons for one action via an `sm:` swap; 13 hand-written `RefreshCw` spin swaps (H:295, H:366, H:755) | none | 15 sites, 13 duplicated icon swaps, no shared `loading` convention | **EXTRACT** | `@tea-ui/composites` | P1 | Built on the new `Button loading`. |
| **Action chip / RowActions** | **~40 sites, 13 pages** — the single largest duplication in HSM (H:321). Plus 6 destructive row actions that hand-write `bg-destructive/10 text-red-300 hover:bg-red-800/40` instead of the `variant="destructive"` the kit already provides (H:298) | 4 interactive status rows, 3 of which share the same active recipe `border-accent bg-accent/10 text-accent` (L:362-366) | ~44 hand-painted semantic colour strings | **ADAPT** | `@tea-ui/primitives` | **P0** | **Not a new component — missing `Button` variants.** HSM §7: "a set of missing `Button` variants; the literal classNames collapse into cva entries" (H:708). |
| **DirtySaveBar + DirtyBadge** | 2 near-identical implementations (`ServerVariables.tsx:150-173` vs `ConfigEditor.tsx:570-593`); the dirty pill is **byte-identical**: `rounded bg-amber-400/15 px-1.5 py-0.5 text-[11px] font-medium text-amber-300` (H:304-305) | none | 2 sites, 1 duplicated literal. The dirty state **is** a text pill — good a11y (H:543) — keep that | **EXTRACT** | `@tea-ui/composites` | P2 | The `rounded` here is another radius-law violation. |
| **Nav / NavItem** | the **same three `NavGroup` calls written out twice** (`App.tsx:286-291` desktop, `:369-373` mobile) plus a duplicated brand mark (`:275-276` / `:362-363`); `NavButton` has **no `aria-current`**; the active state is `bg-accent text-accent-foreground` — the same colour as the focus ring (H:409, H:600) | **5 nav-item implementations**; `dashboard-nav.tsx:26-38` is a **byte-identical copy minus `aria-current` / `aria-label`**; the `NAV` array is declared **twice** (`dashboard-sidebar.tsx:30-36` vs `dashboard-nav.tsx:11-17`) with a **label conflict** (`"Unternehmen"` vs `"Uebersicht"`), and `dashboard-nav.tsx` is dead (L:318, L:427); the mobile drawer is a **third** re-implementation that drops both `aria-current` and `GlobalSearch` (L:279, L:481) | 7 implementations; **1 of 7 has `aria-current`** | **EXTRACT** | `@tea-ui/composites` | P1 | One `Nav` + one `NavItem` with mandatory `aria-current`, one data source, rendered into both shells. |
| **Panel / section label (uppercase `h3`)** | `Diagnostics.tsx:113,123,133`, `Security.tsx:77`, `LoadingScreenEditor.tsx:1063,1554,1718-1895` (H:301) | covered by the 20 micro-label sites (L:419) | 6 + 20 | **MERGE** | `@tea-ui/primitives` | **P0** | Merged into `Eyebrow`. |
| **Chart** | `Chart.tsx` — hand-rolled SVG, **0 dependencies**, fixed `W=900` + `viewBox`, `role="img"` + a German `aria-label` already present (H:264, H:678); series colours hard-coded as props: `#22d3ee`, `#a78bfa`, `#f59e0b` (`Monitoring.tsx:20-22`, H:128); grid / label colours `#334155` / `#64748b` at **9 px** → **~3.4:1, fails AA** (H:616) | **absent** | Zero dependencies and resolution-independent — a deliberate decision (D021, H:854). The only problem is un-tokenised colours and 9 px labels | **REUSE** | `@tea-ui/data` | P2 | HSM §7: REUSE. Fix the two hexes and the label size. **A design-system fix, not a perf problem** (H:854). |
| **`usePolling` hook** | **21 `setInterval`s, 13 files, 11 independent constants with 4 different names**, 3 cleanup patterns, and **no `document.visibilityState` check anywhere** (H:423-425, H:839). The dashboard alone runs 6 concurrent timers, 3 of them hitting `/api/v1/status` every 5 s (H:455) | none | The single highest-value extraction in HSM (H:425) | **EXTRACT** | `@tea-ui/react` | P1 | Not a visual primitive, but it is the shared data-access primitive and the audits name it as the top extraction. |
| **Colour utils (`hexToHsv` / `hsvToHex`)** | `color-picker.tsx:35,62` — pure, exported as public API (H:243) | absent | Pure functions trapped inside a mouse-only widget | **REUSE** | `@tea-ui/utils` | P2 | Ship the maths; refuse the widget. |
| **HoneypotField** | absent | 2 verbatim copies (`kontakt:62-65`, `website-check:64-67`) with a **different `id`** and the **same `name`** (L:331, L:601); `tabIndex={-1}` + `aria-hidden` are correct (L:882) | A security control duplicated with divergent ids | **PROJECT-SPECIFIC** | — | P2 | Reusable in principle, but it is a form-security control, not a design-system primitive, and it belongs with LUTEA's `anti-spam.ts` (L:599). |
| **App shells, page shells, service cards, marketing heroes, RBAC / policy** | `AppShell` — but with a **conditional hook call** (H:635); no marketing surface | `DashboardShell` re-declared in 5 routes because there is **no `dashboard/layout.tsx`** (L:482, L:569); `PublicHeader` / `PublicFooter` / `PublicPageHeader` (L:944); `ServiceCard` ×2 (L:347-355); `Hero` (L:990); `rbac.ts` + `policy.ts` incl. `NEVER_SELF_APPROVE` (L:644-656) | — | **PROJECT-SPECIFIC** | — | P2 | L §5.7 says RBAC "should be preserved verbatim in any extraction" (L:644). The shells are app architecture, not primitives. |
| HSM feature components | `ConfigEditor`, `ServerVariables`, `FileBrowser`, `loadingScreens.ts`, `configPriority.ts`, `eggLogoUrl` all present (H:679-687) | — | — | **PROJECT-SPECIFIC** / **GENERALIZE** (`FileBrowser`, H:682) | — | P2 | HSM §7 is explicit: the KV parser, the 43 game-server config key fragments and the ES5 generator are domain data, not design system (H:679-687). |
| HSM application widgets | `LoadingScreenEditor` (2165 L), `LoadingScreenMakerDialog` (772 L) (H:268-269) | — | 4 tabs, 16 element types, 18 `useState`, marquee, 8-handle resize, undo stack | **DO-NOT-BUILD** | — | P2 | HSM §7: "a component library should ship the *primitives* it is made of … not a 2165-line application widget" (H:683-684). |
| LUTEA dead / lying components | — | `DashboardClient`, `DashboardNav`, `FinderClient`, `scoreWeights` UI, claimed MapLibre map (L:955-959) | Dead or lying controls | **DO-NOT-BUILD** | — | P2 | `scoreWeights` is "a control that lies" — the UI writes weights that `score.ts:22-49` hardcodes (L:958, L:1143). `maplibre-gl` is not installed at all (L:959). |
| HSM dead kit | `avatar.tsx`, unused `ScrollBar` / dropdown exports / `TableFooter` / `TableCaption`, `@radix-ui/react-slot`, `tw-animate-css`, geist, nunito, lilita-one, `boxShadow.card`, `boxShadow.sidebar`, `.glass-grid`, `.bg-card` (H:427-436) | — | — | **DO-NOT-BUILD** | — | P2 | "a library must not ship them and a CI lint rule should catch them" (H:718). `Skeleton` is the sole exception: REUSE + adopt. |
| LUTEA dead kit | — | `colors.lutea.*`, `colors.status.*`, `boxShadow.card`, `--radius-*`, the `#root` selector, `CardFooter`, `DialogOverlay` / `DialogPortal`, `ToastViewport` (L:1177-1196) | — | **DO-NOT-BUILD** | — | P2 | L §11.3: `StubSection` is the exception — "adopt it, do not delete it" (L:1185). |

**"Do not build" summary — the components the two repos only *appear* to need:**

| Component | Why it looks needed | Why it is not |
|---|---|---|
| **ColorPicker** | HSM's loadingscreen editor genuinely needs colour picking (H:243) | The widget has no `role="slider"`, no `tabIndex`, no arrow-key support, no `aria-valuenow`, no portal, no focus trap. **It is unusable without a mouse** — WCAG 2.1.1 and 4.1.2 fail outright, not marginally. Ship `hexToHsv` / `hsvToHex`; do not ship the widget. |
| **HoverCard** | Both repos have mouse-only detail-on-demand: HSM's 8 unreachable nav targets (H:590-592), LUTEA's `TableRow onClick` (L:832-834) | The need is real, the primitive is wrong. A hover-only affordance is precisely how both repos stranded their most important actions. Reachability first, hover second. |
| **TableOfContents** | Nothing in either app has the content volume | Zero consumers in either repo. HSM §7's own argument against shipping `Avatar` applies verbatim (H:670). |
| **Avatar** | Copied into both kits | Imported nowhere in HSM; no user-avatar surface in either app; `rounded-full` breaks the square identity (H:670). |
| **A second Button / Card for marketing** | LUTEA's public site has its own visual register | Its own audit forbids it: "The single kit `Button` with `size=\"xl\"` already serves the hero correctly" (L:1000). |
| **A lighter marketing theme** | The public site reads differently from the admin | Same audit, same verdict: "Do not abstract a 'marketing theme' until one exists" (L:997). |
| **An animation library** | Both are animation-free in practice | LUTEA forbids it: "`ScrollReveal` / `Parallax` are the classic 'abstract for the sake of it'" (L:999). |
| **A generic CMS section renderer** | 5 public pages of literal arrays | "A feature at this size, not a limitation" (L:998). |
| **A responsive-nav component before the current one is fixed** | The public nav is clearly wrong | "Do not generalise `PublicHeader`'s nav until it has a mobile variant — otherwise the abstraction encodes the bug" (L:1001). |

---

## 5. Divergent-implementation ledger (the kill list)

Every behaviour implemented more than once across the two repos. **Canonical** = the implementation that becomes TEA UI's single version. **Delete** = the variants that die. Counts and class strings are quoted verbatim from the audits.

### 5.1 Surface / panel

| | HSM | LUTEA |
|---|---|---|
| **Files** | 31 raw `rounded-none bg-card border border-border` sites in **15 pages**; 6 pages use `kit/card.tsx` correctly — `App.tsx`, `GameServers`, `GameServerDetail`, `Settings`, `Database`, `Ai` (H:290, H:418-419) | 20 sites: `kit/card.tsx:9` (canonical) vs `settings-panel.tsx:198` (a **local `Card({title})`**), `auditor-client.tsx:61,91,101,144,161`, `projects-client.tsx:109`, `overseer-dashboard.tsx:282`, `crm-page-client.tsx:193,264`, `login-form.tsx:43`, `portal-client.tsx:45,56`, `version-manager-client.tsx:307`, `agentur/page.tsx:84,133`, `portfolio/page.tsx:32` (L:323, L:341) |
| **Differing values** | padding `p-4` / `p-5` / `p-6` (H:290); `Card` hard-codes `p-6` + `pt-0` (`card.tsx:26,63,73`, H:242) | padding `p-3` / `p-4` / `p-5` / `p-6` / `p-8`; `bg-card/60` (`portfolio:32`), `bg-card/50`, flat `bg-card`; `settings-panel.tsx:198` invents a `title` prop with a `mb-3 text-sm font-semibold` header no other surface has; `crm-page-client.tsx:193` nests `text-xs` in a `p-3` box (L:343) |
| **Shared defects** | `CardTitle` is a `div` (H:242) · `shadow-none` hard-coded (H:137) · `shadow-card` token dead (H:135) | `CardTitle` is a `div` (L:252) · `shadow-none` hard-coded (L:152) · `shadow-card` dead (L:152) · `CardFooter` unused (L:1182) · a local `Card` shadows the kit's concept (L:1168) |

**Canonical:** `kit/card.tsx` with a `density` prop (`compact = p-3`, `default = p-4`, `comfortable = p-6` — L:345) and `CardTitle` rendering a real heading.
**Delete:** HSM's 31 raw divs, LUTEA's 20 raw divs, and `settings-panel.tsx:198`'s local `Card` — L:345 names it "the best first migration target: 8 usages in one file". **51 sites converge on one component.**

### 5.2 Status

**HSM — 5 independent label tables for 5 shared wire unions** (H:296, H:358-360). Wire types: `WebsiteStatus` (6 values), `ContainerStatus` (6), `BackupStatus` (3), `CertificateStatus` (5), `GameServer["status"]` (4), `DependencyStatus` (4), `SecuritySeverity` (3) (H:296).

| # | Implementation | Form |
|---|---|---|
| 1 | `Https.tsx:211-234` `StatusBadge` | Badge + dot + label |
| 2 | `Backups.tsx:32-56` `statusStyle` + `statusLabel` | Badge |
| 3 | `Websites.tsx:187-198` + `:533-548` | Badge |
| 4 | `GameServers.tsx:106-132` `statusDotClass` + `statusLabel` | dot + label |
| 5 | `GameServerDetail.tsx:302-332` (inline) | **Badge variant + dot + label — three representations of one status in one block** (H:359) |
| 6 | `Docker.tsx:127-142` `StateText` | text |

Plus 15 status-dot sites: **5 dialects, 7 colours, 3 sizes, 4 pages using emoji** (H:288). Dot sizes `h-2.5 w-2.5` (×5) and `h-2 w-2` / `h-1.5 w-1.5` (×6). Colours `bg-accent`, `bg-accent/50`, `bg-green-500`, `bg-amber-500`, `bg-red-500`, `bg-muted-foreground`, `bg-muted-foreground/40`.

**LUTEA — 7 implementations + `FEHLT`** (L:313, L:369):

| # | Implementation | Form | Active state | Colour source |
|---|---|---|---|---|
| 1 | `kit/crm-status-badge.tsx:23` | `span` pill + dot; the `null` branch renders `"Unbearbeitet"` **with a border but no dot** (L:253) | read-only | **inline `style`** from `STATUS_COLORS`, hardcoding `color:"#111318"` — unthemeable, not `twMerge`-able (L:253, L:371) |
| 2 | `company-list.tsx:322-336` | `button` row, no dot | `border-accent bg-accent/10 text-accent` | class |
| 3 | `crm-page-client.tsx:170-183` | `button` 2-col grid | **`border-accent` only — no bg, no text change** | class |
| 4 | `company-list.tsx:229-257` `FilterChip` | `button` chip + dot + count | `border-accent bg-accent/10 text-accent` | class + inline dot |
| 5 | `projects-client.tsx:117-130` | `button` chip | `border-accent text-accent` — no bg | class |
| 6 | `finder-client.tsx:49-62` | `button` chip | `border-accent bg-accent/10 text-accent` | class |
| 7 | `version-manager-client.tsx:17-21` + `portal-client.tsx:7-11` | `Badge` + `STATE_LABELS` / `STATUS_LABELS` | read-only | cva variant |
| 8 | `crm-page-client.tsx:118` | `FEHLT` in `text-destructive text-xs font-semibold` — uppercase, coloured, no explanation (L:369) | — | class |

Plus two dead colour sources: `colors.status.*` (`tailwind.config.ts:39-46`, unreachable — camelCase vs `no_website`) and `STATUS_COLORS` (`lib/status.ts:25-34`) — *"two sources of truth … one is broken and neither is used"* (L:121). And a fourth visual language the audit names outright: `version-manager`'s `approved` renders `variant="default"` = **gold**, which is also the CRM `contacted` colour (L:642).

**Canonical:** `StatusBadge` (read-only, from `crm-status-badge.tsx`'s shape but **token classes, not inline `style`**) + `StatusSelect` (interactive, from `FilterChip`, which already carries the dot, the count and `aria-pressed` — L:373) + one `statusMeta` registry.
**Delete:** HSM's 6 tables + 15 dot sites; LUTEA's #2, #3, #5, #6, #8, both colour sources, and the dead `status.*` scale. **23 implementations + 2 colour sources → 2 components + 1 registry.**

### 5.3 Empty state

- **HSM, 16 sites, 2 families** (H:306, H:383): `App.tsx:472-474`, `Https.tsx:88-93`, `Backups.tsx:282-287`, `Docker.tsx:245-259`, `Websites.tsx:348-358`, `Cloudflare.tsx:229-238`, `GameServers.tsx:370-377`, `FileBrowser.tsx:357-362`, `FileManager.tsx:302-305`, `Database.tsx:388-396`, `LoadingScreenEditor.tsx:1092-1097, 1281-1290`, `Chart.tsx:33-39`, `Ai.tsx:398-402`, `Settings.tsx:173-175`, `GameServerDetail.tsx:565-567`. Most common literal `rounded-none border border-border p-5 text-muted-foreground text-sm` (6×). Two are correctly a `colSpan` row inside the table (`Cloudflare.tsx:229-238`, `Websites.tsx:348-358`) — "the right answer" (H:384).
- **LUTEA, 10 implementations, 1 component** (L:321, L:403): `stub-section.tsx:11` (canonical, **unused**), `portfolio/page.tsx:21`, `crm-page-client.tsx:88`, `projects-client.tsx:103`, `auditor-client.tsx:173`, `overseer-dashboard.tsx:276`, `settings-panel.tsx:177`, `version-manager-client.tsx:225,251,259,293,299`, `company-list.tsx:164-171,215-218`. Common literal `border border-dashed border-border p-10 text-center`; padding drifts `p-4` / `p-10` / `p-16`; text drifts `text-xs` / `text-sm`; one drops the dashed border entirely (`company-list.tsx:215-218`).

**Canonical:** `StubSection` renamed `EmptyState` (L:407), plus `TableEmptyRow` for the in-table case.
**Delete:** 24 inline copies. Content rules to carry over: HSM's only "what to do next" (H:474) and its "no data vs filtered out" distinction (H:474); LUTEA's `portfolio:21-48`, "an empty state that teaches the process" (L:700).

### 5.4 Error banner

**HSM — 31 sites, 19 files, 4 visual dialects** (H:293, H:348-350):

| Dialect | Class string | Count |
|---|---|---|
| A | `bg-destructive/10 border border-destructive/30` + `text-destructive` | 9× |
| B | `bg-red-950/50 border border-destructive/30/50 text-red-300` — **`bg-red-950/50` is not a token** | 7× |
| C | `border-destructive/40 bg-destructive/10` | `Ai.tsx:82`, `GameServers.tsx:330`, `GameServerDetail.tsx:284,380` |
| D | `border border-destructive/25 bg-destructive/10` | `ConfigEditor.tsx:505`, `ServerVariables.tsx:121`, `ConnectLinkDialog.tsx:152`, `LoadingScreenMakerDialog.tsx:496` |

Padding drifts `p-2` / `p-3` / `p-4`. Only 4 of 31 have a `schließen` dismiss button (`Backups.tsx:200`, `Cloudflare.tsx:139`, `Notifications.tsx:102`, `FileManager.tsx:288`). Prefixes: `"IPC-Fehler: "` (4× — **factually wrong, the transport is HTTP**, H:468) and `"Fehler: "` (7×). Structural duplication: `showNotice(msg)` is **copy-pasted 3× with an identical 5 s timer, never cleared on unmount** — `Cloudflare.tsx:84-87`, `FileManager.tsx:89-92`, `Websites.tsx:75-78` (H:294, H:349).

**LUTEA — 9 sites, 1 literal, 0 components** (L:322, L:411): `kontakt/page.tsx:92`, `website-check/page.tsx:88`, `auditor-client.tsx:97`, `finder-client.tsx:84`, `settings-panel.tsx:152`, `login-form.tsx:72`, `overseer-dashboard.tsx:161` + `:175`, `company-list.tsx:159`. Class string `border-destructive/30 bg-destructive/10` verbatim in **all 9**; `text-red-300` 6×, `text-red-200` 2×, unset 1×; **`role="alert"` in only 2 of 9**; padding `p-2` / `p-3` / `p-4`; `login-form.tsx:72` uses a `p` not a `div`.

**Canonical:** one `Alert` with `role="alert"` baked in and a token foreground.
**Delete:** 40 banners, 4 dialects, 3 error text colours, 2 prefixes, and the `showNotice` clone ×3. Also the parallel success family: `bg-accent/10 border border-accent/40 text-accent` (5×) **and** `bg-emerald-500/10 border border-emerald-500/25 text-emerald-400` (2×) **and** `bg-green-900/40 text-green-300` (1×) — three "success" greens (H:123-126, H:294).

### 5.5 Micro-label

- **HSM, 6 sites, 2 competing sizes** (H:301): `text-sm font-medium text-muted-foreground uppercase tracking-wide` (`Diagnostics.tsx:113,123,133`, `Security.tsx:77`) vs the editor's `text-[10px] font-semibold uppercase tracking-wider` (`LoadingScreenEditor.tsx:1063,1554,1718-1895`).
- **LUTEA, 20 occurrences of one literal** (L:324, L:419): `text-[11px] font-semibold uppercase tracking-wider text-muted-foreground` at `table.tsx:36`, `public-footer.tsx:43`, `website-check/page.tsx:96,102`, `portfolio/page.tsx:34`, `crm-page-client.tsx:159,167,185,266`, `auditor-client.tsx:62,104,145,188`, `finder-client.tsx:45`, `company-list.tsx:310,321`, `agentur/page.tsx:128`, `select.tsx:102`, `global-search.tsx:118`; `text-accent` variant at `agentur/page.tsx:40,150`.

**Canonical:** the LUTEA string, as a Tailwind `@utility` or a zero-cost `Eyebrow`. L:421 calls it *"the **highest-leverage de-duplication** in the repo because it is a *type token*, not a component."* The same string also serves as LUTEA's `TableHead` style (`table.tsx:36`, L:267) — one token, two jobs.
**Delete:** all 26 occurrences.

### 5.6 Icon tile

- **LUTEA, 5 verbatim copies** (L:325, L:460): `flex size-10 items-center justify-center bg-accent text-accent-foreground` + a `size-5` icon, at `agentur/page.tsx:160`, `leistungen/page.tsx:30`, `dashboard-client.tsx:75`, `dashboard-client.tsx:124`, `overseer-dashboard.tsx:326`.
- **HSM, 0.** Its analogue is the *panel header* tile: `grid size-7 place-items-center rounded-md bg-foreground/5`, 8 sites (H:297) — different size, and a radius-law violation.

**Canonical:** `IconTile` from the LUTEA literal, plus a `size-4` variant for dashboard density.
**Delete:** 4 copies (keep one). HSM's 8 panel-header tiles become `PanelHeader` with a `size-6` tile.

### 5.7 Stat tile

- **HSM, 6 named functions + 4 inline variants, 3 incompatible `color` vocabularies** (H:289, H:376): `Monitoring.tsx:41` `StatCard({label,value,sub,online})` · `Backups.tsx:368` `SummaryCard({color:"slate"\|"emerald"\|"amber"\|"red"})` · `Https.tsx:187` `SummaryCard({color:"emerald"\|"amber"\|"orange"\|"red"})` · **`Security.tsx:91` `SummaryCard({color:"text-accent"})` — a raw class string where the other two take a token name** · `Diagnostics.tsx:151` `InfoCard` · `ServiceManager.tsx:152` `ActionCard` (a *button*). Plus inline variants: `DynamicDns.tsx:81-122`, `Caddy.tsx:83-110`, `Database.tsx:333-350` (`dl` grid), `Ai.tsx:177-221`. Value sizes drift: `text-2xl font-semibold`, `text-2xl font-bold`, `text-xl font-semibold`, `text-sm`. Value-first (Monitoring / Backups / Https) vs label-first (Security / Diagnostics).
- **LUTEA, 2 ~90 %-identical** (L:319, L:454): `dashboard-client.tsx:115-135` vs `overseer-dashboard.tsx:322-336` — identical `flex size-10 shrink-0 items-center justify-center bg-accent text-accent-foreground`, `truncate text-sm font-semibold`, `text-2xl font-bold`; the overseer adds `alert` → `border-accent/50 bg-accent/5`.

**Canonical:** LUTEA's superset (it has the `alert` state), extracted, with a **`tone`** prop replacing all three `color` vocabularies and `IconTile` inside it.
**Delete:** 6 HSM functions + 4 inline + 1 LUTEA duplicate. HSM's `ActionCard` becomes `Button variant` + `Card` (H:377).
**`DECISION REQUIRED`:** HSM's value-first vs label-first split is a real information-design choice, not drift (H:289).

### 5.8 Loading spinner

- **HSM, 8 page loaders, 5 byte-identical** (H:292, H:363): `Ai.tsx:72-77`, `DynamicDns.tsx:70-76`, `GameServerDetail.tsx:291-296`, `GameServers.tsx:298-304`, `SetupWizard.tsx:61-67` all render exactly `<div className="flex items-center justify-center h-64"><div className="text-muted-foreground">Lade …</div></div>`; `ServiceManager.tsx:59-61`, `Database.tsx:352`, `FileManager.tsx:301` are inline variants. Separately 13 `animate-spin` elements (H:606). Copy is clean: `…` (U+2026) used **64 times across 24 files** (H:477). German strings: "Lade ModelMesh…", "Lade DDNS-Status…", "Lade Server…", "Lade Game-Server…", "Lade Setup-Assistent…", "Lade Service-Status…", "Lade Übersicht…", "Lade Dateien…" (H:292). **No `aria-busy`, no `aria-live` anywhere** (H:477).
- **LUTEA, 13 spinners, 4 sizes** (L:326, L:472): `Loader2 className="animate-spin"` in 13 files at `size-4`, `size-3.5`, `size-4` + `mr-2` (in `LoaderIcon`, `company-list.tsx:226`), plus an `animate-pulse` dot (`global-search.tsx:60`). **No `role="status"` anywhere.** Copy drifts: `"... werden geladen ..."`, `"Projekte werden geladen..."`, `"Einstellungen werden geladen..."`, `"Unternehmen wird geladen..."`, `"Portal wird geladen..."`, and `"Overseer wird geladen ..."` — **space before the ellipsis** at `overseer-dashboard.tsx:156` (L:474, L:1131). But the *in-button* pattern is excellent and consistent: `disabled={busy}` + spinner swap + label change, in six places (L:674-680).
- Both ship a written, unused `Skeleton` (H:252, L:265).

**Canonical:** one `Loading` with `role="status"` + `aria-busy`, built on the existing `Skeleton`; HSM's `…` convention wins and LUTEA's ` " …"` is fixed. Two variants, both kept: full-page (`PageLoader`, from HSM) and in-button (from LUTEA).
**Delete:** 21 hand-rolled loaders, 4 spinner sizes, the ellipsis drift, and the dead `Skeleton` in both repos.

### 5.9 Search input

- **HSM, no component.** `Notifications.tsx:149,158,167` are raw inputs with `placeholder-slate-500` → **~3.3:1, fails AA** (H:618). `slate` is also outside the configured `baseColor` vocabulary (H:127).
- **LUTEA, 3 implementations, 2 bypassing the kit** (L:316, L:379-383): `company-list.tsx:118-128` (kit `Input` + `Search` at `pl-8`) · `crm-page-client.tsx:65-73` (raw `<input>` inside a hand-typed `flex h-8 items-center gap-2 border border-input bg-input px-2.5` box) · `global-search.tsx:46-61` (raw, with its own `border-ring ring-3 ring-ring/40` focus recipe, `w-52`). Widths diverge: `w-full` / `w-52` / `flex-1`. All three hand-place the icon at `left-2.5` / `size-3.5`. **No clear/reset button anywhere** (L:316).

**Canonical:** `global-search.tsx:46-61`, built on the kit `Input` (L:383) — left icon slot, optional trailing slot, reset button.
**Delete:** `crm-page-client.tsx:65-73` "should be deleted outright" (L:383) and HSM's 3 raw inputs.

### 5.10 Refresh button

**HSM, 15 sites, 1 literal ×8** (H:295, H:366-369): `"px-3 py-1.5 rounded-none bg-muted text-sm text-muted-foreground hover:bg-muted"` at `Docker.tsx:253,290`, `Https.tsx:171` (minus `rounded-none`), `Backups.tsx:337`, `Cloudflare.tsx:257`, `FileManager.tsx:272`, `Security.tsx:49` (as `h-auto px-4 py-2`), `Diagnostics.tsx:72` (as `h-auto px-4 py-2`). `Security.tsx:49` and `Diagnostics.tsx:72` are **byte-identical except the label**. `App.tsx:411-417` renders **two buttons for one action**, swapping on `sm:` with identical handlers. `Caddy.tsx:53-61` factors the idea into a local `btn(action, label, style)` closure that still bakes styling into a string argument. **13 hand-written `RefreshCw` spin swaps** (H:755). **LUTEA: none.**

**Canonical:** `RefreshButton` with `busy` + `label`, built on the new `Button loading` prop.
**Delete:** 15 inline buttons, the `btn()` closure, and the 13 icon swaps.

### 5.11 Action button group / action chip

**HSM, ~40 sites, 13 pages** — the single largest duplication in either audit (H:321). The `Button` cva offers 6 variants (H:322) and **13 of 14 pages bypass it**. Full literal inventory (H:324-344):

| Intent | Literal | Count |
|---|---|---|
| success / accent | `px-3 py-1.5 rounded-none bg-accent/15 text-accent text-sm hover:bg-accent/40 disabled:opacity-40` | 8 |
| success / accent, 4 other paddings | `px-2 py-0.5`, `px-2 py-1`, `px-3 py-1.5 rounded`, `px-4 py-2 rounded` | 4 + 1 + 4 + 1 |
| warn | `px-3 py-1.5 rounded bg-amber-900/60 text-amber-200 text-sm hover:bg-amber-800/60` | 2 |
| warn, sm | `px-2 py-1 rounded bg-amber-900/60 text-amber-200 text-xs …` | 3 |
| info | `px-3 py-1.5 rounded bg-blue-900/60 text-blue-200 text-sm hover:bg-blue-800/60` | 2 |
| accent-purple | `px-2 py-0.5 rounded bg-purple-900/60 text-purple-200 text-xs hover:bg-purple-800/60` | 1 |
| neutral | `px-3 py-1.5 rounded bg-muted text-muted-foreground text-sm hover:bg-muted` / `bg-muted text-xs` | **20** |
| destructive | `px-2 py-1 rounded bg-destructive/10 text-red-300 text-xs border border-destructive/30 hover:bg-red-800/40` | 4 |
| destructive, lg | `px-4 py-2 rounded bg-destructive/10 text-red-300 text-sm hover:bg-red-800/40` | 2 |
| destructive, alt | `px-2 py-1 rounded bg-destructive/15 text-destructive text-xs hover:bg-destructive/30` | 1 |
| sky | `px-2 py-1 rounded bg-sky-900/50 text-sky-200 text-xs border border-sky-800 hover:bg-sky-800/50` | 1 |
| orange | `bg-orange-900/50 text-orange-200 border border-orange-800` | 1 |
| emerald | `bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 hover:border-emerald-400/60` | 1 |
| ghost → destructive | `px-2 py-1 rounded text-muted-foreground text-xs hover:bg-destructive/20 hover:text-destructive` | 1 |
| bare | `px-3 py-1.5 rounded text-xs` | 5 |

**LUTEA, 4 interactive status rows** (L:362-366): 3 share `border-accent bg-accent/10 text-accent`; 1 (`crm-page-client.tsx:170-183`) uses `border-accent` only.

**Canonical:** **not a component** — a set of semantic `Button` variants. HSM §7: "a set of missing `Button` variants; the literal classNames collapse into cva entries" (H:708).
**Delete:** ~44 hand-painted class strings. Also HSM's 6 destructive row actions that ignore the existing `variant="destructive"` (`button.tsx:18`, H:298).

### 5.12 Form field

**HSM, 12 raw controls across 9 files** (H:414): `DynamicDns.tsx` 6 `input` + 1 `select` + 7 `label` · `Websites.tsx` 9 `input` + 1 `select` + 4 `label` · `Cloudflare.tsx` 1 `select` + 1 `label` · `Notifications.tsx` 3 `input` · `Database.tsx` 3 `input` + 4 `label` · `SetupWizard.tsx` 4 + 4 · `Ai.tsx` 1 `select` · `Settings.tsx` 4 raw `button` · `FileBrowser.tsx` + `LoadingScreenEditor.tsx` 2 hidden file inputs each · `App.tsx:519` + `Database.tsx:238` 2 raw `button` · `ConnectLinkDialog.tsx:239` 1 raw `a` styled as a button. **All 14 raw `label` elements use the same class string** — `block text-sm text-muted-foreground mb-1|2` — "a house style written 14 times outside the kit" (H:415).

**LUTEA, 5 implementations, 11 unassociated `label`s** (L:466, L:790-800): `kontakt/page.tsx:110-116` `Field` · `settings-panel.tsx:205-214` `LabeledInput` · `settings-panel.tsx:216-229` `Toggle` · `projects-client.tsx:159-172` (3 inline) · `crm-page-client.tsx:279-290` (2 inline) · `version-manager-client.tsx:154-159,177-182`. Label typography drifts: `text-sm font-medium` (2×), `text-[11px] text-muted-foreground` (2×), `text-[11px] font-medium text-muted-foreground` (1×) (L:328).

**Worst cases:**
- HSM `ServerVariables.tsx:79-81` — the field key is a bare `span className="break-all font-mono text-xs"`; **~20 variables in a 2-column grid have no name at all** (H:562). Its unsaved-changes dot is `aria-hidden` (H:270).
- LUTEA `settings-panel.tsx:210,219` — unassociated `label` + `Input` with no `aria-label` + `button aria-pressed` with no name ⇒ **every control in the settings dialog is completely unnamed for AT, across 12 fields** (L:798).
- LUTEA `kontakt/page.tsx:113` — a subtle variant: the visible `label` is unassociated while the 6 controls are named by a **parallel** `aria-label` (`:67,71,74,79,82,89`), so the accessible name and the visible label "happen to match only by manual discipline, and they will drift" (L:800).
- HSM `Websites.tsx:249-331` — a whole raw form: 9 inputs, 1 select, 4 labels, 3 checkboxes, `required` on one field, and **no error display at all** — failures land in the top-level banner (H:489).
- **HSM has exactly one `required` attribute in the whole codebase** (H:484) and **no `aria-describedby` anywhere** (H:587).

**Canonical:** one `Field` = `Label` (Radix) + control + `description` + `error`, with `id` / `htmlFor` generated and `aria-describedby` + `aria-invalid` wired. HSM's `NumField` (unit suffix, commit-on-blur/Enter, reverts on parse failure) is the best form control in either repo and is used **exactly once** (`LoadingScreenEditor.tsx:1584-1609`, H:312) — it ships as `NumberField`.
**Delete:** 17 raw-label class strings, 12 raw controls, HSM's raw `label` house style, LUTEA's 5 field implementations.

### 5.13 Nav item

- **HSM:** the **same three `NavGroup` calls written out twice** — `App.tsx:286-291` (desktop) and `:369-373` (mobile) — plus the brand mark duplicated at `:275-276` and `:362-363` (H:409). `NavButton` is a real `button` with **no `aria-current`**; the active state is `bg-accent text-accent-foreground` — the same colour as the focus ring (H:600). Nav data is 3 arrays (`SERVICES_NAV` `:116-122`, `SYSTEM_NAV` `:124-130`, `DATA_NAV` `:132-139`); `SYSTEM_NAV` gives `ddns` the **same `LayoutGrid` icon as `dashboard`** (H:410). Group titles: "Allgemein", "Web & Netzwerk", "System & Daten" (H:447).
- **LUTEA, 5 implementations** (L:318): `dashboard-sidebar.tsx:56-69` (the only one with `aria-current`) · `dashboard-nav.tsx:26-38` (**byte-identical minus `aria-current` / `aria-label`**, and **dead**) · `dashboard-sidebar.tsx:111-119` (mobile, a third re-render of `NAV`, drops `aria-current` **and** `GlobalSearch`) · `public-header.tsx:26-32` · `public-footer.tsx:49-54`. The `NAV` array is declared **twice** (`dashboard-sidebar.tsx:30-36` vs `dashboard-nav.tsx:11-17`) with a **route-label conflict** — `/dashboard` is "Unternehmen" in the sidebar and "Uebersicht" in the dead copy, and `dashboard/page.tsx:10` also says "Unternehmen", so **`dashboard-nav.tsx` is stale** (L:427).
- Also LUTEA-only: `PublicHeader` has `<nav className="hidden items-center gap-6 md:flex">` with **no mobile nav anywhere** — below 768 px the 5 nav items **do not exist** (L:510, L:1137, ranked the 2nd-highest-severity public defect). And the footer groups are `div` + `ul`, not `nav` (L:303).

**Canonical:** one `Nav` + one `NavItem` with **mandatory** `aria-current`, one data source, rendered into both shells; one `Drawer` wrapping that same `Nav` on small viewports.
**Delete:** HSM's duplicated JSX block and duplicated brand mark; LUTEA's `dashboard-nav.tsx` (dead, stale) and its third `NAV` copy.

### 5.14 Table wrapper

- **HSM:** `kit/table.tsx` wraps in `<div className="relative w-full overflow-auto">` (`:9`) — a `div`, **not `role="region"`** — and is used in **2 files** (`FileBrowser.tsx:12-19`, `Database.tsx:29-36`). **8 pages hand-roll `table`** (`Ai.tsx:274,479`, `Backups.tsx:291`, `Cloudflare.tsx:218`, `Docker.tsx:313`, `FileManager.tsx:307`, `Https.tsx:106`, `Websites.tsx:338`) and all 8 use the **same** header literal — `thead className="bg-background text-muted-foreground"` + `th className="px-4 py-3 font-medium"` + `tbody className="divide-y divide-border"` + `tr className="hover:bg-muted/50"` + `td className="px-4 py-3 …"` (H:352-354). Only 3 of the 8 raw tables wrap in `overflow-x-auto` (H:514). `Docker.tsx:313` drops `caption` and `scope` entirely (H:356).
- **LUTEA:** **no wrapper at all** — `kit/table.tsx` has no overflow container and no sticky header (L:267); its single consumer `crm-page-client.tsx:93-130` hides columns with `hidden md:table-cell` (`:97-99`) instead of scrolling (L:724). `company-list.tsx` and `projects-client.tsx` reimplement tabular lists as `button` / `div` stacks (L:740).

**Canonical:** one `Table` — HSM's `px-4 py-3` rhythm (its 8 raw tables already agree on it, H:356) + LUTEA's `h-9` uppercase head + a proper `overflow-x-auto` wrapper (with `role="region"` + an accessible name) + `TableCaption` + `scope="col"` + `TableEmptyRow`.
**Delete:** 8 raw HSM tables, LUTEA's 2 `button`-stack pseudo-tables, and both repos' no-op `TableBody` / dead `data-[state=selected]`.

### 5.15 Dialog shell

- **HSM (5 files):** `ConnectLinkDialog.tsx`, `LoadingScreenMakerDialog.tsx` (×2 Dialogs, one **nested inside another** at `:710`), `FileBrowser.tsx` (has `DialogTitle`, **no `DialogDescription`**, H:539), `Database.tsx` (×3 dialogs), `GameServers.tsx`. Kit defects: 8px shadow vs 6px elsewhere (`:41`), English `sr-only "Close"` (`:49`), `focus:` on the close button (`:47`), `DialogFooter className="gap-2 sm:gap-0"` fighting the component's own `sm:space-x-2` (`confirm-dialog.tsx:53`, H:244), and `sm:rounded-none` which is a **no-op** because the element is already `rounded-none` (H:245).
- **LUTEA (4 ad-hoc shells + 1 correct primitive, L:399):** `overseer-overlay.tsx:33-43` (right drawer) · `settings-overlay.tsx:32-51` (centred, `max-h-[85vh]`) · `dashboard-sidebar.tsx:98-130` (left drawer) · `projects-client.tsx:137-142` (centred form). The two drawers are the same component with **mirrored override strings**; the centred ones differ in padding (`p-0` + inner vs `p-6`). `kit/confirm-dialog.tsx` is **unused** (L:255). `overseer-overlay.tsx:20-31` and `settings-overlay.tsx:19-30` are **character-for-character** the same trigger markup (L:292, L:435).
- **Three real focus failures, both repos:** HSM's fullscreen preview is a **sibling** of `DialogContent`, so it is inside the trap and the `inert` background but visually on top — "a keyboard user can see it and cannot reach it" (H:631); the nested slot dialog stacks a second Radix root (H:631); and HSM's destructive confirm gets initial focus by ordering, "accidentally right … not by design" (H:632). LUTEA's close button has **no ring at all** (L:825) and its overlay triggers have no `aria-haspopup="dialog"` / `aria-expanded` (L:292-293).

**Canonical:** `Dialog` (centred) + `Drawer` (left/right) as two variants over one primitive, plus `ConfirmDialog` + `useConfirm` for every destructive action.
**Delete:** 4 ad-hoc LUTEA shells, HSM's nested-dialog pattern, and the verbatim-duplicate `SidebarAction` triggers.

### 5.16 Sidebar

- **HSM:** `App.tsx:286-291` desktop `w-64`; `App.tsx:357-376` mobile drawer `w-72` with a `bg-black/60` backdrop that closes on click but has **no close-on-Escape, no focus trap**, and leaves the main content interactive behind it (H:506). The structural breakpoint is `lg` (`App.tsx:270` `hidden lg:flex`), but the Tauri window minimum is **980 px** — *below* `lg` (1024) — so "the default desktop window shows the mobile drawer, and the desktop sidebar is unreachable without resizing the window past 1024 px" (H:192, H:505, H:907).
- **LUTEA:** `dashboard-sidebar.tsx:38` — `<aside>` 256 px, `bg-card/50`, `shadow-sidebar`, `hidden … lg:flex`; hosts `GlobalSearch` (`:50`), which is therefore **unreachable below 1024 px** (L:563, L:725, L:1139). `DashboardMobileHeader` (`:84-133`) is the drawer variant: a **third** `NAV` re-render, and it drops both `aria-current` and `GlobalSearch` (L:279, L:481). Header heights: `min-h-[69px]` written **twice** (L:312, L:564) plus `h-14` on mobile (L:312). L:208 notes a `DashboardShell` re-declared in **5 routes** because there is no `dashboard/layout.tsx` (L:482, L:569).

**Canonical:** one `Nav` + one `Sidebar` + one `Drawer`, with `GlobalSearch` (or its replacement) present in **both** shells, and the breakpoint chosen against the real minimum window width.
**Delete:** HSM's duplicated nav JSX; LUTEA's `dashboard-nav.tsx` and the duplicated `min-h-[69px]`.
**`DECISION REQUIRED`:** HSM's 980 px minimum vs `lg` at 1024 px is a **product** decision, not a CSS one — either the window minimum rises to 1024 or the sidebar breakpoint drops.

### 5.17 Card grid

- **LUTEA, 7 occurrences** (L:314): `mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3` verbatim at `agentur/page.tsx:73,82,96`, `leistungen/page.tsx:26`, `dashboard-client.tsx:69`, `dashboard-client.tsx:100`, `overseer-dashboard.tsx:263` — then density drifts to `gap-3 md:grid-cols-3` (`:69`) and `gap-3 md:grid-cols-4` (`:100`).
- **HSM:** no `CardGrid` primitive; page roots use `space-y-6` in 16 pages (20 occurrences) with two outliers — `GameServers.tsx:328` `space-y-5` and `GameServerDetail.tsx:312` `space-y-4` (H:291, H:451).

**Canonical:** one `Grid` / `CardGrid` with a `cols` prop, plus one `Page` layout primitive with `space-y-6` baked in.
**Delete:** 7 grid literals, 2 `space-y` outliers, and the 20 hand-written `space-y-6` roots.

### 5.18 Service card

**LUTEA only, 2 copies, near-identical** (L:315, L:347-355): `agentur/page.tsx:156-169` `ServiceCard` and `leistungen/page.tsx:27-40` (inlined). Identical `Card className="transition-colors hover:border-accent/50"`, identical icon box `flex size-10 items-center justify-center bg-accent text-accent-foreground` with a `size-5` icon, identical `CardTitle className="text-base"`, identical `CardDescription` inside `CardContent`. **Only delta:** `leistungen` adds a price line (`:37`) — *"The clearest single duplication in the repo"* (L:315). Both files also declare a `SERVICES` const (`agentur:8-15`, `leistungen:9-16`) listing the same 6 titles **in a different order**.

**Canonical:** `FeatureCard` with an optional `price`, driven by one array.
**Delete:** the `leistungen` inline copy and the second `SERVICES` array.
**Classification:** `PROJECT-SPECIFIC` for TEA UI's core — it is a marketing-layer component, so it belongs in `@tea-ui/marketing`, not `@tea-ui/primitives` (L §8.2 calls it "really a `FeatureCard` with an optional `price`", L:989).

### 5.19 Toast

| | HSM | LUTEA |
|---|---|---|
| **Implementation** | Real `ToastPrimitive.ToastRoot` via `@radix-ui/react-toast`; 8 parts + `ToastProvider` (H:256) | Radix imported (`toast.tsx:3`) and `ToastProvider` re-exported (`:8`), but `Toast` (`:37`) renders a plain `div` (L:269) |
| **Live region** | Radix's `ToastAnnounce` supplies it (H:256) | **none** — `Toaster` has no `role="status"` / `aria-live` / `role="alert"` (L:270) |
| **Animation** | dead (`animate-in` etc. with no `tw-animate-css`) (H:197) | dead — **no `data-state` is ever emitted**, so every `data-[state=open]:animate-in` and `data-[swipe=end]:animate-out` is dead; swipe-to-dismiss does not exist (L:1056-1062) |
| **Store** | module-level mutable singleton: `memoryState` + `listeners` array + `toastTimeouts` Map + `count` (H:278) | module-level mutable singletons `listeners` / `toasts` (L:1064) |
| **Limits** | `TOAST_LIMIT = 1` — a second toast silently replaces the first; `TOAST_REMOVE_DELAY = 1_000_000` ms ≈ 16.7 min (H:278) | n/a |
| **Close button** | `opacity-0` until `group-hover` (`:78`) → **keyboard users never see it** (H:256) | `opacity-0`, `focus:opacity-100` (`:46`) — no ring, starts invisible (L:826) |
| **z-index** | `z-[100]` (`:17`) | dead `z-[100]` (`:13`) vs the real `z-[9999]` (`:17`) (L:206) |
| **Mount point** | provider inside `main.tsx`'s `Toaster`, a **sibling of `App`** → a throw in `App` unmounts the toaster (H:257) | root layout (L:1053) |
| **Consumers** | 26 call sites (H:400) | **2 files** (L:329) |
| **Cost of being wrong** | 0 bytes in the bundle, but the CSS it would define is relied on by 5 kit components (H:821) | "a full Radix toast dependency, an unused viewport, a dead animation set, two z-index values, and an inaccessible result — for a feature used in exactly 2 files" (L:1067) |

**Canonical:** rebuild once on HSM's working Radix path, with LUTEA's missing parts. See §4.
**Delete:** both `use-toast` module-level singletons, `TOAST_LIMIT = 1`, the 16.7-minute remove delay, the dead `z-[100]`, and one of the two z-index values.

### 5.20 Colour palette

The full set of hand-written colour escapes, side by side. **Everything in this table is a token or a class-name that must stop existing.**

| Escape | HSM | LUTEA |
|---|---|---|
| `slate` (not in either token vocabulary) | `bg-slate-500` (`Chart.tsx:35`), `placeholder-slate-500` (`Notifications.tsx:154,163,172`) — both fail contrast (H:616-618) | none |
| raw red beside `destructive` | `text-red-300` 23× across 12 files **and** `text-destructive`; "the two never agree" (H:125) | `text-red-300` 6×, `text-red-200` 2× in error banners (L:413) |
| success greens | `bg-accent/10` (5×), `bg-emerald-500/10` (2×), `bg-green-900/40 text-green-300` (1×) — **three** (H:123-126) | `#4CAF6D` hard-coded in 2 score sites, duplicating `STATUS_COLORS` (L:448) |
| warn ambers | `text-amber-200/300/400`, `bg-amber-900/30`, `bg-amber-800/60`, `bg-amber-950/40` — **37 occurrences across 19 files**, mixed freely (H:124) | `text-accent/40` process numerals, ~2.2:1, fails AA (L:861) |
| terminal / editor backgrounds | `#0a0a0c` in 3 places (`GameServerDetail.tsx:111,473`, `FileBrowser.tsx:423`) (H:229) | — |
| loadingscreen / template palettes | `#e6edf7`, `#9aa7bd` (`loadingScreens.ts:495-496`), `#0a0e1a`, `#1a2332`, `#1e293b` (`:558,599`) (H:229) | — |
| chart series | `#22d3ee`, `#a78bfa`, `#f59e0b` as props (`Monitoring.tsx:20-22`) (H:128) | — |
| chart grid / labels | `#334155` / `#64748b` (`Chart.tsx:66,68,97`), 9 px, ~3.4:1 (H:616) | — |
| editor overlays | `rgba(0,0,0,0.35)`, `rgba(245,158,11,0.85)` (`LoadingScreenEditor.tsx:1272,1375-1376`) (H:229) | — |
| second status colour source | none — no status scale exists | `colors.status.*` **plus** `STATUS_COLORS` (L:121) |
| third brand ramp entry | `mlhsm.blue` reachable only via arbitrary value (`App.tsx:301,317`) (H:119) | `lutea.gold/green/blue` all dead (L:89-91) |
| semantic-failure status | `FEHLT` in `text-destructive` (L:369) | (same row, LUTEA side) |
| scrollbar / selection | `::selection` gold-on-gold (`styles.css:62-65`), scrollbar thumb hover `#f2c012` (`:86-90`) (H:225, H:626) | identical values (`globals.css:55-58`, `:60-73`) (L:132-133) |

**Canonical:** one token set. `success` = the currently-unnamed `#4CAF6D`-class green becomes an explicit `status.positive`; `info` = the dead `#2F6FEB`; `caution` = the amber family collapsed to one value; `critical` = `#B3261E`; and `#E0332E` gets one home or is deleted (§3, `primary`).
**Delete:** every row in that table. `DECISION REQUIRED`: the two score thresholds (L:443-448) and the `#1A1D24` archived badge (L:865) are the concrete casualties that prove hand-picked status hexes do not survive.

### 5.21 Unit formatting (GB vs GiB)

- **HSM:** `formatBytes` is written **4 times with 3 different unit systems** — `KB/MB/GB` and `KiB/MiB/GiB` (H:717). `FileBrowser.tsx:52-55` uses **GiB/MiB/KiB** and is "the only page that does; everyone else uses GB/MB/KB" (H:267); `FileBrowser` additionally has a **bytes-only** path (H:717). `Backups`, `Monitoring` and `Database` each differ (H:717). Related formatters: `formatUptime`, `elapsedSince`, `etaText` (H:717). The UI label is "Gesamtgröße" (H:530). Two more related facts: HSM caps `FileBrowser` at 2 MiB **after** transfer (H:267), and `api.ts:528-538` returns a whole file as a `number[]` (H:851).
- **LUTEA:** **no byte formatter exists in the repo at all.** There is nothing to merge with and nothing to migrate.

**Canonical:** one `formatBytes(value, { binary = true, unit = "adaptive" })` + one `formatDuration` in `@tea-ui/utils`.
**`DECISION REQUIRED`:** binary (KiB/MiB/GiB) or decimal (KB/MB/GB). The honest default is **binary**, because the dominant surface in both apps is disk/backup/container size — and the sole existing correct implementation (`FileBrowser.tsx:52-55`) already uses it. A `binary` flag keeps decimal available for anything that genuinely means decimal (a transfer rate, a licence cap).
**Delete:** 3 of the 4 HSM copies, and the bytes-only path.

### 5.22 German status terminology — the merged label table

The two repos use **different words for the same wire values**, and HSM's diverge **per page** for one wire union (H:296). This table becomes TEA UI's shared terminology. HSM's wire unions and their current wordings come from H:296, H:530 and H:358-360; LUTEA's from L:625 (CRM, `status.ts:14-23`), L:631-638 (project lifecycle) and L:642 (version states).

| Wire value | HSM German as found | LUTEA German as found | TEA UI canonical | Tone |
|---|---|---|---|---|
| running / online | "Läuft" (Docker/App) **and** "Online" (App header + grid) — two words for one state (H:296, H:530) | — | **"Läuft"** | positive |
| stopped | "Gestoppt" (H:530) | — | **"Gestoppt"** | neutral |
| not started / paused | "Angehalten", "Starten", "Pausiert" — three words, one page row (H:296) | — | **"Angehalten"** | neutral |
| unreachable | "Nicht erreichbar" (H:530) | — | **"Nicht erreichbar"** | critical |
| error / failed-state | "Fehler" (H:530) | — | **"Fehler"** | critical |
| success | "Erfolgreich" (H:530) | — | **"Erfolgreich"** | positive |
| failed (operation) | "Fehlgeschlagen" (H:530) | — | **"Fehlgeschlagen"** | critical |
| pending / in-flight | "Ausstehend" (H:530) | — | **"Ausstehend"** | neutral |
| valid | "Gültig" (certificate, H:530) | — | **"Gültig"** | positive |
| warning | "Warnung" (H:530) | — | **"Warnung"** | caution |
| critical (severity) | "Kritisch" (H:530) | — | **"Kritisch"** | critical |
| expired | "Abgelaufen" (certificate, H:530) | — | **"Abgelaufen"** | neutral |
| unsafe action | "nicht sicher" (H:296) | — | **"Nicht sicher"** | critical |
| unprocessed | — | "Unbearbeitet" (L:625) | **"Unbearbeitet"** | neutral |
| no website | — | "Keine Website" (L:625) **and** "FEHLT" in the table cell (L:369, L:736) | **"Keine Website"** | critical |
| opportunity | — | "Opportunity" — **untranslated, the only English label in the set** (L:627) | `DECISION REQUIRED` | info |
| contacted | — | "Kontaktiert" (L:625) | **"Kontaktiert"** | info |
| conversation | — | "Gespraech" (L:625) — transliterated | **"Gespräch"** | info |
| offer | — | "Angebot" (L:625) | **"Angebot"** | info |
| customer | — | "Kunde" (L:625) | **"Kunde"** | positive |
| archived | — | "Archiviert" (L:625) — but the **badge is ~1.1:1, unreadable** (L:865) | **"Archiviert"** | neutral |
| request (project) | — | "Anfrage" (L:638) | **"Anfrage"** | neutral |
| planning | — | "Planung" (L:638) | **"Planung"** | info |
| design | — | "Design" (L:638) | **"Design"** | info |
| development | — | "Entwicklung" (L:638) | **"Entwicklung"** | info |
| review | — | "Review" (L:638) — deliberate German/English industry mix (L:640) | **"Review"** | info |
| approval | — | "Freigabe" (L:638) | **"Freigabe"** | info |
| live | — | "Live" (L:638) | **"Live"** | positive |
| maintenance | — | "Wartung" (L:638) | **"Wartung"** | neutral |
| cancelled | — | "Abgebrochen" (L:638) | **"Abgebrochen"** | neutral |
| draft (version) | — | "Entwurf" (L:642) | **"Entwurf"** | neutral |
| approved (version) | — | "Freigegeben" (L:642) | **"Freigegeben"** | positive |
| rejected (version) | — | "Abgelehnt" (L:642) — **declared, but no reject action exists anywhere** (L:642, L:1194) | **"Abgelehnt"** | critical |

**Rules that come out of this table:**

1. **One word per wire value, everywhere.** HSM's five independent tables are deleted and replaced by this table (H:296, H:360).
2. **A label is never colour-only and never abbreviated.** Every LUTEA implementation that carries a dot also carries the text (L:769, L:813) — that is the good pattern and it is already the house rule; the four that don't are the four to delete (§5.2).
3. **Orthography `DECISION REQUIRED`.** LUTEA's `ae` / `oe` / `ue` transliteration (`Gespraech`, `Bestaetigen`, `Loeschen`, `Ungueltige Ressourcen-ID`, L:625, L:651, L:717) versus HSM's real umlauts (H:530). The table above recommends **real umlauts** — LUTEA's transliteration has already produced three corrupted user-facing strings (L:1140) and one mangled code comment (L:1167), which is evidence of a broken pipeline rather than a style choice.
4. **`opportunity` `DECISION REQUIRED`.** L:627 flags it as the one untranslated label and offers "Chance / Interesse / Lead" without choosing. Until someone chooses, the key stays `opportunity` so the inconsistency is explicit rather than hidden.
5. **Register `DECISION REQUIRED`.** Both repos mix informal *du* with formal *Sie* (H:920, L:543). HSM argues the informal voice is current (H:920).
6. **Copy defects to purge on adoption:** `"Speichere."` / `"Verbinde."` / `"Trenne."` — a full stop where an ellipsis belongs (`Settings.tsx:520, 633, 722, 726`, H:532); the English `sr-only "Close"` (`kit/dialog.tsx:49`, H:532); the factually wrong `"IPC-Fehler: "` (H:468); the **double-encoded UTF-8 in 12 user-visible strings** of `FileManager.tsx` (lines 62, 102, 172, 206, 226, 240, 246, 292, 301, 311, 312, 320, 325, 335) and `api.ts:1276, 1280` (H:471); and LUTEA's `und我们把das CRM` / `Gebäude-Precrição` / `WBÖhe` (L:1140). HSM's own conclusion: a repo-wide UTF-8 guard (editorconfig + a CI grep for the `â€` / `Ã¤` signature) is needed **first**, or extraction moves the corruption with the strings (H:887).
7. **Ellipsis:** HSM's `…` (U+2026) is used consistently, 64 times across 24 files (H:477). LUTEA drifts to `...` and even to a spaced ` ...` (L:1131). Canonical: `…`, no space.

### 5.23 Kill-list summary

| # | Behaviour | HSM impls | LUTEA impls | Canonical | Sites deleted |
|---|---|---|---|---|---|
| 1 | surface / panel | 31 raw + 6 kit | 20 raw + 1 local | `Card` + `density` | 51 raw + 1 local |
| 2 | status | 6 tables + 15 dot sites | 7 + `FEHLT` + 2 colour sources | `StatusBadge` + `StatusSelect` + `statusMeta` | 28 |
| 3 | empty state | 16 | 10 (+1 dead component) | `EmptyState` + `TableEmptyRow` | 24 |
| 4 | error banner | 31 (4 dialects) | 9 (1 literal) | `Alert` | 40 + 3 clones |
| 5 | micro-label | 6 (2 sizes) | 20 (1 literal) | `Eyebrow` | 26 |
| 6 | icon tile | 0 | 5 | `IconTile` | 4 |
| 7 | stat tile | 6 fns + 4 inline | 2 | `StatTile` | 12 |
| 8 | loading spinner | 8 loaders + 13 spins | 13 (4 sizes) | `Loading` on `Skeleton` | 21 |
| 9 | search input | 3 raw (fail contrast) | 3 (2 bypassing the kit) | `SearchInput` | 5 |
| 10 | refresh button | 15 (1 literal ×8) | 0 | `RefreshButton` | 15 |
| 11 | action button group | ~40 | 4 | `Button` variants | ~44 |
| 12 | form field | 12 raw controls, 14 raw labels | 5 impls, 11 unassociated labels | `Field` + `NumberField` | 17 impls |
| 13 | nav item | 2 identical JSX blocks | 5 | `Nav` + `NavItem` | 6 |
| 14 | table wrapper | 2 kit users + 8 raw | 1 + 2 pseudo-lists | `Table` | 10 |
| 15 | dialog shell | 5 files, nested | 4 ad-hoc + 1 unused | `Dialog` + `Drawer` + `ConfirmDialog` | 5 |
| 16 | sidebar | 2 shells | 3 shells + 1 dead | `Sidebar` + `Drawer` | 3 |
| 17 | card grid | 0 (+2 outliers) | 7 | `CardGrid` + `Page` | 9 |
| 18 | service card | 0 | 2 | `FeatureCard` (marketing layer) | 1 + 1 array |
| 19 | toast | 1 working, 26 call sites | 1 inert, 2 call sites | one rebuilt toast | 1 store + 1 duplicate |
| 20 | colour palette | 8 escape families | 4 escape families | the token set | all |
| 21 | unit formatting | 4 `formatBytes`, 3 unit systems | none | `formatBytes` + `formatDuration` | 3 |
| 22 | German status terms | 5 tables | 3 tables | `statusMeta` (§5.22) | 8 |

---

## 6. Accessibility defect register

Deduplicated across both repos. `file:line` is the reference **as quoted in the originating audit** — `H:` items from HSM-AUDIT, `L:` items from LUTEA-AUDIT.

**Severity.** `S1` = blocker (a control is unreachable, unnamed, or unusable). `S2` = serious (fails a criterion, or degrades a whole surface). `S3` = minor (polish, or a latent risk).

### 6.1 Forms — labels, association, validation

| # | Defect | Origin | Sev | WCAG 2.2 | TEA UI rule |
|---|---|---|---|---|---|
| F1 | **`htmlFor` appears 0 times in the entire HSM frontend.** Every `Label` is decorative. Affects `GameServers.tsx:531,540,599,623-628,646`; `GameServerDetail.tsx:603,612`; `Settings.tsx:267,277,297,495,593,603,613`; `LoadingScreenEditor.tsx:553,1583,1628,1729,1746,1800,1817,1834,2033,2114,2118`; `ConfigEditor.tsx:414-417`; `ConnectLinkDialog.tsx:160,190`; `FileBrowser.tsx:324`; plus 14 raw `label` elements in `Cloudflare.tsx:199`, `DynamicDns.tsx:164,202,216,230,250,275`, `Websites.tsx:289,300,311,403`, `Database.tsx:578,586,788,872`, `SetupWizard.tsx:160,211,234,239,250` (H:554-562) | H | **S1** | 1.3.1, 3.3.2, 4.1.2 | **`Field` generates `id` + `htmlFor`.** A `Label` outside a `Field` is a lint error. |
| F2 | **`ServerVariables.tsx:79-81`** — the field key is a bare `span className="break-all font-mono text-xs"` with **no label element at all**; ~20 variables are edited in a 2-column grid (H:562) | H | **S1** | 1.3.1, 3.3.2, 4.1.2 | `Field` is mandatory for key/value editors; a monospace key becomes the `Label`, not a replacement for it. |
| F3 | **`settings-panel.tsx:210,219`** — `LabeledInput`'s `label` and `Toggle`'s `label` have neither `htmlFor` nor a nested control, and the `Input` has no `aria-label`, so **every control in the settings dialog has no accessible name, across 12 fields** (L:790-798) | L | **S1** | 1.3.1, 3.3.2, 4.1.2 | Same as F1. L:802 — one `Field` fixes all 11. |
| F4 | `kontakt/page.tsx:113` — the visible `label` is unassociated while the 6 controls are named by a **parallel** `aria-label` (`:67,71,74,79,82,89`); the names match "only by manual discipline, and they will drift" (L:800) | L | S2 | 1.3.1, 2.5.3, 3.3.2 | **`Field` is the only way to name a control.** A hand-written `aria-label` that duplicates visible text is banned (also 2.5.3 risk). |
| F5 | `projects-client.tsx:160,166,170` — `label` without `htmlFor` in front of `select name="companyId"` (`:161`), `Input name="name"` (`:167`), `Textarea name="notes"` (`:171`) (L:793-795) | L | **S1** | 1.3.1, 3.3.2, 4.1.2 | Same as F1. |
| F6 | **No `aria-describedby` anywhere in HSM** (0 occurrences). **No form field is ever marked invalid**; `aria-invalid` occurs 5 times, all inside `kit/button.tsx:6` as a *style* hook, and **no page ever sets it** — so the invalid styling is dead (H:586-587) | H | S2 | 3.3.1, 3.3.3, 4.1.2 | `Field` wires `aria-describedby` to the `error` slot and sets `aria-invalid` itself. A consumer cannot opt out. |
| F7 | HSM reports validation as a **toast**, not an inline field error (`Settings.tsx:231,235,246`) — "the message appears in the corner while the offending field is elsewhere on the page" (H:487). `aria-invalid` **is** present on LUTEA's `Input` (L:767) but **missing on its `Textarea`** 10 lines below in the same file (L:258) | H + L | S2 | 3.3.1, 3.3.3 | `Field` requires the error to render inside the field. `Textarea` inherits `Input`'s invalid styling — one source, not two. |
| F8 | **HSM has exactly one `required` attribute in the whole codebase** (`Websites.tsx:260`) and no validation library; `Settings.tsx:229-250` accepts **any** password with no strength check (H:484-486) | H | S3 | 3.3.2, 3.3.8 | Out of TEA UI's scope (a schema is app logic) — but `Field` must make `required` / `type` / `min` / `max` expressible without a hand-typed class string. |
| F9 | LUTEA's server returns **only `issues[0].message`** for a 6-field form (`api/contact/route.ts:21`) — the user sees one error for six fields, in a single banner (L:598) | L | S2 | 3.3.1 | `Field` supports an `errors` map, not a single string, so a future server-side fix needs no component change. |
| F10 | HSM's `Websites.tsx:249-331` — a whole raw form (9 inputs, 1 select, 4 labels, 3 checkboxes) with `required` on one field and **no error display at all**; failures land in the top-level banner at `:208-218` (H:489) | H | S2 | 3.3.1 | Same as F6. |

### 6.2 Keyboard

| # | Defect | Origin | Sev | WCAG 2.2 | TEA UI rule |
|---|---|---|---|---|---|
| K1 | **8 non-keyboard-reachable primary navigation targets.** `App.tsx:596-603` (4 service-status cards with `onClick`), `:655-657`, `:715-717`, `:777-779` (3 dashboard cards) — no `role`, no `tabIndex`, no key handler. Same for `GameServers.tsx:384-388`, where 4 nested buttons each need `e.stopPropagation()` (`:459,471,483,495,504`) (H:589-592) | H | **S1** | 2.1.1, 4.1.2 | **A clickable `Card` is never an anchor.** `Card` is not interactive; navigation is a `Link` or a `Button`. Banned: `onClick` on a non-interactive element. |
| K2 | `crm-page-client.tsx:108` — `onClick` on `<TableRow>`; a `tr` is not focusable, has no `role="button"`, no `tabIndex`, no key handler. "The entire company detail panel … is **mouse-only**" (L:832-834) | L | **S1** | 2.1.1, 4.1.2 | Same as K1. A clickable row must be a real `button` in the first cell, or the row must carry `tabIndex` + `role` + `onKeyDown` — the library ships the correct row and forbids the pattern. |
| K3 | `global-search.tsx` — **no `role="combobox"`, no `aria-expanded`, no `aria-controls`, no `aria-autocomplete`, no `aria-activedescendant`**; results are bare `button`s in a `div` with no `listbox` / `option` / `aria-selected`; **no arrow-key nav, no Enter-to-select, no Home/End**; Escape only blurs (`:55`). "**The feature is unusable without a mouse**" (L:280, L:828-830) | L | **S1** | 2.1.1, 4.1.2 | Either build the command palette **as** a combobox or do not build it (§4). A search box with results must be a combobox. |
| K4 | `settings-panel.tsx:220-226` — a hand-rolled `<button aria-pressed>` toggle exists while `kit/switch.tsx` sits **unused** (L:266) | L | S2 | 4.1.2 | `Switch` is the only toggle. `aria-pressed` on a non-toggle is a lint error. |
| K5 | HSM's mobile drawer (`App.tsx:357-376`) has **no close-on-Escape, no focus trap**, and the main content stays interactive behind it (H:506) | H | S2 | 2.1.2, 2.4.3 | `Drawer` traps focus and closes on Escape by contract. |
| K6 | HSM's `LoadingScreenEditor.tsx:836-944` is the most complete keyboard model in either repo (Alt-drag, Shift-click, marquee, 8 resize handles, `Ctrl+Z/Y/D/C/X/V/A/0`, arrow nudge, Space-pan, Esc-cancel, double-click inline edit) — but the keydown listener is on **`window`** and is not scoped to dialog open-state (H:268) | H | S3 | 2.1.1, 2.4.3 | `Kbd` ships; keyboard scope is the app's job, but a library-provided `useHotkeys` must scope to the element. |
| K7 | `kit/toast.tsx:78` — `ToastClose` is `opacity-0` until `group-hover`; LUTEA's is the same at `:46` (L:826). **Keyboard users never see the close button** (H:256) | H + L | S2 | 2.4.7, 2.5.5 | The close control is visible on `:focus-visible` as well as hover. Never `opacity-0` on a focusable control. |
| K8 | Tab order in `GameServerDetail.tsx:319-377` puts 6 action buttons in a row before any content; the `FileBrowser` row is 5 unlabeled icon buttons per row × N rows (H:502) | H | S3 | 2.4.3, 1.3.1 | `RowActions` names every action; a row's actions are one tab stop with a menu for overflow. |

### 6.3 Focus

| # | Defect | Origin | Sev | WCAG 2.2 | TEA UI rule |
|---|---|---|---|---|---|
| X1 | **`focus:` instead of `focus-visible:` on 4 controls**: `kit/select.tsx:22`, `kit/dialog.tsx:47`, `kit/toast.tsx:63,78`. A visible ring on mouse click, and a **missing** ring if the heuristic does not fire (H:596-597) | H | S2 | 2.4.7, 2.4.13 | **`focus:` is banned.** Only `focus-visible:` on interactive elements. |
| X2 | **`focus:outline-none` with no replacement ring**: `kit/dialog.tsx:44` and `kit/toast.tsx:46` (L:825-826) — "Keyboard users get no focus indicator on the dialog close button" | L | **S1** | 2.4.7 | **`outline-none` without a replacement is banned outright.** |
| X3 | `kit/badge.tsx:7` — `focus:ring-2` on a **non-focusable `div`**: never fires (H:208, H:598) | H | S3 | 2.4.7 | `Badge` is a `span` and is not focusable. |
| X4 | `kit/table.tsx` rows, `App.tsx:519` `NavButton`, `Database.tsx:238` — **no focus style whatsoever**; they fall back to the UA default, a low-contrast blue/white ring on `bg-background #111318` (H:215, H:599) | H | S2 | 2.4.7 | Every interactive element gets the library ring by default, via the primitive — not by remembering a class. |
| X5 | **The focus ring and the selected/active state are the same colour.** `ring: #F2C012` = `accent: #F2C012` (`tailwind.config.js:29,34`); the `NavButton` active fill `bg-accent` "obliterates the ring entirely: a gold ring on a gold button" (`App.tsx:523-525`). `::selection` is a **third** gold (`styles.css:62-65`) (H:600-601, H:200) | H (and L, same values) | S2 | 1.4.11, 2.4.11, 2.4.13 | **`ring` gets its own value**, distinct from `accent`, `primary` and `::selection`. The focus indicator must be distinguishable from every state it can appear over. |
| X6 | The mobile drawer is a sibling of the main content with a `bg-black/60` backdrop; the content behind stays focusable (H:506) | H | S2 | 2.4.3, 2.4.11 | `Drawer` sets `inert` on the background (WCAG 2.2's new **2.4.11 Focus Not Obscured** makes this concrete). |
| X7 | HSM's fullscreen preview is a **sibling** of `DialogContent` (`:687-708`) — inside the trap and the `inert` background but visually on top: "a keyboard user can see it and cannot reach it" (H:631) | H | S2 | 2.1.2, 2.4.3 | A full-bleed layer inside a dialog must be **inside** `DialogContent`, or a separate dialog root. |
| X8 | HSM's destructive confirm receives initial focus by element ordering, "accidentally right … not by design" (`confirm-dialog.tsx:54`, H:632) | H | S3 | 2.4.3, 3.3.4 | `ConfirmDialog` sets initial focus explicitly: the cancel button for destructive actions. |

### 6.4 Semantics

| # | Defect | Origin | Sev | WCAG 2.2 | TEA UI rule |
|---|---|---|---|---|---|
| S1a | **`CardTitle` is a `div` in both repos** — heading semantics lost at ~50 use sites (H:242, L:252) | H + L | S2 | 1.3.1, 2.4.6 | `CardTitle` renders a real heading with a `level` prop. |
| S1b | `role` usage in all of HSM: **3 occurrences** — `Chart.tsx:55` (`role="img"`, correct), and `kit/table.tsx:76,90` which are `[&:has([role=checkbox])]` **selectors, not assignments** (H:594) | H | S2 | 1.3.1, 4.1.2 | Roles come from the primitives, not from call sites. |
| S1c | Nothing in HSM assigns `role="status"`, `role="progressbar"`, `role="group"`, `role="list"` / `listitem`, or `role="navigation"`; the 3 nav groups are unlabelled `nav` / `div`s; the 3 progress bars (`App.tsx:684`, `:940`, `GameServers.tsx:425`) have **no `role="progressbar"`, no `aria-valuenow`** (H:594) | H | S2 | 1.3.1, 4.1.2 | `Meter` always emits `role="progressbar"` + `aria-valuenow`. `Nav` always emits `nav` + `aria-label`. |
| S1d | `kit/badge.tsx:32` renders a `<div>` — **invalid inside the `<span>` / `<p>` where it is actually used** (`Websites.tsx:381-389`, `GameServers.tsx:396-401`, `GameServerDetail.tsx:326-332`) (H:240) | H | S2 | 1.3.1 | `Badge` is a `span`. |
| S1e | `Separator` defaults to `decorative={true}` in both repos (H:251, L:264) → `role="none"`, invisible to AT; a semantic divider requires an opt-in nobody makes (H:251) | H + L | S3 | 1.3.1 | Default flips to `false`; `decorative` is the opt-out. |
| S1f | HSM has **no skip link**; the sidebar is the first focusable content on every page (L:870 for the LUTEA equivalent) | H + L | S2 | 2.4.1 | `AppShell` ships a skip link. |
| S1g | **Heading-order breaks, LUTEA:** `shell.tsx:23` — the `h1` is inside `hidden … lg:flex`, so **below 1024 px the dashboard has no `h1` at all**, and the mobile header renders the title as a `div` (`:92-93`); `projects-client.tsx:111` project names are `span`, so no `h2`; `crm-page-client.tsx:144` is a `div`; `portal-client.tsx:47` `h1` in the `invalid` state vs `:65` `h2` with no `h1` in the `ready` state; `version-manager-client.tsx:151,208,241,308`; `auditor-client.tsx:104-105` (L:836-843, L:1151) | L | S2 | 1.3.1, 2.4.6, 2.4.10 | The shell owns the `h1` and it is **never inside a responsive-visibility wrapper**. `PageHeader` owns the `h2`. |
| S1h | HSM: `App.tsx:141` `PageKey` includes `"logs"`, which is never rendered and is in no nav array, so `titleFor` returns the raw string `"logs"` and the fallback renders "Bereich logs in Vorbereitung."; the fallback array (`:454-470`) is a **hand-maintained duplicate** of the render switch and already omits `ai` and `game-servers` (H:447) | H | S3 | 2.4.6, 3.3.2 | A route/label registry is one data structure, generated once. |
| S1i | HSM's `FileBrowser.tsx:308,314` breadcrumb segments signal state with `font-bold` only — **no `aria-current`** (H:267) | H | S2 | 1.3.1, 2.4.8 | `Breadcrumb` emits `aria-current="page"`. |
| S1j | `kit/table.tsx` wrapper is a `div`, not `role="region"`; **no table in either repo has a `caption`** and no `th` has `scope` (H:254, H:516) | H (+ L) | S2 | 1.3.1, 2.4.6 | `Table` wrapper is `role="region"` with a name; `TableHead` emits `scope="col"`; `TableCaption` is required in `DataTable`. |
| S1k | LUTEA: `company-list.tsx:133` puts `aria-label="Statusfilter"` on a plain `div` — not exposed without a `role` (L:806); `:197` puts `aria-label` on a bare `svg` without `role="img"` (L:810) | L | S2 | 4.1.2, 1.1.1 | `aria-label` only on elements that accept a name. `role="group"` + `sr-only` legend for filter rows. |
| S1l | `DashboardMobileHeader` drops `aria-current` **and** `GlobalSearch`; below 1024 px the dashboard has neither (L:279, L:481, L:725) | L | S2 | 2.1.1, 2.4.5 | One `Nav` rendered in both shells — the same component, so it cannot diverge. |

### 6.5 Live regions

| # | Defect | Origin | Sev | WCAG 2.2 | TEA UI rule |
|---|---|---|---|---|---|
| R1 | **`aria-live`: 0 occurrences. `role="alert"`: 0 occurrences — in all of HSM.** So the **31 inline error banners are invisible to a screen reader** when they appear; the 8 loaders announce nothing; the dirty pills announce nothing; the container/game-server counts changing every 5 s announce nothing; and `TOAST_LIMIT = 1` means a second toast *replaces* the first with no announcement of the loss (H:577-584) | H | **S1** | 4.1.3 | **`Alert` carries `role="alert"` by default** and takes an `assertive` / `polite` prop. |
| R2 | **Zero `aria-live` / `role="status"` in the whole LUTEA repository.** "The most systemic a11y gap" (L:812). Consequences: toasts **entirely** invisible (L:816); error banners silent in **7 of 9** (L:817); inline errors silent (`crm-page-client:189,234,255`, `settings-panel:256,290,348`); no `aria-busy` anywhere (L:819); the search busy indicator is a bare `span` with no text (L:820); the `kontakt` success panel is not announced (L:821) | L | **S1** | 4.1.3 | Same as R1, plus `Loading` carries `role="status"`. |
| R3 | No `aria-busy` on **any** loading state in either repo (H:477, L:819) | H + L | S2 | 4.1.3 | `Loading` and `DataTable` set `aria-busy` on the region they own. |
| R4 | HSM's dirty-state pills and count changes are visual-only (H:581-582) | H | S2 | 4.1.3 | `DirtyBadge` is a text pill (already the good pattern, H:543) **and** announces via a polite live region on change. |
| R5 | HSM's status dots are always paired with text (H:545) — **keep this**; the two sites that use a dot only (`Monitoring.tsx:56-60`, `Notifications.tsx:119-123`) are the exceptions (H:288) | H | S3 | 1.4.1, 4.1.3 | `StatusDot` is decorative (`aria-hidden`) and **always** ships beside a text label. |

### 6.6 Motion

| # | Defect | Origin | Sev | WCAG 2.2 | TEA UI rule |
|---|---|---|---|---|---|
| M1 | **`prefers-reduced-motion`: 0 occurrences. `motion-reduce:`: 0 occurrences — in HSM** (H:604). Unguarded: `animate-pulse` on status dots that change every second (`GameServers.tsx:111`, `GameServerDetail.tsx:306`); `animate-spin` on **13 elements** (`App.tsx:307,326`, `ConfigEditor.tsx:587`, `ConnectLinkDialog.tsx:146`, `FileBrowser.tsx:269`, `Database.tsx:415,1112`, `GameServerDetail.tsx:658`, `Ai.tsx:201`, `LoadingScreenEditor.tsx:2142`, `LoadingScreenMakerDialog.tsx:374,514,674`); `animate-pulse` in the dead `Skeleton`; the generated loadingscreen `@keyframes hsmspin` at 0.9 s linear infinite, permanently, inside a game client; `transition-all` on every `Button` and every clickable `Card` (H:604-610) | H | **S1** | 2.3.3, 2.2.2 | **The library honours `prefers-reduced-motion` globally.** No component ships an unguarded animation. |
| M2 | **Zero `prefers-reduced-motion` in the entire LUTEA repository** — 13 `animate-spin` loaders, `animate-pulse` (`global-search.tsx:60`, `skeleton.tsx:12`), and every `animate-in` / `animate-out` / `slide-in-from-*` / `zoom-in-95` on Radix content. L:225 calls it "an awkward gap" for a project whose own `/website-check` **sells accessibility audits to paying customers** | L | **S1** | 2.3.3, 2.2.2 | Same as M1. |
| M3 | **HSM's enter/exit animations emit nothing at all** — `tw-animate-css` is installed and never imported, so `data-[state=open]` / `data-[side=bottom]` / `data-[swipe=move]` hooks are inert (H:197). **LUTEA's toast animations are equally dead** for a different reason: no `data-state` is ever emitted (L:1056-1062) | H + L | S2 | 2.3.3 | The animation layer is **owned and tested by the library**; a missing import cannot silently disable it (§7, rule 9). |
| M4 | **No motion token axis at all.** LUTEA: `duration-` / `ease-` matches **zero** times — all motion runs at Tailwind defaults (L:224). HSM: the only authored duration is `duration-200` on one dialog (`kit/dialog.tsx:41`) (H:196) | H + L | S3 | 2.3.3 | A named `duration-fast / base / slow` + `ease-standard` axis, all zeroed under reduced motion. |

### 6.7 Contrast

| # | Defect | Site and computed ratio | Origin | Sev | WCAG 2.2 | TEA UI rule |
|---|---|---|---|---|---|---|
| C1 | `crm-status-badge.tsx:33,48` + `status.ts:33` — the `archived` badge: `#1A1D24` text on a 10 %-alpha version of itself over `#111318` → **~1.1:1, effectively invisible** (L:865, L:1128) | | L | S2 | 1.4.3, 1.4.11 | Status foreground/background pairs come from the registry with a **machine-checked** contrast floor. |
| C2 | `Chart.tsx:68,97` — 9 px axis labels, `#64748b` on `#171A21` → **~3.4:1, fails** (and 9 px is below any readable minimum) (H:616) | | H | S2 | 1.4.3, 1.4.4 | Chart ink is tokenised; no `slate`. |
| C3 | `Chart.tsx:35` — `text-slate-500` (#64748b) on `bg-card` → **~3.4:1, fails** (H:617) | | H | S2 | 1.4.3 | `slate` is not in either palette. |
| C4 | `Notifications.tsx:154,163,172` — `placeholder-slate-500` → **~3.3:1, fails** for placeholder text (H:618) | | H | S2 | 1.4.3, 1.4.11 | `placeholder` colour is a token with a contrast floor. |
| C5 | `agentur/page.tsx:85` — `text-accent/40` process numerals `01`-`04` on `bg-card` → **~2.2:1, fails AA**. "These are step numbers, decorative, but they read as content" (L:861) | | L | S2 | 1.4.3 | No `text-accent/40` on content-bearing numerals. |
| C6 | `company-list.tsx:254` — `text-[10px] opacity-60` on the `FilterChip` count → **~2.3:1, fails AA** (L:863) | | L | S2 | 1.4.3 | Same. |
| C7 | `company-list.tsx:216` — `text-muted-foreground/40` icon on `background` → **~2.4:1**, and it is the **only** content of the "select a company" empty state (L:862) | | L | S2 | 1.4.3, 1.4.11 | `EmptyState` icons are either `aria-hidden` decoration with adjacent text, or meet 1.4.11. |
| C8 | **Systemic:** `text-[10px]` and `text-[11px]` in `text-muted-foreground` (`#9A968C` on `#111318`, ~5.9:1) — "the **primary section labels** throughout the dashboard, rendered at 10-11 px. Small text at the edge of the ratio in a dense admin tool is a real legibility problem even though it technically passes" (L:866). HSM has the same exposure: **9 px and 10 px are used for real UI text**, not just decoration — `App.tsx:278,381,389,393`, 13 sites in `LoadingScreenEditor.tsx`, `GameServers.tsx:406,434,448` (H:166) | | H + L | S2 | 1.4.4, 1.4.12 | **`Eyebrow` is `text-[11px]`, never 10 px.** The 10-px step is deleted from the type scale. |
| C9 | `kit/label.tsx:8` `peer-disabled:opacity-70` reduces `text-sm font-medium` to ~70 % — "borderline / risk" (H:624) | | H | S3 | 1.4.3 | Disabled styling uses a token pair, not an opacity multiplier. |
| C10 | `App.tsx:393-410` — the status pill at `text-[11px]` passes contrast (>7:1) but "11 px is small for a persistent status indicator" (H:625) | | H | S3 | 1.4.4 | Status pills are `text-xs`, not `text-[11px]`. |
| C11 | **Passes — keep:** `muted-foreground #9A968C` on `card #171A21` is ~7.4:1 (H:628); `text-accent` on `bg-accent/10` ~10:1 (H:620); `text-red-300` on the destructive tint ~8:1 (H:619) | | H | — | 1.4.3 | These three become the contrast **floor fixtures** in TEA UI's test suite. |

### 6.8 Touch

| # | Defect | Origin | Sev | WCAG 2.2 | TEA UI rule |
|---|---|---|---|---|---|
| T1 | **No target-size floor is expressed in either kit.** HSM's `Button` cva publishes a smallest size of `icon-xs` (`button.tsx:22-32`, H:241); LUTEA's is `iconSm` (`button.tsx:27`, L:251). Neither defines a minimum, so the smallest published size is unenforced — and HSM's own `LoadingScreenEditor` re-declares the union by hand, "a shadow copy of `VariantProps` that will drift" (`:1478-1479`, H:749) | H + L | S2 | 2.5.8 (AA, new in 2.2) | **Every interactive target is ≥ 24×24 CSS px** (2.5.8). The size scale is generated from `VariantProps`, so it cannot drift. |
| T2 | HSM's `FileBrowser.tsx:389-406` — **5 icon-only buttons per row**; a 40-file directory = 200 targets, each of which is also unnamed (§S2a / G2) (H:566) | H | S2 | 2.5.8, 4.1.2 | `RowActions` guarantees both a name and a size. |
| T3 | HSM's `color-picker.tsx` SV square and hue strip are `div`s with pointer handlers only — **no `tabIndex`, no `role="slider"`, no arrow keys** (H:243) | H | **S1** | 2.1.1, 2.5.8, 4.1.2 | Reason `ColorPicker` is `DO-NOT-BUILD` (§4). |
| T4 | `ToastClose` is `opacity-0` until hover in both repos (H:256, L:826) — invisible to touch discovery until tapped | H + L | S2 | 2.5.8, 2.4.7 | Visible on focus and on touch, always ≥ 24 px. |
| T5 | LUTEA's `PublicHeader` nav is `hidden md:flex` with **no mobile menu anywhere** — below 768 px the 5 nav items **do not exist** (L:510, L:1137). This is a reachability defect before it is a touch one, and it is rated High | L | **S1** | 2.4.5, 1.4.10, 2.5.8 | A `Nav` must be reachable at every viewport. L:1001: do not generalise the nav until it has a mobile variant. |

### 6.9 Screen reader

| # | Defect | Origin | Sev | WCAG 2.2 | TEA UI rule |
|---|---|---|---|---|---|
| Z1 | **`aria-label` coverage in HSM: 12 occurrences in 4 files** — only `Chart.tsx:56`, `LoadingScreenEditor.tsx` (×8), `ServerModeOverlay.tsx:92`, `Settings.tsx` (×4). "The other 18 pages contain **zero** `aria-label`" (H:575) | H | S2 | 4.1.2 | A lint rule: an interactive element with only an icon child must have `aria-label` or visible text. |
| Z2 | `FileBrowser.tsx:389-406` — 5 buttons per row with only a lucide icon, **no `aria-label`, no `title`**. A 40-file directory = 200 unnamed buttons (H:566) | H | **S1** | 4.1.2 | Same as Z1. |
| Z3 | `Database.tsx:514-524` — `Pencil` and `Trash2` per row, no names (H:567) | H | **S1** | 4.1.2 | Same. |
| Z4 | `App.tsx:298-351` — the three sidebar power buttons are wrapped in `Tooltip` (`:296,315,334`) and Radix assigns `aria-describedby`, "but a `describedby` is not a `name`. All three are announced as 'button'" (H:568) | H | **S1** | 4.1.2, 2.5.3 | **A `Tooltip` never substitutes for an accessible name.** `aria-label` is mandatory on icon-only controls, tooltip or not. |
| Z5 | `LoadingScreenMakerDialog.tsx:428` (`Eye`), `:435` (`Trash2`) — `title` only, "unreliable for AT and absent on touch" (H:570) | H | S2 | 4.1.2 | Same as Z1; `title` is not a name. |
| Z6 | `Ai.tsx:590-592` — the API-key reveal toggle: **no `aria-label`, no `aria-pressed`, no tooltip** — "a completely unnamed toggle" (H:307, H:372) | H | **S1** | 4.1.2 | `SecretInput` ships the toggle with both attributes. |
| Z7 | `LoadingScreenEditor.tsx:1640-1651, 1654-1667` — `ColorRow` preset swatches carry `title={c}` (a hex string) only (H:572) | H | S2 | 1.1.1, 4.1.2 | If presets ship, they ship as labelled swatches with `aria-pressed`. |
| Z8 | `kit/color-picker.tsx:190-207` — trigger has `title="Farbe wählen"` but no `aria-label` and no `aria-expanded` (H:573) | H | S2 | 4.1.2, 4.1.3 | Same as Z5. |
| Z9 | `App.tsx:873` renders `Switch` with **no `aria-label`** (H:253) | H | **S1** | 4.1.2 | A `Switch` without an associated label is a lint error. |
| Z10 | `kit/dialog.tsx:49` — the close button's only name is the **English** `<span className="sr-only">Close</span>`, the only language slip in a user-facing string (H:245, H:532, H:640) | H | S2 | 3.1.2, 4.1.2 | All library copy is localised; `lang="de"` is not negotiable. |
| Z11 | HSM's mobile drawer: no `aria-label`, no focus trap, content behind stays live (H:506) | H | S2 | 4.1.2, 2.4.3 | `Drawer` takes a required `title`. |
| Z12 | LUTEA's `version-manager-client.tsx` uses `button aria-pressed` for its toggles (good) but `DialogTrigger`s carry no `aria-haspopup="dialog"` / `aria-expanded` (`overseer-overlay.tsx:20-31`, `settings-overlay.tsx:19-30`, L:292-293) | L | S3 | 4.1.2 | `Dialog` supplies these from `DialogTrigger` by contract. |
| Z13 | **Keep — the good practice, and the model:** HSM's `LoadingScreenEditor` `IconBtn` sets `aria-label` on every icon-only button (`:1492`) and `ToggleBtn` sets both `aria-label` and `aria-pressed` (`:1521-1522`) — "**the only component in the app that gets icon-only buttons right**" (H:541) | H | — | 4.1.2 | This is TEA UI's `IconButton` contract. |
| Z14 | **Keep:** LUTEA has `role="alert"` (2), `aria-pressed` on all toggles (`company-list.tsx:177,245,327`, `settings-panel.tsx:223`), `aria-labelledby` on landmark sections (`overseer-dashboard.tsx:227,270`), `aria-hidden` on decorative layers, `aria-current="page"`, `aria-label` on both `nav`s, the one correct `htmlFor`/`id` pair (`login-form.tsx:53,57`), a retry affordance on failure, `autoComplete="current-password"`, and native `details`/`summary` FAQ (L:754-782) | L | — | — | These are the reference implementations. |

---

## 7. Anti-patterns to encode as lint rules / architectural bans

Every rule below has a precedent — a concrete site in one of the two repos where the pattern was found. **Rules marked `[P0]` are what make the token layer enforceable; without them §8.2 cannot hold.**

| # | Ban | Evidence it must be banned | Enforcement |
|---|---|---|---|
| 1 | **`focus:` on any interactive element — use `focus-visible:`** | HSM: 4 controls (`select.tsx:22`, `dialog.tsx:47`, `toast.tsx:63,78`) (H:596-597). LUTEA: `focus:outline-none` with no replacement (`dialog.tsx:44`, `toast.tsx:46`) (L:825-826) | `eslint-plugin-tailwindcss` `no-restricted-syntax`; fail build |
| 2 | **`outline-none` without a replacement ring in the same rule** | `kit/dialog.tsx:44`, `kit/toast.tsx:46` (L:825-826) | custom AST rule: `outline-none` requires `focus-visible:ring` or `focus-visible:outline` |
| 3 | **`rounded-md` / `rounded-lg` / `rounded-xl` outside a semantic allowlist** | HSM: 7 `rounded-md` + 4 `rounded-sm` sites breaking the zero-radius convention (H:117); `PanelHeader`'s `rounded-md` across 8 sites (H:297); `DirtyBadge`'s `rounded` (H:305). LUTEA: overrode the copy precisely to enforce the rule (`switch.tsx:9`, L:140) | `no-restricted-syntax` with a 5-entry allowlist (`pill`, switch-thumb, dot, progress, avatar) — **`DECISION REQUIRED` on the allowlist** (§3) |
| 4 | **Raw hex in any component** — including `text-[#…]`, `bg-[#…]`, `shadow-[…rgba(…)]` | HSM: 4 chart hexes (`Monitoring.tsx:20-22`), `#334155` / `#64748b` (`Chart.tsx:66,68,97`), `#0a0a0c` ×3, `#e6edf7`, `#9aa7bd`, `#0a0e1a`, `#1a2332`, `#1e293b`, 2 `rgba()` editor styles (H:128, H:229, H:616-617). LUTEA: 4 score hexes duplicating `STATUS_COLORS` (L:448), `#111318` hard-coded in `crm-status-badge.tsx:48` (L:253) | `no-restricted-syntax`; exception: the token layer itself, and generated-HTML files with an allowlist |
| 5 | **A raw `rgba()`/`#hex` in a `shadow-[…]`** — use one of exactly three elevation tokens | HSM: 4 offset magnitudes for one concept (H:139-153); LUTEA: 3 + a `shadow-xl` outlier (L:156) | `no-restricted-syntax` on `shadow-\[` |
| 6 | **Two greens for "success"** — one token, one meaning | HSM: `bg-accent/10` (5×), `bg-emerald-500/10` (2×), `bg-green-900/40` (1×) (H:123-126); 7 dot colours for one "online" semantic (H:288). LUTEA: `#4CAF6D` in 2 sites plus `status.customer` (L:116, L:448) | lint: `emerald|green|teal|accent` in a success context; enforced by the `statusMeta` registry instead |
| 7 | **`text-red-300` / `text-red-200` instead of the destructive token** | HSM: `text-red-300` 23× across 12 files **and** `text-destructive`, "the two never agree" (H:125). LUTEA: `text-red-300` 6×, `text-red-200` 2× in banners (L:413) | `no-restricted-syntax` on `text-red-`; a `destructive-foreground` token is the only legal foreground |
| 8 | **A `div` inside a `p` / `span` — `Badge` renders a `span`** | `kit/badge.tsx:32` used inside `Websites.tsx:381-389`, `GameServers.tsx:396-401`, `GameServerDetail.tsx:326-332` (H:240) | `a11y` lint: `no-redundant-roles` + a component-level assertion in the test suite |
| 9 | **An animation utility whose keyframes are not loaded** | HSM: `tw-animate-css` installed, never imported → 5 components with dead `animate-in` (H:41, H:197, H:821). LUTEA: dead toast animations because no `data-state` is emitted (L:1056-1062) | **build-time smoke test:** render one `Dialog`, one `Toast` and assert the computed `animation-name` is not `none`. This is the only rule that catches a missing CSS import. |
| 10 | **`dark:` utilities in a project with no light theme** | HSM: 2 occurrences in `kit/button.tsx:6`, both dead because no `.dark` class is ever applied (H:108) | banned until TEA UI ships a second theme (§8.3) |
| 11 | **`z-[9999]` and any ad-hoc `z-[N]`** | LUTEA: `z-[9999]` vs a dead `z-[100]` (L:206, L:1163). HSM: `z-[60]`, `z-[70]`, `z-[900]`, `z-[1000]`, `z-[1001]` (H:170-182) | `no-restricted-syntax`; only the named scale's 6 steps are legal |
| 12 | **`role="alert"` missing on an error banner** | HSM: 31 banners, 0 `role="alert"` (H:578). LUTEA: 9 banners, 2 with it (L:413) | structural — `Alert` always emits it; a raw banner is a lint error |
| 13 | **A `label` without `htmlFor` (or without a nested control)** | HSM: **0 `htmlFor` in the entire frontend**, 30+ fields (H:554-562). LUTEA: 11 unassociated labels (L:790-800) | `jsx-a11y/label-has-associated-control`; `Field` makes compliance structural |
| 14 | **`aria-invalid` / `aria-describedby` never set on an invalid field** | HSM: 0 `aria-describedby`; 5 `aria-invalid`, all dead style hooks (H:586-587). LUTEA: `Input` has it, `Textarea` does not (L:258) | `Field` sets both; a consumer cannot bypass it |
| 15 | **An interactive element whose only name is a `Tooltip` or a `title`** | `App.tsx:298-351` — "a `describedby` is not a `name`" (H:568); `LoadingScreenMakerDialog.tsx:428,435` (H:570); `color-picker.tsx:190-207` (H:573) | `jsx-a11y` + a custom rule: icon-only ⇒ `aria-label` required |
| 16 | **`onClick` on a non-interactive element** (`div`, `span`, `tr`, `Card`) | HSM: 8 primary nav targets (H:589-592). LUTEA: `TableRow onClick` (L:832-834) | `jsx-a11y/no-static-element-interactions` + `click-events-have-key-events` + `no-noninteractive-element-interactions`, all error |
| 17 | **A live region that does not exist** — no `aria-live` / `role="status"` on asynchronous state | HSM: 0 `aria-live`, 0 `role="alert"` (H:578). LUTEA: 0 of either repo-wide (L:812) | `Alert` and `Loading` own it; a raw async state update is a review-blocker |
| 18 | **An animation without a `prefers-reduced-motion` escape** | HSM: 0 occurrences across 13 spinners + pulses + `transition-all` (H:604-610). LUTEA: 0 repo-wide (L:225) | `stylelint` / CSS rule: every `animation` / `transition` in the library must be inside a `@media (prefers-reduced-motion: no-preference)` block or paired with `motion-reduce:` |
| 19 | **`focus:ring` on a non-focusable element** | `kit/badge.tsx:7` — never fires (H:208) | `jsx-a11y/no-noninteractive-tabindex` + a component test asserting the element is not focusable |
| 20 | **A `Text`-only status** — colour-only or dot-only | `website-check/page.tsx:110-114` (icon + colour, no text) vs `auditor-client.tsx:164-166` (adds `OK` / `PROBLEM`) — "the two audit UIs disagree on accessibility" (L:849). HSM: `Monitoring.tsx:56-60` and `Notifications.tsx:119-123` are dot-only (H:288) | `StatusDot` is `aria-hidden` and always beside text — structural |
| 21 | **Unencoded / double-encoded UTF-8 in any user-facing string** | HSM: 12 user-visible strings in `FileManager.tsx` (lines 62, 102, 172, 206, 226, 240, 246, 292, 301, 311, 312, 320, 325, 335) and `api.ts:1276, 1280`, **verified at byte level** (H:471). LUTEA: `und我们把das CRM` (`crm-page-client.tsx:299`), `Gebäude-Precrição` (`settings-panel.tsx:249`), `WBÖhe` (`settings-overlay.tsx:13`) (L:1140) | `.editorconfig` `charset = utf-8` + a CI grep for the `â€` / `Ã¤` / non-Latin-script signature. HSM's conclusion: this guard is needed **before** any extraction, or the corruption moves with the strings (H:887) |
| 22 | **A German string that is not German** | `kit/dialog.tsx:49` `"Close"` (H:245); `FileBrowser.tsx:309` English breadcrumb root (H:267); HSM's `"IPC-Fehler: "` — wrong about the transport (H:468); LUTEA's `opportunity` — the only untranslated CRM label (L:627) | i18n: one `de` message catalogue; no inline user-facing literals in library code |
| 23 | **Mixed `du` / `Sie` register, or `…` vs `...` vs ` ...`** | HSM: `SetupWizard.tsx:11,178,207` in *Sie* (H:920); `Settings.tsx:520,633,722,726` — `"Speichere."` / `"Verbinde."` / `"Trenne."`, a full stop where an ellipsis belongs (H:532). LUTEA: `agentur:26` *Sie* vs the rest *du* (L:543); `overseer-dashboard.tsx:156` `"Overseer wird geladen ..."` with a space (L:1131) | copy-deck lint: one register, ellipsis is always `…` with no space |
| 24 | **An `as any` that defeats a type guard** | HSM: `DynamicDns.tsx:209,223,237` silences a real type error (H:416). LUTEA: `crm-page-client.tsx:122` `status={c.crm_status as any}` defeats the `isCrmStatus` guard that exists for exactly this (`status.ts:36`) (L:1027, L:1141) | `@typescript-eslint/no-explicit-any` as an **error**; a status wire value is typed, not cast |
| 25 | **A Tailwind v4 utility in a v3 project** (silent no-op) | LUTEA: `max-h-(--…)`, `origin-(--…)`, `h-(--…)`, `min-w-(--…)` (`select.tsx:72,85`) (L:263, L:1161). HSM: `max-h-[--radix-…]` missing `var()` (`select.tsx:78`) (H:903) | `no-restricted-syntax` on the `-(` and `[--` forms not valid in the declared Tailwind major; plus a build assertion on emitted CSS for a canary class |
| 26 | **A `!`-prefixed override inside library code** | HSM: `color-picker.tsx:197,263`, `LoadingScreenEditor.tsx:1586,1647,1660` — used "where a variant would be correct" (H:741) | `no-restricted-syntax`; `!` is banned in `@tea-ui/*`, allowed in apps |
| 27 | **`className` merged positionally instead of injected into `cva`** | HSM: `Button` injects into cva (`button.tsx:51`); `Badge` does not (`badge.tsx:32`) (H:740) | library review rule: every primitive passes `className` into its `cva` call |
| 28 | **`data-slot` missing, or referenced with no producer** | HSM: 1 of 20 has it, and its two consumers (`has-data-[icon=inline-end]`, `in-data-[slot=button-group]`) have **no producer** (H:789, H:904). LUTEA: 3 of 20 (L:1020) | a component test per primitive asserting `data-slot`; plus a dead-selector detector for `data-[slot=…]` with no matching component |
| 29 | **A module-level mutable singleton in a library** | HSM: `use-toast.ts` `memoryState` + `listeners` + `toastTimeouts` + `count` (H:278, H:859). LUTEA: `use-toast.ts:12-13` `listeners` / `toasts` (L:1064) — "breaks under SSR and parallel renders" | banned; TEA UI uses a React context store |
| 30 | **No lint and no test in a project that ships a shared library** | HSM: no eslint / prettier / biome / stylelint / editorconfig in `git ls-files`; no test runner; 12 000 lines of UI incl. a 2165-line editor with a hand-rolled undo stack (H:55-56, H:872-873). LUTEA: `next.config.ts:5` sets `eslint.ignoreDuringBuilds: true` **while eslint is not installed**; 0 test files (L:52, L:54, L:1086, L:1155). L §11.5.3: *"a single `eslint` + `eslint-plugin-tailwindcss` + `stylelint` setup would have caught items 1, 4, 15, 16, 23, 27, 28 and the whole of §4.9"* (L:1214) | **non-negotiable gate.** Rules 1-29 have no other enforcement |
| 31 | **A dev tool in `dependencies`** | HSM: `shadcn@4.21.0` in `dependencies`, so every consumer's `npm audit` reports it (H:820). LUTEA: `lighthouse`, `playwright-core`, `osm-pbf` in `dependencies` (L:47-49) | `dependency-cruiser` / `import/no-extraneous-dependencies` |
| 32 | **A component that ships but is imported nowhere** | HSM: `avatar.tsx`, `skeleton.tsx`, `@radix-ui/react-slot`, `SetupWizard.tsx` (275 L), `ServiceManager.tsx` (182 L), `tw-animate-css`, geist, nunito, lilita-one (H:427-436). LUTEA: 8 unused Radix packages, `DashboardClient`, `DashboardNav`, `FinderClient`, `CardFooter`, `ToastViewport`, `#root` (L:1073, L:1177-1196) | `knip` / `ts-prune` in CI: an unreferenced export is a **failure** in a published library, not a warning |
| 33 | **A control that ships with no `loading` convention** | HSM: **no kit component accepts `loading`** (H:755); 13 hand-written `RefreshCw` swaps; 12 different busy prop names across the app (`loading`, `busy`, `busyId`, `actionLoading`, `creating`, `saving`, `updating`, `testing`, `restarting`, `reinstalling`, `deploying`, `opBusy`, `editorBusy`, `uploading`) (H:754) | `Button loading` is the only path; per-item state uses `<id>Loading` or a `Set<string>` (H:757) |
| 34 | **`"use client"` applied to only half the client-only files** | HSM: present in 14, absent in 8 equally client-only kit files (H:804). LUTEA: missing on `dropdown-menu.tsx` despite a `Portal` (L:256) | rule: the directive appears iff a handler, hook, or portal is present (L:1039) |
| 35 | **No ref forwarding on a primitive** | HSM: `badge`, `skeleton`, `confirm-dialog` (H:796). LUTEA: `Badge`, 6 `Card` parts, `CrmStatusBadge`, 5 `Table` parts, 3 `Toast` parts (L:1021) | a component test per primitive asserting a forwarded ref reaches the DOM node |
| 36 | **`tone` and `variant` used for the same concept** | LUTEA: `variant` in `Button`/`Badge`/`Toast`, **`tone`** in `CrmStatusBadge:29`; `solid` (a visual) collides with `success` (a semantic) in one namespace (L:1018-1019). HSM: ad-hoc booleans `destructive`, `on`, `transparent`, `show`, `pressed` alongside `variant` (H:748) | `variant` only; every variant set derived from `VariantProps<typeof xVariants>` (H:751) |
| 37 | **A German label table per page** | HSM: 5 tables (H:296). LUTEA: `projects-client.tsx:48-54` and `portal-client.tsx:7-11` are the **same 9-state lifecycle**, duplicated (L:934); `STATUS_LABELS` also drifts from `CRM_STATUSES` | one registry; a new status wire value without a label is a **type error** |
| 38 | **A control that lies** | LUTEA: `scoreWeights` UI writes weights `score.ts:22-49` hardcodes (L:958, L:1143); `STATE_LABELS` declares a `rejected` state with no reject action (L:642); `README.md:63` claims MapLibre, not installed (L:959); `data-ok` is not a real attribute (L:607, L:1148) | review rule: a control whose state cannot be produced by any handler does not ship |
| 39 | **A `docs/` claim the code does not support** | HSM: `ANLEITUNG_SHADCN_MIGRATION.md` points at `components/ui/*` and names `text-mlhsm-gold` / `text-mlhsm-olive`, **neither of which exists** (H:80); `components.json` `ui` alias points at a folder that does not exist (H:906) | docs link-check + a token-existence test on every token name in prose |
| 40 | **A mock/story fixture in either project** | HSM: `Caddy.tsx:5-6`, `Docker.tsx:6-7`, `Monitoring.tsx:3-4` and `api.ts:1-6` all state in comments that **nothing is faked** (H:921) | TEA UI ships primitives only — no storybook data layer. A fixture framework is an app decision, and HSM's "real-data discipline" is an explicit project rule that a mock-heavy design system would work against (H:921) |

---

## 8. Design decision input for TEA UI architecture

Seven decisions, each constrained by specific findings. `DECISION REQUIRED` marks the ones neither audit settles.

### 8.1 Token architecture

**Constraint set:**
1. 16 of 18 tokens are already byte-identical across both repos (§2.1) — so the token *set* is settled; only the *mechanism* is not.
2. **There are no CSS custom properties for colour anywhere.** HSM sets `components.json` `cssVariables: false` and keeps hex in `tailwind.config.js` (H:90). LUTEA has **zero** `var(--…)` matches in the whole source tree (L:78). Its `:root` contains only three dead `--radius-*` values (L:68-76).
3. Two symptoms of the missing layer, one in each repo: HSM's `.bg-card { background-color: #171a21 }` hand-written duplicate (H:221) and LUTEA's `.bg-card` override which "wins on source order, hardcodes the value, blocks theming, and is a latent cascade bug" (L:128).
4. Both are dark-only, so **no token currently has a light counterpart to test against** (H:108, L:60).
5. `darkMode: "class"` is configured in both and **never meaningfully used** — HSM never applies a `.dark` class (H:108), LUTEA hardcodes it and its own audit calls the strategy and the class "both decorative" (L:60).
6. HSM's `rounded-full` in `kit/avatar.tsx:15` and `ring` = `accent` = `#F2C012` = `::selection` are the two clearest consequences of tokens-as-hex-without-a-name (H:239, H:600).

**Decision.** Tokens are **CSS custom properties in one stylesheet**, named by role, referenced from one Tailwind config, shipped once as `@tea-ui/tokens`. The `tea` reference theme is the LUTEA reading of the palette (because `primary` = `accent` = `ring` = gold is the *collapsed* case — §3); `hsm` and `lutea` are thin overrides that may only change role values, never add raw hex. `DECISION REQUIRED`: whether `ring` gets a value distinct from `accent` — H §6 G8 says the collision is an AA focus-visibility failure (H:600), and this document recommends it does, but the audits do not choose a replacement hue.

### 8.2 Theme count and whether to add a light theme

**Constraint set:**
1. Both repos are **single-theme** and say so explicitly (H:108, L:60).
2. Both nevertheless ship a two-theme **API surface**: `darkMode: "class"` and `<html className="dark">` (H:108, L:60).
3. **Two dead `dark:` utilities** in HSM (`kit/button.tsx:6`) that can never fire (H:108) — the cost of the phantom API, already paid.
4. **Contrast was only ever computed against the dark tokens** (H:612-628, L:857-866). No light palette exists to fail.
5. L §8.2: *"If the shared system ever needs a light mode, the **public** site is the only surface that should get it — but that is a product decision, not a component. Do not abstract a 'marketing theme' until one exists."* (L:997)
6. H §10.1.2 makes the *token strategy* the decision to make first, and ties it to the light-mode question (H:911).

**Decision.** **Ship exactly one theme — dark — and remove the phantom API.** Do not ship `darkMode: "class"` and do not ship a light theme, because no audit evidences a light-theme requirement and a second untested theme is a second untested palette. `DECISION REQUIRED`: if a light theme is required later, it is a **new reference theme with its own contrast audit**, not a derived one — the entire contrast register in §6.7 would have to be re-measured. Rule 10 (`dark:` banned) is the enforcement.

### 8.3 Primitive library choice

**Constraint set:**
1. HSM is **Base UI for `Button`, Radix for the other 19** (H:23, H:241) — H §10.1.1 names this "mixed-idiom smell" and says "Pick one before publishing, or document the split" (H:882).
2. LUTEA is **Radix throughout**, with `Button` on `@radix-ui/react-slot` + `asChild` (L:24, L:251) — and its audit calls that Button "**the reference implementation for the whole kit**" (L:251).
3. HSM's `Button` has the better **size matrix** (8 sizes including a 4-step icon scale, H:241); LUTEA's has icon auto-sizing `[&_svg:not([class*='size-'])]:size-4` and `select-none` (L:251). **Take both.**
4. **8 of LUTEA's 11 Radix packages resolve to zero imported call sites** (L:26-33, L:1073) — a shared library's install cost is paid by every consumer (L:1113).
5. HSM carries **dead dependencies** with the same character: `@radix-ui/react-slot` and `@radix-ui/react-avatar` imported nowhere, `tw-animate-css` installed and never imported, three font packages never imported (H:427-436).
6. **Both kits' Radix wrappers are mostly correct**: HSM §7 marks `DropdownMenu`, `Switch`, `Tabs`, `Tooltip`, `ConfirmDialog`, `ScrollArea` REUSE (H:660-669); LUTEA §7.1 marks `Label`, `Separator`, `Skeleton`, `Switch`, `Tabs`, `Tooltip`, `Button`, `Badge`, `Input`, `ConfirmDialog` REUSE (L:894-910).
7. Both carry the same set of wrapper-level defects that a shared library must not inherit: English `Close` (H:245), `focus:` not `focus-visible:` (H:246), item-focus colour mismatch between `Select` and `DropdownMenu` (H:246), no `aria-invalid` on `Textarea` (L:258), `focus:outline-none` with no ring (L:825), `decorative` defaulting to `true` (H:251, L:264).

**Decision.** **Radix only; drop `@base-ui/react`.** Ship the union of the 20+20 kit files, de-duplicated, with the wrapper defects above fixed at source. Peer-dependency budget: **only the Radix packages with a real consumer** — which directly resolves the "8 unused packages" problem and gives the install-cost rule a concrete number. `Button` is the reference implementation; `ConfirmDialog` + `useConfirm` is the second (H:666, L:910).

### 8.4 The status → tone model

**Constraint set:**
1. **HSM has no status colour scale at all** — 7 colours for one "online" semantic across 15 sites, 3 sizes, 4 pages using emoji (H:288).
2. **LUTEA has two, one broken and neither used** (L:121), with the `archived` badge at **~1.1:1** (L:865) and a key mismatch making the whole scale unreachable (L:1127).
3. Both paint status **off the primary scale** — `bg-accent` in HSM, `variant="default"` = gold in LUTEA (H:288, L:642). L §5.7's verdict: *"Status colours are not a system — they are recycled from the primary scale."* (L:642)
4. HSM: **5 hand-written label tables** for 5 shared wire unions, and **no two agree on the German wording** (H:296).
5. LUTEA: **7 implementations + `FEHLT`**, 3 of 4 sharing one active recipe, one using `border-accent` only (L:369).
6. HSM's score bands disagree by 5 points for the same value across two pages (L:443-448) — thresholds duplicated as raw hex.
7. `role` usage in HSM is 3 occurrences; 3 progress bars have **no `role="progressbar"`, no `aria-valuenow`** (H:594).

**Decision.** One `statusMeta` registry, keyed by the **wire value** (types already exist in both repos: HSM's are in `api.ts:173-179, 277-283, 976-981, 1019`, LUTEA's in `lib/status.ts:1-10`; H:360), returning `{ label, tone, description }`. `tone` is a closed enum of **five** values — `positive | info | caution | critical | neutral` — each mapped to a **status-specific** token, never to `accent` or `primary`. A new wire value without a label is a **type error** (rule 37). `StatusBadge` (read-only) and `StatusSelect` (interactive) are the only two renderers. The German label table is §5.22. `DECISION REQUIRED`: the `opportunity` label (L:627 offers "Chance / Interesse / Lead" without choosing) and the score thresholds (L:1208 flags the 40-vs-45 divergence as possibly intentional).

### 8.5 Density model

**Constraint set:**
1. **HSM's kit exposes no density axis.** `Input` is hard-coded `h-10` with no `size` prop, so **12 sites hand-roll `h-8` / `h-9`** (H:158, H:247). HSM's own audit: "the kit exposes no `size` on `Input`" and every compact field "overrides the kit's height" (H:158).
2. **LUTEA's is a real, documented step down**: `Button h-8` default, `Input h-8`, `SelectTrigger h-8` — with the reason written in the file: *"Trigger auf h-8 (Dashboard-Informationsdichte statt h-10 Form-Dichte)"* (L:167). Its `TableHead` is `h-9` (L:267) against HSM's `h-12` (H:254).
3. Both have **no density variables at all** (H:156, L:236) — the scale lives in component code.
4. **Type size is the other half**: LUTEA's `text-[11px]` is "the dominant label size" (L:178); HSM uses **9 px and 10 px for real UI text** across 16 sites (H:166), and L flags 10-11 px as a legibility problem even where it passes (L:866).
5. Both have **no spacing scale** — `space-y-6` is hand-written 20 times in HSM (H:156) and `mt-10 grid gap-4 …` 7 times in LUTEA (L:314).
6. HSM's escapes are fighting its own kit: the action chips all pair a padding with `h-auto` to escape `h-8` (H:346), and the migration guide documents this as a "stolperstein" (H:346).

**Decision.** **LUTEA's density is canonical** — `md = h-8`. TEA UI ships `size` (`xs | sm | md | lg | xl`) on every control, plus a `density` prop on `Card` (`compact p-3` / `default p-4` / `comfortable p-6`, L:345), plus a `Page` layout primitive with `space-y-6` and a `CardGrid`. **The 10 px type step is deleted**; `Eyebrow` is `text-[11px]` (rule, C8). HSM's 12 override sites become `size="sm"`; HSM's `h-10` inputs become `size="lg"`.

### 8.6 Reference-theme fidelity requirements for `hsm` and `lutea`

**What a consumer must be able to reproduce exactly, from each repo's own evidence:**

| Requirement | Source | HSM | LUTEA |
|---|---|---|---|
| The 18 role tokens, verbatim | H:92-107, L:87-117 | as today | as today |
| Square identity: every radius `0`, `rounded-full` only for pill/dot/progress/scroll/avatar | H:110-117, L:140-141 | 182 `rounded-none` sites resolve unchanged | 19 kit sites resolve unchanged |
| Three elevation tokens, `4 / 6 / 8 px`, zero-blur, `rgba(0,0,0,0.5)` | H:139-153, L:149-156 | dialog 8px, popover 6px, tooltip 4px all preserved | same |
| `sans` = Jost Variable, `mono` = JetBrains Mono, `display` = Lilita One | H:161, L:188-190 | `display` unused — no change | `display` drives the marketing `h1` (L:518) |
| Focus ring: `focus-visible:` only, `ring-offset-background`, `ring-3` on `Button` / `Input` | H:204, L:230 | all 8 divergent recipes collapse to one | all 5 collapse to one |
| Card: `rounded-none`, `shadow-none`, real heading, `density` | H:242, L:252 | 6 pages already on the kit | 20 raw divs migrate |
| Table: `h-9` head, `px-4 py-3`, `p-4` cells, `overflow-x-auto` | H:254, L:267 | 8 raw tables migrate to `px-4 py-3` — **which is what they already use** (H:356) | 1 consumer gains a wrapper |
| German copy deck: one register, `…` with no space, real umlauts | H:530, L:625, L:1131 | `…` already consistent 64× (H:477) | `" ... "` drift fixed (L:1131) |
| `bg-accent/15 text-accent` action-chip family | H:326 | 40 sites become variants | n/a |
| `bg-accent/10 border border-accent/40 text-accent` success banner | H:294 | becomes `Alert variant="success"` | n/a |
| `flex size-10 … bg-accent text-accent-foreground` icon tile | L:460 | n/a | 5 sites become `IconTile` |
| `text-[11px] font-semibold uppercase tracking-wider` micro-label | L:419 | becomes the shared `Eyebrow` | 20 sites become `Eyebrow` |
| `min-h-[69px]` shell header | L:312, L:564 | HSM's equivalent is the magic number `min-h-[69.5px]` (`App.tsx:381`, H:299) | becomes a `ShellHeader` token, written once |

**Fidelity rule.** A `hsm` or `lutea` theme may change **role values and density steps only**. It may not add a role, rename a role, or introduce a raw hex — that is what makes the two `.bg-card` overrides (H:221, L:128) and the dead `status.*` scale (L:1127) impossible to reproduce.

### 8.7 What TEA UI is, in one paragraph

**`@tea-ui/tokens`** (role tokens as CSS custom properties, one dark reference theme, `hsm` / `lutea` as thin overrides) + **`@tea-ui/utils`** (one `cn`, `cva`, `formatBytes`, `hexToHsv` / `hsvToHex`) + **`@tea-ui/primitives`** (Radix-only; `Button` with `loading` and 8 sizes, `Card` with `density` and a real `CardTitle`, `Input` / `Textarea` / `Switch` / `Select` / `Checkbox` / `Tabs` / `Dialog` / `Drawer` / `DropdownMenu` / `Tooltip` / `Toast` / `ConfirmDialog` / `Table` / `Separator` / `ScrollArea` / `Label` / `Badge` / `Eyebrow` / `Skeleton` / `Alert`) + **`@tea-ui/composites`** (`Field`, `StatusBadge` + `StatusSelect` + `statusMeta`, `StatusDot`, `EmptyState` + `TableEmptyRow`, `Loading`, `Meter`, `SearchInput`, `SecretInput`, `RefreshButton`, `RowActions`, `StatTile`, `Score`, `IconTile`, `PanelHeader`, `PageHeader`, `Nav`, `CardGrid`, `Pagination`, `Kbd`, `CodeBlock`) + **`@tea-ui/marketing`** (`Logo`, `FeatureCard`, `Hero`, `PublicPageHeader`) + **`@tea-ui/data`** (`Chart`, `DataTable`) + **`@tea-ui/react`** (`usePolling`, `useNotifier`). **Not** built: `Avatar`, `ColorPicker` (the widget), `HoverCard`, `TableOfContents`, a second marketing theme, an animation library, a CMS section renderer, a generic responsive nav, and anything project-specific. HSM's "real-data discipline" (H:921) means **no storybook data layer** (rule 40).

---

*Synthesis layer only. No source repository was read, and no file other than this one was created or modified. Every claim above cites HSM-AUDIT.md, LUTEA-AUDIT.md, or both; items that neither audit settles are marked `DECISION REQUIRED` and carry no claim of evidence.*




