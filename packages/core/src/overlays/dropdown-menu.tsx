import * as React from "react";
import { DropdownMenu as DropdownPrimitive, ContextMenu as ContextPrimitive } from "radix-ui";
import { Check, ChevronRight } from "@tea-ui/icons";
import { cn } from "@tea-ui/utils";
import { COPY } from "@tea-ui/ux-standards";

import { dataSlot } from "../internal";

/**
 * TEA UI â€” DropdownMenu and ContextMenu.
 *
 * Both source projects shipped a fully built `DropdownMenu` and used it in
 * exactly one place, hand-rolling the rest. This is the one implementation, and
 * the styling defect it fixes is worth naming: the source project's dropdown
 * item highlighted with `bg-muted` while its select item highlighted with
 * `bg-accent`. The same "you are here" moment therefore looked like two
 * different things depending on which control the user was in. Here, a
 * highlighted item is always `bg-accent-subtle` with the foreground brought up.
 */
export const menuContentVariants = cn(
  "z-dropdown min-w-48 border border-line bg-surface-2 p-1 shadow-overlay",
  "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
  "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
);

const itemVariants = cn(
  "relative flex cursor-default select-none items-center gap-2 px-2 py-1.5 text-ui text-fg outline-none",
  "data-[highlighted]:bg-accent-subtle data-[highlighted]:text-fg",
  "data-disabled:pointer-events-none data-disabled:opacity-50",
  "[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-fg-muted",
);

export const DropdownMenu = DropdownPrimitive.Root;
export const DropdownMenuTrigger = DropdownPrimitive.Trigger;
export const DropdownMenuPortal = DropdownPrimitive.Portal;
export const DropdownMenuGroup = DropdownPrimitive.Group;
export const DropdownMenuSub = DropdownPrimitive.Sub;
export const DropdownMenuRadioGroup = DropdownPrimitive.RadioGroup;

export const DropdownMenuContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Content>
>(function DropdownMenuContent({ className, sideOffset = 4, align = "start", ...props }, ref) {
  return (
    <DropdownPrimitive.Portal>
      <DropdownPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        align={align}
        collisionPadding={12}
        className={cn(menuContentVariants, className)}
        {...dataSlot("menu", "content")}
        {...props}
      />
    </DropdownPrimitive.Portal>
  );
});

export const DropdownMenuItem = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Item> & { inset?: boolean | undefined; variant?: "default" | "destructive" | undefined }
>(function DropdownMenuItem({ className, inset, variant = "default", ...props }, ref) {
  return (
    <DropdownPrimitive.Item
      ref={ref}
      className={cn(
        itemVariants,
        inset && "ps-8",
        variant === "destructive" && "text-critical data-[highlighted]:bg-critical-subtle data-[highlighted]:text-critical",
        className,
      )}
      {...dataSlot("menu", "item")}
      {...props}
    />
  );
});

export const DropdownMenuCheckboxItem = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.CheckboxItem>
>(function DropdownMenuCheckboxItem({ className, children, checked, ...props }, ref) {
  return (
    <DropdownPrimitive.CheckboxItem
      ref={ref}
      checked={checked}
      className={cn(itemVariants, "ps-8", className)}
      {...dataSlot("menu", "checkbox-item")}
      {...props}
    >
      <span className="absolute start-2 flex size-4 items-center justify-center">
        <DropdownPrimitive.ItemIndicator>
          <Check size={14} aria-hidden="true" />
        </DropdownPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownPrimitive.CheckboxItem>
  );
});

export const DropdownMenuRadioItem = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.RadioItem>
>(function DropdownMenuRadioItem({ className, children, ...props }, ref) {
  return (
    <DropdownPrimitive.RadioItem
      ref={ref}
      className={cn(itemVariants, "ps-8", className)}
      {...dataSlot("menu", "radio-item")}
      {...props}
    >
      <span className="absolute start-2 flex size-4 items-center justify-center">
        <DropdownPrimitive.ItemIndicator>
          <span aria-hidden="true" className="size-1.5 rounded-pill bg-current" />
        </DropdownPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownPrimitive.RadioItem>
  );
});

export const DropdownMenuLabel = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Label> & { inset?: boolean | undefined }
>(function DropdownMenuLabel({ className, inset, ...props }, ref) {
  return (
    <DropdownPrimitive.Label
      ref={ref}
      className={cn("px-2 py-1.5 text-label font-semibold uppercase tracking-widest text-fg-muted", inset && "ps-8", className)}
      {...dataSlot("menu", "label")}
      {...props}
    />
  );
});

export const DropdownMenuSeparator = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Separator>
>(function DropdownMenuSeparator({ className, ...props }, ref) {
  return (
    <DropdownPrimitive.Separator ref={ref} className={cn("-mx-1 my-1 h-px bg-line", className)} {...dataSlot("menu", "separator")} {...props} />
  );
});

/** A right-aligned keyboard hint. Decorative unless it is the only key shown. */
export const DropdownMenuShortcut = React.forwardRef<HTMLSpanElement, React.ComponentProps<"span">>(
  function DropdownMenuShortcut({ className, ...props }, ref) {
    return <span ref={ref} className={cn("ms-auto text-label text-fg-subtle", className)} {...dataSlot("menu", "shortcut")} {...props} />;
  },
);

export const DropdownMenuSubTrigger = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.SubTrigger> & { inset?: boolean | undefined }
>(function DropdownMenuSubTrigger({ className, inset, children, ...props }, ref) {
  return (
    <DropdownPrimitive.SubTrigger
      ref={ref}
      className={cn(itemVariants, inset && "ps-8", className)}
      {...dataSlot("menu", "sub-trigger")}
      {...props}
    >
      {children}
      <ChevronRight size={14} aria-hidden="true" className="ms-auto" />
    </DropdownPrimitive.SubTrigger>
  );
});

export const DropdownMenuSubContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.SubContent>
>(function DropdownMenuSubContent({ className, ...props }, ref) {
  return (
    <DropdownPrimitive.Portal>
      <DropdownPrimitive.SubContent
        ref={ref}
        className={cn(menuContentVariants, className)}
        {...dataSlot("menu", "sub-content")}
        {...props}
      />
    </DropdownPrimitive.Portal>
  );
});

/* -------------------------------------------------------------------------- */

export const ContextMenu = ContextPrimitive.Root;
export const ContextMenuTrigger = ContextPrimitive.Trigger;
export const ContextMenuGroup = ContextPrimitive.Group;
export const ContextMenuSub = ContextPrimitive.Sub;
export const ContextMenuRadioGroup = ContextPrimitive.RadioGroup;

export const ContextMenuContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof ContextPrimitive.Content>
>(function ContextMenuContent({ className, ...props }, ref) {
  return (
    <ContextPrimitive.Portal>
      <ContextPrimitive.Content
        ref={ref}
        className={cn(menuContentVariants, className)}
        {...dataSlot("context-menu", "content")}
        {...props}
      />
    </ContextPrimitive.Portal>
  );
});

export const ContextMenuItem = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof ContextPrimitive.Item> & { inset?: boolean | undefined; variant?: "default" | "destructive" | undefined }
>(function ContextMenuItem({ className, inset, variant = "default", ...props }, ref) {
  return (
    <ContextPrimitive.Item
      ref={ref}
      className={cn(itemVariants, inset && "ps-8", variant === "destructive" && "text-critical", className)}
      {...dataSlot("context-menu", "item")}
      {...props}
    />
  );
});

export const ContextMenuSeparator = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof ContextPrimitive.Separator>
>(function ContextMenuSeparator({ className, ...props }, ref) {
  return <ContextPrimitive.Separator ref={ref} className={cn("-mx-1 my-1 h-px bg-line", className)} {...dataSlot("context-menu", "separator")} {...props} />;
});

export const ContextMenuLabel = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof ContextPrimitive.Label>
>(function ContextMenuLabel({ className, ...props }, ref) {
  return <ContextPrimitive.Label ref={ref} className={cn("px-2 py-1.5 text-label uppercase tracking-widest text-fg-muted", className)} {...dataSlot("context-menu", "label")} {...props} />;
});

export { COPY as menuCopy };
