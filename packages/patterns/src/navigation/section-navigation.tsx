import * as React from "react";
import { cn } from "@tea-ui/utils";
import { FEEDBACK } from "@tea-ui/ux-standards";

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
 * **Disabled sections stay focusable and say why.** Hiding an unavailable
 * section makes the page look incomplete, and a natively `disabled` button is
 * worse than hiding it: the browser drops it out of the tab order, so a
 * keyboard user never lands on it, never learns it exists, and never hears the
 * one string that explains it. An unavailable section is information — "this
 * exists and here is why you cannot have it yet" — so it is rendered with
 * `aria-disabled` rather than `disabled`: still in the tab order, still
 * announced, still announcing its reason through `aria-describedby`, and still
 * guarded in the click handler because `aria-disabled` suppresses neither the
 * click event nor the browser's own affordances. `title` is kept for a pointer,
 * but it is the tooltip, not the contract: a tooltip is unavailable to a
 * keyboard user and unreachable by touch.
 */

export interface SectionNavItem {
  /** Stable id. Also what `onSelect` receives and what `active` matches. */
  id: string;
  label: string;
  /** Count or status beside the label. Decorative — the label carries the name. */
  badge?: React.ReactNode;
  /**
   * Present but not selectable. The section stays in the list — see the file
   * header — so the reason is given in `disabledReason`. Note that this is
   * `aria-disabled` rather than the native attribute, so the item remains
   * focusable and its reason remains reachable.
   */
  disabled?: boolean;
  /**
   * Why the section cannot be used. Rendered as the button's description
   * (`aria-describedby`) *and* as its `title`, so it reaches a keyboard user
   * and a screen reader as well as a pointer. Omit it only when there is
   * genuinely nothing to say — an `aria-disabled` item with no description
   * tells the user that it is unavailable and not why.
   */
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
    /*
     * One `useId` for the rail, not one per item: a hook inside the map would
     * change the number of hooks between renders whenever the item list
     * changes length, which is the hook-order bug the lint rule exists for.
     * `useId` emits `:r0:`, a legal HTML id and an illegal CSS identifier, so
     * the colons go — a consumer has to be able to reach this element with a
     * selector, and the reason id is an element a consumer may well target.
     */
    const idBase = React.useId().replace(/:/g, "");

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
          {items.map((item, index) => {
            const isActive = item.id === active;
            const reasonId = `${idBase}-${index}-reason`;
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
                  /*
                   * `aria-disabled`, NOT `disabled`. The native attribute takes the
                   * element out of the tab order and out of the accessibility tree's
                   * reachable set, so the item could not be focused, could not be
                   * read, and the `disabledReason` below could not be announced to
                   * anyone. An unavailable section is information, and information
                   * has to be reachable — so it stays focusable and says why.
                   */
                  aria-disabled={item.disabled || undefined}
                  aria-describedby={item.disabled && item.disabledReason ? reasonId : undefined}
                  title={item.disabled ? item.disabledReason : undefined}
                  /*
                   * The guard, because `aria-disabled` stops nothing: the button
                   * still receives the click, still takes focus, and a screen reader
                   * still lets a user activate it. Without this, the polite
                   * attribute would be a lie the browser does not enforce.
                   */
                  onClick={() => {
                    if (item.disabled) return;
                    onSelect(item.id);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 text-ui text-start transition-colors",
                    orientation === "horizontal" && "w-auto",
                    item.disabled
                      ? // No hover affordance either. A disabled row that lights up
                        // under the pointer promises a click that will not happen,
                        // which is a worse lie than saying nothing.
                        "cursor-not-allowed text-fg-subtle opacity-50"
                      : isActive
                        ? "bg-surface-3 font-medium text-fg"
                        : "text-fg-muted hover:bg-surface-2 hover:text-fg",
                  )}
                >
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {item.badge}
                  {/*
                   * The reason is not only for assistive technology. `opacity-50`
                   * on its own distinguishes this row by *contrast alone*, which is
                   * exactly what WCAG 2.2 1.4.1 forbids, and it is invisible to
                   * anyone who cannot see the row and to anyone on a display where
                   * the difference does not read. A visible word carries the state
                   * on a second channel, and `FEEDBACK.disabled.label` is the deck's
                   * word for it rather than a string typed here.
                   */}
                  {item.disabled ? (
                    <span className="shrink-0 text-label uppercase tracking-widest text-fg-subtle">
                      {FEEDBACK.disabled.label}
                    </span>
                  ) : null}
                </button>
                {item.disabled && item.disabledReason ? (
                  /*
                   * `sr-only`, not `hidden` and not `aria-hidden`: a
                   * display-none description is not in the accessibility tree, so
                   * `aria-describedby` would point at nothing and the reason would
                   * be lost again — the same defect as the native `disabled`.
                   */
                  <span id={reasonId} className="sr-only">
                    {item.disabledReason}
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      </nav>
    );
  },
);