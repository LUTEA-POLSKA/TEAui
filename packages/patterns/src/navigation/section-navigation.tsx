import * as React from "react";
import { cn } from "@tea-ui/utils";

/**
 * TEA UI Patterns — SectionNavigation.
 *
 * The rail that moves between the sections of one page.
 *
 * The audit found these built as `role="tablist"` on a settings page, with the
 * arrow-key handling copied from a tab implementation and the panel wiring never
 * added. Tabs are not the right role here and the mismatch is not cosmetic: a
 * `tab` promises `aria-controls` pointing at a real panel, and a screen reader
 * user is told they can switch panels with arrow keys when the page scrolls
 * instead. A section rail is navigation *within* a page, which is what
 * `aria-current` exists for, so this is a `nav` with `aria-current="page"` on
 * the active item and no arrow-key roving at all — Tab moves between sections,
 * as it does everywhere else.
 *
 * **The active item is marked by more than colour.** `aria-current` carries it
 * for assistive technology; the weight and background carry it visually. The
 * audit's recurring finding was a selected row distinguished by background alone.
 *
 * **Disabled sections stay visible and say why.** Hiding an unavailable section
 * makes the page look incomplete; a disabled button explains itself through its
 * tooltip while remaining in the list, which is also what lets a screen reader
 * user find it and hear the reason.
 */

export interface SectionNavItem {
  /** Stable id. Also what `onSelect` receives and what `active` matches. */
  id: string;
  label: string;
  /** Count or status beside the label. Decorative — the label carries the name. */
  badge?: React.ReactNode;
  /**
   * Present but not selectable. The section stays in the list — see the file
   * header — so the reason is given in `disabledReason`.
   */
  disabled?: boolean;
  /** Why the section cannot be used. Announced as the button's description. */
  disabledReason?: string;
}

export interface SectionNavigationProps extends Omit<React.ComponentProps<"nav">, "onSelect"> {
  items: readonly SectionNavItem[];
  /** Id of the section currently shown. */
  active: string;
  onSelect: (id: string) => void;
  /**
   * Name for the landmark. **Required** — two `nav`s on one settings page (this
   * one and the app's own) are indistinguishable in the landmark list without it.
   */
  label: string;
  /** Orientation of the rail. Defaults to `vertical`, which is what a rail is. */
  orientation?: "vertical" | "horizontal";
}

export const SectionNavigation = React.forwardRef<HTMLElement, SectionNavigationProps>(
  function SectionNavigation(
    { items, active, onSelect, label, orientation = "vertical", className, ...props },
    ref,
  ) {
    return (
      <nav
        ref={ref}
        aria-label={label}
        data-tea-touch
        className={cn(orientation === "vertical" ? "w-56 shrink-0" : "w-full", className)}
        {...props}
      >
        <ul
          className={cn(
            "flex gap-1",
            orientation === "vertical" ? "flex-col" : "flex-row flex-wrap",
          )}
        >
          {items.map((item) => {
            const isActive = item.id === active;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  /*
                   * `aria-current="page"` rather than a bare `aria-selected`:
                   * this is navigation inside one document, and "you are here" is
                   * the claim being made. `aria-current="true"` would also be
                   * correct and is more widely announced, but `page` is the more
                   * specific value for a place rather than a step.
                   */
                  aria-current={isActive ? "page" : undefined}
                  aria-disabled={item.disabled || undefined}
                  disabled={item.disabled}
                  onClick={() => onSelect(item.id)}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 text-ui text-start transition-colors",
                    orientation === "horizontal" && "w-auto",
                    isActive
                      ? "bg-surface-3 font-medium text-fg"
                      : "text-fg-muted hover:bg-surface-2 hover:text-fg",
                    item.disabled && "opacity-50",
                  )}
                >
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {item.badge}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    );
  },
);