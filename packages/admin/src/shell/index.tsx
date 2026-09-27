import * as React from "react";
import { Menu, X } from "@tea-ui/icons";
import { cn } from "@tea-ui/utils";
import { COPY } from "@tea-ui/ux-standards";
import {
  Box,
  Container,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  HStack,
  IconButton,
  SkipLink,
  stateAttributes,
} from "@tea-ui/core";

/**
 * TEA UI Admin â€” the application shell.
 *
 * This component decides the information architecture of an admin product, so
 * the three rules it enforces are worth stating. All three were re-invented
 * separately in both source products, which is exactly the cost TEA UI exists to
 * remove.
 *
 *  1. **The sidebar collapses below 1024px and becomes a drawer.** Below `lg` a
 *     256px sidebar stops being information and becomes an obstruction. Both
 *     source projects collapsed by hand, each with its own drawer and its own
 *     magic header height.
 *  2. **There is a skip link, and it is the first focusable thing on the page.**
 *     Neither source product had one. Without it, a keyboard user tabs through
 *     the entire navigation on every page.
 *  3. **The main region has a stable id**, because the skip link's target is an
 *     anchor, not a scroll hack.
 */
export interface NavItem {
  /** Stable key, matched against `activeId`. */
  id: string;
  /** The visible label. Say the thing, not "Home". */
  label: string;
  /** A router path, when the item is a link. */
  href?: string | undefined;
  onSelect?: (() => void) | undefined;
  icon?: React.ReactNode | undefined;
  /** A count or short status, rendered after the label. */
  meta?: React.ReactNode | undefined;
  /** Group heading, rendered above this item. */
  group?: string | undefined;
  disabled?: boolean | undefined;
}

export interface AdminShellProps extends React.ComponentProps<"div"> {
  /** Product name, shown in the sidebar header. */
  product: string;
  nav: readonly NavItem[];
  /** Id of the current route. */
  activeId: string;
  onNavigate?: ((id: string) => void) | undefined;
  /** Sidebar footer: a user menu, a version, a logout. */
  sidebarFooter?: React.ReactNode | undefined;
  /** Top bar, right of the title. */
  actions?: React.ReactNode | undefined;
  /** A live status summary, e.g. "Alle Dienste online". */
  status?: React.ReactNode | undefined;
  /** Id of the main region; also the skip link's target. */
  mainId?: string | undefined;
  children: React.ReactNode;
}

export function AdminShell({
  product,
  nav,
  activeId,
  onNavigate,
  sidebarFooter,
  actions,
  status,
  mainId = "tea-main",
  className,
  children,
  ...props
}: AdminShellProps): React.ReactElement {
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  // Navigating from the drawer must close it, or the user lands on the new page
  // still behind an overlay, with focus left behind the scrim.
  const select = React.useCallback(
    (item: NavItem) => {
      item.onSelect?.();
      onNavigate?.(item.id);
      setDrawerOpen(false);
    },
    [onNavigate],
  );

  return (
    <Box className={cn("min-h-dvh bg-canvas text-fg", className)} {...props}>
      <SkipLink targetId={mainId} />
      <div className="flex min-h-dvh">
        <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-e border-line bg-surface lg:flex">
          <SidebarHeader product={product} />
          <div className="min-h-0 flex-1 overflow-y-auto">
            <SidebarNav nav={nav} activeId={activeId} onSelect={select} />
          </div>
          {sidebarFooter ? <div className="shrink-0 border-t border-line p-3">{sidebarFooter}</div> : null}
        </aside>

        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerContent side="start" showCloseButton={false} className="w-72">
            <DrawerHeader>
              <DrawerTitle className="flex items-center justify-between">
                {product}
                <IconButton label={COPY.navigation.closeMenu} variant="ghost" size="sm" onClick={() => setDrawerOpen(false)}>
                  <X size={16} aria-hidden="true" />
                </IconButton>
              </DrawerTitle>
            </DrawerHeader>
            <DrawerBody className="p-0">
              <SidebarNav nav={nav} activeId={activeId} onSelect={select} />
            </DrawerBody>
          </DrawerContent>
        </Drawer>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-header flex h-14 shrink-0 items-center gap-3 border-b border-line bg-canvas px-4">
            <IconButton
              label={COPY.navigation.toggleSidebar}
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setDrawerOpen(true)}
            >
              <Menu size={18} aria-hidden="true" />
            </IconButton>
            <span className="truncate text-ui font-semibold text-fg lg:hidden">{product}</span>
            {status ? <div className="hidden lg:flex">{status}</div> : null}
            <HStack gap="ui" className="ms-auto">
              {actions}
            </HStack>
          </header>
          <main id={mainId} tabIndex={-1} className="min-w-0 flex-1 focus-visible:outline-none">
            {children}
          </main>
        </div>
      </div>
    </Box>
  );
}

function SidebarHeader({ product }: { product: string }): React.ReactElement {
  return (
    <div className="flex h-14 shrink-0 items-center border-b border-line px-4">
      <span className="text-ui font-semibold text-fg">{product}</span>
    </div>
  );
}

function SidebarNav({
  nav,
  activeId,
  onSelect,
}: {
  nav: readonly NavItem[];
  activeId: string;
  onSelect: (item: NavItem) => void;
}): React.ReactElement {
  const groups = React.useMemo(() => groupNav(nav), [nav]);
  return (
    <nav aria-label={COPY.navigation.main} className="flex flex-col gap-4 p-3">
      {groups.map((group) => (
        <div key={group.label || "_ungrouped"} className="flex flex-col gap-0.5">
          {group.label ? (
            <p className="px-2 pb-1 text-label font-semibold uppercase tracking-widest text-fg-subtle">
              {group.label}
            </p>
          ) : null}
          {group.items.map((item) => (
            <NavLink key={item.id} item={item} active={item.id === activeId} onSelect={onSelect} />
          ))}
        </div>
      ))}
    </nav>
  );
}

function NavLink({
  item,
  active,
  onSelect,
}: {
  item: NavItem;
  active: boolean;
  onSelect: (item: NavItem) => void;
}): React.ReactElement {
  const className = cn(
    "flex w-full items-center gap-2 px-3 py-2 text-start text-ui transition-colors",
    "disabled:pointer-events-none disabled:opacity-50",
    active ? "bg-accent-subtle font-medium text-accent" : "text-fg-muted hover:bg-surface-3 hover:text-fg",
  );

  const content = (
    <>
      {item.icon ? (
        <span aria-hidden="true" className="shrink-0">
          {item.icon}
        </span>
      ) : null}
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {item.meta ? <span className="shrink-0 text-micro text-fg-subtle">{item.meta}</span> : null}
    </>
  );

  // `aria-current` is what makes the position announceable. The background
  // colour alone is invisible to a screen reader and ambiguous in a greyscale
  // screenshot â€” the audit found active items marked by colour alone.
  const shared = {
    className,
    ...(active ? { "aria-current": "page" as const } : {}),
    ...stateAttributes({ disabled: item.disabled, active }),
  };

  if (item.href) {
    return (
      <a
        href={item.href}
        onClick={(event) => {
          // Let the browser handle a real href unless the consumer supplied
          // `onSelect`, in which case the router owns the navigation.
          if (!item.onSelect) return;
          event.preventDefault();
          onSelect(item);
        }}
        {...shared}
      >
        {content}
      </a>
    );
  }

  return (
    <button type="button" disabled={item.disabled} onClick={() => onSelect(item)} {...shared}>
      {content}
    </button>
  );
}

/** Consecutive items sharing a `group` become one labelled block, in order. */
function groupNav(nav: readonly NavItem[]): Array<{ label: string; items: NavItem[] }> {
  const order: string[] = [];
  const map = new Map<string, NavItem[]>();
  for (const item of nav) {
    const key = item.group ?? "";
    if (!map.has(key)) {
      map.set(key, []);
      order.push(key);
    }
    map.get(key)!.push(item);
  }
  return order.map((label) => ({ label, items: map.get(label) ?? [] }));
}

/* -------------------------------------------------------------------------- */

export interface PageHeaderProps extends React.ComponentProps<"header"> {
  title: string;
  description?: string | undefined;
  actions?: React.ReactNode | undefined;
  /** Breadcrumb above the title. */
  breadcrumb?: React.ReactNode | undefined;
}

/** The standard page head: optional breadcrumb, title, description, actions. */
export const PageHeader = React.forwardRef<HTMLElement, PageHeaderProps>(function PageHeader(
  { title, description, actions, breadcrumb, className, children, ...props },
  ref,
) {
  return (
    <header ref={ref} className={cn("flex flex-col gap-3 border-b border-line pb-4", className)} {...props}>
      {breadcrumb}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-title font-semibold text-fg">{title}</h1>
          {description ? <p className="mt-0.5 text-micro text-fg-muted">{description}</p> : null}
        </div>
        {actions ? <HStack gap="ui">{actions}</HStack> : null}
      </div>
      {children}
    </header>
  );
});

export interface PageProps extends React.ComponentProps<"div"> {
  children: React.ReactNode;
}

/**
 * The page body. One component, so that "how much padding does a TEA page have"
 * has exactly one answer â€” the audit found `p-4`, `p-5` and `p-6` on the same
 * kind of page inside one product.
 */
export const Page = React.forwardRef<HTMLDivElement, PageProps>(function Page(
  { className, children, ...props },
  ref,
) {
  return (
    <Container size="full" center={false} className={cn("py-4 md:py-6", className)} ref={ref} {...props}>
      {children}
    </Container>
  );
});
