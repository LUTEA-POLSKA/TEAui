import * as React from "react";
import { Slider as SliderPrimitive } from "radix-ui";
import { cn } from "@tea-ui/utils";

import { dataSlot, stateAttributes, useControllableState } from "../internal";
import { useFieldControlProps } from "./field";

/**
 * TEA UI — Slider.
 *
 * A slider, and the only TEA UI control with no sensible default value: a
 * slider with no name is a `<div>` a screen reader announces as "slider", and
 * a voice-control user cannot say which one they mean. `label` is required.
 *
 * Three things it gets right that a hand-rolled range never does:
 *
 *  - **A real value text.** `aria-valuetext` is what a screen reader reads
 *    instead of the raw number, so a percentage slider says "40 %" and a
 *    temperature slider says "18 degrees". `formatValue` is how you say it.
 *  - **One tab stop, with arrows and Home/End.** Radix owns the roving focus;
 *    the value is only reachable because the thumb is focusable.
 *  - **The filled track is the value.** A range is readable with no colour
 *    perception, and it is readable *by shape* — a line with a filled part and an
 *    empty part, not two colours on one line.
 */
export interface SliderProps
  extends Omit<
    React.ComponentProps<typeof SliderPrimitive.Root>,
    "value" | "defaultValue" | "onValueChange" | "orientation" | "dir"
  > {
  /**
   * The accessible name. **Required** — there is no default, because a slider
   * whose name is guessed is a slider nobody can identify.
   */
  label: string;
  /** Controlled value. An array, because a range has two thumbs. */
  value?: number[] | undefined;
  /** Uncontrolled initial value. */
  defaultValue?: number[] | undefined;
  /** Called with the whole value array on every change. */
  onValueChange?: ((value: number[]) => void) | undefined;
  /** Lowest selectable value. */
  min?: number | undefined;
  /** Highest selectable value. */
  max?: number | undefined;
  /** Granularity. Left to Radix (1) when omitted. */
  step?: number | undefined;
  /** Which way the track runs. Decides the arrow keys and the fill direction. */
  orientation?: "horizontal" | "vertical";
  /**
   * Turn a number into the words a screen reader should hear, and into the
   * visible readout. Defaults to the bare number.
   */
  formatValue?: ((value: number) => string) | undefined;
  /** Show the formatted value next to the label. Off by default. */
  showValue?: boolean | undefined;
  className?: string | undefined;
}

/**
 * @example
 * ```tsx
 * <Field>
 *   <FieldLabel>Storage</FieldLabel>
 *   <Slider
 *     label="Storage as a percentage"
 *     defaultValue={[40]}
 *     showValue
 *     formatValue={(v) => `${v} %`}
 *   />
 * </Field>
 * ```
 */
export const Slider = React.forwardRef<HTMLSpanElement, SliderProps>(function Slider(
  {
    className,
    label,
    value,
    defaultValue = [0],
    onValueChange,
    min = 0,
    max = 100,
    step,
    orientation = "horizontal",
    formatValue,
    showValue = false,
    disabled,
    ...props
  },
  ref,
) {
  const field = useFieldControlProps();
  const isDisabled = field.disabled ?? disabled ?? false;

  const [values, setValues] = useControllableState({
    value,
    defaultValue,
    onChange: onValueChange,
    name: "Slider",
  });

  const format = React.useCallback(
    (next: number) => (formatValue ? formatValue(next) : String(next)),
    [formatValue],
  );

  return (
    <div className={cn("flex min-w-0 flex-col gap-1", className)} {...dataSlot("slider")}>
      {showValue ? (
        // `aria-hidden`: the value is already on the thumb as `aria-valuetext`,
        // and a second copy is a second announcement.
        <span aria-hidden="true" className="text-micro tabular-nums text-fg-muted">
          {format(values[0] ?? min)}
        </span>
      ) : null}
      <SliderPrimitive.Root
        ref={ref}
        value={values}
        onValueChange={setValues}
        min={min}
        max={max}
        step={step}
        orientation={orientation}
        disabled={isDisabled}
        aria-label={label}
        aria-labelledby={props["aria-labelledby"]}
        aria-describedby={field["aria-describedby"] ?? props["aria-describedby"]}
        data-orientation={orientation}
        data-tea-touch
        className={cn(
          "relative flex touch-none select-none items-center",
          "data-[orientation=horizontal]:h-4 data-[orientation=horizontal]:w-full",
          "data-[orientation=vertical]:h-full data-[orientation=vertical]:w-4",
          "data-[disabled]:opacity-50",
        )}
        {...stateAttributes({ disabled: isDisabled, orientation })}
        {...dataSlot("slider-root")}
        {...props}
      >
        <SliderPrimitive.Track
          className={cn(
            "relative grow overflow-hidden rounded-none bg-surface-3",
            "data-[orientation=horizontal]:h-1 data-[orientation=horizontal]:w-full",
            "data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1",
          )}
          {...dataSlot("slider-track")}
        >
          <SliderPrimitive.Range
            className={cn("absolute bg-primary", "data-[orientation=horizontal]:h-full")}
            {...dataSlot("slider-range")}
          />
        </SliderPrimitive.Track>
        {values.map((_, index) => (
          <SliderPrimitive.Thumb
            key={index}
            aria-label={values.length > 1 ? `${label} ${index + 1}` : undefined}
            className={cn(
              // Pill is a documented exception: a slider thumb is a control
              // marker, and a square one is invisible against the track.
              "block rounded-pill border border-primary bg-primary",
              "outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "disabled:cursor-not-allowed",
            )}
            {...dataSlot("slider-thumb")}
          />
        ))}
      </SliderPrimitive.Root>
    </div>
  );
});
