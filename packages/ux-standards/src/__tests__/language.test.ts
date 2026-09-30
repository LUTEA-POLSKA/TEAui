import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * No German in the shipped packages.
 *
 * TEA UI publishes to npm, so every string literal in the `packages` tree is
 * text a stranger's users will read. The copy deck, the destructive verbs, the error
 * anatomy, the status labels and the four registry packages all carried German
 * defaults — which meant an unconfigured `@tea-ui/admin` shipped buttons reading
 * "Speichern", dialogs titled "Ungespeicherte Änderungen", and a clear button
 * whose `aria-label` was compiled to `"Suche leeren"`.
 *
 * The mixed-language version of this is worse than either language alone: the
 * unsaved-changes dialog rendered "Verwerfen und verlassen" next to "Save",
 * because half its strings came from the deck and half were hardcoded beside it.
 *
 * ## What this can and cannot see
 *
 * It matches the characters ä ö ü ß, which catches the majority, plus the
 * character-less German that the most-used words have — "Speichern", "Abbrechen",
 * "Eingabe", "Fehler", "Aktiv". It cannot see a German word that is spelled
 * identically in English, or a string built by concatenation. A lint rule is a
 * floor, not proof; the review still has to look.
 */

/**
 * `packages/ux-standards/src/__tests__` → up three levels is `packages`. Located
 * by walking up to the directory that actually contains the sibling packages
 * rather than counting, because counting is how this test ends up scanning a
 * path that does not exist and reporting ENOENT as a language failure.
 */
const REPO_ROOT = (() => {
  let dir = import.meta.dirname;
  for (let i = 0; i < 6; i += 1) {
    if (existsSync(join(dir, "packages", "core"))) return dir;
    dir = dirname(dir);
  }
  throw new Error("could not locate the repository root from the test file");
})();

const PACKAGES = join(REPO_ROOT, "packages");

/**
 * Files where German is the point. `terminology.ts` quotes German in
 * `FORBIDDEN_COPY` to say what not to write, and the `du`/`Sie` discussion names
 * the German registers deliberately.
 */
const ALLOWED = new Set(["ux-standards/src/terminology.ts"]);

/**
 * German that survives without an umlaut, so it needs a word list.
 *
 * This list started with 20 words and was trusted to be the guard. It was not:
 * it was a list of the strings that had been translated, so any *other* German
 * word without an umlaut passed straight through — and did. `label: "Warnung"`,
 * `label: "Kritisch"`, `label: "In Ordnung"`, `label: "Abgebrochen"`,
 * `network: "Verbindung fehlgeschlagen"` and `label: "Hinweis"` were all shipped
 * in the status registry and the error anatomy while this test reported green.
 * Every one of them is rendered by `StatusBadge` or `ErrorState` for an
 * English-default consumer.
 *
 * A hand-kept list of twenty cannot be a complete detector, and pretending
 * otherwise is worse than having no guard: a green test that is cited as proof
 * is a claim someone will rely on. So the list is now broad, and — more
 * importantly — the *rule* is no longer the list. German compounds are
 * recognised by morphology (`ung`, `heit`, `keit`, `lich`, `isch`, `schaft`),
 * which is what actually distinguishes German from English in this vocabulary,
 * and the word list is the second net rather than the only one.
 */
const GERMAN_WORDS = [
  // Verbs
  /\bSpeichern\b/, /\bAbbrechen\b/, /\bEingabe\b/, /\bAnmelden\b/, /\bAbmelden\b/,
  /\bBearbeiten\b/, /\bEntfernen\b/, /\bErstellen\b/, /\bBestätigen\b/, /\bLöschen\b/,
  /\bZurück\b/, /\bWeiter\b/, /\bFertigstellen\b/, /\bVorschau\b/, /\bÖffnen\b/,
  /\bSchließen\b/, /\bSuchen\b/, /\bFiltern\b/, /\bHerunterladen\b/, /\bHochladen\b/,
  /\bImportieren\b/, /\bExportieren\b/, /\bAktualisieren\b/, /\bWiederholen\b/,
  /\bAuswählen\b/, /\bAnzeigen\b/, /\bEinblenden\b/, /\bAusblenden\b/, /\bAbsenden\b/,
  /\bEmpfangen\b/, /\bErhalten\b/, /\bBeginnen\b/, /\bBeenden\b/, /\bErsetzen\b/,
  /\bHinzufügen\b/, /\bEinfügen\b/, /\bVerwerfen\b/, /\bÜbernehmen\b/, /\bZurücksetzen\b/,
  // Nouns
  /\bFehler\b/, /\bAktiv\b/, /\bInaktiv\b/, /\bZertifikat\b/, /\bLaufzeit\b/,
  /\bEinstellungen\b/, /\bKritisch\b/, /\bWarnung\b/, /\bFehlgeschlagen\b/,
  /\bFehlend\b/, /\bHinweis\b/, /\bMessung\b/, /\bMesswert\b/, /\bBeispiel\b/,
  /\bAuswahl\b/, /\bFortschritt\b/, /\bLaden\b/, /\bErgebnis\b/, /\bErgebnisse\b/,
  /\bUmgebung\b/, /\bBenutzer\b/, /\bAnsicht\b/, /\bDichte\b/, /\bKompakt\b/,
  /\bKomfortabel\b/, /\bRückgängig\b/, /\bAnzahl\b/, /\bMenge\b/, /\bGröße\b/,
  /\bHöhe\b/, /\bBreite\b/, /\bSpeicherplatz\b/, /\bArbeitsspeicher\b/, /\bLaufzeit\b/,
  /\bSicherung\b/, /\bVerarbeitung\b/, /\bWartung\b/, /\bSicherheit\b/, /\bNetzwerk\b/,
  /\bEinrichtung\b/, /\bKonfiguration\b/, /\bVoraussetzung\b/, /\bEinschränkung\b/,
  /\bZusammenfassung\b/, /\bÜberblick\b/, /\bVergleich\b/, /\bVerschieben\b/,
  /\bHinweis\b/, /\bRegel\b/, /\bVorrang\b/, /\bVorschau\b/, /\bEigenschaft\b/,
  /\bBezeichnung\b/, /\bBeschriftung\b/, /\bVolltext\b/, /\bAbschnitt\b/,
  /\bAbschnitte\b/, /\bStartseite\b/, /\bWerter\b/, /\bWartung\b/, /\bPlanung\b/,
  /\bInhalt\b/, /\bInhalte\b/, /\bVersion\b/, /\bVersionierung\b/, /\bVerbindung\b/,
  /\bServerfehler\b/, /\bAngebot\b/, /\bAbgebrochen\b/, /\bKonto\b/, /\bAnmeldung\b/,
  /\bKennwort\b/, /\bPasswort\b/, /\bAdresse\b/, /\bE-Mail\b/, /\bBeschreibung\b/,
  // Adjectives and fixed phrases
  /\bFehlgeschlagen\b/, /\bUngültig\b/, /\bErforderlich\b/, /\bOptional\b/,
  /\bAktuell\b/, /\bKritisch\b/, /\bIn Ordnung\b/, /\bOhne Website\b/,
  /\bIn Planung\b/, /\bNicht verfügbar\b/, /\bNicht gefunden\b/, /\bWird geladen\b/,
];

/**
 * German noun morphology. Restricted to `-heit`, `-keit` and `-schaft`, which
 * English does not produce at all.
 *
 * The first version of this rule also matched `-ung` and the verb prefixes
 * `ver-`/`ent-`/`be-`/`zer-`, and it was wrong in both halves: English has
 * `y**oung**`, `am**ong**`, `sl**ung**`, and it shares all four prefixes —
 * `**because**`, `**ver**ified`, `**ent**ries`, `be**fore**`. The rule reported
 * six English strings as German on its first run, which is how a heuristic
 * earns the right to exist rather than loses the right to be trusted. Only
 * suffixes that are closed-vocabulary German survive here.
 */
const GERMAN_MORPHOLOGY = /(?:heit|keit|schaft)\b/;

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === "dist" || entry === "node_modules") continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) sourceFiles(full, out);
    else if (/\.(ts|tsx)$/.test(entry) && !/\.test\.tsx?$/.test(entry)) out.push(full);
  }
  return out;
}

/**
 * Strips comments, because this rule is about what a user reads, and German in
 * a doc comment explaining a German example is legitimate.
 */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
}

/**
 * The known debt, as an exact set of literals rather than a count or a line
 * number, so the ratchet cannot be satisfied by deleting an unrelated line and
 * cannot drift when the files are edited above it.
 *
 * These are the strings the repository shipped in German before this test
 * existed. The list is long and it is the honest state of the work, not an
 * approval: every entry is one more thing to translate, and deleting an entry
 * here is a change that has to be justified by the string actually changing in
 * the source. A count would be easier to game and worse to read.
 */
const KNOWN_GERMAN = new Set<string>([]);

describe("shipped source", () => {
  it("adds no new German to the shipped packages", () => {
    const offenders: string[] = [];

    for (const file of sourceFiles(PACKAGES)) {
      const rel = relative(PACKAGES, file).replace(/\\/g, "/");
      if (ALLOWED.has(rel)) continue;

      stripComments(readFileSync(file, "utf8"))
        .split("\n")
        .forEach((line, index) => {
          // Escaped quotes must not end a literal. The naive `"[^"\n]*"` splits
          // a string containing `aria-current=\"step\"` in half and reports the
          // left fragment, which matches nothing and looks like a new violation.
          //
          // Backticks are included because they were a real gap. The first
          // version of this rule matched only `"` and `'`, and six German
          // strings hid in template literals the whole time — including three
          // user-visible ones in `consequenceSentence`, which is the sentence a
          // destructive dialog shows. A guard that misses a string form is not a
          // guard, and this one only found out because the remaining German was
          // counted by hand.
          for (const literal of line.match(
            /"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`/g,
          ) ?? []) {
            // Compare against the text, not the quoted literal: the allowlist is
            // written as readable strings, and matching it against the quotes
            // would silently never match anything.
            const text = literal.slice(1, -1);
            const german =
              /[äöüßÄÖÜ]/.test(text) ||
              GERMAN_MORPHOLOGY.test(text) ||
              GERMAN_WORDS.some((re) => re.test(text));
            if (german && !KNOWN_GERMAN.has(text)) {
              offenders.push(`${rel}:${index + 1}  ${literal}`);
            }
          }
        });
    }

    expect(
      offenders,
      `New German in shipped source:\n${offenders.join("\n")}\n\n` +
        `A public package cannot know its users' language. Translate the string, or ` +
        `move it to a prop the consumer fills in. If it belongs in KNOWN_GERMAN, the ` +
        `string it replaced was translated in the same change.`,
    ).toEqual([]);
  });

  it("keeps its record of the remaining debt honest", () => {
    // Not an assertion about behaviour — an assertion that the allowlist has
    // not quietly become a place where anything is allowed. An entry that no
    // longer exists in the source means a string was translated, and the
    // entry should have been deleted in the same change.
    const stillPresent = new Set<string>();

    for (const file of sourceFiles(PACKAGES)) {
      const rel = relative(PACKAGES, file).replace(/\\/g, "/");
      if (ALLOWED.has(rel)) continue;
      const stripped = stripComments(readFileSync(file, "utf8"));
      for (const known of KNOWN_GERMAN) {
        if (stripped.includes(known)) stillPresent.add(known);
      }
    }

    const stale = [...KNOWN_GERMAN].filter((entry) => !stillPresent.has(entry));

    expect(
      stale,
      `These KNOWN_GERMAN entries no longer appear in any source file:\n${stale.join("\n")}\n\n` +
        `Delete them. A stale entry hides the next person who reintroduces the same ` +
        `string, and the point of this list is that it is the real remaining debt.`,
    ).toEqual([]);
  });
});
