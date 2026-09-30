import * as React from "react";
import { RefreshCw } from "@tea-ui/icons";
import { COPY } from "@tea-ui/ux-standards";
import { cn } from "@tea-ui/utils";

import { Button, type ButtonProps } from "@tea-ui/core";

/**
 * TEA UI Admin — the refresh control.
 *
 * Kill-list entry 10 in `docs/audit/CONSOLIDATION.md`: **fifteen sites** in one
 * product, one of them a single literal class string repeated eight times, and
 * thirteen hand-written `RefreshCw` spin swaps in the other. Every one of those
 * swaps re-decided the same three things, and they disagreed.
 *
 * The decision this component makes, once:
 *
 *  1. **`loading` is the whole contract.** A refreshing button is not a disabled
 *     button with a swapped icon — `Button loading` already holds the width,
 *     announces itself with `aria-busy` and blocks repeat activation. Thirteen
 *     hand-rolled spin swaps is thirteen chances to forget one of those.
 *  2. **The icon spins, the label does not change.** A refresh that swapped to
 *     "Loading…" and a refresh that kept its label, in the same product, is the
 *     usual outcome. A label that changes on hover-out is a label a screen reader
 *     announces twice, and a button whose width changes under the pointer is a
 *     button people misclick.
 *  3. **A refresh that replaced content with a spinner is the defect this
 *     replaces.** `RefreshButton` refreshes a region that stays on screen; the
 *     refreshing state is `RefreshingIndicator` over preserved content, never a
 *     spinner where the data was. That is why the button does not grow a
 *     full-surface loading state.
 *
 * The busy prop is named `refreshing` rather than `busy` because the audit
 * counted **twelve different busy prop names** across one app
 * (`CONSOLIDATION.md:33`). A prop that says what the work is survives being
 * copied into another file.
 */
export interface RefreshButtonProps extends Omit<ButtonProps, "children" | "loading" | "onClick"> {
  /** The refresh is running. Blocks repeat activation and shows the spinner. */
  refreshing?: boolean | undefined;
  /** Called on every activation. `refreshing` is the caller's job to manage. */
  onClick?: (() => void) | undefined;
  /**
   * The visible label. Defaults to the shared copy deck; a product that wants
   * different words passes them, and the prop wins.
   */
  label?: string | undefined;
  /** The accessible name while `refreshing`. */
  refreshingLabel?: string | undefined;
}

export const RefreshButton = React.forwardRef<HTMLButtonElement, RefreshButtonProps>(
  function RefreshButton(
    { refreshing = false, onClick, label = COPY.actions.refresh, refreshingLabel, className, ...props },
    ref,
  ) {
    return (
      <Button
        ref={ref}
        variant="ghost"
        size="sm"
        loading={refreshing}
        loadingLabel={refreshingLabel ?? COPY.states.refreshing}
        onClick={onClick}
        className={cn("shrink-0", className)}
        {...props}
      >
        {/*
          The glyph is removed rather than dimmed while `refreshing`: `Button`'s
          spinner (14px) takes its place, so the control shows one rotating thing
          instead of two and the width holds. A hidden-but-spaced icon would
          leave the label 14px further from the edge than it was a moment ago.
        */}
        {refreshing ? null : <RefreshCw size={14} aria-hidden="true" data-tea-motion="decorative" />}
        <span>{label}</span>
      </Button>
    );
  },
);
