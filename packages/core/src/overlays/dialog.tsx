import * as React from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { X } from "@tea-ui/icons";
import { cn, cva, type VariantProps } from "@tea-ui/utils";
import { COPY } from "@tea-ui/ux-standards";

import { dataSlot } from "../internal";

/**
 * TEA UI â€” Dialog.
 *
 * The audit's dialog defects, all fixed here:
 *  - A source project's dialogs shipped an English "Close" label inside an
 *    otherwise German product, and one had no accessible name at all. A
 *    `DialogTitle` is therefore **required**: if the consumer omits it, a
 *    visually hidden fallback is rendered so the dialog always has a name.
 *  - Its close button used `focus:outline-none` with no replacement, so keyboard
 *    users lost the focus indicator entirely. The focus ring comes from the
 *    token base layer and is never removed.
 *  - Its content used an 8px hard shadow while every other overlay used 6px.
 *    One elevation concept now has three named steps.
 */
export const dialogOverlayVariants = cva(
  "fixed inset-0 z-modal bg-overlay data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
);

export const dialogContentVariants = cva(
  [
    "fixed start-1/2 top-1/2 z-modal w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2",
    "border border-line bg-surface shadow-modal",
    "max-h-[calc(100dvh-4rem)] overflow-y-auto",
    "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
    "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
  ],
  {
    variants: {
      size: {
        sm: "max-w-sm",
        md: "max-w-md",
        lg: "max-w-lg",
        xl: "max-w-2xl",
        full: "max-w-4xl",
      },
    },
    defaultVariants: { size: "md" },
  },
);

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;
export const DialogPortal = DialogPrimitive.Portal;

export const DialogOverlay = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(function DialogOverlay({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Overlay
      ref={ref}
      className={cn(dialogOverlayVariants(), className)}
      {...dataSlot("dialog", "overlay")}
      {...props}
    />
  );
});

export interface DialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>,
    VariantProps<typeof dialogContentVariants> {
  /** Render the built-in close button. Defaults to `true`. */
  showCloseButton?: boolean | undefined;
  /** Accessible name for that button. */
  closeLabel?: string | undefined;
  /** Accessible name used only when no `DialogTitle` is present. */
  fallbackTitle?: string | undefined;
}

export const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(function DialogContent(
  { className, size, children, showCloseButton = true, closeLabel, fallbackTitle, ...props },
  ref,
) {
  // A title is mandatory for the accessibility tree. A consumer that forgets
  // one gets a visually hidden one rather than an unnamed dialog.
  const hasTitle = React.Children.toArray(children).some(
    (child) => React.isValidElement(child) && child.type === DialogTitle,
  );

  return (
    <DialogPrimitive.Portal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(dialogContentVariants({ size }), className)}
        {...dataSlot("dialog", "content")}
        {...props}
      >
        {hasTitle ? null : <DialogTitle className="sr-only">{fallbackTitle ?? COPY.actions.details}</DialogTitle>}
        {showCloseButton ? (
          <DialogPrimitive.Close
            aria-label={closeLabel ?? COPY.a11y.close}
            className="absolute end-3 top-3 p-1 text-fg-muted transition-colors hover:text-fg"
            {...dataSlot("dialog", "close")}
          >
            <X size={16} aria-hidden="true" />
          </DialogPrimitive.Close>
        ) : null}
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
});

export const DialogHeader = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  function DialogHeader({ className, ...props }, ref) {
    return <div ref={ref} className={cn("flex flex-col gap-1 border-b border-line p-4 pe-12", className)} {...dataSlot("dialog", "header")} {...props} />;
  },
);

export const DialogBody = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  function DialogBody({ className, ...props }, ref) {
    return <div ref={ref} className={cn("p-4", className)} {...dataSlot("dialog", "body")} {...props} />;
  },
);

export const DialogFooter = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  function DialogFooter({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn("flex flex-col-reverse gap-2 border-t border-line p-4 sm:flex-row sm:justify-end", className)}
        {...dataSlot("dialog", "footer")}
        {...props}
      />
    );
  },
);

export const DialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(function DialogTitle({ className, ...props }, ref) {
  return <DialogPrimitive.Title ref={ref} className={cn("text-title font-semibold text-fg", className)} {...dataSlot("dialog", "title")} {...props} />;
});

export const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(function DialogDescription({ className, ...props }, ref) {
  return <DialogPrimitive.Description ref={ref} className={cn("text-micro text-fg-muted", className)} {...dataSlot("dialog", "description")} {...props} />;
});
