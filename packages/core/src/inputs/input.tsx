import * as React from "react";
import { cva, cn, type VariantProps } from "@tea-ui/utils";

import { dataSlot, stateAttributes } from "../internal";
import { useFieldControlProps } from "./field";
import { useInputGroupContext } from "./input-group";

/**
 * TEA UI — Input.
 *
 * A single-line text field, and the reference for every other TEA UI control:
 * it wires itself to a `Field` through {@link useFieldControlProps} rather than
 * accepting `id` and `aria-describedby` by hand, and it derives its height from
 * `--tea-control-h` so one `data-density` attribute retunes every input in a
 * container.
 *
 * Three decisions that are not obvious:
 *
 *  1. **The font goes to 16px on a coarse pointer.** A field rendered below
 *     16px makes iOS Safari zoom the page on focus, and it does not zoom back
 *     out when the user tabs away — the page is left magnified. The source
 *     project patched this with `md:text-sm`, which is a viewport-width guess:
 *     it leaves a phone in landscape at 14px and zooms anyway. `pointer-coarse:`
 *     asks the only question that matters, which is whether the input is being
 *     operated by a finger. Tailwind emits the media query after the bare size
 *     utilities, so it wins without an `!`-prefix.
 *  2. **`invalid` is an appearance and a state.** It sets `aria-invalid` *and*
 *     moves the border and ring to the critical tone. A red border with no
 *     `aria-invalid` is decoration, and a screen reader user is not told.
 *  3. **The native `size` attribute is gone.** `size` is a styling axis in TEA
 *     UI, and a character count on a text input is a suggestion nobody follows.
 *     Use `width` in `className` for a size hint.
 */
export const inputVariants = cva(
  [
    "w-full min-w-0 rounded-none border border-line bg-surface text-fg",
    "px-[length:var(--tea-control-px)]",
    "transition-[background-color,border-color,color,box-shadow] duration-fast ease-standard",
    "outline-none",
    "placeholder:text-fg-subtle",
    // Below 16px, iOS Safari zooms the page on focus and never zooms back out.
    "pointer-coarse:text-body",
    // `focus-visible:` and never `focus:` — a ring on every mouse press is
    // noise, and it is the reason the audit's tables looked like this.
    "focus-visible:border-ring-strong focus-visible:ring-2 focus-visible:ring-ring",
    "disabled:cursor-not-allowed disabled:border-line disabled:bg-surface-2 disabled:text-fg-subtle",
    "read-only:cursor-default read-only:bg-surface-2 read-only:text-fg-muted",
    "aria-[invalid=true]:border-critical aria-[invalid=true]:ring-critical",
    "file:me-3 file:rounded-none file:border-0 file:bg-transparent file:font-medium file:text-ui",
  ],
  {
    variants: {
      size: {
        sm: "control-h text-micro",
        md: "control-h text-ui",
        lg: "h-[calc(var(--tea-control-h)+0.25rem)] text-ui",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
);

export interface InputProps
  extends Omit<React.ComponentProps<"input">, "size" | "color">,
    VariantProps<typeof inputVariants> {
  /**
   * The value is not acceptable. Sets `aria-invalid` and moves the border and
   * ring to the critical tone.
   *
   * Inside a `Field` the field's `invalid` state wins, because a control that
   * disagrees with the field that describes it is the bug the Field system
   * exists to prevent. Set it here only for a standalone input.
   */
  invalid?: boolean | undefined;
}

/**
 * @example
 * ```tsx
 * <Field required invalid={!!error}>
 *   <FieldLabel>E-mail</FieldLabel>
 *   <Input type="email" autoComplete="email" />
 *   <FieldDescription>We send no confirmation.</FieldDescription>
 *   <FieldError>{error}</FieldError>
 * </Field>
 * ```
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, size, invalid, disabled, readOnly, required, type = "text", ...props },
  ref,
) {
  const field = useFieldControlProps();
  const group = useInputGroupContext();

  const isInvalid = field["aria-invalid"] ?? invalid ?? false;
  const isDisabled = field.disabled ?? disabled ?? false;
  const isReadOnly = field.readOnly ?? readOnly ?? false;
  const isRequired = field["aria-required"] ?? required ?? false;

  return (
    <input
      ref={ref}
      type={type}
      id={field.id}
      aria-describedby={field["aria-describedby"]}
      aria-invalid={isInvalid || undefined}
      aria-required={isRequired || undefined}
      disabled={isDisabled || undefined}
      readOnly={isReadOnly || undefined}
      required={isRequired || undefined}
      data-tea-touch
      {...stateAttributes({ disabled: isDisabled, invalid: isInvalid, readOnly: isReadOnly })}
      {...dataSlot("input")}
      className={cn(inputVariants({ size }), group?.controlClassName, className)}
      {...props}
    />
  );
});
