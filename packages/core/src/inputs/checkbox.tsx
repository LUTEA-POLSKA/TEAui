import * as React from "react";
import { Checkbox as CheckboxPrimitive } from "radix-ui";
import { Check, Minus } from "@tea-ui/icons";
import { cn } from "@tea-ui/utils";

import { dataSlot, stateAttributes, useControllableState } from "../internal";
import { useFieldControlProps } from "./field";

/**
 * TEA UI — Checkbox.
 *
 * A native `role="checkbox"` wrapped in Radix's primitive, which renders a
 * `<button>` plus a hidden native `<input>` so the control still participates in
 * form submission, in form reset, and in the browser's own validation UI.
 *
 * The naming question, which is where this component could have gone wrong:
 *
 *  - **Inside a `Field`**: `FieldLabel` renders `<label htmlFor>` pointing at the
 *    control's id. A `<button>` is a *labelable element* in HTML, so the
 *    association is real rather than a convention that happens to work.
 *  - **Standalone**: `label` wraps the control and its text in a `<label>`, which
 *    gives the same implicit association.
 *
 * `indeterminate` exists because "some but not all" is a real state of a parent
 * checkbox that no amount of colour can express. It is reported as
 * `aria-checked="mixed"` and drawn as a dash. Clearing it is the *parent's* job:
 * pass `indeterminate={someSelected}` and update it in `onCheckedChange`.
 */
export interface CheckboxProps
  extends Omit<
    React.ComponentProps<typeof CheckboxPrimitive.Root>,
    "checked" | "defaultChecked" | "indeterminate" | "children"
  > {
  /** Controlled checked state. */
  checked?: boolean | undefined;
  /** Uncontrolled initial checked state. */
  defaultChecked?: boolean | undefined;
  /** Called when the checked state changes, in both controlled and uncontrolled mode. */
  onCheckedChange?: ((checked: boolean) => void) | undefined;
  /** Some but not all children are checked. Draws a dash, reports `aria-checked="mixed"`. */
  indeterminate?: boolean | undefined;
  /** Text next to the box, for a control used without a `Field`. */
  label?: React.ReactNode | undefined;
  className?: string | undefined;
}

/**
 * @example
 * ```tsx
 * <Field>
 *   <FieldLabel>Benachrichtigungen per E-Mail</FieldLabel>
 *   <Checkbox defaultChecked />
 * </Field>
 * ```
 */
export const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(function Checkbox(
  {
    className,
    label,
    checked,
    defaultChecked = false,
    onCheckedChange,
    indeterminate = false,
    disabled,
    required,
    ...props
  },
  ref,
) {
  const field = useFieldControlProps();
  const isDisabled = field.disabled ?? disabled ?? false;
  const isRequired = field["aria-required"] ?? required ?? false;

  // The state is held here rather than inside Radix so that `data-checked` is
  // exact in *uncontrolled* use too. Passing a controlled value to Radix and
  // asking the DOM afterwards would be a second source of truth for the one
  // thing the test suite asserts on.
  const [isChecked, setIsChecked] = useControllableState({
    value: checked,
    defaultValue: defaultChecked,
    onChange: (next) => onCheckedChange?.(next),
    name: "Checkbox",
  });

  const control = (
    <CheckboxPrimitive.Root
      ref={ref}
      id={field.id}
      checked={indeterminate ? "indeterminate" : isChecked}
      onCheckedChange={(next) => setIsChecked(next === true)}
      disabled={isDisabled}
      required={isRequired}
      aria-invalid={field["aria-invalid"]}
      aria-describedby={field["aria-describedby"]}
      aria-required={isRequired || undefined}
      data-tea-touch
      className={cn(
        // `rounded-pill` is one of the seven documented exceptions to TEA
        // geometry: a checkbox is a control marker, not a surface.
        "size-4 shrink-0 rounded-pill border border-line-strong bg-surface",
        "inline-flex items-center justify-center p-0 text-primary-fg",
        "transition-[background-color,border-color,box-shadow] duration-fast ease-standard",
        "outline-none",
        "focus-visible:border-ring-strong focus-visible:ring-2 focus-visible:ring-ring",
        "data-[state=checked]:border-primary data-[state=checked]:bg-primary",
        "data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-[invalid=true]:border-critical",
        className,
      )}
      {...stateAttributes({
        disabled: isDisabled,
        invalid: field["aria-invalid"] === true,
        checked: isChecked,
      })}
      {...dataSlot("checkbox")}
      {...props}
    >
      {/* Radix mounts the indicator for the `checked` *and* the `indeterminate`
          state, so nothing here is forced into the DOM. */}
      <CheckboxPrimitive.Indicator className="size-full">
        {indeterminate ? <Minus className="size-full" /> : <Check className="size-full" />}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );

  if (label === undefined || label === null || label === false) return control;

  return (
    <label className="inline-flex items-center gap-2 text-ui" {...dataSlot("checkbox-label")}>
      {control}
      <span>{label}</span>
    </label>
  );
});
