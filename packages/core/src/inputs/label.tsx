import * as React from "react";
import { Label as LabelPrimitive } from "radix-ui";
import { cn } from "@tea-ui/utils";
import { COPY } from "@tea-ui/ux-standards";

import { dataSlot, stateAttributes } from "../internal";

/**
 * TEA UI — Label.
 *
 * A label for a control, for the cases where `FieldLabel` is not the right
 * thing: a filter chip row, a settings list, a dialog's field grid that already
 * has its own layout.
 *
 * It is a real `<label>` with a real `htmlFor`, which is the whole point. The
 * audit found that most of the problems it was supposed to solve came from
 * treating a label as a styling element that happens to sit near a control.
 * `htmlFor` is not decoration: it is what gives the control its accessible
 * name, and without it a text field is an unnamed box to a screen reader and
 * an unspeakable one to a voice-control user.
 *
 * `Label.Root` from `radix-ui` rather than a bare `<label>`, because it also
 * makes clicking the label activate the control when the control is a Radix
 * primitive rendering a `<button>`.
 */

export interface LabelProps extends React.ComponentProps<typeof LabelPrimitive.Root> {
  /**
   * Mark the label's control as required. Renders a visible asterisk plus a
   * visually hidden "Pflichtfeld", because an asterisk is a shape a screen
   * reader cannot report.
   *
   * The control still needs `aria-required` — inside a `Field` that comes from
   * the field, and `FieldLabel` reads it from the same place.
   */
  required?: boolean | undefined;
  /** The control this label names is disabled. Styles the label to match. */
  disabled?: boolean | undefined;
  className?: string | undefined;
}

/**
 * @example
 * ```tsx
 * <Label htmlFor="display-name" required>
 *   Anzeigename
 * </Label>
 * <Input id="display-name" aria-required />
 * ```
 */
export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(function Label(
  { children, className, required = false, disabled, ...props },
  ref,
) {
  return (
    <LabelPrimitive.Root
      ref={ref}
      className={cn("inline-flex items-center gap-1 text-ui font-medium text-fg", className)}
      {...stateAttributes({ disabled })}
      {...dataSlot("label")}
      {...props}
    >
      {children}
      {required ? (
        <>
          <span aria-hidden="true" className="text-critical">
            *
          </span>
          <span className="sr-only">{` ${COPY.states.required}`}</span>
        </>
      ) : null}
    </LabelPrimitive.Root>
  );
});
