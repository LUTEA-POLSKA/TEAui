import * as React from "react";
import { cva, cn, type VariantProps } from "@tea-ui/utils";

import { dataSlot, stateAttributes, withPrivateRef } from "../internal";
import { useFieldControlProps } from "./field";
import { useInputGroupContext } from "./input-group";

/**
 * TEA UI — Textarea.
 *
 * A multi-line text field with the same field wiring, the same density tokens
 * and the same iOS-zoom floor as `Input`. It differs in exactly two ways:
 *
 *  - it has no `size` variant, because its height comes from `rows`, not from
 *    the control token;
 *  - it can measure itself.
 */

/**
 * The base surface. Shared with `Input` deliberately: a text field and a text
 * *area* that do not match pixel-for-pixel read as two different products.
 */
export const textareaVariants = cva(
  [
    "w-full min-w-0 rounded-none border border-line bg-surface text-fg",
    "px-[length:var(--tea-control-px)] py-2",
    "transition-[background-color,border-color,color,box-shadow] duration-fast ease-standard",
    "outline-none",
    "placeholder:text-fg-subtle",
    "pointer-coarse:text-body",
    "focus-visible:border-ring-strong focus-visible:ring-2 focus-visible:ring-ring",
    "disabled:cursor-not-allowed disabled:border-line disabled:bg-surface-2 disabled:text-fg-subtle",
    "read-only:cursor-default read-only:bg-surface-2 read-only:text-fg-muted",
    "aria-[invalid=true]:border-critical aria-[invalid=true]:ring-critical",
  ],
  {
    variants: {
      size: {
        sm: "text-micro",
        md: "text-ui",
        lg: "text-ui",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
);

export interface TextareaProps
  extends Omit<React.ComponentProps<"textarea">, "size" | "color" | "rows">,
    VariantProps<typeof textareaVariants> {
  /** Visible rows. The one way a textarea's height is set explicitly. */
  rows?: number;
  /**
   * Grow with the content instead of scrolling inside a fixed box.
   *
   * The recalculation sets the height to `scrollHeight`, which means the
   * element's own scroll position is discarded on every keystroke — that is
   * what makes naive auto-resize feel broken. The fix here is to only ever set
   * an explicit height that is at least as large as the content, and to leave
   * `overflow-y` alone, so a box the user has scrolled inside never jumps.
   */
  autoResize?: boolean | undefined;
  /** The value is not acceptable. See `Input`'s `invalid`. */
  invalid?: boolean | undefined;
  className?: string | undefined;
}

/**
 * @example
 * ```tsx
 * <Field invalid={!!error}>
 *   <FieldLabel>Notizen</FieldLabel>
 *   <Textarea rows={3} autoResize />
 *   <FieldError>{error}</FieldError>
 * </Field>
 * ```
 */
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, size, rows, autoResize = false, invalid, disabled, readOnly, required, ...props },
  ref,
) {
  const field = useFieldControlProps();
  const group = useInputGroupContext();
  const [node, setNode] = React.useState<HTMLTextAreaElement | null>(null);

  const isInvalid = field["aria-invalid"] ?? invalid ?? false;
  const isDisabled = field.disabled ?? disabled ?? false;
  const isReadOnly = field.readOnly ?? readOnly ?? false;
  const isRequired = field["aria-required"] ?? required ?? false;

  // Measure after layout, and only when asked. `scrollHeight` is 0 until the
  // element is in the document, so this has to be an effect and not a render.
  React.useLayoutEffect(() => {
    const element = node;
    if (!element || !autoResize) return;

    // Remember the user's scroll offset across the measurement: a box the user
    // has scrolled to the bottom of must not spring back to the top because
    // the height was recomputed.
    const scrollTop = element.scrollTop;
    const wasOverflowing = element.scrollHeight > element.clientHeight;

    element.style.height = "auto";
    const next = element.scrollHeight;
    // Never shrink below what the user is looking at.
    element.style.height = `${Math.max(next, wasOverflowing ? element.clientHeight : 0)}px`;
    if (wasOverflowing) element.scrollTop = scrollTop;
  }, [node, autoResize, props.value]);

  return (
    <textarea
      ref={withPrivateRef(ref, undefined, setNode)}
      rows={rows}
      id={field.id}
      aria-describedby={field["aria-describedby"]}
      aria-invalid={isInvalid || undefined}
      aria-required={isRequired || undefined}
      disabled={isDisabled || undefined}
      readOnly={isReadOnly || undefined}
      required={isRequired || undefined}
      data-tea-touch
      data-auto-resize={autoResize || undefined}
      {...stateAttributes({ disabled: isDisabled, invalid: isInvalid, readOnly: isReadOnly })}
      {...dataSlot("textarea")}
      className={cn(
        textareaVariants({ size }),
        // A textarea inside an `InputGroup` fills it rather than growing: the
        // group's border is the box, and a growing control would tear it.
        group ? "h-full resize-none overflow-auto border-0 bg-transparent px-0" : "resize-y",
        className,
      )}
      {...props}
    />
  );
});
