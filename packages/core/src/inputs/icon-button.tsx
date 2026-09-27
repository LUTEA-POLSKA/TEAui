import * as React from "react";

import { dataSlot } from "../internal";
import { Button, type ButtonProps } from "./button";
import { useButtonGroupContext } from "./button-group";

/**
 * TEA UI — IconButton.
 *
 * A button whose entire content is an icon, which is the one control shape
 * where the accessible name cannot come from the content. The audit found five
 * such buttons on every table row, every one of them unnamed: a screen reader
 * announced "button" five times, and a voice-control user could not operate the
 * table at all, because there was no word to say.
 *
 * The fix is not a lint rule — it is a required prop. `label` has no default
 * and no `undefined` escape, so the compiler refuses the unnamed button. That
 * is worth more than a whole paragraph in a style guide.
 *
 * The icon itself is wrapped in an `aria-hidden` span. `aria-label` on the
 * button is already the name, and leaving the icon in the tree risks a second,
 * conflicting name from an icon that happens to carry a `<title>`.
 */
export interface IconButtonProps
  extends Omit<ButtonProps, "size" | "children" | "asChild" | "as"> {
  /**
   * The accessible name. **Required** — an icon-only button without one is the
   * defect this component exists to make impossible. Write the action, not the
   * icon: "Server neu starten", not "Pfeil".
   */
  label: string;
  /** Button size, mapped onto Button's `icon-*` sizes. */
  size?: "sm" | "md" | "lg";
  children?: React.ReactNode;
}

/** TEA UI's `icon-sm|md|lg` axes are Button's; the mapping is the whole file. */
const ICON_SIZE = {
  sm: "icon-sm",
  md: "icon-md",
  lg: "icon-lg",
} as const;

/**
 * @example
 * ```tsx
 * <IconButton label="Server neu starten" variant="ghost" onClick={restart}>
 *   <RefreshCw />
 * </IconButton>
 * ```
 */
export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, size = "md", children, variant = "ghost", ...props },
  ref,
) {
  const group = useButtonGroupContext();

  return (
    <Button
      ref={ref}
      size={ICON_SIZE[size]}
      variant={variant}
      aria-label={label}
      data-tea-grouped={group ? group.orientation : undefined}
      {...dataSlot("icon-button")}
      {...props}
    >
      <span aria-hidden="true" className="inline-flex items-center justify-center">
        {children}
      </span>
    </Button>
  );
});
