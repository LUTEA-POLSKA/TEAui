import * as React from "react";
import type { Tone } from "@tea-ui/tokens";
import { cn } from "@tea-ui/utils";

import { dataSlot } from "../internal";

/**
 * TEA UI — Meter.
 *
 * A scalar measurement inside a known range: 87 % of a disk, 3 of 5 backups, a
 * quota. It is **not** `Progress`, and the difference is not cosmetic:
 *
 * |            | `Progress`                        | `Meter`                  |
 * |------------|-----------------------------------|--------------------------|
 * | means      | a task is getting done            | a quantity is this much  |
 * | goes up by | time passing                      | something happening      |
 * | at 100 %   | finished                          | possibly *over* the mark |
 *
 * The audit found three hand-built meters in one product (`h-1.5 … bg-muted` plus
 * an inner width written inline) and **none of them had a role** — no
 * `aria-valuenow`, no accessible name, so a screen reader read them as three
 * empty divs. `MetricCard` in the admin layer had a hand-rolled `role="meter"`;
 * this is the extraction of it, and `MetricCard` now composes it.
 *
 * ### On `role="meter"` rather than `role="progressbar"`
 *
 * `CONSOLIDATION.md` §6 S1c prescribes `role="progressbar"` for this component.
 * That is followed for `Progress` and deliberately **not** for `Meter`, because
 * the audit's own goal is the reason to depart: the rule exists so that "the
 * real attribute is for the accessibility tree" rather than for the dataset.
 *
 * WAI-ARIA 1.2 defines them as different things. `progressbar` is *"a
 * progress indicator for task completion"*; `meter` is *"a scalar measurement
 * within a known range"*, and the spec notes it is specifically **not** about
 * loading progress. A disk at 87 % is a measurement. Announcing it as task
 * progress tells the user something is 87 % finished, which is a different and
 * usually wrong claim.
 *
 * `aria-valuetext` is the part that makes the number useful: a raw `87` for a
 * range of `0…100` is announced as a bare figure, and "87 von 100 GB belegt" is
 * the sentence the user needed.
 */
export interface MeterThreshold {
  /** At or above this value the band applies. Bands are matched top-down. */
  at: number;
  tone: Tone;
}

export interface MeterProps extends Omit<React.ComponentProps<"div">, "color"> {
  /** The measurement. May exceed `max` — an over-quota disk is still a reading. */
  value: number;
  /** The upper bound of the range. Defaults to 100. */
  max?: number | undefined;
  /**
   * The accessible name. **Required** — the audit's unnamed bars are exactly
   * what this component exists to end, and a required prop is worth more than a
   * paragraph in a style guide.
   */
  label: string;
  /** The measurement in words, e.g. "18,4 GB von 25 GB belegt". */
  valueText?: string | undefined;
  /**
   * Where the colour changes, highest first. The first band whose `at` the
   * value reaches wins, so the order in this array is meaningful and the
   * comparison is "from the top down" — which is how a threshold ladder reads
   * to a human and how nobody has to think about boundaries.
   */
  thresholds?: readonly MeterThreshold[] | undefined;
  /** Overrides the threshold verdict. Use when the caller already decided. */
  tone?: Tone | undefined;
  /** Track and bar height. `sm` for a table cell, `md` for a panel. */
  size?: "sm" | "md" | "lg" | undefined;
  /**
   * Draw the threshold marks onto the track. A band that only exists as a colour
   * is a band a user cannot point at.
   */
  showThresholds?: boolean | undefined;
  className?: string | undefined;
}

const TONE_FILL: Record<Tone, string> = {
  positive: "bg-positive",
  info: "bg-info",
  caution: "bg-caution",
  critical: "bg-critical",
  neutral: "bg-fg-muted",
};

const TONE_MARK: Record<Tone, string> = {
  positive: "bg-positive/40",
  info: "bg-info/40",
  caution: "bg-caution/40",
  critical: "bg-critical/40",
  neutral: "bg-fg-subtle/40",
};

const SIZE: Record<NonNullable<MeterProps["size"]>, string> = {
  sm: "h-1",
  md: "h-1.5",
  lg: "h-2.5",
};

/** Top-down, so the highest threshold a value reaches is the one that applies. */
function resolveTone(value: number, thresholds: readonly MeterThreshold[] | undefined): Tone {
  if (!thresholds || thresholds.length === 0) return "neutral";
  const ordered = [...thresholds].sort((a, b) => b.at - a.at);
  return ordered.find((threshold) => value >= threshold.at)?.tone ?? "neutral";
}

export const Meter = React.forwardRef<HTMLDivElement, MeterProps>(function Meter(
  {
    value,
    max = 100,
    label,
    valueText,
    thresholds,
    tone,
    size = "md",
    showThresholds = false,
    className,
    ...props
  },
  ref,
) {
  // Clamped for the bar, kept raw for the numbers: over-quota is a fact the
  // user needs, even though a bar cannot be drawn past its end.
  const percent = max === 0 ? 0 : Math.min(100, Math.max(0, (value / max) * 100));
  const resolved = tone ?? resolveTone(value, thresholds);

  return (
    <div ref={ref} className={cn("w-full", className)} {...dataSlot("meter", "root")} {...props}>
      <div
        role="meter"
        // `aria-valuenow` is clamped: a value beyond the range is not a value
        // outside the range, and an AT clamping it differently would announce a
        // figure the component never showed. The surplus is in `valueText`.
        aria-valuenow={Math.min(max, Math.max(0, value))}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuetext={valueText}
        aria-label={label}
        // `pill` is a documented radius exception: progress and load indicators
        // are the reason a rounded end exists in this design language at all.
        className={cn("relative w-full overflow-hidden bg-surface-3", "rounded-pill", SIZE[size])}
        {...dataSlot("meter", "track")}
      >
        <div
          className={cn("h-full rounded-pill", TONE_FILL[resolved])}
          style={{ width: `${percent}%` }}
          {...dataSlot("meter", "fill")}
        />
        {/*
          The marks sit above the fill. They are the reason `showThresholds` is
          worth having: a band the user cannot see the edge of is a band they
          cannot reason about before they hit it.
        */}
        {showThresholds && thresholds && thresholds.length > 0
          ? [...thresholds]
              .sort((a, b) => b.at - a.at)
              .map((threshold) => (
                <span
                  key={`${threshold.tone}-${threshold.at}`}
                  aria-hidden="true"
                  className={cn("absolute inset-y-0 w-px", TONE_MARK[threshold.tone])}
                  style={{ insetInlineStart: `${Math.min(100, Math.max(0, (threshold.at / max) * 100))}%` }}
                  {...dataSlot("meter", "threshold")}
                />
              ))
          : null}
      </div>
    </div>
  );
});

/**
 * The German band labels a score or a meter falls into.
 *
 * A band is a word, not a hue. The audit's four score renderings included a bare
 * `font-mono` number with no colour at all, which is the honest end of that road
 * — and two others that used a hex, which is the dishonest end. This is the
 * middle: the number, the word, and the tone as the third signal.
 */
export const METER_BANDS = {
  /** Measured and worth acting on. */
  good: "Gut",
  /** Measurable, worth watching, not yet a problem. */
  fair: "Mittel",
  /** Approaching or past a limit. */
  poor: "Schwach",
  /** No measurement, or a value outside the range entirely. */
  unknown: "Unbekannt",
} as const;

export type MeterBand = keyof typeof METER_BANDS;
