import * as React from "react";
import { cn } from "@tea-ui/utils";

import { Input, type InputProps } from "./input";

/**
 * TEA UI — NumberInput.
 *
 * A numeric field that clamps **on blur**, not on every keystroke.
 *
 * This is the whole design. The obvious implementation — clamp in `onChange` —
 * is unusable: the moment a user selects `150` in order to type `90`, the clamp
 * fires on the first keystroke, rewrites the box to `100`, and puts the cursor
 * somewhere the user did not choose. A user cannot type a value *below* the
 * current one. The same implementation makes a field that starts empty
 * permanently unwritable, because the intermediate `-` or `,` is not a number.
 *
 * So the field holds whatever the user typed, and on blur the value is parsed,
 * clamped into `[min, max]` and reported once. The user can type anything; the
 * model can only receive a number inside the declared range. And no value is
 * ever reported twice for the same number.
 *
 * `step` is passed to the DOM but deliberately **not** enforced on blur. A field
 * that silently rewrites `0.333` to `0.33` is lying about what was typed, and no
 * native numeric control snaps on blur either. The stepper and the arrow keys
 * honour `step`; free typing does not.
 */
export interface NumberInputProps
  extends Omit<InputProps, "value" | "defaultValue" | "onChange" | "type" | "inputMode" | "size"> {
  /** Controlled numeric value. */
  value?: number | undefined;
  /** Uncontrolled initial numeric value. */
  defaultValue?: number | undefined;
  /** Called with the parsed number on change, and with the clamped value on blur. */
  onValueChange?: ((value: number) => void) | undefined;
  /** Lower bound. Enforced on blur. */
  min?: number | undefined;
  /** Upper bound. Enforced on blur. */
  max?: number | undefined;
  /** Increment for the native stepper and the arrow keys. Not enforced on blur. */
  step?: number | undefined;
  /**
   * `decimal` by default rather than `numeric`, because `numeric` asks a phone
   * for a keypad with no comma key — and a German user then cannot type `0,5`
   * at all, on a form that is otherwise entirely in German.
   */
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  /** The control height. */
  size?: InputProps["size"];
  className?: string | undefined;
}

/**
 * @example
 * ```tsx
 * <Field>
 *   <FieldLabel>Anzahl</FieldLabel>
 *   <NumberInput min={1} max={64} defaultValue={4} />
 * </Field>
 * ```
 */
export const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  function NumberInput(
    {
      value,
      defaultValue,
      onValueChange,
      min,
      max,
      step,
      inputMode = "decimal",
      size,
      className,
      onBlur,
      ...props
    },
    ref,
  ) {
    const isControlled = value !== undefined;
    // The text in the box belongs to the user and is allowed to be temporarily
    // unparseable. That is the entire reason this component exists.
    const [text, setText] = React.useState(() => stringify(value ?? defaultValue));
    const lastEmitted = React.useRef<number | undefined>(undefined);

    // A controlled value that changes from outside must reach the box — but the
    // box is only overwritten when the *outside* value actually changed, never
    // because a render happened.
    const lastExternal = React.useRef(value);
    React.useEffect(() => {
      if (isControlled && !Object.is(value, lastExternal.current)) {
        lastExternal.current = value;
        setText(stringify(value));
      }
    }, [isControlled, value]);

    // The contract is explicit: never emit a change for a value that did not
    // change. Without this, a blur re-reports the number that the last
    // keystroke already reported, and a consumer writing that straight into
    // state renders a second time for nothing.
    const emit = React.useCallback(
      (next: number) => {
        if (Object.is(lastEmitted.current, next)) return;
        lastEmitted.current = next;
        onValueChange?.(next);
      },
      [onValueChange],
    );

    const parse = (raw: string): number | null => {
      const parsed = Number.parseFloat(raw.trim().replace(",", "."));
      return Number.isFinite(parsed) ? parsed : null;
    };

    return (
      <Input
        ref={ref}
        type="number"
        size={size}
        inputMode={inputMode}
        min={min}
        max={max}
        step={step}
        className={cn(className)}
        value={text}
        onChange={(event) => {
          setText(event.target.value);
          const parsed = parse(event.target.value);
          if (parsed !== null) emit(clamp(parsed, min, max));
        }}
        onBlur={(event) => {
          const parsed = parse(text);
          if (parsed === null) {
            // An empty or half-typed box reverts to the last known good value
            // instead of reporting `NaN` into the model.
            if (text.trim() === "") setText(stringify(value ?? defaultValue));
          } else {
            const next = clamp(parsed, min, max);
            setText(stringify(next));
            emit(next);
          }
          onBlur?.(event);
        }}
        {...props}
      />
    );
  },
);

function stringify(value: number | undefined): string {
  return typeof value === "number" && Number.isFinite(value) ? String(value) : "";
}

function clamp(value: number, min: number | undefined, max: number | undefined): number {
  let next = value;
  if (typeof min === "number" && next < min) next = min;
  if (typeof max === "number" && next > max) next = max;
  return next;
}
