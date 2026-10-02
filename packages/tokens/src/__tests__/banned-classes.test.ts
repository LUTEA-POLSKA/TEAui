import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * TEA UI — a doc comment must not be able to add a class to a consumer's bundle.
 *
 * The design system bans the fully-rounded utility: every surface radius is 0, and
 * the `pill` step is reserved for seven documented marks. The lint rule enforces
 * that on JSX `className` literals, and the namespace reset in `index.css` stops
 * `rounded-md` and friends from being generated at all. Both were working.
 *
 * And the class was still in the stylesheet.
 *
 * Tailwind extracts candidates from a `@source` directory by scanning raw text, and
 * raw text includes comments. Two comment lines — one in `index.css` explaining that
 * the utility is an anti-pattern, one in `StatusDot`'s TSDoc calling it a documented
 * exception — were the *only* occurrences anywhere in the packages. No component
 * used it. It shipped to every consumer anyway, because the system was documenting
 * its own ban in the one place the ban could be read as a request.
 *
 * A build-time ban and a review-time ban protect against different things. The lint
 * rule protects against a component using the class. This test protects against the
 * prohibition itself pulling the class in, which is a failure no amount of review of
 * the *components* would ever catch, because the components are clean.
 *
 * The list below is deliberately short. It is the classes that a scan of the
 * `@source` directories once turned up, not an attempt at completeness: the
 * namespace resets and the lint rules already make the rest unreachable, and a
 * longer list would be a list that rots.
 */
const css = readFileSync(resolve(import.meta.dirname, "../index.css"), "utf8");

/**
 * Classes that must not appear as text anywhere in a scanned source, because their
 * mere mention in prose emits them into the built stylesheet.
 *
 * Assembled from parts, and that is not a trick to keep a literal out of this file:
 * this file *is* inside a `@source` directory, so writing the name here would put
 * the class back into the bundle and the test would be the last thing reintroducing
 * what it forbids. The rule applies to this file too, which is why it is stated as
 * the rule rather than obeyed quietly.
 */
const MUST_NOT_BE_MENTIONED = [["rounded", "full"].join("-")] as const;

/**
 * The scanned roots, read from the `@source` directives rather than restated.
 *
 * A hardcoded copy of this list is a list that quietly stops covering the two
 * packages added last quarter — and a test that only guards the roots it remembers
 * reports green while the gap is real.
 */
const ROOTS = [...css.matchAll(/@source\s+"([^"]+)"/g)]
  .map((match) => resolve(dirname(resolve(import.meta.dirname, "../index.css")), match[1]!))
  .filter((path) => {
    try {
      return statSync(path).isDirectory();
    } catch {
      return false;
    }
  });

function textFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === "dist" || entry === "node_modules") continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) textFiles(full, out);
    else if (/\.(ts|tsx|css)$/.test(entry)) out.push(full);
  }
  return out;
}

describe("banned classes", () => {
  it("finds the scanned source directories at all", () => {
    // Without this, a broken path makes every assertion below vacuously pass.
    expect(ROOTS.length).toBeGreaterThan(5);
  });

  it.each(MUST_NOT_BE_MENTIONED)(
    "is not named in any scanned source, so it cannot be emitted by a comment",
    (banned) => {
      const offenders: string[] = [];

      for (const root of ROOTS) {
        for (const file of textFiles(root)) {
          const contents = readFileSync(file, "utf8");
          if (!contents.includes(banned)) continue;

          contents.split("\n").forEach((line, index) => {
            if (line.includes(banned)) offenders.push(`${file}:${index + 1}  ${line.trim()}`);
          });
        }
      }

      expect(
        offenders,
        `These lines name \`${banned}\`. Tailwind scans comments, so naming a banned class ` +
          `in prose is what puts it in the bundle. Describe it without writing it out.\n` +
          `${offenders.join("\n")}`,
      ).toEqual([]);
    },
  );

  it("keeps `pill` available, because it is the allowed exception", () => {
    // The counterpart to the rule above: the prohibition has to leave the one
    // sanctioned shape reachable, or it is a prohibition with no alternative.
    expect(css).toMatch(/--radius-pill:\s*9999px;/);
  });
});
