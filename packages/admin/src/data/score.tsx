import * as React from "react";
import { Meter, type MeterThreshold } from "@tea-ui/core";
import type { Tone } from "@tea-ui/tokens";
import { cn } from "@tea-ui/utils";

/**
 * TEA UI Admin — Score.
 *
 * The audit counted **four renderings of one score in one product**, with two
 * different threshold sets, four hard-coded hexes that duplicated a status table
 * that was itself broken, and one rendering — a bare `font-mono` number with no
 * colour at all — that got the accessibility right by giving up the meaning.
 *
 * The concrete cost: a value of 42 read as *neutral* on the dashboard
 * (`>=70` green, `>=40` amber, else grey) and as *warning* in the auditor
 * (`>=70` green, `>=45` amber, else red). Same product, same number, two
 * answers. The audit notes the divergence "may be intentional" — and it may be,
 * because a lead score and an audit score are different questions. So the fix is
 * not to pick one silently. It is to make the table one object that a product
 * passes in, and to be explicit about what the default says.
 *
 * ### The default, and why it is the stricter one
 *
 * `CONSOLIDATION.md` §8.4 leaves this `DECISION REQUIRED` and does not settle it.
 * TEA UI ships {@link DEFAULT_SCORE_BANDS} as the default, and the default is the
 * **auditor** set, not the dashboard set, for one reason: a scale that cannot
 * express failure trains people to stop reading it. The dashboard set maps its
 * lowest band to `neutral`, so a score of zero — a total failure — renders
 * indistinguishably from a score of 39, which is merely bad. That is audit rule
 * 38, "a control that lies", reached through a colour mapping.
 *
 * A product that genuinely means the softer reading passes
 * {@link DASHBOARD_SCORE_BANDS}. Both are exported so neither is a magic number
 * at a call site.
 *
 * ### Never colour alone
 *
 * The number, the band word, and the tone are three signals. A score is 62 and
 * reads *Elevated*; greyscale, a screen reader and a colour-blind user all get
 * the same answer.
 */
export interface ScoreBand {
  /** At or above this value the band applies. Matched top-down. */
  at: number;
  tone: Tone;
  /** The word. Mandatory — a band without a word is a hue. */
  label: string;
}

/**
 * The default: the stricter of the two threshold sets the audit found.
 *
 * ### Why this set, and what was dropped from it
 *
 * `CONSOLIDATION.md` §8.4 leaves this `DECISION REQUIRED` and does not settle it.
 * The two products differed in **two** ways, and only one of them is defensible:
 *
 * | divergence | dashboard | auditor | defensible? |
 * |---|---|---|---|
 * | the middle threshold | `>= 40` | `>= 45` | **yes** — a lead score and an audit score are different questions |
 * | the tone of a low score | `neutral` (grey) | `critical` (red) | **no** |
 *
 * The second one is a defect in both, not a domain difference: grey says "no
 * measurement", and a score of 0 measured and found wanting is not the same fact
 * as no score at all. Collapsing them is audit rule 38 — "a control that lies" —
 * reached through a colour mapping. So {@link DEFAULT_SCORE_BANDS} keeps the
 * auditor's *tone* and the dashboard's is available only as
 * {@link LEAD_SCORE_BANDS}, which differs in the threshold and nothing else.
 *
 * "No measurement" is not a band here at all. It is `indeterminate`, which
 * renders no bar, because a bar at zero is a claim about a reading that was never
 * taken.
 */
/**
 * The words a score is described in.
 *
 * Deliberately **not** `METER_BANDS`, and the divergence is the point.
 *
 * A `Meter` reports a quantity measured *against a limit* — utilisation, memory
 * pressure — so higher is worse, and the tone ladder (`Normal` / `Elevated` /
 * `Critical`) is exactly right for it. A `Score` reports *achievement* — a lead
 * score, an audit result — so higher is better, and that ladder reads backwards:
 * a lead score of 62 renders "62 Elevated", and 44 renders "44 Critical", which
 * describes a score rather than a system in trouble. Translating `METER_BANDS`
 * out of German exposed the coupling rather than creating it — the German
 * happened to say "Mittel" and "Schwach", which read correctly for a score and
 * would not have for a meter.
 *
 * So the two vocabularies are separate, and this one is a grade scale. The
 * *tones* stay shared, because colour genuinely does mean the same thing in both
 * places; only the word follows the direction of the number.
 */
export const SCORE_BANDS = {
  /** At or above the top band. */
  good: "Good",
  /** Between the two bands — neither strong nor weak. */
  fair: "Fair",
  /** Below the lower band. */
  poor: "Poor",
  /**
   * No score was taken. Not "Poor": a missing measurement is not a bad one, and
   * `indeterminate` is the case where this component deliberately renders no bar,
   * because a bar at zero is a claim about a reading that was never taken.
   */
  unknown: "No score",
} as const;

export const DEFAULT_SCORE_BANDS: readonly ScoreBand[] = [
  { at: 70, tone: "positive", label: SCORE_BANDS.good },
  { at: 45, tone: "caution", label: SCORE_BANDS.fair },
  { at: 0, tone: "critical", label: SCORE_BANDS.poor },
];

/**
 * The dashboard's softer threshold: the middle band opens at 40 instead of 45.
 *
 * Exported so a product that means the softer *reading* names the difference
 * rather than writing `40` at a call site. The tone of a low score is
 * `critical` here too — see the table in {@link DEFAULT_SCORE_BANDS} for why that
 * half of the divergence is not offered.
 */
export const LEAD_SCORE_BANDS: readonly ScoreBand[] = [
  { at: 70, tone: "positive", label: SCORE_BANDS.good },
  { at: 40, tone: "caution", label: SCORE_BANDS.fair },
  { at: 0, tone: "critical", label: SCORE_BANDS.poor },
];

/** The band a score falls into. */
export function scoreBand(value: number, bands: readonly ScoreBand[] = DEFAULT_SCORE_BANDS): ScoreBand {
  const ordered = [...bands].sort((a, b) => b.at - a.at);
  // The lowest band is the floor, so a value below every threshold still lands
  // somewhere. A score with no band is a score with no verdict, which is the one
  // outcome this component exists to prevent.
  return ordered.find((band) => value >= band.at) ?? ordered[ordered.length - 1]!;
}

/** The same bands, as `Meter` thresholds, so a bar and a number cannot disagree. */
function toThresholds(bands: readonly ScoreBand[]): MeterThreshold[] {
  return [...bands].sort((a, b) => b.at - a.at).map(({ at, tone }) => ({ at, tone }));
}

export interface ScoreProps extends Omit<React.ComponentProps<"div">, "color"> {
  /** The score. On the `max` scale. */
  value: number;
  /** The upper bound. Defaults to 100, which is what a score out of a hundred is. */
  max?: number | undefined;
  /** The accessible name. Defaults to `label` when one is given. */
  label?: string | undefined;
  /** What is being scored, e.g. "Lead quality". */
  caption?: string | undefined;
  /**
   * The band table. Pass {@link DASHBOARD_SCORE_BANDS} to opt into the softer
   * reading; the default is {@link DEFAULT_SCORE_BANDS}.
   */
  bands?: readonly ScoreBand[] | undefined;
  /** Draw the bar as well as the number. */
  showMeter?: boolean | undefined;
  /**
   * The number is not known. Renders the unknown band and **no** bar, because a
   * bar at zero is a claim about a measurement that was never taken.
   */
  indeterminate?: boolean | undefined;
  className?: string | undefined;
}

const TONE_TEXT: Record<Tone, string> = {
  positive: "text-positive",
  info: "text-info",
  caution: "text-caution",
  critical: "text-critical",
  neutral: "text-fg-muted",
};

export const Score = React.forwardRef<HTMLDivElement, ScoreProps>(function Score(
  { value, max = 100, label, caption, bands = DEFAULT_SCORE_BANDS, showMeter = true, indeterminate = false, className, ...props },
  ref,
) {
  const resolved = indeterminate
    ? { at: 0, tone: "neutral" as Tone, label: SCORE_BANDS.unknown }
    : scoreBand(value, bands);
  const thresholds = toThresholds(bands);
  const percent = max === 0 ? 0 : Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div ref={ref} className={cn("flex flex-col gap-1.5", className)} {...props}>
      {caption ? (
        <span className="text-label font-semibold uppercase tracking-widest text-fg-muted">{caption}</span>
      ) : null}

      <div className="flex items-baseline gap-2">
        {/*
          The number is the subject, so it is the largest type — the same
          decision `StatTile` made, and for the same reason.
        */}
        <span
          className={cn("text-title font-semibold leading-none tabular-nums", TONE_TEXT[resolved.tone])}
          // The visible number is not a label. The band's word is, and the two
          // together are the sentence a screen reader needs.
          aria-hidden={label ? true : undefined}
        >
          {indeterminate ? "—" : Math.round(percent)}
        </span>
        {/*
          The band word sits beside the number and never leaves. It is the signal
          that survives greyscale, and the one that makes the score mean something
          without its colour.
        */}
        <span className={cn("text-micro", TONE_TEXT[resolved.tone])}>{resolved.label}</span>
        {label ? <span className="sr-only">{label}</span> : null}
      </div>

      {showMeter && !indeterminate ? (
        <Meter
          value={value}
          max={max}
          label={label ?? caption ?? resolved.label}
          valueText={`${Math.round(percent)} of ${max} — ${resolved.label}`}
          thresholds={thresholds}
          showThresholds
        />
      ) : null}
    </div>
  );
});
