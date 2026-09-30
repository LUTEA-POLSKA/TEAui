import * as React from "react";
import type { Tone } from "@tea-ui/tokens";
import { cn, cva, type VariantProps } from "@tea-ui/utils";

/**
 * TEA UI Admin — the icon tile.
 *
 * Kill-list entry 6: five sites in one product rendering the same
 * `flex size-10 … bg-accent text-accent-foreground` block by hand. It is a small
 * component with one job — *be the icon of a row that also has text next to it*
 * — and it earns its place because getting it wrong has a cost: an icon tile
 * carries no label of its own, so the text beside it is the entire accessible
 * name. The tile must therefore never be focusable and never take a name.
 */
export const iconTileVariants = cva("flex shrink-0 items-center justify-center", {
  variants: {
    size: {
      sm: "size-7",
      md: "size-9",
      lg: "size-11",
    },
    tone: {
      neutral: "bg-surface-3 text-fg-muted",
      positive: "bg-positive-subtle text-positive",
      info: "bg-info-subtle text-info",
      caution: "bg-caution-subtle text-caution",
      critical: "bg-critical-subtle text-critical",
      brand: "bg-accent text-accent-fg",
    },
  },
  defaultVariants: { size: "md", tone: "neutral" },
});

/**
 * `aria-label` and `aria-hidden` are omitted from the props on purpose.
 *
 * A tile that can be named is a tile that will be: someone reaches for
 * `aria-label` to satisfy a linter, and the screen reader then announces "Server"
 * immediately before the product name, which is the duplication this component
 * exists to prevent. The only two legal states are the two in the props, and the
 * type is how that is enforced — the same trick `IconButton` uses to make an
 * unnamed button impossible.
 */
export interface IconTileProps
  extends Omit<React.ComponentProps<"span">, "aria-label" | "aria-hidden">,
    VariantProps<typeof iconTileVariants> {
  /** The glyph. Decorative by default — see `standalone`. */
  children: React.ReactNode;
  /**
   * Set `true` only when the tile is the *sole* content of a control, in which
   * case the glyph IS the label and must not be hidden. The default is
   * `aria-hidden`, because a tile next to a product name would otherwise make a
   * screen reader read the icon and the name as two things.
   */
  standalone?: boolean | undefined;
}

export const IconTile = React.forwardRef<HTMLSpanElement, IconTileProps>(function IconTile(
  { children, standalone = false, className, size, tone, ...props },
  ref,
) {
  return (
    <span
      ref={ref}
      aria-hidden={standalone ? undefined : true}
      className={cn(iconTileVariants({ size, tone }), className)}
      {...props}
    >
      {children}
    </span>
  );
});

/* -------------------------------------------------------------------------- */
/* CardGrid                                                                    */
/* -------------------------------------------------------------------------- */

export interface CardGridProps extends React.ComponentProps<"ul"> {
  /** Minimum card width. The grid auto-fits, so there is no column count. */
  minCardWidth?: string | undefined;
  children: React.ReactNode;
}

/**
 * Kill-list entry 17: seven card grids in one product, each with its own
 * `grid-cols-*` and breakpoint, and two outliers that used a plain flex row.
 *
 * The reason this is a component and not a `className` is that a grid whose
 * column count is fixed per breakpoint is a grid that is wrong at some width:
 * one card at 400px in a four-column grid is a column of whitespace. An
 * auto-fit grid with a minimum width has no wrong width.
 *
 * It is a `<ul>`, because a grid of resources is a list, and a list is what a
 * screen reader can count. The consumer's cards are {@link CardGridItem}s.
 */
export const CardGrid = React.forwardRef<HTMLUListElement, CardGridProps>(function CardGrid(
  { minCardWidth = "18rem", className, children, ...props },
  ref,
) {
  return (
    <ul
      ref={ref}
      style={{ gridTemplateColumns: `repeat(auto-fit, minmax(min(${minCardWidth}, 100%), 1fr))` }}
      className={cn("m-0 grid list-none gap-ui p-0", className)}
      {...props}
    >
      {children}
    </ul>
  );
});

/** A card as an item of a {@link CardGrid}. */
export const CardGridItem = React.forwardRef<HTMLLIElement, React.ComponentProps<"li">>(
  function CardGridItem({ className, ...props }, ref) {
    return <li ref={ref} className={cn("min-w-0", className)} {...props} />;
  },
);

export type { Tone };
