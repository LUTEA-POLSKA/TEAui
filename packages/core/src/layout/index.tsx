import * as React from "react";
import { Slot } from "radix-ui";
import { cn } from "@tea-ui/utils";

import { dataSlot } from "../internal";

/**
 * TEA UI — layout primitives.
 *
 * Product-agnostic structure, with no opinions about what a page *is*. Density
 * is not a prop here: `Stack` and friends read `--tea-gap` and
 * `--tea-section-gap`, so a compact table inside a comfortable page retunes
 * itself without either container knowing about the other. That is the whole
 * reason density is expressed in CSS rather than in props.
 */

export interface BoxProps extends React.ComponentProps<"div"> {
  asChild?: boolean | undefined;
  as?: React.ElementType | undefined;
}

/** The escape hatch. A `div` that contributes nothing but structure. */
export const Box = React.forwardRef<HTMLDivElement, BoxProps>(function Box(
  { asChild = false, as, className, ...props },
  ref,
) {
  const Component = (asChild ? Slot.Root : (as ?? "div")) as React.ElementType;
  return <Component ref={ref} className={cn(className)} {...dataSlot("box")} {...props} />;
});

export interface StackProps extends React.ComponentProps<"div"> {
  direction?: "vertical" | "horizontal" | undefined;
  /**
   * The gap step. `ui` reads the density variable; `section` uses the larger
   * one; a Tailwind class is accepted for deliberate one-offs.
   */
  gap?: "ui" | "section" | "none" | string | undefined;
  align?: React.CSSProperties["alignItems"] | undefined;
  justify?: React.CSSProperties["justifyContent"] | undefined;
  wrap?: boolean | undefined;
  children: React.ReactNode;
}

const GAP: Record<"ui" | "section" | "none", string> = {
  ui: "gap-ui",
  section: "section-gap",
  none: "gap-0",
};

export const Stack = React.forwardRef<HTMLDivElement, StackProps>(function Stack(
  { direction = "vertical", gap = "ui", align, justify, wrap = false, className, style, children, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      style={{ alignItems: align, justifyContent: justify, ...style }}
      className={cn(
        "flex",
        direction === "vertical" ? "flex-col" : "flex-row",
        wrap && "flex-wrap",
        gap === "ui" || gap === "section" || gap === "none" ? GAP[gap] : gap,
        className,
      )}
      {...dataSlot("stack")}
      {...props}
    >
      {children}
    </div>
  );
});

export const HStack = React.forwardRef<HTMLDivElement, Omit<StackProps, "direction">>(
  function HStack(props, ref) {
    return <Stack ref={ref} direction="horizontal" {...props} />;
  },
);

export const VStack = React.forwardRef<HTMLDivElement, Omit<StackProps, "direction">>(
  function VStack(props, ref) {
    return <Stack ref={ref} direction="vertical" {...props} />;
  },
);

export interface FlexProps extends React.ComponentProps<"div"> {
  direction?: React.CSSProperties["flexDirection"] | undefined;
  align?: React.CSSProperties["alignItems"] | undefined;
  justify?: React.CSSProperties["justifyContent"] | undefined;
  wrap?: boolean | undefined;
  grow?: boolean | undefined;
  shrink?: boolean | undefined;
  basis?: string | number | undefined;
  gap?: string | number | undefined;
  children: React.ReactNode;
}

/** Escape-hatch flexbox, for when a Stack's opinion is wrong. */
export const Flex = React.forwardRef<HTMLDivElement, FlexProps>(function Flex(
  { direction, align, justify, wrap, grow, shrink, basis, gap, className, style, children, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      style={{
        flexDirection: direction,
        alignItems: align,
        justifyContent: justify,
        flexGrow: grow ? 1 : undefined,
        flexShrink: shrink ? 1 : undefined,
        flexBasis: basis,
        gap,
        ...style,
      }}
      className={cn("flex", wrap && "flex-wrap", className)}
      {...dataSlot("flex")}
      {...props}
    >
      {children}
    </div>
  );
});

export interface GridProps extends React.ComponentProps<"div"> {
  cols?: number | undefined;
  /**
   * Auto-fit columns that never fall below `minChildWidth`. This is the
   * responsive default for card grids, and it is why a TEA card grid needs no
   * per-breakpoint column counts.
   */
  minChildWidth?: string | undefined;
  gap?: "ui" | "section" | "none" | string | undefined;
  children: React.ReactNode;
}

export const Grid = React.forwardRef<HTMLDivElement, GridProps>(function Grid(
  { cols, minChildWidth, gap = "ui", className, style, children, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      style={{
        gridTemplateColumns: minChildWidth
          ? `repeat(auto-fit, minmax(min(${minChildWidth}, 100%), 1fr))`
          : cols
            ? `repeat(${cols}, minmax(0, 1fr))`
            : undefined,
        ...style,
      }}
      className={cn("grid", gap === "ui" || gap === "section" || gap === "none" ? GAP[gap] : gap, className)}
      {...dataSlot("grid")}
      {...props}
    >
      {children}
    </div>
  );
});

export const CONTAINER_SIZES = {
  xs: "max-w-xs",
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
  "6xl": "max-w-6xl",
  full: "max-w-none",
} as const;

export interface ContainerProps extends React.ComponentProps<"div"> {
  /** The measure. Admin panels are `full`; Public UI prose uses `lg`–`3xl`. */
  size?: keyof typeof CONTAINER_SIZES | undefined;
  /** Centre the container. Off for a container inside a grid cell. */
  center?: boolean | undefined;
  children: React.ReactNode;
}

export const Container = React.forwardRef<HTMLDivElement, ContainerProps>(function Container(
  { size = "6xl", center = true, className, children, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(CONTAINER_SIZES[size], center && "mx-auto", "w-full px-4 md:px-6", className)}
      {...dataSlot("container")}
      {...props}
    >
      {children}
    </div>
  );
});

export interface SpacerProps extends React.ComponentProps<"div"> {
  /** The gap step to insert. */
  size?: "ui" | "section" | "none" | string | undefined;
  /** Grow to fill the remaining space instead of a fixed gap. */
  grow?: boolean | undefined;
}

export const Spacer = React.forwardRef<HTMLDivElement, SpacerProps>(function Spacer(
  { size = "ui", grow = false, className, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn(grow ? "flex-1" : size === "ui" || size === "section" || size === "none" ? GAP[size] : size, className)}
      {...dataSlot("spacer")}
      {...props}
    />
  );
});

export interface CenterProps extends React.ComponentProps<"div"> {
  /** Restrict to a full-viewport centring, for empty routes and error pages. */
  full?: boolean | undefined;
  children: React.ReactNode;
}

export const Center = React.forwardRef<HTMLDivElement, CenterProps>(function Center(
  { full = false, className, children, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn("flex flex-col items-center justify-center gap-3 text-center", full && "min-h-[60dvh]", className)}
      {...dataSlot("center")}
      {...props}
    >
      {children}
    </div>
  );
});

export interface DividerProps extends Omit<React.ComponentProps<"hr">, "children"> {
  orientation?: "horizontal" | "vertical" | undefined;
  /**
   * A label rendered in a gap in the rule. A visible divider that separates
   * nothing is decoration, and a labelled one is a section boundary worth
   * announcing.
   */
  label?: React.ReactNode | undefined;
}

/**
 * A real `<hr>`. The audit found a divider rendering `role="none"` by default,
 * which removed it from the accessibility tree entirely — so the structural
 * boundary a screen-reader user most needs was the one they could not perceive.
 */
export const Divider = React.forwardRef<HTMLHRElement, DividerProps>(function Divider(
  { orientation = "horizontal", label, className, ...props },
  ref,
) {
  if (orientation === "vertical") {
    return (
      <div
        ref={ref as unknown as React.Ref<HTMLDivElement>}
        role="separator"
        aria-orientation="vertical"
        className={cn("h-full w-px bg-line", className)}
        {...dataSlot("divider")}
        {...(props as React.ComponentProps<"div">)}
      />
    );
  }

  if (label) {
    return (
      <div className={cn("flex items-center gap-3", className)} {...dataSlot("divider", "labelled")}>
        <span aria-hidden="true" className="h-px flex-1 bg-line" />
        <span className="text-label font-medium uppercase tracking-widest text-fg-muted">{label}</span>
        <span aria-hidden="true" className="h-px flex-1 bg-line" />
      </div>
    );
  }

  return (
    <hr
      ref={ref}
      className={cn("h-px w-full border-0 bg-line", className)}
      {...dataSlot("divider")}
      {...props}
    />
  );
});

export interface AspectRatioProps extends React.ComponentProps<"div"> {
  ratio?: number | undefined;
  children: React.ReactNode;
}

/** Reserves space before content arrives, so nothing reflows on load. */
export const AspectRatio = React.forwardRef<HTMLDivElement, AspectRatioProps>(function AspectRatio(
  { ratio = 16 / 9, className, children, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      style={{ aspectRatio: String(ratio) }}
      className={cn("w-full overflow-hidden", className)}
      {...dataSlot("aspect-ratio")}
      {...props}
    >
      {children}
    </div>
  );
});

export interface ScrollAreaProps extends React.ComponentProps<"div"> {
  orientation?: "vertical" | "horizontal" | "both" | undefined;
  /** How far a wheel or trackpad gesture scrolls per event. */
  scrollStep?: number | undefined;
  children: React.ReactNode;
}

/**
 * A styled scroll container.
 *
 * This is *not* Radix's `ScrollArea`, on purpose: that primitive hides the
 * native scrollbar and reinvents a thumb, which costs a full extra layer of
 * layout and breaks native scroll chaining and momentum on touch. Here the
 * browser keeps its own scrollbar, and the token stylesheet styles it — with
 * the standards `scrollbar-color` first, so Firefox is not left on UA defaults
 * as both source projects were.
 */
export const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(function ScrollArea(
  { orientation = "vertical", scrollStep, className, children, style, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      data-orientation={orientation}
      onWheel={
        scrollStep
          ? (event) => {
              const node = event.currentTarget;
              if (orientation === "vertical") node.scrollTop += event.deltaY * scrollStep;
              else if (orientation === "horizontal") node.scrollLeft += event.deltaY * scrollStep;
            }
          : undefined
      }
      style={{
        overflow: orientation === "both" ? "auto" : orientation === "horizontal" ? "auto hidden" : "hidden auto",
        ...style,
      }}
      className={cn("min-h-0", className)}
      {...dataSlot("scroll-area")}
      {...props}
    >
      {children}
    </div>
  );
});
