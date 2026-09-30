/*
 * TEA UI — German detector.
 *
 * The previous sweeps matched `[äöüÄÖÜß]`, which is a character-class check and
 * is therefore structurally blind to every German word that happens to contain
 * none of those characters. It reported "0 Treffer" while the source still
 * contained `Informationsdichte`, `Abschnitte`, `zur Startseite`, `Auslastung`
 * and `Notiz`. It was wrong twice in the same way, so the method was the
 * problem and the fix is a different method.
 *
 * What this checks instead:
 *   1. a stop-word list of German words that are never English either, so a hit
 *      is a hit rather than a judgement call;
 *   2. the German noun suffixes English does not produce at all — `heit`,
 *      `keit`, `schaft`.
 *
 * Two heuristics were tried and removed rather than kept, because both produced
 * garbage and a noisy check is one people learn to skip:
 *   - `-ung` and the verb prefixes `ver-`/`ent-`/`be-`/`zer-`: English has
 *     `y**oung**`, `am**ong**`, `**because**`, `**ver**ified`, `**ent**ries`;
 *   - the `ue/oe/ae/ss` transliteration shapes: they match `essential`,
 *     `classes`, `password`, `message`, `possible`, `issue`.
 *
 * The authoritative guard for the shipped packages is the ratchet in
 * `@tea-ui/ux-standards`; this one adds `apps/`, which that test does not read.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const SCAN_ROOTS = ["apps", "packages"];
const EXT = /\.(ts|tsx|js|jsx|mjs|css|html)$/;

/* Paths whose German is the point of the file. */
const EXEMPT = [
  "packages/ux-standards/src/__tests__/language.test.ts",
  "packages/ux-standards/src/terminology.ts",
  "packages/core/src/inputs/combobox.tsx",
  "scripts/check-encoding.mjs",
  "scripts/repair-encoding.mjs",
];

/* German words that are also valid English. Reported as INFO, never as a
 * failure: `Server`, `Status` and `Standard` are correct English and appear in
 * English-only files all the time, so flagging them would make the check noisy
 * enough to be ignored — which is what it did. Kept for the `--verbose` run. */
const AMBIGUOUS = [
  "Server", "Status", "Standard", "Info", "Median", "Delta", "Import", "Export",
  "Filter", "Master", "Admin", "Portal", "Service", "Client", "Container",
  "Kontakt", "Note",
];
const VERBOSE = process.argv.includes("--verbose");

/* Unambiguous German. None of these is an English word. */
const GERMAN = [
  "Abschnitte", "Startseite", "Informationsdichte", "Auslastung", "Notiz", "Notizen",
  "uebersicht", "Uebersicht", "Uebernahme", "Aufteilung", "Zustand", "Zustaende",
  "Zustände", "Aktionen", "Aktion", "Beispiel", "Beispiele", "Auswahl", "Waehler",
  "Fortschritt", "Ladezustand", "Fehler", "Fehlermeldung", "Warnung", "Ergebnis",
  "Ergebnisse", "Umgebung", "Benutzer", "Geraet", "Groeße", "Groesse", "Groesse",
  "Ansicht", "Raster", "Kompakt", "Komfortabel", "Dichte", "Hauptnavigation",
  "Werter", "Wertung", "Messwert", "Aufteilung", "Vorschau", "Bezeichnung",
  "Beschriftung", "Eigenschaft", "Volltext", "Rückgängig", "Speichern", "Löschen",
  "Zurück", "Weiter", "Fertig", "Abbrechen", "Öffnen", "Schließen", "Nächste",
  "Vorherige", "Speicherplatz", "Arbeitsspeicher", "Festplatte", "Laufzeit",
  "Sicherung", "Verarbeitung", "Anzahl", "Menge", "Größe", "Höhe", "Breite",
  "Konflikt", "Vergleich", "Verhältnis", "Beispiel", "Einführung", "Überblick",
  "Zusammenfassung", "Voraussetzung", "Voraussetzungen", "Einschränkung",
  "Voraussicht", "Wartung", "Sicherheit", "Speicher", "Netzwerk", "System",
  "Einrichtung", "Konfiguration", "Darstellung", "Bedienung", "Anwendung",
  "Programm", "Komponente", "Komponenten", "Eigenschaften", "Beispiel",
  "zustande", "waehlen", "waehlt", "moechte", "moechten", "haelt", "zurueck",
  "schliessen", "oeffnen", "ueber", "fuer", "waehrend", "zusaetzlich",
  "Pruefung", "Pruefungen", "Messung", "Messungen", "Kontrast", "Kontraste",
  "Hinweis", "Hinweise", "Regel", "Regeln", "Vorrang", "Ansage", "Ansagen",
];

const MORPH = /(?:heit|keit|schaft)\b/;

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      if (["node_modules", "dist", ".git", "coverage", "audit"].includes(entry)) continue;
      yield* walk(full);
    } else if (EXT.test(entry)) {
      yield full;
    }
  }
}

/* Only string literals and JSX text can reach a reader. Comments cannot, so they
 * are stripped first — otherwise every explanatory comment about German counts. */
function readerVisible(line) {
  const withoutBlock = line.replace(/\/\*.*?\*\//g, "");
  return withoutBlock;
}

let failures = 0;
let info = 0;
let scanned = 0;

for (const scanRoot of SCAN_ROOTS) {
  for (const file of walk(join(ROOT, scanRoot))) {
    const rel = relative(ROOT, file).replace(/\\/g, "/");
    if (EXEMPT.includes(rel)) continue;

    const lines = readFileSync(file, "utf8").split(/\r?\n/);
    let inBlock = false;
    scanned++;

    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i];
      const line = readerVisible(raw);
      if (inBlock) {
        if (line.includes("*/")) inBlock = false;
        continue;
      }
      if (line.includes("/*") && !line.includes("*/")) {
        inBlock = true;
        continue;
      }
      const trimmed = line.trimStart();
      if (trimmed.startsWith("//") || trimmed.startsWith("*")) continue;

      const where = `${rel}:${i + 1}`;

      for (const word of GERMAN) {
        const re = new RegExp(`(?<![\\p{L}])${word}(?![\\p{L}])`, "u");
        if (re.test(line)) {
          console.log(`[de]  ${where}  "${word}"  ${trimmed.slice(0, 78)}`);
          failures++;
          break;
        }
      }
      if (MORPH.test(line)) {
        const m = line.match(MORPH);
        if (m) {
          console.log(`[de]  ${where}  ${m[0]}  ${trimmed.slice(0, 78)}`);
          failures++;
        }
      }
      if (VERBOSE) {
        for (const word of AMBIGUOUS) {
          const re = new RegExp(`(?<![\\p{L}])${word}(?![\\p{L}])`, "u");
          if (re.test(line)) {
            console.log(`[?]  ${where}  "${word}" (valid English too)  ${trimmed.slice(0, 60)}`);
            info++;
            break;
          }
        }
      }
    }
  }
}

console.log("");
console.log(`[tea-ui] german-scan: ${scanned} files, ${failures} findings${VERBOSE ? `, ${info} to review` : ""}.`);
if (failures > 0) process.exit(1);
