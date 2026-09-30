import * as React from "react";
import { cn } from "@tea-ui/utils";

import { useFieldControlProps } from "./field";
import { InputGroup, InputGroupEnd, InputGroupStart } from "./input-group";
import { NumberInput, type NumberInputProps } from "./number-input";

/**
 * TEA UI — NumberField.
 *
 * The audit's verdict on the source `NumField` was unambiguous: *"the best form
 * control we found"*, and it was used **exactly once** in thirteen pages
 * (`LoadingScreenEditor.tsx:1584-1609`). A control that good, used once, is not a
 * control — it is an implementation someone forgot to publish.
 *
 * What it had that `NumberInput` alone does not:
 *
 *  - a **unit suffix** welded into the box, so "512" is never ambiguous between
 *    megabytes and megahertz;
 *  - commit on **blur or Enter**, and revert on a parse failure — which is what
 *    `NumberInput` already does, and why this composes it rather than
 *    reimplementing the parse;
 *  - the `Field` wiring, so the field gets an `id`, a `htmlFor` from
 *    `FieldLabel`, `aria-invalid` and the `aria-describedby` chain. The audit
 *    counted **zero** `htmlFor` in the whole frontend and no
 *    `aria-describedby` anywhere; a number field that skips the wiring would be
 *    the thirteenth site that repeats that.
 *
 * ### The unit is announced, not decoration
 *
 * A `<span>GB</span>` beside an input is invisible to a screen reader, and an
 * input announced as "512" is a number without a scale. So the unit gets a real
 * `id` and is added to the control's `aria-describedby` chain: the field is read
 * as "Speicherplatz, 512, Gigabyte". It is *not* the accessible **name** — the
 * name is what the field is, and the unit is what its value is measured in.
 *
 * ### Why it is not a `type="number"` replacement
 *
 * `NumberInput` keeps `type="number"` for the native stepper and arrow keys. The
 * German decimal comma arrives through `inputMode="decimal"`, because
 * `inputMode="numeric"` asks a phone for a keypad with no comma key, and a user
 * who cannot type `0,5` on an otherwise German form is stuck.
 */
export interface NumberFieldProps
  extends Omit<
    NumberInputProps,
    // `prefix` collides with the RDFa `prefix` attribute that React's global
    // HTML typings declare as `string`. A currency glyph is not a vocabulary
    // URI, so the DOM meaning is dropped deliberately rather than by accident.
    "size" | "className" | "id" | "aria-describedby" | "prefix"
  > {
  /**
   * The unit shown at the end of the box, e.g. `"GB"`, `"%"`, `"min"`.
   *
   * It is announced through `aria-describedby`, so a screen-reader user hears the
   * scale as well. Omit it for a dimensionless number.
   */
  unit?: React.ReactNode | undefined;
  /** The unit at the start edge instead — for a currency symbol. */
  prefix?: React.ReactNode | undefined;
  /** The control height. */
  size?: NumberInputProps["size"];
  className?: string | undefined;
}

export const NumberField = React.forwardRef<HTMLInputElement, NumberFieldProps>(function NumberField(
  { unit, prefix, size, className, ...props },
  ref,
) {
  const control = useFieldControlProps();
  const unitId = React.useId();

  const describedBy = [control["aria-describedby"], unit ? unitId : undefined]
    .filter(Boolean)
    .join(" ");

  return (
    /*
     * The group is deliberately **not** a `role="group"`.
     *
     * The audit's own complaint about groups is that an unnamed one appears in
     * the structure list and says nothing. The group's name is the field's
     * visible label, which is a child of `Field` and not reachable from here —
     * and the control inside already carries that name through the `<label
     * for>`, so a second landmark would announce the same thing twice. What the
     * group adds is the border, the `focus-within` ring and the unit; none of
     * that needs a role.
     */
    <InputGroup className={cn(className)}>
      {prefix ? (
        <InputGroupStart className="font-mono text-ui text-fg-muted">{prefix}</InputGroupStart>
      ) : null}
      <NumberInput
        ref={ref}
        size={size}
        id={control.id}
        aria-describedby={describedBy || undefined}
        aria-invalid={control["aria-invalid"]}
        aria-required={control["aria-required"]}
        disabled={control.disabled}
        readOnly={control.readOnly}
        {...props}
      />
      {unit ? (
        // Not `aria-hidden`: this text is how the value gets its scale. The id is
        // what the control above points at.
        <InputGroupEnd id={unitId} className="font-mono text-ui">
          {unit}
        </InputGroupEnd>
      ) : null}
    </InputGroup>
  );
});
