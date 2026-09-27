import * as React from "react";
import { cn } from "@tea-ui/utils";

import { dataSlot, stateAttributes } from "../internal";

/**
 * TEA UI â€” InputGroup.
 *
 * A control with addons welded to it: a search icon, a unit, a clear button, a
 * currency prefix. The audit found three hand-typed search inputs, each with its
 * own idea of how the icon sat in the box and at what height â€” and the second
 * one had already drifted from the first.
 *
 * The mechanism is a context, not a `Slot`. `Slot` would let the *group* style a
 * child it knows nothing about, which is the wrong direction: what has to change
 * is the control's own chrome, and only the control knows what it is. So the
 * group publishes the classes an inner control must drop â€” border, background,
 * horizontal padding and its own focus ring â€” and `Input` applies them. The
 * group can then wrap `Input`, `Textarea` or a `Select.Trigger`, and the border
 * appears exactly once, on the outside, with the ring on the outside too.
 *
 * Focus is the reason the ring moves out. One ring around the whole group is
 * both prettier and more legible than a ring around a borderless input inside a
 * bordered box: the user can see at a glance that the *group*, not some internal
 * element, has focus.
 */

interface InputGroupContextValue {
  /** What a control inside the group must drop to become the group's surface. */
  controlClassName: string | null;
}

const InputGroupContext = React.createContext<InputGroupContextValue | null>(null);

/** Read by `Input` and `Textarea`. `null` when the control is standalone. */
export function useInputGroupContext(): InputGroupContextValue | null {
  return React.useContext(InputGroupContext);
}

const CONTROL_CLASS_NAME = cn(
  // The group owns the border and the background.
  "h-full flex-1 rounded-none border-0 bg-transparent",
  // The addons own the horizontal space, so the control needs none. Without
  // this the text collides with the icon at every density.
  "px-0",
  // The group's `focus-within:` ring replaces the control's own ring, so the
  // control gives it up.
  "focus-visible:border-transparent focus-visible:ring-0",
  // Same for the invalid ring: one critical ring, on the group.
  "aria-[invalid=true]:ring-0",
);

export interface InputGroupProps extends Omit<React.ComponentProps<"div">, "children"> {
  children?: React.ReactNode;
  /**
   * Name for the group. Give it one whenever the group is more than decoration
   * â€” a `role="group"` with no name appears in the structure list and says
   * nothing, which is worse than not being a group at all.
   */
  label?: string | undefined;
  /** Dim the group. Individual controls keep their own `disabled` state. */
  disabled?: boolean | undefined;
}

/**
 * @example
 * ```tsx
 * <InputGroup label="Server durchsuchen">
 *   <InputGroupStart>
 *     <Search aria-hidden className="size-4" />
 *   </InputGroupStart>
 *   <Input type="search" />
 *   <InputGroupEnd>
 *     <IconButton label="Suche zurÃ¼cksetzen" size="sm">
 *       <X aria-hidden />
 *     </IconButton>
 *   </InputGroupEnd>
 * </InputGroup>
 * ```
 */
export const InputGroup = React.forwardRef<HTMLDivElement, InputGroupProps>(function InputGroup(
  { children, className, label, disabled = false, ...props },
  ref,
) {
  const value = React.useMemo<InputGroupContextValue>(
    () => ({ controlClassName: CONTROL_CLASS_NAME }),
    [],
  );

  return (
    <InputGroupContext.Provider value={value}>
      <div
        ref={ref}
        role={label ? "group" : undefined}
        aria-label={label}
        data-tea-touch
        className={cn(
          "flex min-w-0 items-stretch rounded-none border border-line bg-surface",
          "focus-within:border-ring-strong focus-within:ring-2 focus-within:ring-ring",
          "disabled:opacity-50",
          className,
        )}
        {...stateAttributes({ disabled })}
        {...dataSlot("input-group")}
        {...props}
      >
        {children}
      </div>
    </InputGroupContext.Provider>
  );
});

interface InputGroupAddonProps extends React.ComponentProps<"span"> {
  /** Which edge of the group the addon sits on. Sets the horizontal padding. */
  edge: "start" | "end";
}

/**
 * The shared body of both addons.
 *
 * The addon is a `<span>`, never a wrapper element of its own: it must not
 * introduce a block box between the group's flex line and the control, or the
 * control stops filling the height.
 */
const InputGroupAddon = React.forwardRef<HTMLSpanElement, InputGroupAddonProps>(function InputGroupAddon(
  { children, className, edge, ...props },
  ref,
) {
  return (
    <span
      ref={ref}
      className={cn(
        "flex shrink-0 items-center gap-1 text-fg-muted",
        edge === "start" ? "ps-3 pe-2" : "ps-2 pe-1",
        className,
      )}
      {...dataSlot("input-group-addon")}
      {...props}
    >
      {children}
    </span>
  );
});

export type InputGroupStartProps = React.ComponentProps<"span">;

/**
 * An addon at the start edge â€” a decorative icon, a static prefix, a unit.
 *
 * A `title` attribute is not a label and an `svg` is not one either. If the icon
 * is the only content, either give the *control* a name or mark the icon
 * `aria-hidden` and label the group; never rely on the icon being read.
 */
export const InputGroupStart = React.forwardRef<HTMLSpanElement, InputGroupStartProps>(
  function InputGroupStart(props, ref) {
    return <InputGroupAddon ref={ref} edge="start" {...dataSlot("input-group-start")} {...props} />;
  },
);

export type InputGroupEndProps = React.ComponentProps<"span">;

/**
 * An addon at the end edge â€” a clear button, a suffix, a unit.
 *
 * An interactive child needs an accessible name of its own. The audit's five
 * unnamed icon buttons per table row were all of this shape; `IconButton` makes
 * the name a required prop so that cannot recur.
 */
export const InputGroupEnd = React.forwardRef<HTMLSpanElement, InputGroupEndProps>(function InputGroupEnd(
  props,
  ref,
) {
  return <InputGroupAddon ref={ref} edge="end" {...dataSlot("input-group-end")} {...props} />;
});
