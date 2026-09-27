import * as React from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { cn, cva, type VariantProps } from "@tea-ui/utils";
import { COPY } from "@tea-ui/ux-standards";

import { dataSlot } from "../internal";
import { DialogOverlay } from "./dialog";

/**
 * TEA UI â€” Drawer and Sheet.
 *
 * The one primitive that replaces three copy-pasted "right drawer" overrides in
 * the audit, and the answer to the behaviour *both* source products needed and
 * each implemented separately: below 1024px the sidebar stops being information
 * and becomes an obstruction, so it collapses into an edge panel.
 *
 * `Drawer` is an edge panel on `Dialog`, so it inherits the focus trap, the
 * scroll lock, Escape and focus restoration. `Sheet` is the bottom variant for
 * small screens, where a side panel would fight the system back gesture.
 */
export const drawerVariants = cva(
  [
    "fixed z-modal flex flex-col border-line bg-surface shadow-modal",
    "transition-transform data-[state=open]:animate-in data-[state=closed]:animate-out",
    "duration-normal ease-standard",
  ],
  {
    variants: {
      side: {
        start: [
          "inset-y-0 start-0 w-[min(20rem,85vw)] border-e",
          "data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left",
        ],
        end: [
          "inset-y-0 end-0 w-[min(24rem,90vw)] border-s",
          "data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right",
        ],
        top: [
          "inset-x-0 top-0 max-h-[80dvh] border-b",
          "data-[state=open]:slide-in-from-top data-[state=closed]:slide-out-to-top",
        ],
        bottom: [
          "inset-x-0 bottom-0 max-h-[85dvh] border-t rounded-t-none",
          "data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom",
        ],
      },
    },
    defaultVariants: { side: "end" },
  },
);

export const Drawer = DialogPrimitive.Root;
export const DrawerTrigger = DialogPrimitive.Trigger;
export const DrawerClose = DialogPrimitive.Close;
export const DrawerPortal = DialogPrimitive.Portal;

export interface DrawerContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>,
    VariantProps<typeof drawerVariants> {
  showCloseButton?: boolean | undefined;
  closeLabel?: string | undefined;
}

export const DrawerContent = React.forwardRef<HTMLDivElement, DrawerContentProps>(
  function DrawerContent(
    { className, side = "end", children, showCloseButton = true, closeLabel, ...props },
    ref,
  ) {
    return (
      <DialogPrimitive.Portal>
        <DialogOverlay />
        <DialogPrimitive.Content
          ref={ref}
          className={cn(drawerVariants({ side }), className)}
          {...dataSlot("drawer", "content")}
          {...props}
        >
          {showCloseButton ? <DrawerCloseButton label={closeLabel} /> : null}
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    );
  },
);

function DrawerCloseButton({ label }: { label?: string | undefined }): React.ReactElement {
  return (
    <DialogPrimitive.Close
      aria-label={label ?? COPY.a11y.close}
      className="absolute end-3 top-3 p-1 text-fg-muted transition-colors hover:text-fg"
      {...dataSlot("drawer", "close")}
    >
      <span aria-hidden="true">&times;</span>
    </DialogPrimitive.Close>
  );
}

export const DrawerHeader = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  function DrawerHeader({ className, ...props }, ref) {
    return (
      <div ref={ref} className={cn("shrink-0 border-b border-line p-4 pe-12", className)} {...dataSlot("drawer", "header")} {...props} />
    );
  },
);

export const DrawerBody = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  function DrawerBody({ className, ...props }, ref) {
    return <div ref={ref} className={cn("min-h-0 flex-1 overflow-y-auto p-4", className)} {...dataSlot("drawer", "body")} {...props} />;
  },
);

export const DrawerFooter = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  function DrawerFooter({ className, ...props }, ref) {
    return <div ref={ref} className={cn("shrink-0 border-t border-line p-4", className)} {...dataSlot("drawer", "footer")} {...props} />;
  },
);

/** A bottom sheet: the mobile-safe drawer. */
export const Sheet = Drawer;
export const SheetTrigger = DrawerTrigger;
export const SheetClose = DrawerClose;
export const SheetContent = React.forwardRef<HTMLDivElement, DrawerContentProps>(
  function SheetContent({ className, ...props }, ref) {
    return <DrawerContent ref={ref} side="bottom" className={cn("w-full", className)} {...props} />;
  },
);
export const SheetHeader = DrawerHeader;
export const SheetBody = DrawerBody;
export const SheetFooter = DrawerFooter;
