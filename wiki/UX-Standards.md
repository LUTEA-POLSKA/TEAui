# UX Standards

Ein Standard, den niemand liest, ist keiner. Deshalb liegen diese Regeln als
**Code** vor: eine Status-Vokabel, eine Destruktivitäts-Matrix, ein
Formularverhalten. Eine Komponente *kann* sie nicht versehentlich umgehen.

## Cross-Product Consistency

> Wenn zwei TEA-Produkte dasselbe Interaktionsproblem lösen, verhalten sie sich
> gleich — außer es gibt einen dokumentierten Grund.

Das ist die eine Regel, aus der die anderen folgen.

## Die fünf Töne

Geschlossen. Keine sechste Farbe.

| Ton | Bedeutung |
|---|---|
| `positive` | Zustand erreicht |
| `info` | Zustand in Bewegung |
| `caution` | Zustand braucht Aufmerksamkeit |
| `critical` | Zustand ist schlecht |
| `neutral` | kein Zustand |

`destructive` ist **kein** sechster Ton, sondern eine Rolle, die sich den
`critical`-Ton leiht: beide bedeuten „schlecht" und unterscheiden sich im
Gebrauch, nicht in der Farbe.

**Warum ist `caution` orange und nicht bernstein?** In beiden Quellprodukten ist
die Primärfarbe ein Gold. Ein bernsteinfarbenes Warnsignal wäre auf kleinen
Flächen nicht davon zu unterscheiden. Der Ton ist orange, weil die Unterscheidung
sonst nicht existiert.

## Die siebzehn Zustände

Jede asynchrone Fläche ist in genau einem davon. Der passende Indikator ist
**entschieden, nicht gewählt**.

| Zustand | Art | Anzeige |
|---|---|---|
| `idle` | Hintergrund | — |
| `loading` | initial | Skeleton |
| `refreshing` | Hintergrund | Indikator **über** erhaltenem Inhalt |
| `processing` | blockierend | Fortschritt an der auslösenden Aktion |
| `success` | Hintergrund | Bestätigung |
| `warning` | Hintergrund | Callout |
| `error` | Hintergrund | `ErrorState` |
| `empty` | initial | `EmptyState` |
| `disabled` | Hintergrund | — |
| `offline` | Hintergrund | Zustand, kein Fehler |
| `unauthorized` | Hintergrund | erklärt, dass eine Anmeldung fehlt |
| `forbidden` | Hintergrund | erklärt, welche Berechtigung fehlt |
| `notFound` | Hintergrund | erklärt, was nicht da ist |
| `maintenance` | Hintergrund | erklärt, wann es wieder da ist |
| `stale` | Hintergrund | „letzte Aktualisierung vor …" |
| `syncing` | Hintergrund | wie `refreshing` |
| `retrying` | Hintergrund | wie `refreshing` |

Die vier Zustände `refreshing`, `syncing`, `stale` und `retrying` dürfen **nie**
Inhalt ersetzen. Das war der teuerste Einzelfehler im Audit: beide Produkte haben
bei jedem 5-Sekunden-Poll den ganzen Bereich durch einen Spinner ersetzt, also
dem Nutzer den Text weggenommen, den er gerade las.

## Fehleranatomie

Eine Fehlermeldung ist kein String, sie ist eine Antwort auf vier Fragen.

1. Was ist passiert?
2. Warum?
3. Was kann der Nutzer tun?
4. Kann das System sich selbst erholen?

Eine Nachricht, die weniger beantwortet, ist nicht „kurz" — sie ist
unhandhabbar, und der Nutzer muss ein Ticket schreiben, um herauszufinden, was
los war. `ErrorAnatomy` ist der Typ, den jede Fehlerfläche annimmt, und
`shouldOfferRetry` bietet eine Wiederholung **nur** an, wenn sie plausibel
Erfolg hat. Ein Retry bei einem Validierungsfehler lehrt Menschen, dass Knöpfe
nichts tun.

Technische Details gehören hinter eine Disclosure. Sie sind für die Person, die
den Bericht schreibt — nicht für die Person, die das Problem hat.

## Formulare

- Validiere **beiBlur**, nach der ersten Änderung erneut, und beim Absenden.
  Niemals bei jedem Tastenanschlag ab Zeichen eins.
- Ein Feld, das der Nutzer nicht korrigieren kann, ist ein Fehler.
- Paste wird nie blockiert. Auto-Fill ist ein Zugänglichkeitsmerkmal.
- Bei `irreversible` Aktionen: die Folge benennen, nicht andeuten.

## Destruktive Aktionen

| Konsequenz | Schutz |
|---|---|
| `reversible` | **Undo**, keine Frage |
| `recoverable` | Bestätigungsdialog, Folge benannt |
| `irreversible` | Bestätigungsdialog **plus** getipptes Wort |

Zwei Regeln machen das korrekt, und beide sind in `ConfirmDialog` durchgesetzt,
nicht dem Aufrufer überlassen:

1. **Abbrechen ist der Fokus, und der destruktive Button ist nie der primäre.**
   Wer reflexartig Enter drückt, darf nichts zerstören.
2. **Die Folge wird gesagt, nicht angedeutet.** `consequenceSentence()`
   erzeugt sie, damit neben „wird gelöscht" nie ein Knopf mit „Wiederherstellen"
   stehen kann.

Jedes unnötige Bestätigungsdialog ist ein Dialog, den der Nutzt künftig wegklickt —
auch den, den er hätte lesen müssen. Im Audit stand eine reversible
Zweischritt-Bestätigung direkt neben einem `DELETE` ganz ohne Bestätigung.

## Navigation

Die Frage entscheidet das Muster. Diese Tabelle ist die Entscheidung, keine
Empfehlung.

| Situation | Muster | Nicht |
|---|---|---|
| 5+ ständig genutzte Bereiche | Sidebar | horizontale Menüleiste |
| 2–7 Geschwisteransichten **desselben** Themas | Tabs | ein Sidebar-Eintrag je Ansicht |
| 3+ Ebenen Tiefe | Breadcrumb | nur Zurück |
| 15+ Aktionen oder ein Power-User-Workflow | Command Palette | eine Einstellungsseite mit 200 Zeilen |
| eine lange Liste auf dem Bildschirm | lokale Suche | ein Dialog mit denselben Daten |
| mehrschrittige, schwer umkehrbare Aufgabe | Stepper | ein scrollendes Formular |
| Viewport unter 1024px | Drawer / Zurück | eine geschrumpfte Sidebar |

Tab-Zustände stehen in der URL, ebenso Filter, Sortierung, Seite und Auswahl.
Hover, Tooltips und Toasts nicht — ein geteilter Link soll nicht überraschen.

## Bewegung

Bewegung ist Dekoration, bis sie etwas erklärt. Dauer-Tokens: 120 / 180 / 280 ms.
`prefers-reduced-motion` schaltet global ab, mit `!important` — weil die
Enter/Exit-Utilities sonst bedingungslos laufen. Ein Spinner, der aufhört sich zu
drehen, hört auf zu kommunizieren, also tauscht er gegen einen nicht-rotierenden
Fortschritt.

## Inhalt

Register: **du**. Echte Umlaute. Ein Button benennt die Handlung, nicht das Ding.
Ein Fehlertext sagt, was passiert ist, statt „Etwas ist schiefgelaufen" zu
behaupten. Der Wortschatz liegt in `COPY`; eine Komponente tippt keine deutschen
Sätze, wenn es dafür schon ein Token gibt.

## Weiter

- [[Komponenten]] — wie die Regeln in Code aussehen
- [[Accessibility]] — wie die Bodenregeln durchgesetzt werden
- [[Audit]] — woher jede dieser Regeln kommt
