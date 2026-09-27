import * as React from "react";
import { cn, cva, type VariantProps } from "@tea-ui/utils";
import { COPY } from "@tea-ui/ux-standards";

import { dataSlot } from "../internal";

/**
 * TEA UI — Skeleton.
 *
 * The *default* loading affordance in TEA UI, per the performance UX standard.
 * A skeleton that mirrors the real layout is strictly better than a spinner: it
 * tells the user what is arriving, it reserves the space so the page does not
 * jump, and it never replaces content the user is already reading.
 *
 * It is decorative by definition — it depicts nothing that exists — so it is
 * `aria-hidden`. The loading *message* is a separate, real element; `label`
 * renders it as visually hidden text, or you pass the message to whatever
 * announces the region. The audit found eight hand-written "Lade …" loaders in
 * one product and a fully built, completely unused `Skeleton` beside them.
 */
export const skeletonVariants = cva("animate-pulse bg-surface-3", {
  variants: {
    shape: {
      rect: "rounded-none",
      pill: "rounded-pill",
      circle: "rounded-pill",
    },
  },
  defaultVariants: { shape: "rect" },
});

export interface SkeletonProps
  extends Omit<React.ComponentProps<"div">, "children">,
    VariantProps<typeof skeletonVariants> {
  /**
   * Accessible text. Omit when the surrounding region already announces that it
   * is loading — never leave a bare animated block with no context anywhere.
   */
  label?: string | undefined;
}

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(function Skeleton(
  { className, shape, label, style, ...props },
  ref,
) {
  return (
    <>
      <div
        ref={ref}
        aria-hidden={label ? undefined : true}
        className={cn(skeletonVariants({ shape }), className)}
        data-tea-skeleton
        data-tea-motion="decorative"
        style={shape === "circle" ? { borderRadius: "9999px", ...style } : style}
        {...dataSlot("skeleton")}
        {...props}
      />
      {label ? <span className="sr-only">{label || COPY.states.loading}</span> : null}
    </>
  );
});

export interface SkeletonTextProps extends React.ComponentProps<"div"> {
  /** How many lines to reserve. */
  lines?: number | undefined;
  className?: string | undefined;
}

/** A paragraph-shaped skeleton, for text blocks of unknown length. */
export const SkeletonText = React.forwardRef<HTMLDivElement, SkeletonTextProps>(function SkeletonText(
  { lines = 3, className, ...props },
  ref,
) {
  return (
    <div ref={ref} className={cn("flex flex-col gap-2", className)} {...dataSlot("skeleton", "text")} {...props}>
      {Array.from({ length: Math.max(1, lines) }, (_, index) => (
        <Skeleton
          key={index}
          className={cn("h-3", index === lines - 1 ? "w-2/3" : "w-full")}
          {...dataSlot("skeleton", "line")}
        />
      ))}
    </div>
  );
});
