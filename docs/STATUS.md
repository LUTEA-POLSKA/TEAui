# TEA UI — Status

**Stand: 2026-09-28 · Base Rewrite abgeschlossen**

Der Neuaufbau der UI-Basis ist fertig und veröffentlicht. Was das konkret heißt,
was bewusst noch nicht fertig ist, und woran andere Projekte sich halten können.

## Veröffentlicht auf npm

Organisation: **https://www.npmjs.com/org/tea-ui**

| Paket | Version | Inhalt |
| --- | --- | --- |
| `@tea-ui/core` | **1.0.0** | Primitives: Layout, Typografie, Inputs, Feedback, Overlays, Navigation |
| `@tea-ui/admin` | **1.0.0** | Shell, Navigation, Datenanzeige, Produktzustände |
| `@tea-ui/public` | **1.0.0** | Marketing-Sektionen, Hero, Pricing, FAQ, Conversion |
| `@tea-ui/tokens` | **1.0.0** | Farbe, Abstand, Radien, Motion, Dichte, Themes |
| `@tea-ui/icons` | **1.0.0** | Icon-Set |
| `@tea-ui/ux-standards` | **1.0.0** | Die Regeln als Code: Statusvokabular, Feedback, Destruktiv-Politik, Terminologie |
| `@tea-ui/utils` | **1.0.0** | Typen, `cn`, `cva`, kleine Helfer |
| `@tea-ui/patterns` | 0.1.0 | **Gerüst** — 2 Exporte, nicht nutzbar |
| `@tea-ui/templates` | 0.1.0 | **Gerüst** |
| `@tea-ui/blueprints` | 0.1.0 | **Gerüst** |
| `@tea-ui/specialized` | 0.1.0 | **Gerüst** |

Die Aufteilung ist Absicht. Eine `1.0.0` ist eine Zusage; die sieben Pakete oben
sind gebaut, gemessen und aus dem Registry als echtes Node-ESM importiert
verifiziert. Die vier Gerüste nicht — `npm i @tea-ui/blueprints` würde ein fertiges
System versprechen und 73 kB Rahmen liefern. Eine Versionsnummer lässt sich nur
per Deprecation zurücknehmen, deshalb steht dort `0.1.0`.

Wer eines der vier fertig macht, verschiebt es in der Liste `STABLE` in
`scripts/prepare-publish.mjs` und veröffentlicht. `blueprints` kann nicht vor
`patterns` auf `1.0.0`, weil es davon abhängt.

## Für andere Projekte

```bash
npm i @tea-ui/core @tea-ui/tokens @tea-ui/icons @tea-ui/ux-standards @tea-ui/utils
```

```tsx
import "@tea-ui/tokens/styles.css";
import { Button, Field, Alert, Dialog } from "@tea-ui/core";
```

Dokumentation: **https://landnevermore.github.io/TEAui/docs/**
Showcase: **https://landnevermore.github.io/TEAui/**

Accessibility-Ziel ist WCAG 2.2 AA. Die Kontraste aller drei Themes sind getestet,
nicht behauptet.

## Wie andere Projekte erfahren, dass es eine neue Version gibt

Eine veröffentlichte Version wird nie zurückgezogen. Ein Projekt, das `1.0.0`
installiert hat, behält sie; eine neuere Version erscheint daneben. Das einzige
Signal ist deshalb ein fehlschlagender Check oder ein Pull Request — und beides
ist eingerichtet:

- **Hier** meldet Dependabot wöchentlich neue `@tea-ui/*`-Versionen, gruppiert zu
  *einem* Pull Request. Eine neue `core` bedeutet für alle Konsumenten dasselbe
  Upgrade; sieben einzelne kämen zu verschiedenen Zeitpunkten in Zuständen, die
  niemand getestet hat.
- **Konsumenten** brauchen eine `.github/dependabot.yml` mit einem
  `package-ecosystem: npm`-Block. Ohne die ist `npm outdated` das einzige Signal,
  und das führt niemand aus.

## Der OpenCode-Skill

`tea-ui` liegt unter `~/.config/opencode/skills/tea-ui/` und greift in **jedem**
Projekt. Er sucht in `node_modules/@tea-ui/*`, nicht in einem Checkout von TEA
UI — das war der Fehler, der ihn vorher in anderen Projekten wirkungslos gemacht
hat: die Suchbefehle zeigten ins Repo, es gab nichts zu finden, und der Agent
baute neu, was schon existierte.

`npm run check:skill` schlägt fehl, wenn Quelle und installierte Kopie
auseinanderlaufen. Das ist der Teil, der zählt: eine von Hand gepflegte Kopie
verrottet still, und ein verworrener Skill liest sich weiterhin als verbindlich.

## Noch offen

- Die vier Gerüst-Pakete sind der nächste Arbeitsstand.
- `HSM` und `LUTEA` sind auditiert, aber nicht umgestellt. Die Audits liegen unter
  `docs/audit/`.
- Trusted Publishing (OIDC) würde das Veröffentlichen ohne Token möglich machen;
  heute läuft es über einen granularen Token mit 2FA-Bypass.
