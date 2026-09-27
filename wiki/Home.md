# TEA UI

**Build once. Generalize properly. Reuse everywhere.**

TEA UI ist die gemeinsame UI-, UX- und Designsystem-Plattform der TEA-Welt. Sie
ist die Grundlage für HomeServerManager, LUTEA, TEAflow, TEAhost und jedes
TEA-Produkt danach — damit eine UI-Entscheidung einmal getroffen wird und
jedes Produkt sie erbt.

```text
Components → Patterns → Templates → Blueprints → Product UX → Design System → Docs → Workflow
```

## Was TEA UI nicht ist

Es ist keine geteilte Kopie zweier Produkte. Es ist die Verallgemeinerung dessen,
was in beiden Produkten **identisch** war — plus das, was in beiden falsch war
und niemanden aufgefallen ist.

Die gesamte Entwurfsgrundlage ist ein Audit zweier realer Codebasen. Die drei
Dokumente unter `docs/audit/` liegen im Repository: zwei vollständige
Projekt-Audits und eine Zusammenführung, die die sieben offenen
Architektur-Entscheidungen auflöst. **Lies die Zusammenführung, bevor du eine
Architekturentscheidung vorschlägst.**

## Die sechs Regeln

**1. Rollen, keine Farben.** Ein Theme weist Werte semantischen Rollen zu
(`surface`, `fg-muted`, `critical`, `ring`). Eine Komponente enthält nie eine
Farbe. Die Tailwind-Farb-, Schriftgrößen-, Radius- und Schatten-Namespaces sind
**aus dem Build entfernt** — `text-red-300`, `text-[9px]` und `rounded-md`
kompilieren nicht.

**2. Ein Status, ein Wort.** `statusMeta("health", "degraded")` liefert
`{ label, tone, description }`. Ein Wire-Value ohne Label ist ein Typfehler. Es
gibt genau zwei Renderer: `StatusBadge` und `StatusDot`.

**3. Drei Dichten, ein Attribut.** `data-density="compact|default|comfortable"`
stellt jedes Control im Container um, über Custom Properties. Eine kompakte
Tabelle in einer komfortablen Seite — ohne dass einer den anderen kennt.

**4. Ladezustände ersetzen keinen Inhalt.** `refreshing`, `syncing`, `stale` und
`retrying` dürfen nie etwas überschreiben, was lesbar da ist. Beide
Quellprodukte haben bei jedem 5-Sekunden-Poll den ganzen Bereich durch einen
Spinner ersetzt.

**5. Schutz skaliert mit der Konsequenz.** `reversible` → Undo, ohne Frage.
`recoverable` → Bestätigungsdialog mit benannter Folge. `irreversible` →
Bestätigung **plus** getipptes Wort. Abbrechen ist nie der destruktive Button.

**6. Felder sind verdrahtet, nicht zusammengesetzt.** `Field` liefert `htmlFor`,
`aria-describedby` und `aria-invalid`. Ein Feld ohne zugänglichen Namen ist
strukturell nicht ausdrückbar.

## Schnellstart

```bash
npm install
npm run build:css
npm run build
npm run showcase:dev     # http://localhost:4173
npm run docs:dev         # http://localhost:4174
```

## In einem Produkt

```tsx
import { Button, Field, FieldError, FieldLabel, Input } from "@tea-ui/core";
import "@tea-ui/tokens/fonts.css";
import "@tea-ui/tokens/styles.css";
```

Zwei Stylesheet-Importe, eines pro Anliegen: die Schriften und das System. Es
gibt kein drittes Import, das man sich merken müsste.

## Gemessen, nicht behauptet

| | |
|---|---|
| eine importierte Komponente | **12,8 kB gzip** (13,2 % des Pakets) |
| das ganze Core-Paket | 97,1 kB gzip |
| ein Stylesheet für alles | 9,7 kB gzip |
| Tests | 74, inkl. WCAG-2.2-Kontrast-Audit aller drei Themes |
| Paketgrenzen | in CI geprüft, Abhängigkeiten zeigen nur nach unten |

`npm run verify` reproduziert jede Zahl.

## Seiten

- [[Architektur]] — Pakete, Tokens, Bundle, Versionierung
- [[UX-Standards]] — die Regeln, nach denen die Komponenten gebaut sind
- [[Komponenten]] — was es gibt und wie man es benutzt
- [[Themes]] — die drei Referenz-Themes und wie eigene entstehen
- [[Accessibility]] — WCAG 2.2 AA, wie es durchgesetzt wird
- [[Audit]] — was in HomeServerManager und LUTEA gefunden wurde
- [[Deployment]] — Pages, Vercel, statisches Hosting
- [[Beitragen]] — wann was hinzukommt und wann nicht
- [[OpenCode-Skill]] — die Skill, die TEA UI zum Default macht
