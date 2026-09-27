# Komponenten

`packages/core/src/inputs/button.tsx` ist die **Referenzimplementierung** des
ganzen Systems. Wenn dieses Wiki und die Komponente sich widersprechen, hat die
Komponente recht.

## Was es gibt

| Bereich | Komponenten |
|---|---|
| Layout | `Box` `Stack` `HStack` `VStack` `Flex` `Grid` `Container` `Spacer` `Center` `Divider` `AspectRatio` `ScrollArea` |
| Oberfläche | `Card` (+Teile) `Panel` |
| Typografie | `Text` `Heading` `Eyebrow` `Caption` `InlineCode` `Preformatted` `Kbd` `Link` `Blockquote` `List` `DefinitionList` |
| Eingaben | `Button` `IconButton` `ButtonGroup` `Input` `Textarea` `InputGroup` `SearchInput` `PasswordInput` `NumberInput` `Checkbox` `Radio` `RadioGroup` `Switch` `Slider` `Toggle` `ToggleGroup` `Select` `Combobox` `Label` `Field` (+Teile) |
| Rückmeldung | `Spinner` `Skeleton` `Progress` `Badge` `StatusDot` `StatusBadge` `StatusText` `StatusSelect` `Alert` `Callout` `Toast` `Toaster` `useToast` |
| Overlays | `Dialog` `AlertDialog` `ConfirmDialog` `useConfirm` `Drawer` `Sheet` `Popover` `Tooltip` `HoverCard` `DropdownMenu` `ContextMenu` |
| Navigation | `Tabs` `Accordion` `Collapsible` `Breadcrumb` `Pagination` `Stepper` `SkipLink` `Toolbar` `NavigationMenu` |
| Admin | `AdminShell` `Page` `PageHeader` `StatTile` `StatGrid` `MetricCard` `EmptyState` `ErrorState` `LoadingState` und die übrigen Zustände |
| Public | `Section` `Hero` `Feature` `FeatureGrid` `CallToAction` `PublicNavbar` `PublicFooter` `PricingTable` `Faq` `ConversionForm` |
| Formatierung | `formatBytes` `formatDateTime` `formatDuration` `formatNumber` `formatPercent` `formatRelativeTime` |

## Die acht Regeln, die eine Komponente einhalten muss

**Keine Farbe.** Nur semantische Rollen. Die Tailwind-Farbpaletten sind aus dem
Build entfernt, also **kompiliert `text-red-300` nicht**.

**Keine feste Höhe.** Aus der Dichte lesen (`control-h`, `cell-y`, `pad-card`),
damit die Komponente auf `data-density` reagiert.

**Nie `focus:`.** Nur `focus-visible:`. Ein Maus-Klick darf keinen Fokusring
hinterlassen.

**Radius ist `none` oder `pill`.** `pill` ist fünf Bedeutungen vorbehalten:
Avatar, Statuspunkt, Schalter, Radio, Mediensteuerung, Ladeindikator, Fortschritt.

**Elevation ist `raised`, `overlay` oder `modal`.** Nie `shadow-lg`, nie ein
freier Offset.

**Kein Control ohne zugänglichen Namen.** `IconButton.label`, `Slider.label` und
`ButtonGroup.label` sind typseitig **Pflicht** — genau deshalb kann der Fehler
nicht passieren, den das Audit fünfmal pro Tabellenzeile fand.

**Zustand als Datenattribut.** `stateAttributes({ disabled, loading, invalid,
readOnly, selected, active, checked, open, empty })` — geschlossenes Vokabular,
zusätzlich zum echten ARIA-Attribut.

**Keine Anwendungslogik.** Kein API-Aufruf, kein Store-Zugriff, kein Wissen
darüber, was ein Server ist.

## Das Formular-System

`Field` ist das wichtigste Bauteil der Bibliothek, weil es die häufigste
Zugänglichkeitslücke strukturell schließt.

```tsx
<Field required invalid={!!error}>
  <FieldLabel>E-Mail</FieldLabel>
  <Input type="email" autoComplete="email" />
  <FieldDescription>Wir senden keine Bestätigung.</FieldDescription>
  <FieldError>{error}</FieldError>
</Field>
```

`Field` vergibt die IDs, `FieldLabel` setzt `htmlFor`, und jeder Control holt
sich über `useFieldControlProps()` genau die sechs Attribute, die er braucht.
`aria-describedby` enthält Beschreibung **und** Fehlermeldung, aber nur die IDs,
die wirklich im DOM stehen — ein Verweis auf eine fehlende ID ist ein
axe-Fehler und wird von manchen Screenreadern still verworfen.

Das Pflichtzeichen ist ein `aria-hidden`-Sternchen mit `title`. Es ist
**absichtlich kein** verstecktes „Pflichtfeld"-Wort im Label: das würde den
zugänglichen Namen zu „E-Mail Pflichtfeld" machen. Das Attribut sagt es bereits,
und sagt es richtig.

## Status

```tsx
<StatusBadge domain="health" status="degraded" />
<StatusDot domain="certificate" status="expiring" />
<StatusSelect domain="crm" value={stage} onValueChange={setStage} label="Phase" />
```

Nur diese drei. Kein eigener Text, keine eigene Farbe, kein eigenes Icon.

## Destruktive Aktionen

```tsx
const [confirm, ask] = useConfirm();

const ok = await ask({
  level: "irreversible",
  what: "Der Server",
  confirmWord: "srv-01",
});
```

`level` entscheidet den Schutz: `reversible` → Undo, `recoverable` → Dialog,
`irreversible` → Dialog plus getipptes Wort. Abbrechen ist nie der destruktive
Button und immer der Fokus.

## Formatter

`formatBytes` ist **binär** voreingestellt (KiB/MiB/GiB), weil die dominante
TEA-Fläche Speicher ist. `formatDuration` gibt maximal zwei Einheiten aus,
`formatRelativeTime` deutsche Kurztokens. Im Audit standen dieselben Daten einmal
als GB und einmal als GiB in zwei Produkten.

## Weiter

- [[UX-Standards]] — die Regeln hinter diesen APIs
- [[Themes]] — wie dasselbe Markup anders aussieht
- [[Accessibility]] — was davon automatisch geprüft wird
