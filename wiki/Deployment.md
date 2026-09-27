# Deployment

Showcase und Dokumentation bauen zu **einem** statischen Verzeichnis, das jeder
Host ausliefern kann — Domain-Root, GitHub Pages, Vercel, ein Netzlaufwerk. Keine
Serverkomponente, keine Rewrite-Regeln, kein `404.html`.

```bash
npm run site:build                       # Domain-Root  -> dist-site/
npm run site:serve                       # ausliefern auf http://localhost:4175
BASE_PATH=/TEAui/ npm run site:build     # GitHub-Pages-Projekt
BASE_PATH=/TEAui/ npm run site:serve
```

## Warum keine Host-Konfiguration nötig ist

Zwei Entscheidungen, früh getroffen statt nachgerüstet:

**Hash-Routing.** Jede Route liegt im URL-Fragment, also liefert der Host nur
Dateien aus. Ein pfadbasiertes Routing bräuchte Rewrite-Regeln; dieses braucht
keine.

**Ein konfigurierbares `base`.** Asset-URLs werden relativ zu `BASE_PATH`
erzeugt, also liefert derselbe Quelltext `/` und `/TEAui/`.

Der Build schreibt außerdem `.nojekyll`. GitHub Pages betreibt standardmäßig
Jekyll, und Jekyll ignoriert Pfade, die mit `_` beginnen — genau dort landen die
geteilten Chunks von Vite. Ohne die Datei liefert ein Deploy 404 auf genau den
Dateien, die der Bundler zum Teilen ausgewählt hat. Das ist die häufigste Ursache
für „lokal gut, auf Pages kaputt".

## Aufbau des Artefakts

```text
dist-site/
  index.html        das Showcase
  assets/…
  .nojekyll
  docs/
    index.html      die Dokumentation
    assets/…
```

## GitHub Pages

Pages steht auf `build_type: workflow`. Der Workflow
`.github/workflows/pages.yml` baut, **prüft das Artefakt von einem Unterpfad** und
lädt erst dann hoch:

```bash
BASE_PATH=/TEAui/ npm run site:build
BASE_PATH=/TEAui/ PORT=4175 npm run site:serve
# dann /, /docs/ und /.nojekyll abrufen
```

Ein Deploy, der nur in Produktion bricht, bricht bei jedem Mal. Deshalb fragt der
Workflow jede Route ab, bevor er etwas hochlädt.

**Wichtig:** Das Repository war ursprünglich privat, und Pages ist für private
Repositories nicht verfügbar (das gibt es erst mit GitHub Enterprise Cloud). Das
Repository ist inzwischen öffentlich — siehe [[Home]] zur Einordnung.

Alternativen, falls die Quelle nicht öffentlich sein soll:

1. **Vercel, privates Repository.** Framework `Vite`, Build `npm run site:build`,
   Output `dist-site`, `BASE_PATH` leer lassen. Jeder Push bekommt eine Preview.
2. **Öffentlicher Spiegel nur mit Build-Output.** `dist-site/` in ein separates
   öffentliches Repository, Source auf `gh-pages`. Der Quelltext bleibt privat.
3. **NPM-Paketverteilung.** `@tea-ui/*` wird mit `--access restricted`
   veröffentlicht, also an eine GitHub-Organisation oder ein Team. Für den
   Zugriff braucht der Rechner ein `.npmrc` mit Token; CI bekommt es als
   `NPM_TOKEN`.

## Continuous Integration

`ci.yml` läuft bei jedem Push und jedem Pull Request: Paketgrenzen, Typecheck,
Lint, Tests, Stylesheet-Build, Bibliotheks-Build, Exportvertrag und gemessenes
Tree-Shaking. Jeder Schritt hat einen eigenen Namen, damit ein roter Build sagt,
**welche** Regel gebrochen ist, und nicht nur „CI fehlgeschlagen".

Der Pages-Workflow führt dasselbe Gate erneut aus, bevor er ausliefert.
Workflows können nicht voneinander abhängen, und eine grüne Seite aus einer roten
Bibliothek wäre die schlechteste Werbung, die ein Designsystem haben kann, auf
das sich andere Teams verlassen sollen.

## Umgebungsvariablen

| Variable | Standard | Zweck |
|---|---|---|
| `BASE_PATH` | `/` | Asset-Basispfad. `/TEAui/` für ein Pages-Projekt. |
| `SITE_DIR` | `dist-site` | Was `site:serve` ausliefert. |
| `PORT` | `4175` | Port für `site:serve`. |
| `SITE_BASE_PATH` | `/TEAui/` | Repository-Variable, die der Pages-Workflow liest. |

## Weiter

- [[Architektur]] — warum eine Datei und kein Build-Schritt pro Paket
- [[Beitragen]] — wie man ein Release auslöst
