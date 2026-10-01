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
  /**
   * One line under the product name in the sidebar header — what the product
   * *is*, as opposed to what it is called. "Home Server Manager" under "MLHSM".
   *
   * Optional, and omitted rather than faked: a placeholder tagline is worse than
   * no tagline, because it puts a line of invented copy into the most prominent
   * position on the page.
   */
  tagline?: string | undefined;
  nav: readonly NavItemData[];
  /** Id of the current route. */
  activeId: string;
  onNavigate?: ((id: string) => void) | undefined;
  /** Sidebar footer: a user menu, a version, a logout. */
  sidebarFooter?: React.ReactNode | undefined;
  /** Top bar, right of the title. */
  actions?: React.ReactNode | undefined;
  /** A live status summary, e.g. "All services online". */
  status?: React.ReactNode | undefined;
  /** Id of the main region; also the skip link's target. */
  mainId?: string | undefined;
  children: React.ReactNode;
}

export function AdminShell({
  product,
  tagline,
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
          header={<SidebarBrand product={product} tagline={tagline} />}
          footer={sidebarFooter}
        />

        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerContent side="start" showCloseButton={false} className="w-72">
            <DrawerHeader>
              <DrawerTitle className="flex items-center justify-between gap-2">
                <span className="min-w-0">
                  <span className="block truncate text-ui font-semibold text-fg">{product}</span>
                  {/*
                    The same two lines as the desktop sidebar header. A drawer is
                    the same screen at a narrower width, and a brand that loses
                    its tagline below 1024px is a brand that changes identity
                    depending on the device.
                  */}
                  {tagline ? (
                    <span className="block truncate text-micro text-fg-muted">{tagline}</span>
                  ) : null}
                </span>
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
 * The brand row.
 *
 * Its height is the height of the top bar beside it, so the sidebar's divider
 * and the page's divider land on the same pixel row. That only works because
 * `Sidebar` pads its header on the inline axis only — with vertical padding the
 * band would be taller than the `h-14` it declares and the two lines would step
 * apart again. One of the two rules has to be authoritative for the vertical
 * axis, and it is this one, because it is the one a product sets.
 *
 * Name and tagline are centred **as a pair**, so the optical middle of the block
 * stays put when the tagline wraps to two lines. Centring each line separately
 * would shift the name up every time the description grew, which is the kind of
 * movement nobody can name as a bug.
 */
function SidebarBrand({
  product,
  tagline,
}: {
  product: string;
  tagline?: string | undefined;
}): React.ReactElement {
  return (
    <div className="flex h-14 items-center">
      <div className="min-w-0">
        <span className="block truncate text-ui font-semibold text-fg">{product}</span>
        {tagline ? (
          <span className="block truncate text-micro text-fg-muted">{tagline}</span>
        ) : null}
      </div>
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
