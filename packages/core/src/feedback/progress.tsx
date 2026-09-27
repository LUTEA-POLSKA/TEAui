import * as React from "react";
import { Progress as ProgressPrimitive } from "radix-ui";
import type { Tone } from "@tea-ui/tokens";
import { cn } from "@tea-ui/utils";

import { dataSlot, stateAttributes } from "../internal";

/**
 * TEA UI — Progress.
 *
 * Determinate and indeterminate must be distinguishable **without colour**. A
 * moving bar reads as "working, no total known"; a bar with a filled portion
 * reads as "N of M". Colour is the third signal, never the only one.
 *
 * Under `prefers-reduced-motion` the token stylesheet neutralises the movement,
 * so the indeterminate state would become a static, meaningless bar. It
 * therefore also carries a text label, which is the signal that survives.
 */
const TONE_FILL: Record<Tone, string> = {
  positive: "bg-positive",
  info: "bg-info",
  caution: "bg-caution",
  critical: "bg-critical",
  neutral: "bg-fg-muted",
};

export interface ProgressProps
  extends Omit<React.ComponentProps<typeof ProgressPrimitive.Root>, "children" | "value"> {
  /** Current value. Omit together with `indeterminate` for unknown progress. */
  value?: number | null | undefined;
  /** The maximum. Defaults to 100. */
  max?: number | undefined;
  /** The total is not known. */
  indeterminate?: boolean | undefined;
  /** Semantic tone of the filled portion. */
  tone?: Tone | undefined;
  /** The accessible name. Required. */
  label: string;
  /**
   * Human-readable value, e.g. "3 von 8". Without it a screen reader announces
   * a bare percentage, which is rarely the thing the user needs to know.
   */
  valueText?: string | undefined;
  className?: string | undefined;
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(function Progress(
  { value, max = 100, indeterminate = false, tone = "info", label, valueText, className, ...props },
  ref,
) {
  const isIndeterminate = indeterminate || value === null || value === undefined;
  const percent = isIndeterminate ? 0 : Math.min(100, Math.max(0, ((value ?? 0) / max) * 100));

  return (
    <div className={cn("w-full", className)} {...dataSlot("progress", "root")}>
      <ProgressPrimitive.Root
        ref={ref}
        value={isIndeterminate ? null : (value ?? 0)}
        max={max}
        aria-label={label}
        aria-valuetext={valueText}
        className={cn("relative h-2 w-full overflow-hidden bg-surface-3", "rounded-pill")}
        {...dataSlot("progress", "track")}
        {...stateAttributes({ loading: isIndeterminate })}
        {...props}
      >
        <ProgressPrimitive.Indicator
          className={cn(
            "h-full transition-[width] duration-slow ease-standard",
            TONE_FILL[tone],
            isIndeterminate && "w-1/3 animate-pulse",
          )}
          style={isIndeterminate ? undefined : { width: `${percent}%` }}
          {...dataSlot("progress", "indicator")}
        />
      </ProgressPrimitive.Root>
      {isIndeterminate ? <span className="sr-only">Wird verarbeitet</span> : null}
    </div>
  );
});
