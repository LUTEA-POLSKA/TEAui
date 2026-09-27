import * as React from "react";
import { Toggle as TogglePrimitive, ToggleGroup as ToggleGroupPrimitive } from "radix-ui";
import { cva, cn, type VariantProps } from "@tea-ui/utils";

import { dataSlot, stateAttributes } from "../internal";
import { useButtonGroupContext } from "./button-group";

/**
 * TEA UI — Toggle and ToggleGroup.
 *
 * A button that stays pressed. Two properties separate it from every other
 * control here, and both follow from the fact that it *persists*:
 *
 *  - **`aria-pressed` is a state, not a decoration.** A toggle whose only signal
 *    is a highlight is a plain button to a screen reader user: there is no way
 *    to find out whether the thing they are about to change is already changed.
 *    Radix sets it; the pressed *fill* is the second signal, so the state
 *    survives a monochrome screenshot and a colour-vision deficiency.
 *  - **It belongs in a group.** A lone toggle is usually a checkbox that got the
 *    wrong component, and the styling here assumes peers.
 *
 * `ToggleGroup` is single-select (`type="single"`, `role="radiogroup"`, arrows
 * move and select) or multi-select (`type="multiple"`, `role="group"`, arrows
 * move, Space toggles). Both are Radix, because roving focus across a group is
 * three separate rules and a hand-rolled version gets one of them wrong.
 */

export const toggleVariants = cva(
  [
    "relative inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap",
    "rounded-none border border-transparent font-medium",
    "transition-[background-color,border-color,color,box-shadow] duration-[120ms] ease-standard",
    "outline-none",
    "focus-visible:ring-2 focus-visible:ring-ring",
    "disabled:pointer-events-none disabled:opacity-50",
    "active:translate-y-px",
  ],
  {
    variants: {
      variant: {
        default: "border-line bg-surface-3 text-fg hover:bg-line",
        outline: "border-line bg-transparent text-fg hover:border-line-strong hover:bg-surface-2",
      },
      size: {
        sm: "h-[calc(var(--tea-control-h)-0.25rem)] px-[calc(var(--tea-control-px)-0.25rem)] text-micro",
        md: "control-h px-[length:var(--tea-control-px)] text-ui",
        lg: "h-[calc(var(--tea-control-h)+0.25rem)] px-[calc(var(--tea-control-px)+0.25rem)] text-ui",
      },
    },
    defaultVariants: {
      variant: "outline",
      size: "md",
    },
  },
);

/**
 * Group-wide styling, read by each `Toggle` in the group.
 *
 * A context rather than cloning the group's children: cloning means a `Toggle`
 * wrapped in a consumer's own component silently loses the group's size, which
 * is the kind of bug nobody reports and everybody sees.
 */
interface ToggleGroupStyleContextValue {
  variant: ToggleProps["variant"];
  size: ToggleProps["size"];
}

const ToggleGroupStyleContext = React.createContext<ToggleGroupStyleContextValue | null>(null);

export interface ToggleProps
  extends Omit<React.ComponentProps<typeof TogglePrimitive.Root>, "className">,
    VariantProps<typeof toggleVariants> {
  /** The pressed state, when controlled. */
  pressed?: boolean | undefined;
  /** Initial pressed state, when uncontrolled. */
  defaultPressed?: boolean | undefined;
  /** Called when the pressed state changes. */
  onPressedChange?: ((pressed: boolean) => void) | undefined;
  className?: string | undefined;
}

/**
 * @example
 * ```tsx
 * <Toggle pressed={showGrid} onPressedChange={setShowGrid} aria-label="Gitternetz anzeigen">
 *   <Grid3x3 />
 * </Toggle>
 * ```
 */
export const Toggle = React.forwardRef<HTMLButtonElement, ToggleProps>(function Toggle(
  { className, variant, size, pressed, defaultPressed, onPressedChange, ...props },
  ref,
) {
  const buttonGroup = useButtonGroupContext();
  const group = React.useContext(ToggleGroupStyleContext);

  return (
    <TogglePrimitive.Root
      ref={ref}
      pressed={pressed}
      defaultPressed={defaultPressed}
      onPressedChange={onPressedChange}
      data-tea-touch
      data-tea-grouped={buttonGroup ? buttonGroup.orientation : undefined}
      className={cn(
        toggleVariants({ variant: variant ?? group?.variant, size: size ?? group?.size }),
        "data-[state=on]:border-primary data-[state=on]:bg-primary-subtle data-[state=on]:text-primary",
        className,
      )}
      {...dataSlot("toggle")}
      {...props}
    />
  );
});

export interface ToggleGroupProps
  extends Omit<
      React.ComponentProps<typeof ToggleGroupPrimitive.Root>,
      "type" | "orientation" | "dir" | "children"
    >,
    VariantProps<typeof toggleVariants> {
  /** `single` presses one at a time; `multiple` presses any number. */
  type: "single" | "multiple";
  children?: React.ReactNode;
  /** Which way the items run. Decides the arrow keys. */
  orientation?: "horizontal" | "vertical";
  className?: string | undefined;
}

/**
 * @example
 * ```tsx
 * <ToggleGroup type="multiple" aria-label="Spalten" size="sm">
 *   <Toggle value="cpu">CPU</Toggle>
 *   <Toggle value="ram">RAM</Toggle>
 * </ToggleGroup>
 * ```
 */
/**
 * Radix narrows `type` to a literal per variant, which makes a forwardable
 * `ToggleGroupProps["type"]` union unrepresentable in its own prop type. The
 * component is cast once, here, rather than at every call site.
 */
const ToggleGroupRootPrimitive = ToggleGroupPrimitive.Root as unknown as React.ComponentType<
  React.ComponentProps<"div"> & Record<string, unknown>
>;
export const ToggleGroup = React.forwardRef<HTMLDivElement, ToggleGroupProps>(function ToggleGroup(
  { children, className, type, orientation = "horizontal", variant, size, ...props },
  ref,
) {
  // Radix supplies the role: `radiogroup` for single, `group` for multiple.
  const style = React.useMemo<ToggleGroupStyleContextValue>(
    () => ({ variant: variant ?? "outline", size: size ?? "md" }),
    [variant, size],
  );

  return (
    <ToggleGroupStyleContext.Provider value={style}>
      {/* Radix types `type` as a per-variant literal, so a caller forwarding a
          `ToggleGroupProps["type"]` union is genuinely correct — only the
          narrowing is unrepresentable in the type. Runtime behaviour is Radix's. */}
      <ToggleGroupRootPrimitive
        {...(props as React.ComponentProps<"div">)}
        ref={ref}
        type={type}
        orientation={orientation}
        data-orientation={orientation}
        data-tea-touch
        className={cn(
          "inline-flex items-stretch rounded-none",
          orientation === "vertical" ? "flex-col" : "flex-row",
          "[&>*+*]:-ms-px",
          className,
        )}
        {...stateAttributes({ orientation })}
        {...dataSlot("toggle-group")}
        {...props}
      >
        {children}
      </ToggleGroupRootPrimitive>
    </ToggleGroupStyleContext.Provider>
  );
});
