import * as React from "react";
import { cn } from "@tea-ui/utils";
import { COPY } from "@tea-ui/ux-standards";

import { dataSlot } from "../internal";

/**
 * TEA UI — Spinner.
 *
 * The spinner is the *least* preferred loading affordance in TEA UI: it says
 * "something is happening" without saying what or how much. Use a skeleton when
 * there is a layout to mirror, determinate progress when the total is known,
 * and a spinner only when neither applies.
 *
 * Two things it must get right, both of which the audit found broken:
 *  - It announces itself. `role="status"` plus a text label, so a screen reader
 *    user learns that the wait started. A bare spinning SVG is silent.
 *  - It survives reduced motion. Rotation is the one animation that carries
 *    meaning, so rather than freezing it, `data-tea-motion="essential"` swaps it
 *    for a non-rotating pulse in the token stylesheet.
 */
export type SpinnerSize = "sm" | "md" | "lg";

export interface SpinnerProps extends Omit<React.ComponentProps<"svg">, "children"> {
  /** Visible size. */
  size?: SpinnerSize;
  /**
   * Accessible name. Defaults to "Wird geladen". Pass an empty string only if
   * the surrounding surface already announces the wait — never pass nothing.
   */
  label?: string;
  className?: string | undefined;
}

const SIZES: Record<SpinnerSize, string> = {
  sm: "size-3.5",
  md: "size-4",
  lg: "size-6",
};

export const Spinner = React.forwardRef<SVGSVGElement, SpinnerProps>(function Spinner(
  { size = "md", label = COPY.states.loading, className, ...props },
  ref,
) {
  return (
    <span
      role="status"
      className="inline-flex items-center gap-2"
      {...dataSlot("spinner", "root")}
    >
      <svg
        ref={ref}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden={label ? undefined : true}
        className={cn(
          "shrink-0 animate-spin text-current",
          SIZES[size],
          className,
        )}
        data-tea-motion="essential"
        {...props}
      >
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" opacity="0.25" />
        <path
          d="M21 12a9 9 0 0 0-9-9"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="butt"
        />
      </svg>
      {label ? <span className="sr-only">{label}</span> : null}
    </span>
  );
});
