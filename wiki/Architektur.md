# Architektur

## Der Paketgraph

Abhängigkeiten zeigen **nur nach unten**. `@tea-ui/core` kennt nicht, dass
`@tea-ui/admin` existiert. Wer eine Ebene braucht, geht eine Ebene nach oben —
und `npm run check:boundaries` schlägt fehl, wenn jemand das umkehrt.

```text
utils ──▶ tokens ──▶ ux-standards
                 │            │
                 ▼            ▼
              icons ──────▶ core ──────▶ admin ──────▶ patterns ──────▶ templates ──────▶ blueprints
                             └────────▶ public ────────┘         specialized (schwer, opt-in)
```

| Paket | Rolle |
|---|---|
| `@tea-ui/utils` | `cn`, `cva`, `tea-`-Präfix, Exhaustiveness-Checks |
| `@tea-ui/tokens` | Semantische Rollen, drei Themes, Dichte, Bewegung, Breakpoints, Schriften |
| `@tea-ui/ux-standards` | Statusregister, Töne, Zustandsmodell, Destruktivitäts-Matrix, Terminologie |
| `@tea-ui/icons` | Kuratierte Icon-Menge statt der 1600er-Bibliothek |
| `@tea-ui/core` | Der produktabhängigkeitsfreie Primitive-Layer |
| `@tea-ui/admin` | Informationsdichte: Shell, Metriken, Produktzustände |
| `@tea-ui/public` | Marketing, Website-Chrome, Content, Conversion |
| `@tea-ui/patterns` | Interaktionsverträge (Kompositionen ausstehend) |
| `@tea-ui/templates` | Seitenverträge (Kompositionen ausstehend) |
| `@tea-ui/blueprints` | Feature-Verträge: Auth, Billing, Monitoring (Kompositionen ausstehend) |
| `@tea-ui/specialized` | Scope-Registry für Charts, Bäume, Diff (Komponenten ausstehend) |

## Warum genau ein Stylesheet

Ein Theme, ein Bündel, keine Cascade-Reihenfolge zu raten.

- Jedes Paket exportiert dieselbe Datei als `<pkg>/styles.css`, also importiert
  ein Produkt sie genau einmal.
- Keine Komponente kann CSS ausliefern, das vom System abweicht.
- Tailwind emittiert eine Utility nur, wenn sie im Quelltext vorkommt — die Datei
  enthält also ausschließlich Klassen, die TEA UI tatsächlich benutzt.

Der Preis: ein Produkt, das nur `@tea-ui/core` benutzt, lädt auch das CSS der
Admin-Komponenten. Das ist ein bewusster, gemessener Handel — **ein** Stylesheet
ohne Duplikate schlägt vier ineinandergreifende Stylesheets. `npm run check:tree`
misst beide Hälften.

## Tree-Shaking, gemessen

`sideEffects: false` in einem Manifest ist eine Behauptung. `npm run check:tree`
macht daraus eine Messung, indem drei winzige Einstiegspunkte gebündelt und
verglichen werden.

Der Befund war unbequem: **eine einzelne Komponente behielt 93,4 % des Pakets.**
Ursache war nicht `sideEffects`, sondern das Bundling selbst — es zog alle
Komponenten in ein Modul, dessen obere Ebene dutzende `createContext()`-Aufrufe
enthielt. Seiteneffekte, die ein Bundler nicht fallen lassen darf.

`bundle: false` in der gemeinsamen Build-Konfiguration behält den Modulgraphen.
Jede Komponente ist eine eigene Datei, jede Datei ist oben inert, und derselbe
Import schüttelt auf das Nötige herunter: **13,2 %**.

## Drei weitere Entscheidungen, die man nicht erraten sollte

**Hash-Routing.** Die Apps brauchen keine Rewrite-Regeln und kein `404.html`.
Der Server liefert genau eine Datei, alle Routen liegen im Fragment.

**`.nojekyll`.** GitHub Pages betreibt standardmäßig Jekyll, und Jekyll ignoriert
Pfade, die mit `_` beginnen. Dort landen genau die geteilten Chunks von Vite. Ohne
die Datei liefert ein Deploy 404 auf exakt den Dateien, die der Bundler zum
Teilen ausgewählt hat.

**Dunkel, absichtlich.** Beide Quellprodukte waren Dark-only und beworbenen eine
Light-Strategie, die nie angewendet wurde. Eine zweite, ungetestete Palette ist
eine zweite, ungetestete Palette. Die Token-Architektur ist farbschema-fähig; ein
Light-Theme ist ein *neues* Referenztheme mit eigenem Kontrast-Audit.

## Versionierung

Öffentliche APIs sind Verträge.

- Ein Bruch braucht eine Major-Version, eine Migrationsnotiz und einen
  Changelog-Eintrag. Nie eine stille Änderung.
- Jede Änderung bekommt einen Changeset mit Begründung.
- Der Release entsteht aus einem gemergten Changeset, nie aus einem manuellen
  Schritt. Ein leerer Versions-Commit ist Rauschen in jedem Changelog der
  Welt.

## Verzeichnisse

```text
packages/       die Bibliothek, ein Paket pro Grenze
apps/           showcase/ und docs/
skills/tea-ui/  die OpenCode-Skill
wiki/           der Inhalt, der ins GitHub-Wiki publiziert wird
docs/audit/     die HSM- und LUTEA-Audits und ihre Zusammenführung
docs/architecture/COMPONENT-CONTRACT.md   wie eine TEA-UI-Komponente entsteht
scripts/        die Prüfskripte, die CI ausführt
```

## Weiter

- [[Komponenten]] — was es gibt
- [[UX-Standards]] — warum es so gebaut ist
- [[Deployment]] — wie es ausgeliefert wird
