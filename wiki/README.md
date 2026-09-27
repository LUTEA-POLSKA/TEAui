# TEA UI — Wiki

Dieses Wiki ist der menschliche Teil des Projekts. Der verbindliche Teil ist der
Code.

## Seiten

| Seite | Inhalt |
|---|---|
| [[Home]] | Überblick, die sechs Regeln, Schnellstart, gemessene Zahlen |
| [[Architektur]] | Paketgraph, ein Stylesheet, Tree-Shaking, Versionierung |
| [[UX-Standards]] | Töne, 17 Zustände, Fehleranatomie, Formulare, Navigation, Bewegung |
| [[Komponenten]] | Was es gibt, und die acht Regeln, die eine Komponente einhält |
| [[Themes]] | Die drei Referenz-Themes, Dichte, eigene Themes |
| [[Accessibility]] | Durchgesetzt, strukturell, geprüft — und was noch offen ist |
| [[Audit]] | Die Befunde aus HomeServerManager und LUTEA Design |
| [[Deployment]] | Pages, Vercel, statisches Hosting, npm |
| [[Beitragen]] | Wann was hinzukommt und wann nicht |
| [[OpenCode-Skill]] | Die Skill, die TEA UI zum Default für UI-Arbeit macht |

## Kurzregister

```text
Components → Patterns → Templates → Blueprints → Product UX → Design System → Docs → Workflow
```

## Die sechs Regeln, kurz

1. **Rollen, keine Farben.** Themes weisen Werte zu; Komponenten enthalten nie eine
   Farbe. `text-red-300` kompiliert nicht.
2. **Ein Status, ein Wort.** `statusMeta(domain, key)`. Zwei Renderer, kein
   eigener Text, keine eigene Farbe.
3. **Drei Dichten, ein Attribut.** `data-density` stellt jedes Control im
   Container um.
4. **Ladezustände ersetzen keinen Inhalt.** `refreshing`, `syncing`, `stale`,
   `retrying` bleiben über dem, was lesbar da ist.
5. **Schutz skaliert mit Konsequenz.** Undo, Dialog, oder Dialog plus getipptes
   Wort. Abbrechen ist nie der destruktive Button.
6. **Felder sind verdrahtet.** `Field` liefert `htmlFor`, `aria-describedby` und
   `aria-invalid`. Ein Feld ohne zugänglichen Namen ist nicht ausdrückbar.

## Wie dieses Wiki gepflegt wird

Der Inhalt liegt versioniert unter `wiki/` im Repository. Ein Skript schiebt ihn
ins Wiki, sobald das Wiki-Repository existiert:

```bash
node scripts/publish-wiki.mjs
```

Das ist Absicht: Wiki-Inhalt, der nur auf GitHub liegt, ist nicht versioniert und
steht bei einem Refactor nicht neben dem Code, den er beschreibt. Die Quelle der
Wahrheit ist das Repository; das Wiki ist die lesbare Oberfläche.

## Verwandt

- `docs/audit/` — die vollständigen Audits
- `docs/architecture/COMPONENT-CONTRACT.md` — der verbindliche Autorenvertrag
- `README.md` — der Einstieg für Entwickler
