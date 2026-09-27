import * as React from "react";
import { cn } from "@tea-ui/utils";

import { dataSlot } from "../internal";

/**
 * TEA UI — ButtonGroup.
 *
 * A set of related actions, either spaced apart or welded edge to edge.
 *
 * It renders `role="group"`, which is a real structural relationship the audit
 * got for free in one place and missed in the rest: five copy-pasted button
 * rows with no grouping, no orientation and no name. A group says "these belong
 * together" to a screen reader user navigating by structure, which is exactly
 * the information a visual user gets from the shared border.
 *
 * `joined` is done in CSS on the group's own children rather than by asking
 * each child to cooperate. That matters here: the group's most common member is
 * the reference `Button`, which must not need to know about groups. A negative
 * inline margin on every child after the first removes the double border, and
 * because TEA geometry has a radius of exactly zero, nothing else is needed to
 * make the seam disappear. (With a radius, every child but the first and last
 * would need its corners flattened — which is why the radius is zero.)
 */

interface ButtonGroupContextValue {
  orientation: "horizontal" | "vertical";
  joined: boolean;
}

const ButtonGroupContext = React.createContext<ButtonGroupContextValue | null>(null);

/**
 * Read by the TEA UI controls that can join a group. `null` when standalone.
 *
 * A control that does not read this still renders correctly inside a group —
 * the group styles its children from the outside — so this is an opt-in for
 * the parts that want to adapt, never a requirement.
 */
export function useButtonGroupContext(): ButtonGroupContextValue | null {
  return React.useContext(ButtonGroupContext);
}

export interface ButtonGroupProps extends Omit<React.ComponentProps<"div">, "children"> {
  children?: React.ReactNode;
  /**
   * Name for the group. **Required** — a `role="group"` with no name is an
   * entry in the structure list that says nothing, which costs a screen reader
   * user a stop for no information.
   */
  label: string;
  /** Direction the children run in. Decides the join axis and the arrow order. */
  orientation?: "horizontal" | "vertical";
  /**
   * Weld the children into one control: one border, no gaps, one shared focus
   * ring per child. Off by default, because a toolbar of unrelated actions
   * should not look like a segmented control.
   */
  joined?: boolean;
}

/**
 * @example
 * ```tsx
 * <ButtonGroup label="Ansicht" joined>
 *   <Button variant="outline">Tag</Button>
 *   <Button variant="outline">Woche</Button>
 *   <Button variant="outline">Monat</Button>
 * </ButtonGroup>
 * ```
 */
export const ButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(function ButtonGroup(
  { children, className, label, orientation = "horizontal", joined = false, ...props },
  ref,
) {
  const value = React.useMemo<ButtonGroupContextValue>(
    () => ({ orientation, joined }),
    [orientation, joined],
  );

  return (
    <ButtonGroupContext.Provider value={value}>
      <div
        ref={ref}
        role="group"
        aria-label={label}
        data-orientation={orientation}
        data-joined={joined || undefined}
        data-tea-touch
        className={cn(
          "inline-flex items-stretch",
          orientation === "vertical" ? "flex-col" : "flex-row",
          // The seam: pull each child back over the shared border. `-ms-px` and
          // `-mt-px` are layout, not `!`-prefixed overrides, and they are
          // scoped to the group's own children.
          joined && orientation === "horizontal" && "[&>*+*]:-ms-px",
          joined && orientation === "vertical" && "[&>*+*]:-mt-px",
          !joined && "gap-2",
          className,
        )}
        {...dataSlot("button-group")}
        {...props}
      >
        {children}
      </div>
    </ButtonGroupContext.Provider>
  );
});

export type ButtonGroupSeparatorProps = React.ComponentProps<"span">;

/**
 * A gap inside a `joined` group, for splitting one control into two halves —
 * "undo" and "redo", "date from" and "date to". A separator is a `<span>` with
 * `aria-hidden`, because it is a drawing, not content.
 */
export const ButtonGroupSeparator = React.forwardRef<HTMLSpanElement, ButtonGroupSeparatorProps>(
  function ButtonGroupSeparator({ className, ...props }, ref) {
    return (
      <span
        ref={ref}
        aria-hidden="true"
        className={cn("shrink-0 self-stretch bg-line w-px", className)}
        {...dataSlot("button-group-separator")}
        {...props}
      />
    );
  },
);
