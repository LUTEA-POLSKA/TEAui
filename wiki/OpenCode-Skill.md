# OpenCode-Skill

`skills/tea-ui/SKILL.md` macht TEA UI zur Standardquelle für UI-Arbeit in jedem
TEA-Produkt. Sie liegt im Repository unter `skills/` und unter `.opencode/skills/`,
damit sie sowohl mit dem Repository als auch mit einer lokalen Installation
gefunden wird.

## Wofür sie da ist

Die Skill existiert, weil Wissen, das nur in einem Dokument steht, von einem
Agenten nicht angewendet wird. Die Regeln von TEA UI sind an zwei Stellen
kodiert: in der Bibliothek (Lint, Typen, CSS) und in dieser Skill. Die Bibliothek
prüft, was ein *Programm* falsch machen kann; die Skill sagt einem *Agenten*,
wonach er suchen muss, bevor er anfängt.

## Der Ablauf

**1. Suchen, bevor du baust.**

```bash
rg "export (const|function)" packages/*/src/index.ts*
rg "StatusBadge|DataTable|ConfirmDialog|useConfirm" packages/
rg -i "<dein Konzept>" packages/ux-standards/src docs/
```

Dann in dieser Reihenfolge nachsehen: `core` → `admin` → `public` → `patterns` →
`templates` → `blueprints` → `specialized` → `ux-standards`.

**2. Wenn nichts passt: verallgemeinern, nicht hinzufügen.** Vier Fragen, bevor
etwas Neues entsteht — siehe [[Beitragen]]. Diese vier Fragen stehen wortgleich in
der Skill, damit ein Agent sie nicht neu erfindet.

**3. Diese Dinge sind verboten.** Rohes Hex, feste Control-Höhen, `focus:` statt
`focus-visible:`, `rounded-md`, `shadow-lg`, `lucide-react` direkt, 9px- oder
10px-Text, ein Control ohne zugänglichen Namen, Anwendungslogik in einer
Komponente. Jeder Punkt steht dort **mit dem Audit-Befund, den er verhindert** —
nicht als Regel, sondern als Begründung.

**4. Zustände so rendern, wie die Standards es vorgeben.** Eine Tabelle, welche
Affordance zu welchem der siebzehn Zustände gehört. Und die Regel, die im Audit am
teuersten war: `refreshing`, `syncing`, `stale` und `retrying` ersetzen nie Inhalt.

**5. Jeder Status durch das Register.** Nie ein eigenes Wort, nie eine eigene
Farbe. Ein Wire-Value ohne Label ist ein Typfehler — das ist der Punkt.

**6. Destruktive Aktionen nach Konsequenz.** `reversible` → Undo.
`recoverable` → Dialog. `irreversible` → Dialog plus getipptes Wort. Abbrechen ist
nie der destruktive Button.

**7. Formulare mit `Field`.** Nie `htmlFor` und `aria-describedby` von Hand — das
ist genau die Klasse von Fehler, die den Audit viermal unter fünf Feldern gefunden
hat.

**8. Barrierefreiheit ist kein Review-Schritt.** Vor „fertig":

- [ ] jedes interaktive Element ist mit der Tastatur erreichbar und bedienbar
- [ ] Escape schließt jedes Overlay, Fokus kehrt an den Auslöser zurück
- [ ] jedes Icon-Only-Control hat einen zugänglichen Namen
- [ ] jedes Feld hat ein verknüpftes Label, Fehler sind verknüpft **und** angekündigt
- [ ] kein Zustand wird nur über Farbe transportiert
- [ ] es funktioniert bei `data-density="compact"` und unter 1024px

**9. Themen.** Themes weisen Werte zu, Komponenten ändern sich nicht. Eine Rolle
fehlt? Das ist eine TEA-UI-Änderung.

## Was nicht in der Skill steht

Absichtlich nicht: eine Liste jeder Komponente, eine API-Referenz, eine
Anleitung zum Debuggen. Die Skill verweist auf die Quellen, weil eine
Dokumentation, die eine zweite Kopie der Wahrheit ist, veraltet, sobald sich die
erste ändert. Die verbindlichen Listen stehen im Code, wo sie von einer
TypeScript- oder Lint-Regel geschützt sind.

## Weiter

- [[Komponenten]] — die APIs, die die Skill benutzt
- [[UX-Standards]] — die Regeln im Detail
- [[Beitragen]] — für Menschen statt für Agenten
