# Beitragen

## Erst suchen, dann bauen

Das ist die eine Regel, die den Rest ersetzt.

```bash
rg "export (const|function)" packages/*/src/index.ts*
rg "StatusBadge|DataTable|ConfirmDialog" packages/
rg -i "<dein Konzept>" packages/ux-standards/src docs/
```

Wenn es existiert: **benutzen**. Wenn es beinahe existiert: in TEA UI erweitern,
niemals in das Produkt forken.

## Wenn nichts passt: verallgemeinern, nicht hinzufügen

1. Kann eine bestehende Komponente ein Prop bekommen, das den Unterschied
   ausdrückt?
2. Lässt sie sich aus bestehenden Teilen zusammensetzen? (`Card` + `CardHeader`
   schlägt `Card title="…" description="…"`)
3. Ist der Unterschied real, oder sind es zwei Erscheinungen derselben Idee?
   - Zwei Farbgebungen eines Status → ein `StatusBadge` mit `tone`.
   - Ein zentraler und ein Seiten-Spinner → ein `LoadingState`.
   - Ein rechter Drawer und ein Bottom-Sheet → ein `Drawer` mit `side`.
4. Braucht ein anderes TEA-Produkt das auch? Wenn nicht, bleibt es im Produkt.

Erst wenn alle vier scheitern, kommt etwas zu TEA UI — mit Changeset, Test und
einem Kommentar, der begründet, warum es existiert.

## Vor einer neuen Komponente

- Gibt es das schon? Kann es ein Prop lösen?
- Ist es Komposition statt einer neuen Komponente?
- Wäre es in Core, Admin, Public, Pattern, Template, Blueprint oder Specialized?
  Die Ebene folgt aus dem *Kosten*- und *Belastungsprofil*, nicht aus dem
  Themenbereich.
- Wird es mindestens in einem weiteren TEA-Produkt gebraucht?

## Vor einer neuen Abhängigkeit

- Notwendig? Was kostet sie im Bündel?
- Bricht sie eine Paketgrenze? `npm run check:boundaries` sagt es.
- Ist sie zugänglich und gepflegt?
- Gibt es etwas in der Abhängigkeit, das wir selbst brauchen? Die erste Zeile von
  `@tea-ui/icons` ist ein Re-Export, kein Wrapper — eine Abhängigkeit, die nur in
  einem Paket gebraucht wird, gehört dorthin.

## Vor einem neuen UX-Verhalten

- Entscheidet ein UX-Standard das schon?
- Würde ein anderes TEA-Produkt sich anders verhalten? Gibt es einen
  dokumentierten Grund?
- Ist der Zustand im Feedback-Modell benannt? Wenn nicht, gehört er hinein —
  sonst wächst die Zahl der benannten Zustände wieder.

## Vor dem Abschluss

```bash
npm run verify
```

Das ist Paketgrenzen, Typecheck, Lint, Tests, Stylesheet, Build, Exportvertrag und
Tree-Shaking. Danach ein Changeset mit Begründung.

## Der Autorisierungsvertrag

`docs/architecture/COMPONENT-CONTRACT.md` ist die verbindliche Fassung.
`packages/core/src/inputs/button.tsx` ist die Referenzimplementierung. Wenn beide
und dieses Wiki sich widersprechen, gewinnt die Komponente — und der Vertrag
muss nachgezogen werden.

## API-Stabilität

Öffentliche APIs sind Verträge. Eine Umbenennung, eine Prop-Änderung, ein
entfernter Export: Das braucht eine Migrationsnotiz und eine große Version. Eine
stille Änderung ist keine.

Für den Umbau innerhalb einer Veröffentlichung gilt: `internal/` ist nicht
öffentlich und nicht von Semver abgedeckt. Wer `@tea-ui/core/src/...` importiert,
baut gegen etwas, das es nicht verspricht.

## Ein Changeset

```bash
npm run changeset
```

```md
---
"@tea-ui/core": minor
---

Was sich geändert hat — und warum.
```

Der Release entsteht aus einem gemergten Changeset, nie aus einem manuellen Schritt.

## Weiter

- [[Architektur]] — der Paketgraph und seine Prüfung
- [[UX-Standards]] — die Regeln, an die man sich hält
- [[OpenCode-Skill]] — die Skill, die dieselben Regeln einem Agenten gibt
