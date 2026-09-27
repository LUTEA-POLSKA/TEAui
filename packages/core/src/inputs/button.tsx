import * as React from "react";
import { Slot } from "radix-ui";
import { cva, cn, type VariantProps } from "@tea-ui/utils";

import { stateAttributes } from "../internal";
import { Spinner } from "../feedback/spinner";

/**
 * TEA UI — Button. The reference implementation for every component in TEA UI.
 *
 * Read this file before writing another component. It encodes the house style:
 *
 *  1. `cva` for the variant surface, always with `className` passed *into* the
 *     call so a consumer's class merges correctly. (HomeServerManager's Button
 *     did this and its Badge did not — which is how the two drifted.)
 *  2. `variant` and `size` are the only styling axes. There is no `color` prop
 *     and no `className` escape hatch that replaces a variant.
 *  3. State is exposed as data attributes, not only as styling.
 *  4. `asChild` is available on every component that renders an element, so a
 *     consumer can keep native semantics (a real `<a>`) and still get the
 *     styles.
 *  5. `loading` is a first-class state, not a `disabled` alias: it keeps the
 *     control's width, announces itself, and blocks repeat activation.
 *  6. `type` defaults to `"button"`. A TEA UI button inside a form is not a
 *     submit button by accident.
 *  7. The ref is forwarded.
 */
export const buttonVariants = cva(
  [
    "relative inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap",
    "border border-transparent font-medium",
    "transition-[background-color,border-color,color,box-shadow,transform] duration-fast ease-standard",
    "disabled:pointer-events-none disabled:opacity-50",
    "aria-disabled:pointer-events-none aria-disabled:opacity-50",
    // A pressed control moves 1px. It is the cheapest possible tactile feedback
    // and the only one available on a touch device.
    "active:translate-y-px",
  ],
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-fg border-primary hover:bg-primary-hover hover:border-primary-hover",
        secondary: "bg-surface-3 text-fg border-line hover:bg-line hover:border-line-strong",
        outline: "bg-transparent text-fg border-line hover:bg-surface-2 hover:border-line-strong",
        ghost: "bg-transparent text-fg-muted border-transparent hover:bg-surface-3 hover:text-fg",
        subtle: "bg-primary-subtle text-primary border-primary-border hover:bg-primary-subtle/80",
        destructive: "bg-destructive text-destructive-fg border-destructive hover:brightness-110",
        link: "bg-transparent text-primary border-transparent underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        sm: "h-[calc(var(--tea-control-h)-0.25rem)] px-[calc(var(--tea-control-px)-0.25rem)] text-micro",
        md: "control-h px-[length:var(--tea-control-px)] text-ui",
        lg: "h-[calc(var(--tea-control-h)+0.25rem)] px-[calc(var(--tea-control-px)+0.25rem)] text-ui",
        "icon-sm":
          "size-[calc(var(--tea-control-h)-0.25rem)] p-0 [--tea-control-icon:0.875rem] has-[svg]:size-[length:var(--tea-control-icon)]",
        "icon-md":
          "size-[length:var(--tea-control-h)] p-0 [--tea-control-icon:1rem] has-[svg]:size-[length:var(--tea-control-icon)]",
        "icon-lg":
          "size-[calc(var(--tea-control-h)+0.5rem)] p-0 [--tea-control-icon:1.25rem] has-[svg]:size-[length:var(--tea-control-icon)]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends Omit<React.ComponentProps<"button">, "color">,
    VariantProps<typeof buttonVariants> {
  /**
   * Render the consumer's single child element instead of a `<button>`, keeping
   * the styling. Use this whenever the control is really a link or a router
   * link — never to work around a nested-interactive problem.
   */
  asChild?: boolean | undefined;
  /**
   * The element to render instead of `<button>`. Prefer `asChild`; this exists
   * for cases where the consumer must supply an element TEA UI cannot wrap.
   */
  as?: React.ElementType | undefined;
  /**
   * The control is performing an action. Shows a spinner, keeps the width, sets
   * `aria-busy`, and blocks repeat activation — it does *not* collapse to a
   * disabled control, so the label does not shift and the user can still read it.
   */
  loading?: boolean | undefined;
  /** Accessible name for the spinner announced while `loading`. */
  loadingLabel?: string | undefined;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant,
    size,
    asChild = false,
    as,
    loading = false,
    loadingLabel,
    disabled,
    type,
    children,
    ...props
  },
  ref,
) {
  const Component = asChild ? Slot.Root : (as ?? "button");
  const isDisabled = disabled === true || loading;

  return (
    <Component
      ref={ref as React.Ref<HTMLButtonElement>}
      className={cn(buttonVariants({ variant, size, className }))}
      {...(asChild
        ? {}
        : ({ type: type ?? "button", disabled: isDisabled, "aria-busy": loading || undefined } as const))}
      aria-disabled={loading || undefined}
      // A loading button is a real `disabled` element, not a polite one: repeat
      // activation must be impossible, or an impatient second click submits a
      // save twice. The label stays readable and the width does not change.
      onClick={
        loading
          ? (event: React.MouseEvent) => {
              event.preventDefault();
              event.stopPropagation();
            }
          : props.onClick
      }
      {...stateAttributes({ disabled: isDisabled, loading })}
      data-tea-touch
      {...props}
    >
      {loading ? <Spinner size="sm" label={loadingLabel ?? ""} className="-ms-1" /> : null}
      {children}
    </Component>
  );
});

