# Audit

TEA UI wurde **nicht entworfen**, sondern aus einem Audit zweier realer
Codebasen abgeleitet. Diese Seite fasst zusammen, was gefunden wurde — weil die
Entscheidungen im System sonst nach Geschmack aussehen.

## Die Artefakte

```text
docs/audit/HSM-AUDIT.md        vollständiges Audit HomeServerManager  (~140 kB)
docs/audit/LUTEA-AUDIT.md      vollständiges Audit LUTEA Design      (~148 kB)
docs/audit/CONSOLIDATION.md    Zusammenführung, 7 offene            (~180 kB)
                                 Architekturentscheidungen
```

Alle drei liegen versioniert im Repository. Kein Quellprojekt wurde verändert.

## Die teuersten Befunde

| Befund | Wo | Was daraus wurde |
|---|---|---|
| 20 handgeschriebene Kopien derselben Kartenfläche, `p-3` bis `p-8` | HSM | ein `Card`, dessen Padding die Dichte liest |
| 9 Fehlerbanner, davon 2 mit `role="alert"`, 2 rote Texte, 3 Paddings | HSM | ein `Alert`, dessen Rolle aus dem Ton folgt |
| 10 Leerzustände, 5 mit `p-10` | HSM | `EmptyState` + `EmptyStateNew` + `EmptyStateFiltered` |
| 8 identische „Lade …"-Loader, daneben ein gebautes, ungenutztes `Skeleton` | HSM | ein `LoadingState` als Default |
| 5 Stat-Tile-Funktionen, 2 gleichnamig mit anderen Props | HSM | ein `StatTile`, Wert zuerst |
| 5 Status→Label-Tabellen, die sich widersprechen („Online" vs. „Läuft") | beide | ein Register, geschlüsselt nach Wire-Value |
| 4 von 5 Formularfeldern ohne `htmlFor` | HSM | `Field` verdrahtet es strukturell |
| 5 Icon-Buttons pro Tabellenzeile ohne Namen | HSM | `IconButton.label` ist Pflicht |
| Ein `ToastProvider`, in dem sich nie ein `Toast` registriert; `TOAST_LIMIT = 1` | HSM | ein echter `useSyncExternalStore`-Store, Limit 3 mit Zähler |
| `Textarea` ohne `aria-invalid`, während `Input` es hatte | LUTEA | ein Feld-System für beide |
| `color.status.noWebsite` erreichbar nie, weil die Schlüssel `no_website` heißen | LUTEA | Schlüssel aus dem Code, nicht aus dem CSS |
| `max-h-[--radix-…]` ohne `var()` — wirkungslos | LUTEA | `max-h-[var(--radix-…)]` |
| 4 radix-Utilities in v4-Syntax auf Tailwind v3 | LUTEA | Tailwind v4 im Token-Layer |
| Ein öffentliches Nav `hidden md:flex` **ohne** Mobilmenü | LUTEA | `PublicNavbar` mit Drawer |
| Nav `aria-current` in einer Kopie, in der anderen nicht | LUTEA | eine Implementierung |
| Aktualisierung ersetzt den ganzen Bereich durch einen Spinner | beide | `RefreshingIndicator` über erhaltenem Inhalt |
| **0× `prefers-reduced-motion`**, 13 ungeschützte Spinner | beide | globales Gate mit `!important` |
| Echter Text in 9px und 10px | beide | keine Stufe unter 11px |
| Zwei Orthografien (`ü` vs. `ue`), drei Sprachfehler mitten in deutschen Sätzen | LUTEA | echte Umlaute, Register „du" |
| Aktive Navigation nur über Farbe markiert | beide | `aria-current` plus Gewichtsänderung |

## Die sieben Entscheidungen, die die Audits offengelassen haben

1. **Primärfarbe** = Gold. In beiden Produkten ist `accent` Gold; LUTEA hat
   `primary` darauf kollabiert, HSM hatte zusätzlich ein Rot, das semantisch nirgends
   benutzt wurde und *auch nicht* destruktiv war.
2. **Schalter-Radius** = `pill`, als dokumentierte Ausnahme. HSM behielt die Pille
   bewusst, LUTEA überschrieb sie bewusst — die Kopie enthielt LUTEAs Änderung,
   also hätte eine naive „HSM ist kanonisch"-Merge den HSM-Schalter gebrochen.
3. **Fokusring** = ein Rezept. Der Ring bekommt eine Lücke um sich herum, damit er
   sich strukturell von einer gefüllten Fläche unterscheidet, auch wenn beide
   Gold sind.
4. **Tailwind v4**, weil die Kits bereits gegen v4 geschrieben waren — ein
   halber Upgrade, der vier kaputte Utilities trug.
5. **Ein `cn`**, ein Importpfad. HSM hatte zwei Pfade für dieselbe Funktion, und
   `tailwind-merge` fehlte als Abhängigkeit.
6. **Ein Stylesheet für alles.** Voreinstellung binär, Register „du", echte
   Umlaute.
7. **Ein Statusregister** mit fünf Tönen, jeder Tonalias auf einen
   status-spezifischen Token, nie auf `accent`.

## Was NICHT übernommen wurde

- **`LandingScreenEditor`** (2165 Zeilen, eine Datei) — eine fachliche
  Oberfläche, keine wiederverwendbare.
- **`LoadingScreenMakerDialog`** — verschachtelte Dialoge und ein
  `allow-same-origin`-Iframe mit Nutzer-HTML, eine echte XSS-Fläche.
- **Der Farbwähler** — reines Mausgerät: kein `role="slider"`, kein `tabIndex`,
  keine Pfeiltasten.
- **`color-picker`-Nutzung im Editor** — dieselbe Klasse von Defekt.
- **`Menubar`** — in der Liste der Anforderung, aber kein einziger belegter
  Anwendungsfall. Nach der Regel „nicht für möglich-sounding-Bau" weggelassen.
- **Zwei Sprachregister** — gemischt in beiden Produkten. Auf „du" vereinheitlicht.

## Das Ergebnis in Zahlen

```text
vorher:  1 Komponente = 93,4 % des Pakets   (93,4 % kamen mit)
nachher: 1 Komponente = 13,2 % des Pakets   (12,8 kB gzip)
         ein Stylesheet für alles: 9,7 kB gzip
         74 Tests, 64 Kontrastmessungen über 3 Themes
```

## Weiter

- [[Architektur]] — was daraus gebaut wurde
- [[UX-Standards]] — die Regeln in Code
- [[Beitragen]] — wie man sie erweitert, ohne sie zu verdünnen
