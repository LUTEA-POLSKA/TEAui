import * as React from "react";
import type { Tone } from "@tea-ui/tokens";
import { cn, cva, type VariantProps } from "@tea-ui/utils";

import { Card, Meter, stateAttributes } from "@tea-ui/core";

/**
 * TEA UI Admin — the metric tile.
 *
 * The audit found **six named stat-tile functions plus four inline variants**
 * in one product, and **two near-identical 90%-overlapping `StatCard`s** in the
 * other — including two functions with the *same name* and different props,
 * which is the exact thing a shared library has to kill. They also disagreed
 * about whether the value or the label came first.
 *
 * The resolution, made once:
 *  - the **value is the subject**, so the value leads and is the largest type;
 *  - the label sits above it as an uppercase micro-label, because that is what
 *    a scanning eye reads first in a row of tiles;
 *  - colour is a `tone`, never a raw class, and it is never the only signal —
 *    the tone always comes with a word;
 *  - a trend is an arrow *and* a signed percentage, so it survives a
 *    greyscale print and a screen reader.
 */
export const statTileVariants = cva("flex flex-col gap-1 border border-line bg-surface p-4", {
  variants: {
    layout: {
      /** Value first. The default, and the right one for a dashboard. */
      stacked: "",
      /** Label and value side by side. For a dense table column. */
      inline: "flex-row items-baseline justify-between gap-3",
    },
  },
  defaultVariants: { layout: "stacked" },
});

export type Trend = "up" | "down" | "flat";

export interface StatTileProps
  extends React.ComponentProps<"div">,
    VariantProps<typeof statTileVariants> {
  /** What is measured. Read as an eyebrow, above the value. */
  label: string;
  /** The measurement. A formatted string — formatting is the caller's job. */
  value: React.ReactNode;
  /** Secondary text under the value: a unit, a period, a comparison. */
  hint?: React.ReactNode | undefined;
  /** Semantic tone of the value. Never a raw colour. */
  tone?: Tone | undefined;
  /** Direction of change. An arrow plus a signed number, never colour alone. */
  trend?: Trend | undefined;
  /** The change itself, e.g. "+4 %". Required when `trend` is given. */
  trendValue?: string | undefined;
  /** Accessible description of the trend, e.g. "up compared to last week". */
  trendDescription?: string | undefined;
  /** Icon before the label. Decorative. */
  icon?: React.ReactNode | undefined;
}

const TONE_TEXT: Record<Tone, string> = {
  positive: "text-positive",
  info: "text-info",
  caution: "text-caution",
  critical: "text-critical",
  neutral: "text-fg",
};

const TREND_GLYPH: Record<Trend, string> = { up: "\u2191", down: "\u2193", flat: "\u2192" };
const TREND_WORD: Record<Trend, string> = { up: "rising", down: "falling", flat: "unchanged" };

export const StatTile = React.forwardRef<HTMLDivElement, StatTileProps>(function StatTile(
  {
    label,
    value,
    hint,
    tone = "neutral",
    trend,
    trendValue,
    trendDescription,
    icon,
    layout = "stacked",
    className,
    ...props
  },
  ref,
) {
  return (
    <div ref={ref} className={cn(statTileVariants({ layout }), className)} {...props}>
      <div className="flex items-center gap-1.5">
        {icon ? (
          <span aria-hidden="true" className="text-fg-subtle">
            {icon}
          </span>
        ) : null}
        <span className="text-label font-semibold uppercase tracking-widest text-fg-muted">{label}</span>
      </div>

      <div className="flex items-baseline gap-2">
        <span className={cn("text-display font-semibold leading-none", TONE_TEXT[tone])}>{value}</span>
        {trend && trendValue ? (
          <span className={cn("text-micro", trend === "up" ? "text-positive" : trend === "down" ? "text-critical" : "text-fg-muted")}>
            <span aria-hidden="true">{TREND_GLYPH[trend]} </span>
            {trendValue}
            {/* The arrow glyph is decorative; this is the part that carries the
                meaning when the colour and the shape are unavailable. */}
            <span className="sr-only">
              {" "}
              ({trendDescription ?? `${TREND_WORD[trend]} compared to the previous period`})
            </span>
          </span>
        ) : null}
      </div>

      {hint ? <p className="text-micro text-fg-muted">{hint}</p> : null}
    </div>
  );
});

export interface MetricCardProps extends StatTileProps {
  /** A meter under the value, for a bounded resource. */
  percent?: number | undefined;
}

/**
 * A stat tile with a bounded resource under it. The meter is the third signal
 * beside the number and the tone, so a value of 87 % does not depend on being
 * read as amber.
 *
 * The bar used to be hand-rolled here — a `role="meter"` div with an inline
 * width — which is exactly what the audit's three unnamed meters in the source
 * product looked like. It is `Meter` now, so the role, `aria-valuenow` and the
 * `valueText` live in one place.
 */
export const MetricCard = React.forwardRef<HTMLDivElement, MetricCardProps>(function MetricCard(
  { percent, tone = "neutral", label, ...props },
  ref,
) {
  return (
    <Card className="flex flex-col gap-2 p-4" ref={ref}>
      <StatTile {...props} label={label} tone={tone} />
      {typeof percent === "number" ? (
        <Meter value={percent} label={label} tone={tone} />
      ) : null}
    </Card>
  );
});

/* -------------------------------------------------------------------------- */

export interface StatGridProps extends React.ComponentProps<"div"> {
  /** Minimum tile width; the grid auto-fits. */
  minTileWidth?: string | undefined;
  children: React.ReactNode;
}

/** A responsive row of tiles. No per-breakpoint column counts to maintain. */
export const StatGrid = React.forwardRef<HTMLDivElement, StatGridProps>(function StatGrid(
  { minTileWidth = "12rem", className, children, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      style={{ gridTemplateColumns: `repeat(auto-fit, minmax(min(${minTileWidth}, 100%), 1fr))` }}
      className={cn("grid gap-ui", className)}
      {...props}
    >
      {children}
    </div>
  );
});

export { stateAttributes };
