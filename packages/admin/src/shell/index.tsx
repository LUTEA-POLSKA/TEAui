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
  Sidebar,
  SidebarContent,
} from "@tea-ui/core";

/**
 * TEA UI Admin — the application shell.
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
 *
 * The navigation itself is not written here. `Nav` and `NavItem` live in
 * `@tea-ui/core` because a product that builds a navigation *outside* a shell —
 * a settings sidebar, a wizard's step list, a second-level panel — needs exactly
 * the same guarantees, and a copy of this file would be a seventh copy of the
 * thing the audit found six of.
 */
export type { NavItemData as NavItem } from "@tea-ui/core";

import { type NavItemData } from "@tea-ui/core";

export interface AdminShellProps extends React.ComponentProps<"div"> {
  /** Product name, shown in the sidebar header. */
  product: string;
  nav: readonly NavItemData[];
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
  const closeDrawer = React.useCallback(() => setDrawerOpen(false), []);

  return (
    <Box className={cn("min-h-dvh bg-canvas text-fg", className)} {...props}>
      <SkipLink targetId={mainId} />
      <div className="flex min-h-dvh">
        <Sidebar
          label={COPY.navigation.main}
          items={nav}
          activeId={activeId}
          onNavigate={onNavigate}
          header={<SidebarBrand product={product} />}
          footer={sidebarFooter}
        />

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
              <SidebarContent
                label={COPY.navigation.main}
                items={nav}
                activeId={activeId}
                onNavigate={(id) => {
                  onNavigate?.(id);
                  closeDrawer();
                }}
              />
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

/**
 * The brand row. Its `h-14` is the height of the top bar beside it, so the
 * sidebar's first line and the page header sit on one baseline.
 */
function SidebarBrand({ product }: { product: string }): React.ReactElement {
  return (
    <div className="flex h-14 items-center">
      <span className="text-ui font-semibold text-fg">{product}</span>
    </div>
  );
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
 * has exactly one answer — the audit found `p-4`, `p-5` and `p-6` on the same
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
