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
 * identically in English, or a string built by concatenation, and it reads string
 * literals only: German in a doc comment ships in the `.js.map` and is invisible
 * to it. A lint rule is a floor, not proof; the review still has to look. The
 * word list below is where each hand-fixed string is recorded, and it is the
 * receipt for that review, not a substitute for it.
 *
 * That blind spot is not theoretical and it is now measured twice. Every German
 * `@example` in `core`, `admin` and `public` — a `<FieldLabel>Anzahl</FieldLabel>`,
 * an `aria-label="Ansicht"`, a `Defaults to "Wird geladen"` that no longer matched
 * the code beneath it — was found by reading, and fixed by reading. And of the
 * strings removed from `METER_BANDS` and the four scope registries, 96 of 112
 * would have passed this file untouched. The comment below on the word list is
 * the full account; the short version is that the guard catches a recurrence of a
 * *word*, and a reviewer catches a recurrence of a *sentence*.
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
 *
 * It happened a second time anyway, which is the finding worth writing down. A
 * line-by-line audit of the `ux-standards` registries — every `label`,
 * `title`, `description` and prose array entry, read rather than grepped —
 * found twenty-three more shipped strings: `label: "Bereit"`,
 * `label: "Hoch"`, `label: "Fehlt"`, `label: "Kunde"`,
 * `description: "Erster Kontakt hergestellt, Antwort steht aus."`. Not one of
 * them has an umlaut, and several are short enough to read as a key name rather
 * than a language, which is precisely how a word list built from the strings
 * that were already found misses the ones that were not.
 *
 * So the list is a receipt, not a detector. Every entry is a string that had to
 * be translated by hand, added in the same change that translated it. It stays
 * incomplete until the next audit, and the honest thing is to say so rather than
 * to widen it and imply the widening closed anything.
 *
 * It happened a third time, and this one is the measurement worth keeping. Once
 * the `METER_BANDS` registry and the four scope registries were translated, the
 * strings removed from *those files* were run back through this file's own rules
 * to see which of them the guard would actually have stopped: **16 of 112**.
 * Every one of the sixteen had an umlaut, a `ß` or an entry already in this
 * list. The other ninety-six had none of those, and shipped — `includes:
 * ["Rechnungen", "Zahlungsmittel"]`, `solves: "Benachrichtigungen lesen,
 * filtern und als gelesen markieren."`, `good: "Gut"`.
 *
 * The same sweep then read past those files and found four more *shipped string
 * literals* the guard had never been able to see: `<span
 * className="sr-only">Wird verarbeitet</span>` in `Progress`, `{busy ? "Wird
 * gesendet" : …}` in the public conversion form, and `Technische Details` /
 * `Referenz:` in `ErrorState`. `Wird` is in the list below for exactly that
 * reason — enumerating the phrases one at a time is how four of them got
 * through.
 *
 * The shape of the miss is the finding. The registry packages are *sentences*,
 * not labels, and a German sentence is mostly function words: `die`, `der`,
 * `und`, `mit`, `liegt`, `bleibt`, `gilt`. Detecting those reliably needs a
 * parser or a language model, and neither belongs in a unit test — so they are
 * not attempted here, and the net stays lexical. What the list gained instead is
 * the *content* word of every German sentence that shipped, because a recurrence
 * is a sentence about the same subject and will reach for the same noun. The
 * four groups below are the ones that were not on the list: the billing and
 * payment vocabulary, the monitoring vocabulary, the interaction and layout
 * vocabulary, and the band words.
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
  // From the ux-standards audit, where the German had no umlaut and read like an
  // identifier. Status and feedback labels: nouns and participles, each one the
  // `label` of a registry entry that `StatusBadge` or a progress line renders.
  /\bBereit\b/, /\bErfolgreich\b/, /\bUnbekannt\b/, /\bAusstehend\b/,
  /\bAbgelaufen\b/, /\bErstellt\b/, /\bPausiert\b/, /\bGestoppt\b/, /\bFehlt\b/,
  /\bUnbearbeitet\b/, /\bArchiviert\b/, /\bAbgeschlossen\b/, /\bHoch\b/,
  /\bWartungsmodus\b/, /\bInteresse\b/, /\bKontakt\b/, /\bKontaktiert\b/,
  /\bKunde\b/, /\bVeraltete\b/, /\bErster\b/, /\bAntwort\b/,
  // Phrases, because here the words alone would not separate German from code:
  // `Wird` and `neu` are short enough to occur in ordinary text, and `In Arbeit`
  // is two words that read as English taken one at a time.
  /\bWird ausgerollt\b/, /\bStartet neu\b/, /\bIn Arbeit\b/,
  /\bVeraltete Daten\b/, /\bNeuer Versuch\b/, /\bErster Kontakt\b/,
  /* --- From the METER_BANDS and scope-registry translation ------------------
   * The four registry packages, and `METER_BANDS`, in German. Recorded as the
   * content words rather than the sentences, because a recurrence of the German
   * will be a new sentence about the same subject and will reuse the noun even
   * where every function word around it is different. */
  // The band words. `Unbekannt` is above; these three had no umlaut and no entry.
  /\bGut\b/, /\bMittel\b/, /\bSchwach\b/,
  // Billing and payments — the `Billing` and `ApiManagement` blueprints.
  /\bRechnungen?\b/, /\bZahlungsmittel\b/, /\bAbrechnungsintervalle?\b/,
  /\bPlanwechsel\b/, /\bZahlungsanbieter\b/, /\bRechnungsgestaltung\b/,
  /\bKontingente?\b/, /\bWiderruf\b/, /\bAuthentifizierung\b/,
  // Monitoring — the `Monitoring` blueprint and the `MonitoringTemplate`.
  /\bDienststatus\b/, /\bDienste\b/, /\bRessourcenmetriken?\b/, /\bEreignis\b/,
  /\bEreignisse\b/, /\bEreignisliste[n]?\b/, /\bAlarmliste[n]?\b/, /\bMesswerte\b/,
  /\bSchwellen\b/, /\bSchwellenwerte?\b/, /\bStatusleiste\b/, /\bZeitreihe[n]?\b/,
  // Interaction, list and layout vocabulary — `PATTERNS` and the interaction
  // contracts in `BLUEPRINTS`, where German reads as a sentence rather than a label.
  /\bSortierung\b/, /\bFilterzustand\b/, /\bFilterwert\b/, /\bUngelesen\b/,
  /\bEintrag\b/, /\bReihenfolge\b/, /\bReihe\b/, /\bSchritte?\b/, /\bSpalte\b/,
  /\bSpalten\b/, /\bZeile\b/, /\bZeilen\b/, /\bZeilennummern?\b/, /\bTabelle\b/,
  /\bMetrik\b/, /\bPaginierung\b/, /\bLogformat\b/, /\bPersistenz\b/,
  // Access, permissions and channels.
  /\bRollen\b/, /\bZuordnungen?\b/, /\bBerechtigungen\b/, /\bBerechtigungsmodell\b/,
  /\bGelesen\b/, /\bMarkierung\b/, /\bZugangsdaten\b/,
  /\bZugang\b/, /\bGegenstelle\b/, /\bProtokollwahl\b/, /\bTestsendung\b/,
  // The specialised components — `SPECIALIZED`, where German sat in `rules`.
  /\bAchsen\b/, /\bRaster\b/, /\bKontrast\b/, /\bDiagramm\b/, /\bTextalternative\b/,
  /\bDatentabelle\b/, /\bZeichenbibliothek\b/, /\bSyntaxhervorheber\b/,
  /\bTastatur\b/, /\bPlatzhalter\b/, /\bGesamtzahl\b/, /\bZustand\b/,
  /\bZentrale\b/, /\bsichtbar\b/, /\bunsichtbar\b/,
  // Copy and legal — the landing and auth templates.
  /\bTexte\b/, /\bSEO-Texte\b/, /\bRechtliches\b/, /\bWeiterleitung\b/,
  /\bFehlertexte?\b/, /\bWeiterer Zugang\b/,
  // The infinitive and participle forms a German sentence is built from. The
  // single most common shape in the registries: a claim about what a component
  // does, stated as a verb phrase.
  /\bmarkiert\b/, /\bbleibt\b/, /\bbleiben\b/, /\bgespeichert\b/, /\bbesucht\b/,
  /\berreicht\b/, /\bbraucht\b/, /\berledigt\b/, /\bverschwinden\b/, /\bliegt\b/,
  /\bgilt\b/, /\bgibt\b/, /\bverarbeitet\b/, /\bbelegt\b/, /\bgescrollt\b/,
  /\bScrollen\b/, /\bdurchsuchen\b/, /\bwurde\b/, /\bworden\b/,
  // Single words that read as an English token and so were invisible: `Raster`
  // is "grid", `Gut` is "good", `Mittel` is "fair". `Aktionen` is "actions".
  /\bAktionen?\b/, /\bAnzeigename\b/, /\bPflichtfeld\b/, /\bProzent\b/,
  /\bRessourcen\b/, /\bSeit\b/, /\bMonat\b/, /\bMonate\b/, /\bTage\b/, /\bTagen\b/,
  /\bWoche\b/, /\bWochen\b/, /\bZeitraum\b/, /\bZeit\b/, /\bFarbe\b/, /\bZahl\b/,
  // The German present tense of *werden*, plus the two words that were still
  // shipped in `public` and `admin` after everything above was translated.
  // `Wird` is enumerated here rather than one phrase at a time because the
  // phrases it heads are open-ended — `Wird geladen`, `Wird ausgerollt`,
  // `Wird gesendet` — and each one cost a string literal to discover.
  /\bWird\b/, /\bWerde\b/, /\bWurde\b/, /\bWurden\b/,
  /\bTechnisch\w*/, /\bReferenz\b/, /\bGitternetz\b/, /\bLade\b/,
  /* --- The fourth occurrence, and the one the previous three did not predict -----
   * `core/src/format/index.ts` shipped German in two places while this file
   * reported green: `formatDuration` returned `2 Std. 14 Min.` and the exported
   * `TIME_FORMAT_TOKENS` returned `Nie`, `Gerade eben` and `Vor 3 Min.`.
   *
   * The reason is the one this file already names: German without an umlaut that is
   * not on the list. It is worse here than in the registries, because the previous
   * three sweeps were over *registry labels* — a category that can be enumerated. A
   * formatter was not in any of those sweeps, so the class of thing being swept was
   * never the class of thing that shipped.
   *
   * `Vor` is the one worth flagging. It is a preposition, it is two letters of
   * nothing in particular, and the timestamp helpers are exactly where a reader
   * looks first when something reads wrong. */
  /\bVor\b/, /\bNie\b/, /\bGerade\b/, /\bSek\.?\b/, /\bStd\.?\b/, /\bMin\.?\b/,
  /\bTg\.?\b/, /\bZuletzt\b/,
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
 *
 * **It is empty.** `METER_BANDS` and the four scope registries have been
 * translated, the two entries that were parked here are gone from the source, and
 * the German the word list above could not see has been added to the list rather
 * than suppressed here. That is the only way this set is allowed to shrink: by
 * changing the string, or by making the guard able to see it.
 *
 * An empty holding pen is a better state than a short one. A set that is never
 * emptied is a suppression list with a comment explaining why, and the second
 * test below is what stops that from happening quietly — it fails on the first
 * entry whose string is no longer in any source file, so the cost of parking a
 * string here is that the next person to fix it also has to delete the entry.
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
    //
    // This asserts nothing while `KNOWN_GERMAN` is empty, and that is the point
    // of the empty set rather than an argument against it: the test is armed for
    // the first entry anybody parks, so parking costs the next person an edit
    // rather than costing this file its meaning.
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
