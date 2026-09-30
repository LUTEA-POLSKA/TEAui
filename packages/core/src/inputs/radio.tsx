import * as React from "react";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";
import { cn } from "@tea-ui/utils";

import { dataSlot, stateAttributes } from "../internal";
import { useFieldControlProps } from "./field";

/**
 * TEA UI — RadioGroup and Radio.
 *
 * One choice out of a small set. The pair is a family for a reason: the
 * grouping *is* the semantics. `role="radiogroup"` is what tells a screen reader
 * that the arrow keys move between the options, and that leaving the group
 * leaves the choice. A column of loose radios has neither.
 *
 * Two details that are easy to lose:
 *
 *  - **Arrow-key navigation is not optional and is not ours.** Radix implements
 *    it, and it is the only correct implementation: arrows move *and select*,
 *    Tab enters and leaves the group as a single stop, and the roving tabindex
 *    means the whole group is one tab stop rather than four. A hand-rolled
 *    version gets one of those three wrong every time.
 *  - **A radio with no group is a radio group of one.** The `Radio` reads the
 *    group context and wires itself, so it cannot end up outside one.
 */

export interface RadioGroupProps
  extends Omit<
    React.ComponentProps<typeof RadioGroupPrimitive.Root>,
    "value" | "defaultValue" | "onValueChange" | "orientation" | "dir"
  > {
  /** Controlled value — the `value` of the selected `Radio`. */
  value?: string | undefined;
  /** Uncontrolled initial value. */
  defaultValue?: string | undefined;
  /** Called when the selection changes, in both controlled and uncontrolled mode. */
  onValueChange?: ((value: string) => void) | undefined;
  /** Layout direction. Decides the arrow keys and the row/column flow. */
  orientation?: "horizontal" | "vertical";
  /**
   * Name for the group. Give it one whenever the group is not already named by
   * a `FieldGroup` legend: a `role="radiogroup"` with no name is an entry in the
   * structure list that says nothing. A `Field` + `FieldLabel` pair is *not* a
   * substitute here — a label cannot be associated with a `role="radiogroup"`
   * container, only with each option.
   */
  label?: string | undefined;
  className?: string | undefined;
}

/**
 * @example
 * ```tsx
 * <FieldGroup legend="Zeitraum">
 *   <RadioGroup defaultValue="week">
 *     <Radio value="day">Tag</Radio>
 *     <Radio value="week">Woche</Radio>
 *   </RadioGroup>
 * </FieldGroup>
 * ```
 */
export const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(function RadioGroup(
  {
    children,
    className,
    value,
    defaultValue,
    onValueChange,
    orientation = "vertical",
    label,
    disabled,
    required,
    ...props
  },
  ref,
) {
  const field = useFieldControlProps();
  const isDisabled = field.disabled ?? disabled ?? false;
  const isRequired = field["aria-required"] ?? required ?? false;

  return (
    <RadioGroupPrimitive.Root
      ref={ref}
      {...dataSlot("radio-group")}
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      orientation={orientation}
      disabled={isDisabled}
      required={isRequired}
      aria-label={label}
      aria-describedby={field["aria-describedby"]}
      aria-invalid={field["aria-invalid"]}
      aria-required={isRequired || undefined}
      data-orientation={orientation}
      className={cn("flex min-w-0 gap-3", orientation === "vertical" ? "flex-col" : "flex-row", className)}
      {...stateAttributes({ disabled: isDisabled, orientation })}
      {...props}
    >
      {children}
    </RadioGroupPrimitive.Root>
  );
});

export interface RadioProps
  extends Omit<React.ComponentProps<typeof RadioGroupPrimitive.Item>, "children"> {
  /** Text beside the control. Makes the option self-naming. */
  label?: React.ReactNode | undefined;
  children?: React.ReactNode;
  className?: string | undefined;
}

/**
 * One option. Takes `label` (or children) and wires itself to the surrounding
 * `RadioGroup` through Radix's own context, so `name` and selection cannot
 * disagree.
 */
export const Radio = React.forwardRef<HTMLButtonElement, RadioProps>(function Radio(
  { className, label, children, value, disabled, ...props },
  ref,
) {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      value={value}
      disabled={disabled}
      data-tea-touch
      className={cn(
        "group inline-flex items-center gap-2 text-ui",
        "rounded-none",
        "data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-50",
        className,
      )}
      {...dataSlot("radio")}
      {...props}
    >
      <span
        aria-hidden="true"
        className={cn(
          // `rounded-pill` is a documented exception: a radio control is a
          // marker, and a square one reads as a checkbox.
          "flex size-4 shrink-0 items-center justify-center rounded-pill border border-line-strong bg-surface",
          "transition-[background-color,border-color,box-shadow] duration-fast ease-standard",
          "group-data-[state=checked]:border-primary group-data-[state=checked]:bg-primary",
          "group-focus-visible:ring-2 group-focus-visible:ring-ring",
        )}
      >
        <span
          className={cn(
            "size-2 rounded-pill bg-primary-fg",
            // The dot *is* the state, in shape as well as colour.
            "scale-0 transition-transform duration-fast ease-standard",
            "group-data-[state=checked]:scale-100",
          )}
        />
      </span>
      <span className="text-fg group-data-[state=checked]:font-medium">{label ?? children}</span>
    </RadioGroupPrimitive.Item>
  );
});
