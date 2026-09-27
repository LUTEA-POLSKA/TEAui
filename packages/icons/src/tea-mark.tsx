import * as React from "react";
import { cn, slot as slotName } from "@tea-ui/utils";

/**
 * TEA UI — the brand mark.
 *
 * A geometric mark built from the same laws the rest of the system obeys:
 * sharp corners, no gradients, a single accent. It exists so a product can
 * identify the design system without shipping a raster asset, and so the mark
 * is themeable rather than baked.
 *
 * Accessibility follows the contract: a mark with a `title` is a labelled
 * image; a mark without one is decoration and leaves the accessibility tree
 * entirely. There is no middle ground where it is "probably decorative".
 */
export interface TeaMarkProps extends React.ComponentProps<"svg"> {
  /**
   * Accessible name. Omit when the mark sits next to a visible wordmark — it is
   * then redundant and must be hidden from assistive technology.
   */
  title?: string | undefined;
  className?: string | undefined;
}

export const TeaMark = React.forwardRef<SVGSVGElement, TeaMarkProps>(function TeaMark(
  { title, className, ...props },
  ref,
) {
  const labelled = Boolean(title);
  return (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      fill="none"
      role={labelled ? "img" : undefined}
      aria-hidden={labelled ? undefined : true}
      aria-label={labelled ? title : undefined}
      data-slot={slotName("brand", "mark")}
      className={cn("size-6 text-primary", className)}
      {...props}
    >
      {labelled ? <title>{title}</title> : null}
      {/* Three ascending bars: the TEA "stack" idea, drawn in the angular
          language of the system rather than a rounded app-store style. */}
      <path d="M2 20h4v-6H2v6Z" fill="currentColor" opacity="0.45" />
      <path d="M7 20h4V9H7v11Z" fill="currentColor" opacity="0.72" />
      <path d="M12 20h4V4h-4v16Z" fill="currentColor" />
      <path d="M17 20h4v-9h-4v9Z" fill="currentColor" opacity="0.6" />
    </svg>
  );
});
