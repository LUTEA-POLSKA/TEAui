import * as React from "react";
import { Slot } from "radix-ui";
import type { Tone } from "@tea-ui/tokens";
import { cn, cva, type VariantProps } from "@tea-ui/utils";

import { dataSlot } from "../internal";

/**
 * TEA UI — Badge.
 *
 * A short, static label. Deliberately not a status: for that, use `StatusBadge`
 * from `status.tsx`, which reads the shared status registry. Two renderers for
 * two different jobs is the point — a source project had *seven* ad-hoc status
 * renderers, none of which agreed.
 *
 * Two audit defects are fixed here:
 *  - **Element.** The source project's Badge rendered a `<div>` and was placed
 *    inside `<p>` elements across three pages. That is invalid HTML, and
 *    assistive technology handles it unpredictably. A Badge renders a `<span>`.
 *  - **Geometry.** It renders `rounded-none`. In this design language a pill is
 *    a status, and using it decoratively destroys that meaning.
 */
export const badgeVariants = cva(
  [
    "inline-flex items-center gap-1 border px-2 py-0.5 text-micro font-medium leading-none",
    "whitespace-nowrap",
  ],
  {
    variants: {
      variant: {
        subtle: "border-transparent",
        solid: "border-transparent",
        outline: "bg-transparent",
      },
      tone: {
        positive: "",
        info: "",
        caution: "",
        critical: "",
        neutral: "",
      },
    },
    compoundVariants: [
      { variant: "subtle", tone: "positive", class: "bg-positive-subtle text-positive border-positive-border" },
      { variant: "subtle", tone: "info", class: "bg-info-subtle text-info border-info-border" },
      { variant: "subtle", tone: "caution", class: "bg-caution-subtle text-caution border-caution-border" },
      { variant: "subtle", tone: "critical", class: "bg-critical-subtle text-critical border-critical-border" },
      { variant: "subtle", tone: "neutral", class: "bg-neutral-subtle text-fg-muted border-neutral-border" },

      { variant: "solid", tone: "positive", class: "bg-positive text-positive-fg" },
      { variant: "solid", tone: "info", class: "bg-info text-info-fg" },
      { variant: "solid", tone: "caution", class: "bg-caution text-caution-fg" },
      { variant: "solid", tone: "critical", class: "bg-critical text-critical-fg" },
      { variant: "solid", tone: "neutral", class: "bg-neutral text-neutral-fg" },

      { variant: "outline", tone: "positive", class: "border-positive text-positive" },
      { variant: "outline", tone: "info", class: "border-info text-info" },
      { variant: "outline", tone: "caution", class: "border-caution text-caution" },
      { variant: "outline", tone: "critical", class: "border-critical text-critical" },
      { variant: "outline", tone: "neutral", class: "border-line-strong text-fg-muted" },
    ],
    defaultVariants: { variant: "subtle", tone: "neutral" },
  },
);

export interface BadgeProps
  extends Omit<React.ComponentProps<"span">, "color">,
    VariantProps<typeof badgeVariants> {
  /** Render the consumer's child element instead of a `<span>`. */
  asChild?: boolean | undefined;
  className?: string | undefined;
  /** Convenience passthrough so a tone can be derived from a status. */
  tone?: Tone | undefined;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { className, variant, tone, asChild = false, ...props },
  ref,
) {
  const Component = asChild ? Slot.Root : "span";
  return (
    <Component
      ref={ref}
      className={cn(badgeVariants({ variant, tone, className }))}
      {...dataSlot("badge")}
      {...props}
    />
  );
});
