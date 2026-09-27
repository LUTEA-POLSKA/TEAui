import * as React from "react";
import { Select as SelectPrimitive } from "radix-ui";
import { Check, ChevronDown, ChevronUp } from "@tea-ui/icons";
import { cn, cva, type VariantProps } from "@tea-ui/utils";

import { dataSlot, stateAttributes } from "../internal";
import { useFieldControlProps } from "./field";

/**
 * TEA UI — Select.
 *
 * A native `<select>` is correct whenever the option list is short and known,
 * and this component is the answer when it is not: searchable, grouped,
 * scrollable, or too long to trust to a native listbox on mobile. The audit
 * found three hand-typed native `<select>`s in one product — none of which had
 * an accessible name — sitting next to a fully built Radix Select that nobody
 * used.
 *
 * Two audit defects are fixed here rather than carried forward:
 *  - The available-height constraint. The source project's version was
 *    `max-h-[--radix-select-content-available-height]`, which is not a valid
 *    arbitrary value and silently resolved to nothing, so a long list escaped
 *    the viewport. It is `max-h-[var(--radix-select-content-available-height)]`
 *    here.
 *  - The trigger height. Both source projects hardcoded a fixed height, so a
 *    compact table could not contain a compact select. It reads
 *    `--tea-control-h` here.
 */
export const selectTriggerVariants = cva(
  [
    "control-h inline-flex w-full items-center justify-between gap-2 border px-[length:var(--tea-control-px)]",
    "bg-surface text-ui text-fg transition-colors duration-fast ease-standard",
    "data-[placeholder]:text-fg-muted",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "aria-invalid:border-critical aria-invalid:bg-critical-subtle",
  ],
  {
    variants: {
      variant: {
        outline: "border-line data-[hover]:border-line-strong",
        ghost: "border-transparent bg-transparent data-[hover]:bg-surface-3",
      },
    },
    defaultVariants: { variant: "outline" },
  },
);

export interface SelectProps
  extends Omit<React.ComponentProps<typeof SelectPrimitive.Root>, "children"> {
  children: React.ReactNode;
  /** The controlled value. */
  value?: string | undefined;
  /** The uncontrolled initial value. */
  defaultValue?: string | undefined;
  /** Called with the new value. */
  onValueChange?: ((value: string) => void) | undefined;
}

/**
 * Radix discriminates the Select root's props on `multiple`, which makes a
 * forwardable optional-value signature unrepresentable in its own types. The
 * cast is done once, here, rather than at every call site.
 */
const SelectRootPrimitive = SelectPrimitive.Root as unknown as React.ComponentType<
  React.ComponentProps<"span"> & Record<string, unknown>
>;

export const Select = React.forwardRef<HTMLSpanElement, SelectProps>(function Select(
  { children, ...props },
  ref,
) {
  return (
    <SelectRootPrimitive ref={ref} {...props} {...dataSlot("select", "root")}>
      {children}
    </SelectRootPrimitive>
  );
});

export const SelectGroup = SelectPrimitive.Group;
export const SelectValue = SelectPrimitive.Value;
export const SelectSeparator = SelectPrimitive.Separator;

export interface SelectTriggerProps
  extends Omit<React.ComponentProps<typeof SelectPrimitive.Trigger>, "className">,
    VariantProps<typeof selectTriggerVariants> {
  className?: string | undefined;
}

export const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  function SelectTrigger({ className, variant, children, disabled, ...props }, ref) {
    const field = useFieldControlProps();
    return (
      <SelectPrimitive.Trigger
        ref={ref}
        disabled={field.disabled ?? disabled}
        aria-invalid={field["aria-invalid"] || undefined}
        aria-required={field["aria-required"] || undefined}
        className={cn(selectTriggerVariants({ variant }), className)}
        data-tea-touch
        {...dataSlot("select", "trigger")}
        {...stateAttributes({ disabled: field.disabled ?? disabled })}
        {...props}
      >
        {children}
        <SelectPrimitive.Icon asChild>
          <ChevronDown size={16} aria-hidden="true" className="shrink-0 text-fg-muted" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
    );
  },
);

export interface SelectContentProps extends React.ComponentProps<typeof SelectPrimitive.Content> {
  className?: string | undefined;
  /** Where the list is placed relative to the trigger. */
  position?: React.ComponentProps<typeof SelectPrimitive.Content>["position"];
}

export const SelectContent = React.forwardRef<HTMLDivElement, SelectContentProps>(
  function SelectContent({ className, children, position = "popper", ...props }, ref) {
    return (
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          ref={ref}
          position={position}
          className={cn(
            "z-popover max-h-[var(--radix-select-content-available-height)] min-w-[var(--radix-select-trigger-width)]",
            "border border-line bg-surface-2 shadow-overlay",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
            className,
          )}
          {...dataSlot("select", "content")}
          {...props}
        >
          <SelectScrollUpButton />
          <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
          <SelectScrollDownButton />
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    );
  },
);

export interface SelectItemProps extends React.ComponentProps<typeof SelectPrimitive.Item> {
  className?: string | undefined;
  /**
   * A short explanation shown under the label in the list. It is not truncated
   * away and it is not a tooltip — this is the place a confusing option
   * explains itself.
   */
  description?: string | undefined;
}

export const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(
  function SelectItem({ className, children, description, ...props }, ref) {
    return (
      <SelectPrimitive.Item
        ref={ref}
        className={cn(
          "relative flex cursor-default select-none flex-col gap-0.5 py-2 pe-8 ps-3 text-ui text-fg outline-none",
          "data-[highlighted]:bg-accent-subtle data-[highlighted]:text-fg",
          "data-[state=checked]:text-primary",
          "data-disabled:pointer-events-none data-disabled:opacity-50",
          className,
        )}
        {...dataSlot("select", "item")}
        {...props}
      >
        <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
        {description ? (
          <span className="text-micro text-fg-muted">{description}</span>
        ) : null}
        <span className="absolute end-2 flex size-4 items-center justify-center">
          <SelectPrimitive.ItemIndicator>
            <Check size={14} aria-hidden="true" />
          </SelectPrimitive.ItemIndicator>
        </span>
      </SelectPrimitive.Item>
    );
  },
);

export const SelectScrollUpButton = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>
>(function SelectScrollUpButton({ className, ...props }, ref) {
  return (
    <SelectPrimitive.ScrollUpButton
      ref={ref}
      className={cn("flex cursor-default items-center justify-center py-1 text-fg-muted", className)}
      {...props}
    >
      <ChevronUp size={14} aria-hidden="true" />
    </SelectPrimitive.ScrollUpButton>
  );
});

export const SelectScrollDownButton = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>
>(function SelectScrollDownButton({ className, ...props }, ref) {
  return (
    <SelectPrimitive.ScrollDownButton
      ref={ref}
      className={cn("flex cursor-default items-center justify-center py-1 text-fg-muted", className)}
      {...props}
    >
      <ChevronDown size={14} aria-hidden="true" />
    </SelectPrimitive.ScrollDownButton>
  );
});
