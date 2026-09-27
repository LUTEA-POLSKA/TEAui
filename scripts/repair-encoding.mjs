import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";

/**
 * TEA UI — encoding repair.
 *
 * Text written through a cp1252 round-trip ended up in the repository as
 * mojibake: an em-dash stored as the three characters `â€"`, which renders as
 * `TEA UI â€”` and would ship to npm in every package description.
 *
 * Two earlier attempts at a whole-file round-trip damaged the sources, and both
 * failures are worth recording, because they are the two ways to get this wrong:
 *
 *   - A `latin1` inverse drops the euro sign. U+20AC is above U+00FF, so a latin1
 *     encoder cannot represent the byte it stands for, and the result no longer
 *     parses as JSON.
 *   - A whole-file rewrite also rewrites characters that were never corrupt. The
 *     files carry a UTF-8 BOM, and a catch-all fallback rewrote it to `?`, so the
 *     very first character of every file became garbage and TypeScript stopped at
 *     line 1 of each one.
 *
 * So this only ever rewrites the mojibake itself. A run of cp1252-representable
 * characters is mapped back to bytes and decoded as UTF-8; everything outside such
 * a run is left byte-for-byte alone. U+FEFF is deliberately excluded from the run
 * alphabet so a BOM survives untouched.
 */

/** cp1252 code point -> byte. Only the ranges where cp1252 != latin1. */
const HIGH = new Map([
  [0x20ac, 0x80], [0x201a, 0x82], [0x0192, 0x83], [0x201e, 0x84], [0x2026, 0x85],
  [0x2020, 0x86], [0x2021, 0x87], [0x02c6, 0x88], [0x2030, 0x89], [0x0160, 0x8a],
  [0x2039, 0x8b], [0x0152, 0x8c], [0x017d, 0x8e], [0x2018, 0x91], [0x2019, 0x92],
  [0x201c, 0x93], [0x201d, 0x94], [0x2022, 0x95], [0x2013, 0x96], [0x2014, 0x97],
  [0x02dc, 0x98], [0x2122, 0x99], [0x0161, 0x9a], [0x203a, 0x9b], [0x0153, 0x9c],
  [0x017e, 0x9e], [0x0178, 0x9f],
]);

/**
 * The first character of a genuine mojibake run.
 *
 * Mojibake is a UTF-8 sequence decoded as cp1252, so it always opens with the
 * cp1252 rendering of a UTF-8 lead byte: C2 renders as `Â`, C3 as `Ã`, and the
 * three-byte sequences used by the punctuation in this repository open with E2,
 * which renders as `â`. A run that does not start with one of these was never
 * mojibake.
 *
 * This distinction is not academic. Most of the repository is *correctly* encoded
 * and contains an em-dash (U+2014), an arrow (U+2192) and box-drawing characters
 * as themselves. A repair that treated every high code point as damage would
 * rewrite those into the replacement character, and the source would stop
 * compiling — which is precisely what an earlier version of this script did.
 */
const LEAD = new Set([0x00c2, 0x00c3, 0x00e2]);

/** A character that a cp1252 decode could have produced. */
const FROM_CP1252 = (point) =>
  (point >= 0x80 && point <= 0xff && point !== 0xfeff) || HIGH.has(point);

function byteOf(point) {
  return HIGH.get(point) ?? point;
}

/** Decode one maximal run of cp1252-ish characters back into the text it was. */
function repairRun(run) {
  const bytes = Buffer.from([...run].map((char) => byteOf(char.codePointAt(0))));
  return bytes.toString("utf8");
}

/**
 * Repair, but only where the evidence says so.
 *
 * A run is rewritten when it opens with a mojibake lead byte and decodes to valid
 * UTF-8. Anything else is returned untouched, character for character, so text
 * that was already correct cannot be damaged by the presence of damage elsewhere.
 */
export function repair(text) {
  let out = "";
  let run = "";

  const flush = () => {
    if (!run) return;
    const first = run.codePointAt(0);
    if (!LEAD.has(first)) {
      out += run;
    } else {
      const decoded = repairRun(run);
      out += decoded.includes("�") ? run : decoded;
    }
    run = "";
  };

  for (const char of text) {
    if (FROM_CP1252(char.codePointAt(0))) {
      run += char;
      continue;
    }
    flush();
    out += char;
  }
  flush();
  return out;
}

const SKIP = /node_modules|[\\/]dist|dist-site|[\\/]\.git|reports/u;
const EXT = new Set([".json", ".ts", ".tsx", ".md", ".mjs", ".css", ".html", ".yml", ".yaml", ".txt"]);

const write = process.argv.includes("--write");
const touched = [];
const rejected = [];

(function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (SKIP.test(path)) continue;
    if (entry.isDirectory()) {
      walk(path);
      continue;
    }
    if (!EXT.has(extname(entry.name))) continue;
    if (statSync(path).size > 4_000_000) continue;

    const before = readFileSync(path, "utf8");
    const after = repair(before);
    if (after === before) continue;

    // Refuse anything that did not come out clean, rather than writing it.
    if (after.includes("�")) {
      rejected.push(`${path} (replacement character)`);
      continue;
    }
    if (/â€/.test(after)) {
      rejected.push(`${path} (mojibake remains)`);
      continue;
    }
    if (after.charCodeAt(0) !== before.charCodeAt(0)) {
      rejected.push(`${path} (first character changed)`);
      continue;
    }
    if (extname(path) === ".json") {
      try {
        JSON.parse(after);
      } catch (error) {
        rejected.push(`${path} (would not parse: ${error.message.slice(0, 60)})`);
        continue;
      }
    }

    if (write) writeFileSync(path, after, "utf8");
    touched.push(path);
  }
})(".");

console.log(`${write ? "repaired" : "would repair"} ${touched.length} files`);
for (const path of rejected) console.log(`  rejected ${path}`);
