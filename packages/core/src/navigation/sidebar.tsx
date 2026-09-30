import * as React from "react";
import { cn } from "@tea-ui/utils";

import { dataSlot } from "../internal";
import { Nav, type NavItemData } from "./nav";

/**
 * `NavItemData` is re-exported because a consumer of `Sidebar` needs it to build
 * the array, and importing the row shape from a second module to pass it to the
 * first is exactly the kind of two-path confusion the audit found in the source
 * products (`import { cn } from "cn"` alongside `import { cn } from "@/lib/utils"`).
 */
export type { NavItemData };

/**
 * TEA UI — Sidebar.
 *
 * Kill-list entry 16: **two shells in one product, three plus one dead in the
 * other**, and the mobile copy is a *second re-render* of the same navigation
 * that quietly drops two things. The audit's canonical answer is one `Nav`, one
 * `Sidebar`, one `Drawer`, with whatever global search the product has present
 * in **both**.
 *
 * ### What the duplicated versions got wrong
 *
 *  - **The mobile copy was not the desktop copy.** It was written out again, and
 *    it dropped `aria-current` and the search field. A feature that exists only
 *    above 1024 px is a feature half the product does not have — the audit
 *    ranked that the second-highest-severity defect in one public page.
 *  - **Escape did nothing and focus was not trapped.** The hand-rolled overlay
 *    left the main content interactive behind the scrim, so a keyboard user
 *    could tab straight out of an open drawer. `Drawer` fixes both.
 *  - **The brand mark was duplicated** with the desktop header.
 *
 * The fix is not "write a better sidebar". It is that there is now **one place
 * that holds the navigation**, and a product renders it twice — once in this
 * `Sidebar` and once in a `Drawer` — from the same `items` array. A second
 * re-render of the nav is no longer possible, because the pieces are parts.
 *
 * ### The breakpoint is a product decision
 *
 * The audit marks it `DECISION REQUIRED`: *"a 980 px minimum vs `lg` at
 * 1024 px is a product decision, not a CSS one — either the window minimum rises
 * to 1024 or the sidebar breakpoint drops."* A design system cannot settle that,
 * so it exposes it. `breakpoint` defaults to `lg`, which is TEA UI's documented
 * value in `index.css`, and a product with a 980 px minimum passes `md`.
 */
export type SidebarBreakpoint = "sm" | "md" | "lg" | "xl";

/**
 * Breakpoint → the Tailwind class that reveals the sidebar.
 *
 * All four class strings are written out literally, and that is the only way this
 * works: Tailwind extracts classes by scanning source, so a class assembled at
 * runtime (`\`${breakpoint}:flex\``) is never generated and silently produces no
 * CSS. A lookup table keeps every possible string visible to the scanner while
 * the value stays a prop.
 *
 * The first version of this file tried to be cleverer — static `min-[…]` classes
 * *plus* an inline `display: none` — and the inline style simply won, hiding the
 * sidebar at every width.
 */
const SHOW_FROM: Record<SidebarBreakpoint, string> = {
  sm: "sm:flex",
  md: "md:flex",
  lg: "lg:flex",
  xl: "xl:flex",
};

export interface SidebarProps extends React.ComponentProps<"aside"> {
  /**
   * The navigation's accessible name. **Required** — the audit counted three
   * nav groups with no name in one product, and a `<nav>` without a name is a
   * landmark a screen reader cannot tell from the other one.
   */
  label: string;
  /** The items, rendered through `Nav`. */
  items: readonly NavItemData[];
  /** Id of the current route. */
  activeId?: string | undefined;
  onNavigate?: ((id: string) => void) | undefined;
  /** Brand row above the navigation — a product mark, a workspace switcher. */
  header?: React.ReactNode | undefined;
  /**
   * Content between the brand row and the navigation: a global search, a filter,
   * a pinned item. The audit's point is that this must be here rather than only
   * in the desktop copy.
   */
  beforeNav?: React.ReactNode | undefined;
  /** Content below the navigation: a user menu, a version, a logout. */
  footer?: React.ReactNode | undefined;
  /** Rendered width. `w-64` in both source products, so that is the default. */
  width?: string | undefined;
  /** Below this width the sidebar is hidden and the product shows a `Drawer`. */
  breakpoint?: SidebarBreakpoint | undefined;
  /** Drop the border between sidebar and content. */
  bordered?: boolean | undefined;
  className?: string | undefined;
}

/**
 * @example
 * ```tsx
 * // Desktop
 * <Sidebar
 *   label="Hauptnavigation"
 *   items={NAV}
 *   activeId={page}
 *   header={<BrandMark />}
 *   beforeNav={<GlobalSearch />}
 *   footer={<UserMenu />}
 * />
 *
 * // Mobile — the SAME items, from the SAME array
 * <Drawer open={open} onOpenChange={setOpen}>
 *   <DrawerContent side="start">
 *     <SidebarContent label="Hauptnavigation" items={NAV} beforeNav={<GlobalSearch />} />
 *   </DrawerContent>
 * </Drawer>
 * ```
 */
export function Sidebar({
  label,
  items,
  activeId,
  onNavigate,
  header,
  beforeNav,
  footer,
  width = "w-64",
  breakpoint = "lg",
  bordered = true,
  className,
  ...props
}: SidebarProps): React.ReactElement {
  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-dvh shrink-0 flex-col bg-surface",
        width,
        bordered && "border-e border-line",
        // The one decision the audit left open: below this width the product
        // shows a `Drawer` instead, and the two read the same `items`.
        SHOW_FROM[breakpoint],
        className,
      )}
      data-sidebar-breakpoint={breakpoint}
      {...dataSlot("sidebar")}
      {...props}
    >
      <SidebarContent
        label={label}
        items={items}
        activeId={activeId}
        onNavigate={onNavigate}
        header={header}
        beforeNav={beforeNav}
        footer={footer}
      />
    </aside>
  );
}

export interface SidebarContentProps {
  /** The navigation's accessible name. Required, for the reason above. */
  label: string;
  items: readonly NavItemData[];
  activeId?: string | undefined;
  onNavigate?: ((id: string) => void) | undefined;
  header?: React.ReactNode | undefined;
  beforeNav?: React.ReactNode | undefined;
  footer?: React.ReactNode | undefined;
  className?: string | undefined;
}

/**
 * The sidebar's parts, without the frame.
 *
 * This is the export that actually kills the duplication. `Sidebar` is the
 * desktop frame; the mobile drawer needs the *same* content without the
 * `<aside>`, because a drawer already supplies its own panel, header and close
 * button. Splitting the content out is what makes "rendered into both shells"
 * possible at all — and it is the thing the source products could not do, which
 * is why the mobile nav was a second, drifting copy.
 */
export function SidebarContent({
  label,
  items,
  activeId,
  onNavigate,
  header,
  beforeNav,
  footer,
  className,
}: SidebarContentProps): React.ReactElement {
  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)} {...dataSlot("sidebar", "content")}>
      {header ? <div className="shrink-0 border-b border-line p-3">{header}</div> : null}
      {beforeNav ? <div className="shrink-0 p-3">{beforeNav}</div> : null}
      {/*
        `min-h-0` on the scroll region is load-bearing. A flex child with
        content taller than its box defaults to `min-height: auto` and will not
        shrink, so the footer is pushed out of the sidebar instead of the
        navigation scrolling inside it.
      */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <Nav label={label} items={items} activeId={activeId} onNavigate={onNavigate} />
      </div>
      {footer ? <div className="shrink-0 border-t border-line p-3">{footer}</div> : null}
    </div>
  );
}
