import * as React from "react";
import { COPY, IA_LIMITS } from "@tea-ui/ux-standards";
import { cn } from "@tea-ui/utils";

import { dataSlot, stateAttributes } from "../internal";

/**
 * TEA UI — Nav and NavItem.
 *
 * Kill-list entry 13: **two byte-identical nav-item blocks in one product and
 * five hand-rolled ones in the other**, for six sites between them. The
 * duplication was not the styling — it was three decisions each site re-made:
 *
 *  1. **Is the nav a `<nav>` with a name?** The audit counted three nav groups in
 *    navigations with no `aria-label`, and one codebase with **three** `role`
 *    assignments. A `<nav>` without a name is a landmark a screen reader cannot
 *    tell from the other one, and there is usually more than one. `Nav` emits
 *    the landmark and `aria-label` always, and takes the label as a **required**
 *    prop so an unnamed nav cannot compile.
 *  2. **What marks the current item?** Colour, in both projects. A filled
 *    accent surface is invisible to a screen reader and ambiguous in a greyscale
 *    screenshot. `NavItem` sets `aria-current="page"` alongside the styling.
 *  3. **Is the active item's colour distinguishable from its focus ring?** TEA UI
 *    deliberately sets `ring` and `accent` to the same gold, so an active item
 *    that is *filled* would obliterate a focus ring painted on it. The active
 *    state is therefore a **subtle fill plus a font-weight change plus the left
 *    marker**, never a solid fill, and the focus ring stays legible on top of it.
 *
 * `IA_LIMITS` is consulted in development only. A sidebar with fourteen entries
 * is a real navigation problem, but it is not a build failure — so it warns
 * rather than throws, and the warning names the limit it came from.
 */
export interface NavItemData {
  /** Stable key, matched against `Nav`'s `activeId`. */
  id: string;
  /** The visible label. Say the thing, not "Home". */
  label: string;
  /** A router path, when the item is a link. */
  href?: string | undefined;
  /** Called instead of the browser navigating, when a router owns navigation. */
  onSelect?: (() => void) | undefined;
  /** Glyph before the label. Decorative. */
  icon?: React.ReactNode | undefined;
  /** A count or short status, rendered after the label. */
  meta?: React.ReactNode | undefined;
  /**
   * Group heading. Consecutive items sharing a group become one labelled block.
   * Omit it for items that belong to no group.
   */
  group?: string | undefined;
  disabled?: boolean | undefined;
}

export interface NavProps extends Omit<React.ComponentProps<"nav">, "children"> {
  /**
   * The landmark's accessible name. **Required** — three unlabelled nav groups
   * in the source product is the defect, and a required prop is worth more than
   * a paragraph in a style guide.
   */
  label: string;
  items: readonly NavItemData[];
  /** Id of the current route. Exactly one item matches, or none. */
  activeId?: string | undefined;
  /** Called for every activation, so the consumer can own routing. */
  onNavigate?: ((id: string) => void) | undefined;
  /**
   * A group heading repeats on hover, a screen reader reads it once as text and
   * cannot tie it to the items that follow.
   */
  orientation?: "vertical" | "horizontal" | undefined;
  className?: string | undefined;
}

function groupItems(items: readonly NavItemData[]): Array<{ label: string; items: NavItemData[] }> {
  const order: string[] = [];
  const map = new Map<string, NavItemData[]>();
  for (const item of items) {
    const key = item.group ?? "";
    if (!map.has(key)) {
      map.set(key, []);
      order.push(key);
    }
    map.get(key)!.push(item);
  }
  return order.map((label) => ({ label, items: map.get(label) ?? [] }));
}

/**
 * A development-only guard, without pulling `@types/node` into a browser package.
 *
 * The declaration is module-scoped on purpose. `core` has no Node types and
 * should not acquire them for one environment check, and a *global* `declare`
 * would collide with a consumer that does have them.
 */
declare const process: { env?: { NODE_ENV?: string } } | undefined;

const isDevelopment = (): boolean =>
  typeof process === "undefined" || process?.env?.NODE_ENV !== "production";

/** Development-only. A warning, never a throw: an oversized nav is a design
 * problem, not a broken build, and a library that crashes a product's dev server
 * over navigation taste has overstepped. */
function warnAboutLimits(items: readonly NavItemData[], grouped: Array<{ label: string; items: NavItemData[] }>): void {
  if (!isDevelopment()) return;

  const topLevel = new Set(items.map((item) => item.group ?? "")).size;
  if (topLevel > IA_LIMITS.maxTopLevel) {
    console.warn(
      `[tea-ui] Nav: ${topLevel} groups exceeds IA_LIMITS.maxTopLevel (${IA_LIMITS.maxTopLevel}). ` +
        `Past this, a user scans the sidebar instead of reading it — consider a different mechanism.`,
    );
  }
  for (const group of grouped) {
    if (group.items.length > IA_LIMITS.maxGroupSize) {
      console.warn(
        `[tea-ui] Nav: group "${group.label || "(ungrouped)"}" has ${group.items.length} items, ` +
          `over IA_LIMITS.maxGroupSize (${IA_LIMITS.maxGroupSize}). Split it, or move the tail behind a section.`,
      );
    }
  }
}

export const Nav = React.forwardRef<HTMLElement, NavProps>(function Nav(
  { label, items, activeId, onNavigate, orientation = "vertical", className, ...props },
  ref,
) {
  const groups = React.useMemo(() => groupItems(items), [items]);
  React.useEffect(() => {
    warnAboutLimits(items, groups);
  }, [items, groups]);

  return (
    <nav
      ref={ref}
      aria-label={label}
      className={cn(
        "flex gap-4 p-3",
        orientation === "vertical" ? "flex-col" : "flex-row items-center",
        className,
      )}
      {...dataSlot("nav")}
      {...stateAttributes({ orientation })}
      {...props}
    >
      {groups.map((group) => (
        <div key={group.label || "_ungrouped"} className="flex flex-col gap-0.5">
          {group.label ? (
            <p className="px-2 pb-1 text-label font-semibold uppercase tracking-widest text-fg-subtle">
              {group.label}
            </p>
          ) : null}
          {group.items.map((item) => (
            <NavItem
              key={item.id}
              data={item}
              active={item.id === activeId}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ))}
    </nav>
  );
});

export interface NavItemProps {
  data: NavItemData;
  /** This is the current route. */
  active?: boolean | undefined;
  onNavigate?: ((id: string) => void) | undefined;
  /** Merged into the row's class list. */
  className?: string | undefined;
}

/**
 * One entry in a {@link Nav}.
 *
 * It renders a real `<a>` when the item has an `href` and a real `<button>`
 * when it does not. A `div` with `onClick` — which the audit found on eight
 * primary nav targets — is not focusable, has no role, and does nothing on
 * Enter.
 *
 * The ref type is `HTMLElement` rather than `HTMLDivElement` on purpose: the
 * component renders one or the other depending on `href`, so naming a div here
 * would be a lie the consumer discovers at the point of typing.
 */
export const NavItem = React.forwardRef<HTMLElement, NavItemProps>(function NavItem(
  { data, active = false, onNavigate, className },
  ref,
) {
  const { id, label, href, onSelect, icon, meta, disabled } = data;

  const activate = React.useCallback(
    (event: React.MouseEvent) => {
      // A real `href` still navigates when the consumer has not supplied
      // `onSelect` — the router takes over only when it says it will.
      if (href && !onSelect) return;
      event.preventDefault();
      onSelect?.();
      onNavigate?.(id);
    },
    [href, onSelect, onNavigate, id],
  );

  const className_ = cn(
    "flex w-full items-center gap-2 border-s-2 px-3 py-2 text-start text-ui transition-colors",
    "disabled:pointer-events-none disabled:opacity-50",
    // The active marker is a *border* on the inline-start edge, plus weight. A
    // solid fill would be ambiguous with a focus ring that shares the gold, and
    // the border keeps a 2px distinction that survives a greyscale screenshot.
    active
      ? "border-primary bg-accent-subtle font-medium text-fg"
      : "border-transparent text-fg-muted hover:bg-surface-3 hover:text-fg",
    className,
  );

  const content = (
    <>
      {icon ? (
        <span aria-hidden="true" className="shrink-0">
          {icon}
        </span>
      ) : null}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {meta ? <span className="shrink-0 text-micro text-fg-subtle">{meta}</span> : null}
    </>
  );

  const shared = {
    className: className_,
    ...(active ? { "aria-current": "page" as const } : {}),
    ...stateAttributes({ disabled, active }),
    ...dataSlot("nav", "item"),
  };

  if (href) {
    return (
      <a
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={href}
        onClick={activate}
        aria-disabled={disabled || undefined}
        {...shared}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      ref={ref as React.Ref<HTMLButtonElement>}
      type="button"
      disabled={disabled}
      onClick={activate}
      {...shared}
    >
      {content}
    </button>
  );
});

/** The copy a `Nav` needs when it is the primary navigation of an application. */
export const MAIN_NAV_LABEL = COPY.navigation.main;
