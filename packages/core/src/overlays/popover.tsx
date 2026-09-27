import * as React from "react";
import { HoverCard as HoverCardPrimitive, Popover as PopoverPrimitive, Tooltip as TooltipPrimitive } from "radix-ui";
import { cn, cva, type VariantProps } from "@tea-ui/utils";

import { dataSlot } from "../internal";

/**
 * TEA UI — Popover, Tooltip, HoverCard.
 *
 * Three related surfaces that differ in one thing each, and it is worth being
 * precise about it because the audit shows what happens when they are confused:
 *
 *  - **Popover** — the user asked for it. Click-triggered, interactive content,
 *    closes on Escape and on an outside pointer. It is for choosing a value or
 *    filling in something.
 *  - **Tooltip** — the user did not ask for it. It explains a control that
 *    already has a visible label, and it is **supplementary**. Radix links it
 *    with `aria-describedby`, not a name, which is exactly right: a tooltip can
 *    never be the accessible name of a control. The audit found icon-only
 *    buttons whose only description was a tooltip, which left them unnamed for
 *    a screen reader while sighted users were fine. `IconButton.label` exists to
 *    make that impossible.
 *  - **HoverCard** — a preview. Pointer *and* focus triggered, because a
 *    keyboard user must be able to reach it too.
 */
export const popoverContentVariants = cva(
  [
    "z-popover border border-line bg-surface-2 p-3 shadow-overlay",
    "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
    "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
  ],
  {
    variants: {
      size: { sm: "w-56", md: "w-72", lg: "w-96" },
    },
    defaultVariants: { size: "md" },
  },
);

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverAnchor = PopoverPrimitive.Anchor;
export const PopoverClose = PopoverPrimitive.Close;
export const PopoverArrow = PopoverPrimitive.Arrow;

export interface PopoverContentProps
  extends Omit<React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>, "className">,
    VariantProps<typeof popoverContentVariants> {
  className?: string | undefined;
  /**
   * Trap focus and block the background. Off by default: a popover usually lets
   * the user keep working in the page behind it.
   */
  modal?: boolean | undefined;
}

/**
 * Radix ships the popover content as a modal/non-modal pair, so the exported
 * `Content` is a union and cannot accept a `modal` prop. Both branches are
 * dispatched here, once, instead of at every call site.
 */
const PopoverContentPrimitive = PopoverPrimitive.Content as unknown as React.ComponentType<
  React.ComponentProps<"div"> & Record<string, unknown>
>;

export const PopoverContent = React.forwardRef<HTMLDivElement, PopoverContentProps>(
  function PopoverContent({ className, size, modal = false, align = "center", sideOffset = 6, ...props }, ref) {
    return (
      <PopoverPrimitive.Portal>
        <PopoverContentPrimitive
          ref={ref}
          modal={modal}
          align={align}
          sideOffset={sideOffset}
          collisionPadding={12}
          className={cn(popoverContentVariants({ size }), className)}
          {...dataSlot("popover", "content")}
          {...props}
        />
      </PopoverPrimitive.Portal>
    );
  },
);

export const tooltipContentVariants = cva(
  "z-tooltip max-w-xs border border-line bg-surface-3 px-2 py-1 text-micro text-fg shadow-overlay data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95",
);

export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export interface TooltipContentProps
  extends React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>,
    VariantProps<typeof tooltipContentVariants> {}

export const TooltipContent = React.forwardRef<HTMLDivElement, TooltipContentProps>(
  function TooltipContent({ className, sideOffset = 6, children, ...props }, ref) {
    return (
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          ref={ref}
          sideOffset={sideOffset}
          collisionPadding={8}
          className={cn(tooltipContentVariants(), className)}
          {...dataSlot("tooltip", "content")}
          {...props}
        >
          {children}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    );
  },
);

export const HoverCard = HoverCardPrimitive.Root;
export const HoverCardTrigger = HoverCardPrimitive.Trigger;
export const HoverCardPortal = HoverCardPrimitive.Portal;

export const hoverCardContentVariants = cva(
  "z-popover w-80 border border-line bg-surface-2 p-3 shadow-overlay data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
);

export interface HoverCardContentProps
  extends React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Content> {
  className?: string | undefined;
}

export const HoverCardContent = React.forwardRef<HTMLDivElement, HoverCardContentProps>(
  function HoverCardContent({ className, align = "center", sideOffset = 6, ...props }, ref) {
    return (
      <HoverCardPrimitive.Portal>
        <HoverCardPrimitive.Content
          ref={ref}
          align={align}
          sideOffset={sideOffset}
          collisionPadding={12}
          className={cn(hoverCardContentVariants(), className)}
          {...dataSlot("hover-card", "content")}
          {...props}
        />
      </HoverCardPrimitive.Portal>
    );
  },
);
