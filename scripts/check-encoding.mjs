#!/usr/bin/env node
/**
 * TEA UI — the encoding guard.
 *
 * Audit rule 21: *"unencoded / double-encoded UTF-8 in any user-facing string"*,
 * with the enforcement the audit asked for — "`.editorconfig` `charset = utf-8`
 * plus a CI grep for the `Ã¢â‚¬` / `ÃƒÂ¤` / non-Latin-script signature" — and with
 * HSM's conclusion attached: **"this guard is needed before any extraction, or
 * the corruption moves with the strings."**
 *
 * That is not hypothetical here. This repository shipped commit `0df5138`,
 * "Repair mojibake in 40 files: text that passed through a cp1252 round-trip".
 * Forty files, including every package description. `scripts/repair-encoding.mjs`
 * fixed them, and it is a *repair* tool: it is invoked by hand, once, and then
 * never again. A repair tool that has already been run once is indistinguishable
 * from one that has been forgotten.
 *
 * So this is the other half. It is a **check**, it runs in `npm run verify`, and
 * it fails the build. That is the difference the repository's own lint header
 * insists on: "a rule that only exists in a document is a suggestion; a rule that
 * fails a build is a standard."
 *
 * ### What it detects
 *
 * Mojibake is a UTF-8 byte sequence decoded as cp1252, so it is not arbitrary:
 * the result is always a *run* of characters from the cp1252 high range sitting
 * next to ordinary punctuation, and the classic signatures are the em-dash
 * (`Ã¢â‚¬”`), every umlaut (`ÃƒÂ¤`, `ÃƒÂ¶`, `ÃƒÂ¼`, `ÃƒÅ¸`), the typographic quotes
 * (`Ã¢â‚¬Å“`) and the replacement character itself (`Ã¯Â¿Â½`). Each of those is
 * something this repository's copy legitimately contains **in its correct form**,
 * so the guard matches the *wrong* form, never the right one.
 *
 * Deliberately not detected: a genuine non-Latin script. The audit found Chinese
 * inside a German string in one product and called it a corruption vector, but
 * `åŠ›` is a valid character and a lint rule that flags it would eventually get
 * itself switched off by someone who needed it. Mojibake has a signature; that
 * is why it can be a rule and that one cannot.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve, extname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(import.meta.url), "..", "..");

const SCAN = ["packages", "apps", "scripts", "docs", "tests", "wiki"];
const EXTENSIONS = new Set([".ts", ".tsx", ".js", ".mjs", ".css", ".json", ".md", ".yml", ".yaml"]);

/** Directories that are never scanned. */
const SKIP = new Set(["node_modules", "dist", "dist-site", "reports", "screenshots", ".git", "target"]);

/**
 * Files exempt, and the reason each one is exempt. An exempt list is a claim
 * about what counts as corruption, so each entry has to survive the question
 * "why is this one allowed to be broken?".
 */
const EXEMPT = new Map([
  /*
   * The audit documents *quote* mojibake, because that is the evidence. A row in
   * `HSM-AUDIT.md` showing `ÃƒÂ¤` is a correct transcription of a defect, and
   * "fixing" it would destroy the finding. `eslint.config.mjs` exempts the same
   * directory for the same reason.
   */
  ["docs/audit", "quotes mojibake as evidence; repairing it would destroy the finding"],
  /*
   * The repair tool's own documentation names the corrupt sequences it hunts, for
   * the same reason. It is the one file that is *supposed* to contain them.
   */
  ["scripts/repair-encoding.mjs", "names the corrupt sequences it repairs"],
]);

/**
 * The wrong form of each character, and what it should have been.
 *
 * Every pattern is written as escape sequences. That is not a style preference —
 * it is the only way this file can be scanned by itself. A first version spelled
 * the patterns out literally and therefore matched its own source, which is the
 * fastest possible route to a rule somebody switches off: a checker that always
 * fails teaches you to ignore it, and then it protects nothing.
 *
 * The `\uFFFD` entry is the one that matters most in practice. A file that has
 * already been through a lossy round-trip carries the replacement character
 * where the text used to be, and no re-decode can bring that back — which is
 * why it is listed separately from the recoverable cases.
 */
const MOJIBAKE = [
  ["\u00e2\u20ac\u201d", "\u2014", "em dash"],
  ["\u00e2\u20ac\u2013", "\u2013", "en dash"],
  ["\u00e2\u20ac\u00a6", "\u2026", "ellipsis"],
  ["\u00e2\u20ac\u0153", "\u201c", "left double quote"],
  ["\u00e2\u20ac\ufffd", "\u201d", "right double quote"],
  ["\u00e2\u20ac\u02dc", "\u2018", "left single quote"],
  ["\u00e2\u20ac\u2122", "\u2019", "right single quote / apostrophe"],
  ["\u00c3\u00a4", "\u00e4", "a umlaut"],
  ["\u00c3\u00b6", "\u00f6", "o umlaut"],
  ["\u00c3\u00bc", "\u00fc", "u umlaut"],
  ["\u00c3\u009f", "\u00df", "eszett"],
  ["\u00c3\u0084", "\u00c4", "A umlaut"],
  ["\u00c3\u0096", "\u00d6", "O umlaut"],
  ["\u00c3\u009c", "\u00dc", "U umlaut"],
  ["\u00ef\u00bf\u00bd", "\ufffd", "replacement character (already lossy)"],
];

function exemptReason(relativePath) {
  // `relative()` returns backslashes on Windows and forward slashes everywhere
  // else. The keys in EXEMPT are written the portable way, so the comparison
  // happens on a normalised path — otherwise the whole exempt list silently
  // stops working on Windows, which is the machine this runs on.
  const normalised = relativePath.split("\\").join("/");
  for (const [prefix, reason] of EXEMPT) {
    if (normalised === prefix || normalised.startsWith(`${prefix}/`)) return reason;
  }
  return null;
}

function* filesIn(directory) {
  let entries;
  try {
    entries = readdirSync(directory, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (SKIP.has(entry.name)) continue;
    const full = join(directory, entry.name);
    if (entry.isDirectory()) {
      yield* filesIn(full);
    } else if (EXTENSIONS.has(extname(entry.name))) {
      yield full;
    }
  }
}

const findings = [];

for (const scope of SCAN) {
  for (const file of filesIn(join(root, scope))) {
    const relativePath = relative(root, file);
    if (exemptReason(relativePath)) continue;

    const text = readFileSync(file, "utf8");
    const lines = text.split(/\r?\n/);
    for (const [wrong, right, name] of MOJIBAKE) {
      let index = lines.findIndex((line) => line.includes(wrong));
      while (index !== -1) {
        findings.push({
          file: relativePath,
          line: index + 1,
          wrong,
          right,
          name,
          text: lines[index].trim().slice(0, 100),
        });
        index = lines.findIndex((line, i) => i > index && line.includes(wrong));
      }
    }
  }
}

if (findings.length === 0) {
  const exempt = [...EXEMPT.keys()].join(", ");
  console.log(
    `[tea-ui] encoding clean. ${MOJIBAKE.length} mojibake signatures checked; ` +
      `${EXEMPT.size} paths exempt (${exempt}).`,
  );
  process.exit(0);
}

console.error(`\n[tea-ui] ${findings.length} mojibake signature(s) found.\n`);
for (const finding of findings) {
  console.error(`  ${finding.file}:${finding.line}  ${finding.name}`);
  console.error(`    found:  ${finding.wrong}`);
  console.error(`    should: ${finding.right}`);
  console.error(`    in:     ${finding.text}`);
}
console.error(
  [
    "",
    "Audit-Befund 21: Text, der durch eine cp1252-Rundkonvertierung gelaufen ist.",
    "Ursache, nicht Symptom: eine Datei, die einmal durch eine verlustbehaftete",
    "Rundkonvertierung ging, ist nicht durch Umdeuten reparierbar — jeder weitere",
    "Durchlauf macht es schlimmer.",
    "",
    "node scripts/repair-encoding.mjs   # einmal ausführen, danach committen",
    "node scripts/check-encoding.mjs   # dieser Check, läuft in npm run verify",
  ].join("\n"),
);
process.exit(1);
