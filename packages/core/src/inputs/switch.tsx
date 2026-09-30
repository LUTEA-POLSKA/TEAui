import * as React from "react";
import { Switch as SwitchPrimitive } from "radix-ui";
import { cn } from "@tea-ui/utils";

import { dataSlot, stateAttributes, useControllableState } from "../internal";
import { useFieldControlProps } from "./field";

/**
 * TEA UI — Switch.
 *
 * An on/off control, for a setting that takes effect immediately. The
 * distinction from `Checkbox` is not visual, it is semantic: a checkbox is a
 * value submitted with a form, a switch is a setting that is already in force.
 * Rendering one as the other teaches users the wrong expectation, so both exist.
 *
 * Radix's `Switch.Root` is a `<button role="switch">` with `aria-checked`, and
 * it is labelable in exactly the same way a `<button>` is — so `FieldLabel`'s
 * `htmlFor` gives it a name, and a standalone `label` wraps it.
 *
 * The state is also carried by the position of the thumb. A switch that only
 * changed colour would be a switch nobody can read without colour vision.
 */
export interface SwitchProps
  extends Omit<
    React.ComponentProps<typeof SwitchPrimitive.Root>,
    "checked" | "defaultChecked" | "children"
  > {
  /** Controlled on/off state. */
  checked?: boolean | undefined;
  /** Uncontrolled initial state. */
  defaultChecked?: boolean | undefined;
  /** Called when the state changes, in both controlled and uncontrolled mode. */
  onCheckedChange?: ((checked: boolean) => void) | undefined;
  /** Text beside the switch, for a control used without a `Field`. */
  label?: React.ReactNode | undefined;
  className?: string | undefined;
}

/**
 * @example
 * ```tsx
 * <Field>
 *   <FieldLabel>Maintenance mode</FieldLabel>
 *   <Switch defaultChecked />
 *   <FieldDescription>New jobs are queued.</FieldDescription>
 * </Field>
 * ```
 */
export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(function Switch(
  { className, label, checked, defaultChecked = false, onCheckedChange, disabled, required, ...props },
  ref,
) {
  const field = useFieldControlProps();
  const isDisabled = field.disabled ?? disabled ?? false;
  const isRequired = field["aria-required"] ?? required ?? false;

  const [isChecked, setIsChecked] = useControllableState({
    value: checked,
    defaultValue: defaultChecked,
    onChange: (next) => onCheckedChange?.(next),
    name: "Switch",
  });

  const control = (
    <SwitchPrimitive.Root
      ref={ref}
      id={field.id}
      checked={isChecked}
      onCheckedChange={setIsChecked}
      disabled={isDisabled}
      required={isRequired}
      aria-invalid={field["aria-invalid"]}
      aria-describedby={field["aria-describedby"]}
      aria-required={isRequired || undefined}
      value={isChecked ? "on" : "off"}
      data-tea-touch
      className={cn(
        // `rounded-pill` is a documented exception: a switch is a control
        // marker, and a square switch reads as a checkbox.
        "relative inline-flex h-4 w-7 shrink-0 items-center rounded-pill border border-line-strong",
        "bg-surface-2 p-0.5",
        "transition-[background-color,border-color] duration-fast ease-standard",
        "outline-none",
        "focus-visible:border-ring-strong focus-visible:ring-2 focus-visible:ring-ring",
        "data-[state=checked]:border-primary data-[state=checked]:bg-primary",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-[invalid=true]:border-critical",
        className,
      )}
      {...stateAttributes({ disabled: isDisabled, invalid: field["aria-invalid"] === true, checked: isChecked })}
      {...dataSlot("switch")}
      {...props}
    >
      <SwitchPrimitive.Thumb
        // The thumb's position is the second signal: the switch is readable
        // with no colour perception at all.
        className={cn(
          "pointer-events-none block size-3 rounded-pill bg-fg transition-transform duration-fast ease-standard",
          "data-[state=checked]:translate-x-3 data-[state=unchecked]:translate-x-0",
          "data-[state=checked]:bg-primary-fg",
        )}
        {...dataSlot("switch-thumb")}
      />
    </SwitchPrimitive.Root>
  );

  if (label === undefined || label === null || label === false) return control;

  return (
    <label className="inline-flex items-center gap-2 text-ui" {...dataSlot("switch-label")}>
      {control}
      <span>{label}</span>
    </label>
  );
});
