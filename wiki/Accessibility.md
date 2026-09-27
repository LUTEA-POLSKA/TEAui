# Accessibility

Ziel: **WCAG 2.2 AA**. Kein Attest, sondern ein Bündel aus Tests, Bodenregeln im
Stylesheet und einer Struktur, die die Fehlerklasse gar nicht erst zulässt.

## Durchgesetzt, nicht empfohlen

Die meisten Regeln hier sind keine Stilfrage. Jede ist ein Defekt, den das Audit
in den Quellprodukten gefunden hat, verwandelt in etwas, das eine Maschine
verweigert. Eine Regel, die nur in einem Dokument steht, ist ein Vorschlag; eine
Regel, die einen Build bricht, ist ein Standard.

**Farben können nicht ausdrücken, was sie ausdrücken sollen.** Die
Tailwind-Farb-, Schriftgrößen-, Radius- und Schatten-Namespaces sind aus dem
Build **entfernt**. `text-red-300`, `text-[9px]`, `rounded-md` und `shadow-lg`
kompilieren nicht. Die Defekte, die das Audit dutzende fand, sind nicht mehr
ausdrückbar.

**Kein Text unter 11px.** Es gibt keinen Schritt darunter. Im Audit trug echter
Text in beiden Projekten 9px und 10px.

**Fokus ist strukturell, nicht chromatisch.** Der Ring hat eine Lücke um sich
herum (`ring-offset`), also liest er sich anders als eine gefüllte Akzentfläche.
Ein Theme darf `ring` auf einen eigenen Farbton setzen, muss es aber nicht.

**Bewegung wird global abgeschaltet.** `prefers-reduced-motion: reduce` setzt
`animation-duration: 0.01ms !important` auf alles — mit `!important`, weil die
Enter/Exit-Utilities sonst bedingungslos laufen. Ein Spinner, der aufhört sich zu
drehen, hört auf zu kommunizieren, also tauscht er gegen einen nicht rotierenden
Fortschritt.

**Touch-Ziele.** Interaktive Controls tragen `data-tea-touch`. Auf einem Zeiger
mit grober Auflösung wird die Dichtehöhe als Minimum behandelt: 28px wird 44px.
WCAG 2.5.8, ohne eine einzige Medienabfrage in einer Komponente.

**Ein Fokusring wird nie entfernt, ohne dass ein neuer entsteht.** Das Audit fand
`focus:outline-none` ohne Ersatz an Dialog- und Toast-Schließern.

## Durch die Struktur erzwungen

**Ein Feld kann keinen zugänglichen Namen verlieren.** `Field` vergibt die IDs und
stellt sie über `useFieldControlProps()` bereit. `IconButton.label`,
`Slider.label` und `ButtonGroup.label` sind typseitig Pflicht — deshalb passiert
der Fehler nicht, den das Audit fünfmal pro Tabellenzeile fand.

**Eine Überschrift ist eine Überschrift.** `CardTitle` rendert ein echtes
`<h2>`…`<h6>` und verlangt ein `level`. Die Quellkomponente rendert ein `<div>` —
und hat damit in jedem Produkt, das sie benutzt, die Seitenstruktur eingeebnet.
Ein Screenreader-Nutzer, der nach Überschriften navigiert, hatte nichts.

**Ein Dialog hat immer einen Namen.** `DialogTitle` ist erforderlich; fehlt es,
rendert die Komponente ein visuell verborgenes. Im Audit trugen einige Dialoge
nur das englische „Close" in einem sonst deutschen Produkt.

**Ein Status ist nie nur Farbe.** `StatusDot` trägt `title` **und** versteckten
Text. Ein Trend ist ein Pfeil **und** eine Zahl **und** ein Wort für
Screenreader. Eine aktive Navigation trägt `aria-current`, nicht nur einen
Hintergrund.

**Ein Fehler wird angekündigt.** `FieldError` hat `role="alert"`, `Alert` wählt
`alert` für unterbrechende Töne und `status` für die übrigen, `aria-describedby`
enthält Beschreibung und Fehlermeldung gemeinsam. Ein Farbwechsel ist keine
Ansage.

## Geprüft

```bash
npm test
```

Die Tests behaupten kein Klassen-Listing — sie prüfen Verhalten:

- **Rolle und Name** über `getByRole` und `toHaveAccessibleName`
- **Tastaturbedienung** mit `@testing-library/user-event`: Tab, Pfeile, Enter, Space, Escape
- **Fokusführung**: Fokus wandert in ein Overlay, Escape schließt, Fokus kehrt an
  den Auslöser zurück, der Hintergrund ist inert
- **Zustandsattribute** statt Stil
- **Kontrast** aller Theme-Paare gegen WCAG 2.2, geparst aus `themes.css`

Der Kontrast-Audit prüft 64 Messungen über drei Themes, darunter: `caution` muss
farblich weit genug von `primary` entfernt sein, und die 1px-Rahmenfarbe muss
gegen die Fläche messbar bleiben, weil sie in dieser Designsprache die ganze
Struktur trägt.

## Noch offen

- **Visuelle Regression** ist im Workflow vorhanden, sammelt aber noch keine
  Referenzbilder. Ohne Referenz ist der Job ein Upload, kein Vergleich.
- **Screenreader-Tests** sind manuell. axe deckt die Struktur ab, nicht die
  Ansagequalität in VoiceOver oder NVDA.
- **`prefers-contrast` und `forced-colors`** sind nicht behandelt.

Diese drei Punkte sind bewusst nicht als erledigt markiert. Ein Designsystem,
das seine Lücken nicht auflistet, lädt dazu ein, sie zu übersehen.

## Weiter

- [[UX-Standards]] — die Produktseite der Barrierefreiheit
- [[Komponenten]] — die APIs, die daraus folgen
