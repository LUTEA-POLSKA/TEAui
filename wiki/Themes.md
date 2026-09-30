# Themes

## Zwei Stylesheet-Importe, sonst nichts

```tsx
import "@tea-ui/tokens/fonts.css";
import "@tea-ui/tokens/styles.css";
```

Das eine importiert die drei Schriften, das andere das System. Ein drittes Import
gibt es nicht, das man sich merken müsste — Typografie ist ein Token, also gehört
sie in den Token-Layer und nicht in jede Anwendung. Beide Quellprodukte haben
ihre Schriften global per CSS-`@import` geladen, auf jeder Route, auch auf den
Marketing-Seiten, die kein Monospace-Zeichen rendern; eines davon lieferte ein
viertes Familienpaket aus, das nirgends verwendet wurde.

## Die drei Referenz-Themes

Ein Theme weist **Werte semantischen Rollen** zu. Keine Komponente ändert sich
zwischen Themes, und keine Komponente enthält eine Farbe.

| | `tea` (Default) | `pop` | `ton` |
|---|---|---|---|
| Leinwand | `#111318` | `#0b1220` | `#15130f` |
| Fläche | `#171a21` | `#111c33` | `#1e1b16` |
| Vordergrund | `#e8e6e0` | `#e8f0ff` | `#efe7d8` |
| Primär / Marke | Gold `#f2c012` | Blau `#4da6ff` | Orange `#d15600` |
| Warnton | `#fb923c` | `#ffca28` | `#c79810` |
| Standarddichte | `default` | `default` | `default` |

Die Unterschiede sind echte Entscheidungen, keine Schattierungen: Farbtemperatur,
Markenidentität und Standarddichte. Die Dichte ist **keine** Theme-Eigenschaft, sondern eine Produktentscheidung:
`--tea-density` steht in allen drei Referenzthemes auf `default`, und wer ein
kompaktes Dashboard baut, setzt `data-density="compact"` auf seinen Container.
Deshalb ist das hier auch die einzige Spalte, in der sich die drei Themas
nicht unterscheiden — sie unterscheiden sich in Farbtemperatur und Marke, und
das ist der Unterschied, der eine Entscheidung ist.

## Nur Dark, und zwar absichtlich

Die auditierten Quellprodukte waren Dark-only und hatten eine konfigurierte,
aber nie angewendete Light-Strategie. Ein Trap: ein Entwickler liest `darkMode: "class"`
und nimmt an, es gäbe ein helles Theme.

Eine zweite, ungetestete Palette ist eine zweite, ungetestete Palette. Die
Token-Architektur ist farbschema-fähig; ein Light-Theme ist ein **neues**
Referenztheme mit eigenem Kontrast-Audit, keine Ableitung.

## Themes anwenden

```tsx
<html data-theme="pop" data-density="compact">
```

Oder in Code:

```ts
import { applyTheme, applyDensity } from "@tea-ui/tokens";

applyTheme("pop");
applyDensity("compact");
```

Attribute statt Kontext, weil Attribute im DOM inspectierbar sind, SSR überleben
und es erlauben, einen einzelnen Bereich der Seite zu überschreiben, ohne einen
Re-Render auszulösen.

## Ein eigenes Theme bauen

1. `packages/tokens/src/themes.css` kopieren.
2. **Nur die Werte der Rollen ändern.** Keine Rolle hinzufügen, kein Hex in eine
   Komponente.
3. Eine Rolle fehlt? Das ist eine Änderung an TEA UI, nicht an deinem Theme.
4. `npm test` laufen lassen. Der Kontrast-Audit parst jede Theme-Datei und misst
   jedes dokumentierte Paar gegen WCAG 2.2 — ein Wert, der durchfällt, ist nicht
   auslieferbar, bis er neu gemessen wurde.

Der Audit prüft unter anderem, dass `caution` farblich weit genug von `primary`
entfernt ist. In einer Welt mit goldener Primärfarbe ist das keine Formalie,
sondern die einzige Sache, die einen Warnhinweis von einer Aktion unterscheidet.

## Dichte

```tsx
<html data-density="compact">
```

Drei Stufen: `compact` (28px), `default` (32px), `comfortable` (36px).
Die Dichte ist ein **Attribut, kein Prop** — sie wirkt über Custom Properties auf
alles im Container und vererbt sich nach innen, nicht nach außen. Eine kompakte
Tabelle in einer komfortablen Seite funktioniert, weil keine der beiden die
andere kennen muss. Genau das war der Grund, sie in CSS und nicht in Props zu
legen.

Auf einem Zeigegerät mit grober Pointer-Auflösung wird die Dichtehöhe als
**Minimum** behandelt: `data-tea-touch` hebt auf 44px an. So bleibt eine
komfortable Desktop-Tabelle luftig und ein 28px-Knopf auf dem Telefon trotzdem
groß genug.

## Was nicht geht

- `dark:`-Utilities in einem Dark-only-System.
- Eine Komponente, die auf `data-theme` reagiert. Themes sind eine Ebene tiefer.
- Ein Theme, das eine Rolle hinzufügt.
- Ein Theme, das eine Farbe in eine Komponente schiebt.

## Weiter

- [[Architektur]] — wie die Rollen in den Build gelangen
- [[Komponenten]] — was thematisiert wird
